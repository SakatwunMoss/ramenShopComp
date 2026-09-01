import {
  RAMEN_STYLES,
  type RamenStyleId,
  type Shop,
} from "./types";

export type ShopFilters = {
  area?: string;
  middleArea?: string;
  style?: RamenStyleId | string;
  q?: string;
  /** false のとき HotPepper キーワード該当をすべて表示（居酒屋等を含む） */
  ramenOnly?: boolean;
};

/** ラーメン店らしいレコードか（ジャンル or 店名） */
export function matchesRamenScope(
  shop: Shop,
  ramenOnly: boolean | undefined,
): boolean {
  if (ramenOnly === false) return true;

  const genre = shop.genre ?? "";
  const name = shop.name;
  return (
    genre.includes("ラーメン") ||
    name.includes("ラーメン") ||
    name.includes("らーめん") ||
    name.includes("らあめん") ||
    name.includes("拉麺") ||
    name.includes("つけ麺") ||
    name.includes("つけめん") ||
    name.includes("麺屋") ||
    name.includes("麺処") ||
    name.includes("麺場")
  );
}

function matchesStyleFilter(shop: Shop, styleId: string | undefined): boolean {
  if (!styleId) return true;
  const style = RAMEN_STYLES.find((s) => s.id === styleId);
  if (!style) return true;
  const haystack = `${shop.name} ${shop.genre ?? ""} ${shop.access ?? ""}`;
  return style.keywords.some((kw) => haystack.includes(kw));
}

export function matchesShopFilters(shop: Shop, filters: ShopFilters): boolean {
  if (!matchesRamenScope(shop, filters.ramenOnly)) return false;

  if (filters.area && shop.large_area_code !== filters.area) return false;
  if (filters.middleArea && shop.middle_area_code !== filters.middleArea) {
    return false;
  }

  if (filters.q && !shop.name.includes(filters.q)) return false;

  if (!matchesStyleFilter(shop, filters.style)) return false;

  return true;
}

export function sortShopsByUpdatedAt(shops: Shop[]): Shop[] {
  return [...shops].sort((a, b) =>
    (b.updated_at ?? "").localeCompare(a.updated_at ?? ""),
  );
}

export function filterShops(shops: Shop[], filters: ShopFilters): Shop[] {
  return sortShopsByUpdatedAt(shops.filter((s) => matchesShopFilters(s, filters)));
}
