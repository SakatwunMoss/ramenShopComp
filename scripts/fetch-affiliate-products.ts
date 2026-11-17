/**
 * アフィリエイト商品を提供元 API から取得し JSON スナップショットを出力する。
 *
 * Usage:
 *   npm run fetch-affiliate-products
 *   AFFILIATE_PROVIDER=yahoo npm run fetch-affiliate-products
 *
 * Required env (Yahoo / AFFILIATE_PROVIDER=yahoo):
 *   YAHOO_CLIENT_ID
 *
 * Output:
 *   output/affiliate-products.json（R2 アップロードはしない）
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listAffiliateSearchTargets } from "../src/lib/affiliate/keywords";
import {
  getAffiliateProvider,
  isAffiliateProviderId,
} from "../src/lib/affiliate/providers";
import { inferAffiliateStyleFromName } from "../src/lib/affiliate/product-relevance";
import { AFFILIATE_REVIEW_THRESHOLDS } from "../src/lib/affiliate/review-thresholds";
import type {
  AffiliateProduct,
  AffiliateProductsSnapshot,
  AffiliateProviderId,
  AffiliateStyleKey,
} from "../src/lib/affiliate/types";

const OUTPUT_DIR = join(process.cwd(), "output");
const OUTPUT_FILE = join(OUTPUT_DIR, "affiliate-products.json");

const PER_STYLE_LIMIT = 2;

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

/** 厳しめ閾値で何件取れるか（キーワード補充の判断用） */
function countPassingStrict(candidates: AffiliateProduct[]): number {
  const [strict] = AFFILIATE_REVIEW_THRESHOLDS;
  if (!strict) return candidates.length;
  return candidates.filter((p) =>
    passesThreshold(p, strict.minCount, strict.minAverage),
  ).length;
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
    return { rakuten: { applicationId, accessKey, affiliateId } };
  }

  const clientId = process.env.YAHOO_CLIENT_ID?.trim() ?? "";
  if (!clientId) {
    throw new Error("YAHOO_CLIENT_ID is required");
  }
  return { yahoo: { clientId } };
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}

function reclassifyForTarget(
  products: AffiliateProduct[],
  targetStyle: AffiliateStyleKey,
): AffiliateProduct[] {
  const out: AffiliateProduct[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    const inferred = inferAffiliateStyleFromName(product.name);
    if (inferred !== targetStyle) continue;
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    out.push({ ...product, styleKey: inferred });
  }

  return out;
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
  let requestCount = 0;

  for (const target of targets) {
    const byId = new Map<string, AffiliateProduct>();

    for (let ki = 0; ki < target.keywords.length; ki++) {
      const keyword = target.keywords[ki]!;
      if (requestCount > 0) await sleep(gapMs);
      requestCount += 1;

      console.log(
        `[affiliate] fetching style=${target.styleKey} keyword[${ki}]="${keyword}"`,
      );

      const raw = await provider.search(
        {
          styleKey: target.styleKey,
          keyword,
          hits: 30,
        },
        credentials,
      );

      const matched = reclassifyForTarget(raw, target.styleKey);
      for (const product of matched) {
        if (!byId.has(product.id)) {
          byId.set(product.id, product);
        }
      }

      const candidates = [...byId.values()];
      console.log(
        `[affiliate] style=${target.styleKey} keyword[${ki}] raw=${raw.length} matched=${matched.length} pool=${candidates.length}`,
      );

      // 厳しめ閾値で目標件数に届いていれば、閾値緩和の前にキーワード補充を打ち切る
      if (countPassingStrict(candidates) >= PER_STYLE_LIMIT) {
        break;
      }
    }

    const candidates = [...byId.values()];
    const picked = pickForStyle(candidates, usedIds, PER_STYLE_LIMIT);
    for (const product of picked) {
      usedIds.add(product.id);
      products.push(product);
    }

    console.log(
      `[affiliate] style=${target.styleKey} selected=${picked.length}/${PER_STYLE_LIMIT}`,
    );
  }

  if (products.length === 0) {
    throw new Error(
      "No affiliate products selected. Keeping previous snapshot (do not upload empty file).",
    );
  }

  // 全系統の商品名一覧（取り違えの目視確認用）
  console.log("[affiliate] === all selected products ===");
  for (const product of products) {
    console.log(
      `  [${product.styleKey}] ${product.name} / ${formatPrice(product.price)}`,
    );
  }

  const preview = products.slice(0, 3);
  console.log(`[affiliate] VC link preview (first ${preview.length}):`);
  for (const product of preview) {
    console.log(
      `  - [${product.styleKey}] ${product.name} / ${formatPrice(product.price)}`,
    );
    console.log(`    ${product.affiliateUrl}`);
  }

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
