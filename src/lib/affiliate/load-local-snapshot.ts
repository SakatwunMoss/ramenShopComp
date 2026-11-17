import type { AffiliateProductsSnapshot } from "./types";

/**
 * 開発時のみ: 週次バッチ相当のローカル JSON を読む。
 * 本番では呼ばない（products-data 側でガード）。node:fs は動的 import。
 *
 * AFFILIATE_LOCAL_FILE:
 * - 未設定 → output/affiliate-products.json
 * - パス文字列 → そのファイル
 * - "0" / "false" → 読まない
 */
export async function loadLocalAffiliateSnapshot(): Promise<AffiliateProductsSnapshot | null> {
  if (process.env.NODE_ENV === "production") return null;

  const raw = process.env.AFFILIATE_LOCAL_FILE?.trim();
  if (raw === "0" || raw === "false") return null;

  try {
    const { existsSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const filePath = raw || join(process.cwd(), "output", "affiliate-products.json");
    if (!existsSync(filePath)) return null;

    const data = JSON.parse(
      readFileSync(filePath, "utf8"),
    ) as AffiliateProductsSnapshot;
    if (!data?.products?.length) return null;
    return data;
  } catch (err) {
    console.warn("[affiliate] local JSON fallback failed:", err);
    return null;
  }
}
