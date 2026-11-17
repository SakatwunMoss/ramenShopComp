/**
 * アフィリエイト商品を提供元 API から取得し JSON スナップショットを出力する。
 *
 * Usage:
 *   npm run fetch-affiliate-products
 *
 * Required env (楽天):
 *   RAKUTEN_APPLICATION_ID / RAKUTEN_ACCESS_KEY / RAKUTEN_AFFILIATE_ID
 *
 * Output:
 *   output/affiliate-products.json
 *
 * 失敗時は非ゼロ終了し、空 JSON で上書きしない（ワークフロー側で R2 アップロードをスキップ）。
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listAffiliateSearchTargets } from "../src/lib/affiliate/keywords";
import { getAffiliateProvider } from "../src/lib/affiliate/providers";
import type {
  AffiliateProduct,
  AffiliateProductsSnapshot,
} from "../src/lib/affiliate/types";

const OUTPUT_DIR = join(process.cwd(), "output");
const OUTPUT_FILE = join(OUTPUT_DIR, "affiliate-products.json");

/** 系統あたりの目標件数 */
const PER_STYLE_LIMIT = 2;

/** リクエスト間隔（レート制限対策） */
const REQUEST_GAP_MS = 700;

/**
 * レビュー閾値。厳しい順に試し、2件に満たなければ段階的に緩める。
 */
const REVIEW_THRESHOLDS = [
  { minCount: 5, minAverage: 3.5 },
  { minCount: 3, minAverage: 3.0 },
  { minCount: 1, minAverage: 0 },
  { minCount: 0, minAverage: 0 },
] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  for (const threshold of REVIEW_THRESHOLDS) {
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

async function main() {
  const provider = getAffiliateProvider("rakuten");
  const credentials = {
    rakuten: {
      applicationId: process.env.RAKUTEN_APPLICATION_ID?.trim() ?? "",
      accessKey: process.env.RAKUTEN_ACCESS_KEY?.trim() ?? "",
      affiliateId: process.env.RAKUTEN_AFFILIATE_ID?.trim() ?? "",
    },
  };

  if (
    !credentials.rakuten.applicationId ||
    !credentials.rakuten.accessKey ||
    !credentials.rakuten.affiliateId
  ) {
    throw new Error(
      "RAKUTEN_APPLICATION_ID, RAKUTEN_ACCESS_KEY, and RAKUTEN_AFFILIATE_ID are required",
    );
  }

  const targets = listAffiliateSearchTargets();
  const usedIds = new Set<string>();
  const products: AffiliateProduct[] = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]!;
    if (i > 0) await sleep(REQUEST_GAP_MS);

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
      `[affiliate] style=${target.styleKey} candidates=${candidates.length} picked=${picked.length}`,
    );
  }

  if (products.length === 0) {
    throw new Error(
      "No affiliate products selected. Keeping previous snapshot (do not upload empty file).",
    );
  }

  const snapshot: AffiliateProductsSnapshot = {
    generated_at: new Date().toISOString(),
    products,
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(
    `[affiliate] wrote ${products.length} products → ${OUTPUT_FILE}`,
  );
}

main().catch((err) => {
  console.error("[affiliate] failed:", err);
  process.exit(1);
});
