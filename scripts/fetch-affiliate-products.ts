/**
 * アフィリエイト商品を提供元 API から取得し JSON スナップショットを出力する。
 *
 * Usage:
 *   npm run fetch-affiliate-products
 *   AFFILIATE_PROVIDER=yahoo npm run fetch-affiliate-products
 *
 * Required env (楽天 / AFFILIATE_PROVIDER=rakuten):
 *   RAKUTEN_APPLICATION_ID / RAKUTEN_ACCESS_KEY / RAKUTEN_AFFILIATE_ID
 *
 * Required env (Yahoo / AFFILIATE_PROVIDER=yahoo):
 *   YAHOO_CLIENT_ID
 * （VC の sid/pid は src/lib/site.ts の定数）
 *
 * Output:
 *   output/affiliate-products.json
 * （R2 へのアップロードは行わない。CI の別ステップで制御）
 *
 * 失敗時は非ゼロ終了し、空 JSON で上書きしない。
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listAffiliateSearchTargets } from "../src/lib/affiliate/keywords";
import {
  getAffiliateProvider,
  isAffiliateProviderId,
} from "../src/lib/affiliate/providers";
import { AFFILIATE_REVIEW_THRESHOLDS } from "../src/lib/affiliate/review-thresholds";
import type {
  AffiliateProduct,
  AffiliateProductsSnapshot,
  AffiliateProviderId,
} from "../src/lib/affiliate/types";

const OUTPUT_DIR = join(process.cwd(), "output");
const OUTPUT_FILE = join(OUTPUT_DIR, "affiliate-products.json");

/** 系統あたりの目標件数 */
const PER_STYLE_LIMIT = 2;

/** Yahoo は 1 req/sec。楽天は少し短くて可 */
const REQUEST_GAP_MS: Record<AffiliateProviderId, number> = {
  rakuten: 700,
  yahoo: 1100,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveProviderId(): AffiliateProviderId {
  const raw = (process.env.AFFILIATE_PROVIDER ?? "yahoo").trim().toLowerCase();
  if (!isAffiliateProviderId(raw)) {
    throw new Error(
      `AFFILIATE_PROVIDER must be "rakuten" or "yahoo" (got "${raw}")`,
    );
  }
  return raw;
}

function passesThreshold(
  product: AffiliateProduct,
  minCount: number,
  minAverage: number,
): boolean {
  return (
    product.reviewCount >= minCount && product.reviewAverage >= minAverage
  );
}

function pickForStyle(
  candidates: AffiliateProduct[],
  usedIds: Set<string>,
  limit: number,
): AffiliateProduct[] {
  const selected: AffiliateProduct[] = [];

  for (const threshold of AFFILIATE_REVIEW_THRESHOLDS) {
    if (selected.length >= limit) break;

    for (const product of candidates) {
      if (selected.length >= limit) break;
      if (usedIds.has(product.id)) continue;
      if (selected.some((p) => p.id === product.id)) continue;
      if (
        !passesThreshold(product, threshold.minCount, threshold.minAverage)
      ) {
        continue;
      }
      selected.push(product);
    }
  }

  return selected;
}

function loadCredentials(providerId: AffiliateProviderId) {
  if (providerId === "rakuten") {
    const applicationId = process.env.RAKUTEN_APPLICATION_ID?.trim() ?? "";
    const accessKey = process.env.RAKUTEN_ACCESS_KEY?.trim() ?? "";
    const affiliateId = process.env.RAKUTEN_AFFILIATE_ID?.trim() ?? "";
    if (!applicationId || !accessKey || !affiliateId) {
      throw new Error(
        "RAKUTEN_APPLICATION_ID, RAKUTEN_ACCESS_KEY, and RAKUTEN_AFFILIATE_ID are required",
      );
    }
    return {
      rakuten: { applicationId, accessKey, affiliateId },
    };
  }

  const clientId = process.env.YAHOO_CLIENT_ID?.trim() ?? "";
  if (!clientId) {
    throw new Error("YAHOO_CLIENT_ID is required");
  }
  return {
    yahoo: { clientId },
  };
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}

function logStylePicks(styleKey: string, picked: AffiliateProduct[]) {
  console.log(`[affiliate] style=${styleKey} picked=${picked.length}`);
  for (const product of picked) {
    console.log(`  - ${product.name}`);
    console.log(`    price=${formatPrice(product.price)}`);
    console.log(`    image=${product.imageUrl}`);
    console.log(`    vc=${product.affiliateUrl}`);
  }
}

async function main() {
  const providerId = resolveProviderId();
  const provider = getAffiliateProvider(providerId);
  const credentials = loadCredentials(providerId);
  const gapMs = REQUEST_GAP_MS[providerId];

  console.log(`[affiliate] provider=${providerId}`);
  console.log(`[affiliate] output=${OUTPUT_FILE} (no R2 upload)`);

  const targets = listAffiliateSearchTargets();
  const usedIds = new Set<string>();
  const products: AffiliateProduct[] = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]!;
    if (i > 0) await sleep(gapMs);

    console.log(
      `[affiliate] fetching style=${target.styleKey} keyword="${target.keyword}"`,
    );

    const candidates = await provider.search(
      {
        styleKey: target.styleKey,
        keyword: target.keyword,
        hits: 30,
      },
      credentials,
    );

    const picked = pickForStyle(candidates, usedIds, PER_STYLE_LIMIT);
    for (const product of picked) {
      usedIds.add(product.id);
      products.push(product);
    }

    console.log(
      `[affiliate] style=${target.styleKey} candidates=${candidates.length}`,
    );
    logStylePicks(target.styleKey, picked);
  }

  if (products.length === 0) {
    throw new Error(
      "No affiliate products selected. Keeping previous snapshot (do not upload empty file).",
    );
  }

  // 組み立てた VC リンクの目視確認用（先頭3件）
  const preview = products.slice(0, 3);
  console.log(`[affiliate] VC link preview (first ${preview.length}):`);
  for (const product of preview) {
    console.log(
      `  - [${product.styleKey}] ${product.name} / ${formatPrice(product.price)}`,
    );
    console.log(`    ${product.affiliateUrl}`);
  }

  const imageHosts = [
    ...new Set(
      products
        .map((p) => {
          try {
            return new URL(p.imageUrl).hostname;
          } catch {
            return null;
          }
        })
        .filter((h): h is string => Boolean(h)),
    ),
  ];
  console.log(`[affiliate] image hosts seen: ${imageHosts.join(", ") || "(none)"}`);

  const snapshot: AffiliateProductsSnapshot = {
    generated_at: new Date().toISOString(),
    products,
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(
    `[affiliate] wrote ${products.length} products (provider=${providerId}) → ${OUTPUT_FILE}`,
  );
}

main().catch((err) => {
  console.error("[affiliate] failed:", err);
  process.exit(1);
});
