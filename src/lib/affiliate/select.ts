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

/** 0 以上 1 未満の乱数を返す関数（テストで差し替え可能） */
export type RandomFn = () => number;

export function isAffiliateStyleKey(value: string): value is AffiliateStyleKey {
  return value === "general" || STYLE_IDS.includes(value as RamenStyleId);
}

export function soupPreferenceToStyleKey(
  soup: SoupPreference,
): AffiliateStyleKey | null {
  if (soup === ANY_PREFERENCE) return null;
  return SOUP_TO_STYLE[soup] ?? null;
}

/** 有効な系統キーを重複除去して返す */
export function normalizeAffiliateStyleKeys(
  styleKeys: Array<AffiliateStyleKey | string | null | undefined>,
): AffiliateStyleKey[] {
  return [
    ...new Set(
      styleKeys
        .filter((k): k is string => typeof k === "string" && k.length > 0)
        .filter(isAffiliateStyleKey),
    ),
  ];
}

/**
 * 系統がちょうど1つに決まるとき true（従来の系統枠選定）。
 * 0個・複数は混在扱い（全商品からランダム）。
 */
export function isDeterminedAffiliateStyle(
  styleKeys: Array<AffiliateStyleKey | string | null | undefined>,
): boolean {
  return normalizeAffiliateStyleKeys(styleKeys).length === 1;
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

function pickRandomIndex(length: number, random: RandomFn): number {
  if (length <= 0) return 0;
  const n = random();
  const clamped = Number.isFinite(n) ? Math.min(Math.max(n, 0), 0.999999) : 0;
  return Math.floor(clamped * length);
}

export type SelectAffiliateRandomOptions = {
  limit?: number;
  excludeIds?: Iterable<string>;
  /** 省略時は Math.random（呼び出し側でレンダー中に使わないこと） */
  random?: RandomFn;
};

/**
 * 全アフィリエイト商品からランダムに選定。
 * - 同一 id は選ばない
 * - 可能なら2件目以降は既選と別系統
 */
export function selectAffiliateProductsRandom(
  snapshot: AffiliateProductsSnapshot | null | undefined,
  options: SelectAffiliateRandomOptions = {},
): AffiliateProduct[] {
  const limit = options.limit ?? 2;
  const random = options.random ?? Math.random;
  const excluded = new Set(options.excludeIds ?? []);

  if (!snapshot?.products?.length || limit <= 0) return [];

  let pool = snapshot.products.filter((p) => !excluded.has(p.id));
  const selected: AffiliateProduct[] = [];

  while (selected.length < limit && pool.length > 0) {
    let candidates = pool;
    if (selected.length > 0) {
      const usedStyles = new Set(selected.map((p) => p.styleKey));
      const otherStyle = pool.filter((p) => !usedStyles.has(p.styleKey));
      if (otherStyle.length > 0) candidates = otherStyle;
    }

    const idx = pickRandomIndex(candidates.length, random);
    const pick = candidates[idx]!;
    selected.push(pick);
    pool = pool.filter((p) => p.id !== pick.id);
  }

  return selected;
}

export type SelectAffiliateProductsOptions = {
  excludeIds?: Iterable<string>;
  random?: RandomFn;
};

/**
 * 系統キー配列から商品を選定。
 * - 単一系統: その系統から limit 件。足りなければ general → 全体（従来）
 * - 複数/未指定: 全商品（general 含む）からランダム。可能なら別系統
 */
export function selectAffiliateProducts(
  snapshot: AffiliateProductsSnapshot | null | undefined,
  styleKeys: Array<AffiliateStyleKey | string | null | undefined>,
  limit = 2,
  options: SelectAffiliateProductsOptions = {},
): AffiliateProduct[] {
  if (!snapshot?.products?.length || limit <= 0) return [];

  const normalized = normalizeAffiliateStyleKeys(styleKeys);
  const excluded = new Set(options.excludeIds ?? []);

  if (normalized.length !== 1) {
    return selectAffiliateProductsRandom(snapshot, {
      limit,
      excludeIds: excluded,
      random: options.random,
    });
  }

  const all = [...snapshot.products]
    .filter((p) => !excluded.has(p.id))
    .sort(byReviewDesc);
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

  const key = normalized[0]!;
  pushFrom(productsForStyle(all, key));
  if (selected.length < limit && key !== "general") {
    pushFrom(productsForStyle(all, "general"));
  }
  if (selected.length < limit) pushFrom(all);
  return selected;
}
