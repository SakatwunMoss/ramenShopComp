import type { SoupPreference } from "@/lib/diagnose/preferences";
import { ANY_PREFERENCE } from "@/lib/diagnose/preferences";
import { RAMEN_STYLES, type RamenStyleId } from "@/lib/types";
import type {
  AffiliateProduct,
  AffiliateProductsSnapshot,
  AffiliateStyleKey,
} from "./types";

const STYLE_IDS = RAMEN_STYLES.map((s) => s.id);

const SOUP_TO_STYLE: Record<
  Exclude<SoupPreference, typeof ANY_PREFERENCE>,
  RamenStyleId
> = {
  豚骨: "tonkotsu",
  醤油: "shoyu",
  味噌: "miso",
  塩: "shio",
  つけ麺: "tsukemen",
};

export function isAffiliateStyleKey(value: string): value is AffiliateStyleKey {
  return value === "general" || STYLE_IDS.includes(value as RamenStyleId);
}

export function soupPreferenceToStyleKey(
  soup: SoupPreference,
): AffiliateStyleKey | null {
  if (soup === ANY_PREFERENCE) return null;
  return SOUP_TO_STYLE[soup] ?? null;
}

function byReviewDesc(a: AffiliateProduct, b: AffiliateProduct): number {
  if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
  return b.reviewAverage - a.reviewAverage;
}

function productsForStyle(
  products: AffiliateProduct[],
  styleKey: AffiliateStyleKey,
): AffiliateProduct[] {
  return products.filter((p) => p.styleKey === styleKey).sort(byReviewDesc);
}

/**
 * 系統キー配列から商品を選定。
 * - 単一系統: その系統から limit 件。足りなければ general → 全体
 * - 複数/未指定: 複数系統からバランスよく最大 limit 件
 */
export function selectAffiliateProducts(
  snapshot: AffiliateProductsSnapshot | null | undefined,
  styleKeys: Array<AffiliateStyleKey | string | null | undefined>,
  limit = 2,
): AffiliateProduct[] {
  if (!snapshot?.products?.length || limit <= 0) return [];

  const normalized = [
    ...new Set(
      styleKeys
        .filter((k): k is string => typeof k === "string" && k.length > 0)
        .filter(isAffiliateStyleKey),
    ),
  ];

  const all = [...snapshot.products].sort(byReviewDesc);
  const selected: AffiliateProduct[] = [];
  const used = new Set<string>();

  const pushFrom = (pool: AffiliateProduct[]) => {
    for (const product of pool) {
      if (selected.length >= limit) return;
      if (used.has(product.id)) continue;
      used.add(product.id);
      selected.push(product);
    }
  };

  if (normalized.length === 1) {
    const key = normalized[0]!;
    pushFrom(productsForStyle(all, key));
    if (selected.length < limit && key !== "general") {
      pushFrom(productsForStyle(all, "general"));
    }
    if (selected.length < limit) pushFrom(all);
    return selected;
  }

  if (normalized.length === 0) {
    // 未指定: 系統をローテーションしてバランスよく
    const rotation: AffiliateStyleKey[] = [...STYLE_IDS, "general"];
    let guard = 0;
    while (selected.length < limit && guard < rotation.length * 2) {
      const key = rotation[guard % rotation.length]!;
      const pool = productsForStyle(all, key).filter((p) => !used.has(p.id));
      if (pool[0]) {
        used.add(pool[0].id);
        selected.push(pool[0]);
      }
      guard += 1;
    }
    if (selected.length < limit) pushFrom(all);
    return selected;
  }

  // 複数系統: 各系統から交互に1件ずつ
  let guard = 0;
  while (selected.length < limit && guard < normalized.length * 3) {
    const key = normalized[guard % normalized.length]!;
    const pool = productsForStyle(all, key).filter((p) => !used.has(p.id));
    if (pool[0]) {
      used.add(pool[0].id);
      selected.push(pool[0]);
    }
    guard += 1;
  }
  if (selected.length < limit) pushFrom(productsForStyle(all, "general"));
  if (selected.length < limit) pushFrom(all);
  return selected;
}
