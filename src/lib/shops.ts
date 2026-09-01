import { SHOPS_PAGE_SIZE } from "./site";
import {
  filterShops,
  type ShopFilters,
} from "./shop-filters";
import { isShopsDataAvailable, loadShopsSnapshot } from "./shops-data";
import type { AreaCountEntry } from "./shops-snapshot";
import type { Shop } from "./types";

export type { ShopFilters } from "./shop-filters";

export type AreaStat = {
  code: string;
  name: string;
  count: number;
  parentCode?: string | null;
};

export type GenreTrend = {
  genre: string;
  count: number;
};

export type PaginatedShops = {
  shops: Shop[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export { isShopsDataAvailable };

function countKey(ramenOnly: boolean | undefined): keyof AreaCountEntry {
  return ramenOnly === false ? "all" : "ramen";
}

export async function listShops(
  filters: ShopFilters = {},
  limit = 48,
): Promise<Shop[]> {
  const snapshot = await loadShopsSnapshot();
  if (!snapshot) return [];

  return filterShops(snapshot.shops, filters).slice(0, limit);
}

export async function countShops(filters: ShopFilters = {}): Promise<number> {
  const snapshot = await loadShopsSnapshot();
  if (!snapshot) return 0;

  return filterShops(snapshot.shops, filters).length;
}

export async function listShopsPaginated(
  filters: ShopFilters = {},
  page = 1,
  pageSize = SHOPS_PAGE_SIZE,
): Promise<PaginatedShops> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.min(pageSize, 48));

  const snapshot = await loadShopsSnapshot();
  if (!snapshot) {
    return {
      shops: [],
      total: 0,
      page: safePage,
      pageSize: safeSize,
      totalPages: 0,
    };
  }

  const filtered = filterShops(snapshot.shops, filters);
  const total = filtered.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeSize);
  const offset = (safePage - 1) * safeSize;

  return {
    shops: filtered.slice(offset, offset + safeSize),
    total,
    page: safePage,
    pageSize: safeSize,
    totalPages,
  };
}

export async function getShopById(id: string): Promise<Shop | null> {
  const snapshot = await loadShopsSnapshot();
  if (!snapshot) return null;

  return snapshot.shops.find((shop) => shop.id === id) ?? null;
}

/** URL の id 順を保って複数店舗を取得する */
export async function getShopsByIds(ids: string[]): Promise<Shop[]> {
  if (ids.length === 0) return [];

  const snapshot = await loadShopsSnapshot();
  if (!snapshot) return [];

  const byId = new Map(snapshot.shops.map((shop) => [shop.id, shop]));
  const ordered: Shop[] = [];
  for (const id of ids) {
    const shop = byId.get(id);
    if (shop) ordered.push(shop);
  }
  return ordered;
}

export async function listLargeAreas(options?: {
  ramenOnly?: boolean;
}): Promise<AreaStat[]> {
  const snapshot = await loadShopsSnapshot();
  if (!snapshot) return [];

  const key = countKey(options?.ramenOnly);
  const entries = Object.entries(snapshot.area_counts.large)
    .map(([code, counts]) => ({
      code: code.trim(),
      count: counts[key],
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const labels = await getAreaLabelMap(entries.map((r) => r.code));

  return entries.map((row) => ({
    code: row.code,
    count: row.count,
    name: labels.get(row.code) ?? resolveLargeAreaName(row.code),
  }));
}

export async function listMiddleAreas(
  largeAreaCode: string,
  options?: { ramenOnly?: boolean },
): Promise<{ code: string; count: number; name: string }[]> {
  const snapshot = await loadShopsSnapshot();
  if (!snapshot) return [];

  const key = countKey(options?.ramenOnly);
  const byMiddle = snapshot.area_counts.middle[largeAreaCode] ?? {};
  const entries = Object.entries(byMiddle)
    .map(([code, counts]) => ({
      code: code.trim(),
      count: counts[key],
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const labels = await getAreaLabelMap(entries.map((r) => r.code));

  return entries.map((row) => ({
    code: row.code,
    count: row.count,
    name: labels.get(row.code) ?? row.code,
  }));
}

export async function listGenreTrends(
  filters: Pick<ShopFilters, "area" | "middleArea" | "ramenOnly">,
  limit = 5,
): Promise<GenreTrend[]> {
  const snapshot = await loadShopsSnapshot();
  if (!snapshot) return [];

  const filtered = filterShops(snapshot.shops, filters);
  const counts = new Map<string, number>();

  for (const shop of filtered) {
    const genre = shop.genre?.trim();
    if (!genre) continue;
    counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getAreaLabel(code: string): Promise<string | null> {
  const normalized = code.trim();
  if (!normalized) return null;
  if (AREA_LABELS[normalized]) return AREA_LABELS[normalized];

  const snapshot = await loadShopsSnapshot();
  return snapshot?.area_labels?.[normalized]?.name ?? null;
}

async function getAreaLabelMap(codes: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const normalized = [...new Set(codes.map((c) => c.trim()).filter(Boolean))];
  if (normalized.length === 0) return map;

  const snapshot = await loadShopsSnapshot();
  const labels = snapshot?.area_labels ?? {};

  for (const code of normalized) {
    if (AREA_LABELS[code]) {
      map.set(code, AREA_LABELS[code]);
    } else if (labels[code]?.name) {
      map.set(code, labels[code].name);
    }
  }

  return map;
}

export function resolveLargeAreaName(code: string): string {
  return AREA_LABELS[code] ?? code;
}

/** エリアLP用の導入文（DB集計のみ・捏造なし） */
export function buildAreaIntro(input: {
  areaName: string;
  shopCount: number;
  genres: GenreTrend[];
  parentName?: string | null;
}): string {
  const { areaName, shopCount, genres, parentName } = input;
  const scope = parentName ? `${parentName}の${areaName}` : areaName;
  const parts: string[] = [
    `${scope}のラーメン店を ${shopCount.toLocaleString("ja-JP")} 件掲載しています。`,
  ];

  if (genres.length > 0) {
    const top = genres
      .slice(0, 3)
      .map((g) => `${g.genre}（${g.count}件）`)
      .join("、");
    parts.push(`ジャンルの傾向は ${top} などです。`);
  }

  parts.push(
    "系統や予算で絞り込み、気になる店舗を選んで横並び比較できます。",
  );

  return parts.join("");
}

export async function listAllAreaPathsForSitemap(): Promise<
  {
    path: string;
    updatedAt: string | null;
  }[]
> {
  const snapshot = await loadShopsSnapshot();
  if (!snapshot) return [{ path: "/areas", updatedAt: null }];

  const paths: { path: string; updatedAt: string | null }[] = [
    { path: "/areas", updatedAt: null },
  ];

  const largeUpdated = new Map<string, string | null>();
  const middleUpdated = new Map<string, string | null>();

  for (const shop of snapshot.shops) {
    const largeCode = shop.large_area_code?.trim();
    const middleCode = shop.middle_area_code?.trim();
    const updatedAt = shop.updated_at ?? null;

    if (largeCode) {
      const prev = largeUpdated.get(largeCode);
      if (!prev || (updatedAt && updatedAt > prev)) {
        largeUpdated.set(largeCode, updatedAt);
      }
    }

    if (largeCode && middleCode) {
      const key = `${largeCode}/${middleCode}`;
      const prev = middleUpdated.get(key);
      if (!prev || (updatedAt && updatedAt > prev)) {
        middleUpdated.set(key, updatedAt);
      }
    }
  }

  for (const [code, updatedAt] of largeUpdated) {
    paths.push({ path: `/areas/${code}`, updatedAt });
  }

  for (const [key, updatedAt] of middleUpdated) {
    paths.push({ path: `/areas/${key}`, updatedAt });
  }

  return paths;
}

export async function countShopsForSitemap(): Promise<number> {
  const snapshot = await loadShopsSnapshot();
  if (!snapshot) return 0;
  return snapshot.shops.length;
}

export async function listShopSitemapEntries(
  offset: number,
  limit: number,
): Promise<{ id: string; updatedAt: string }[]> {
  const snapshot = await loadShopsSnapshot();
  if (!snapshot) return [];

  return snapshot.shops
    .slice()
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .slice(offset, offset + limit)
    .map((shop) => ({
      id: shop.id,
      updatedAt: shop.updated_at,
    }));
}

/** 表示用の主要大エリアラベル（コード→地名） */
export const AREA_LABELS: Record<string, string> = {
  Z011: "東京",
  Z012: "神奈川",
  Z013: "埼玉",
  Z014: "千葉",
  Z015: "茨城",
  Z016: "栃木",
  Z017: "群馬",
  Z021: "北海道",
  Z031: "宮城",
  Z032: "山形",
  Z033: "福島",
  Z034: "青森",
  Z035: "岩手",
  Z036: "秋田",
  Z041: "愛知",
  Z042: "岐阜",
  Z043: "三重",
  Z044: "静岡",
  Z051: "大阪",
  Z052: "兵庫",
  Z053: "京都",
  Z054: "滋賀",
  Z055: "奈良",
  Z056: "和歌山",
  Z061: "岡山",
  Z062: "広島",
  Z063: "鳥取",
  Z064: "島根",
  Z065: "山口",
  Z071: "福岡",
  Z072: "佐賀",
  Z073: "長崎",
  Z074: "熊本",
  Z075: "大分",
  Z076: "宮崎",
  Z077: "鹿児島",
  Z078: "沖縄",
  Z081: "新潟",
  Z082: "長野",
  Z083: "山梨",
  Z091: "石川",
  Z092: "福井",
  Z093: "富山",
  Z101: "香川",
  Z102: "徳島",
  Z103: "愛媛",
  Z104: "高知",
};
