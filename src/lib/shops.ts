import { getDb } from "./db";
import { SHOPS_PAGE_SIZE } from "./site";
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

/** ラーメン店らしいレコードに寄せる（ジャンル or 店名） */
const RAMEN_SCOPE_SQL = `(
  IFNULL(genre, '') LIKE '%ラーメン%'
  OR name LIKE '%ラーメン%'
  OR name LIKE '%らーめん%'
  OR name LIKE '%らあめん%'
  OR name LIKE '%拉麺%'
  OR name LIKE '%つけ麺%'
  OR name LIKE '%つけめん%'
  OR name LIKE '%麺屋%'
  OR name LIKE '%麺処%'
  OR name LIKE '%麺場%'
)`;

function pushRamenScope(
  clauses: string[],
  ramenOnly: boolean | undefined,
) {
  if (ramenOnly !== false) {
    clauses.push(RAMEN_SCOPE_SQL);
  }
}

function buildFilterClauses(filters: ShopFilters): {
  clauses: string[];
  params: unknown[];
} {
  const clauses: string[] = [];
  const params: unknown[] = [];

  pushRamenScope(clauses, filters.ramenOnly);

  if (filters.area) {
    clauses.push("large_area_code = ?");
    params.push(filters.area);
  }

  if (filters.middleArea) {
    clauses.push("middle_area_code = ?");
    params.push(filters.middleArea);
  }

  if (filters.q) {
    clauses.push("name LIKE ?");
    params.push(`%${filters.q}%`);
  }

  if (filters.style) {
    const style = RAMEN_STYLES.find((s) => s.id === filters.style);
    if (style) {
      const ors = style.keywords
        .map(
          () =>
            "(name LIKE ? OR IFNULL(genre,'') LIKE ? OR IFNULL(access,'') LIKE ?)",
        )
        .join(" OR ");
      clauses.push(`(${ors})`);
      for (const kw of style.keywords) {
        const like = `%${kw}%`;
        params.push(like, like, like);
      }
    }
  }

  return { clauses, params };
}

function applyStylePostFilter(
  shops: Shop[],
  styleId: string | undefined,
  limit: number,
): Shop[] {
  if (!styleId) return shops;
  const style = RAMEN_STYLES.find((s) => s.id === styleId);
  if (!style) return shops;
  return shops
    .filter((shop) => {
      const haystack = `${shop.name} ${shop.genre ?? ""} ${shop.access ?? ""}`;
      return style.keywords.some((kw) => haystack.includes(kw));
    })
    .slice(0, limit);
}

export async function listShops(
  filters: ShopFilters = {},
  limit = 48,
): Promise<Shop[]> {
  const db = await getDb();
  if (!db) return [];

  const { clauses, params } = buildFilterClauses(filters);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const fetchLimit = filters.style ? Math.max(limit * 3, 120) : limit;
  const bindParams = [...params, fetchLimit];

  const sql = `
    SELECT * FROM shops
    ${where}
    ORDER BY updated_at DESC
    LIMIT ?
  `;

  try {
    const { results } = await db.prepare(sql).bind(...bindParams).all<Shop>();
    return applyStylePostFilter(results ?? [], filters.style, limit);
  } catch (err) {
    console.error("listShops error:", err);
    return [];
  }
}

export async function countShops(filters: ShopFilters = {}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { clauses, params } = buildFilterClauses(filters);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  // style は SQL 近似 + 後段フィルタのため、style 指定時は実体を数える
  if (filters.style) {
    const shops = await listShops(filters, 5000);
    return shops.length;
  }

  try {
    const row = await db
      .prepare(`SELECT COUNT(*) AS count FROM shops ${where}`)
      .bind(...params)
      .first<{ count: number }>();
    return Number(row?.count ?? 0);
  } catch (err) {
    console.error("countShops error:", err);
    return 0;
  }
}

export async function listShopsPaginated(
  filters: ShopFilters = {},
  page = 1,
  pageSize = SHOPS_PAGE_SIZE,
): Promise<PaginatedShops> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.min(pageSize, 48));
  const db = await getDb();

  if (!db) {
    return {
      shops: [],
      total: 0,
      page: safePage,
      pageSize: safeSize,
      totalPages: 0,
    };
  }

  // style フィルタは後段絞り込みがあるため、広めに取得してからページング
  if (filters.style) {
    const all = await listShops(filters, 2000);
    const total = all.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / safeSize);
    const offset = (safePage - 1) * safeSize;
    return {
      shops: all.slice(offset, offset + safeSize),
      total,
      page: safePage,
      pageSize: safeSize,
      totalPages,
    };
  }

  const total = await countShops(filters);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeSize);
  const offset = (safePage - 1) * safeSize;

  const { clauses, params } = buildFilterClauses(filters);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  try {
    const { results } = await db
      .prepare(
        `
        SELECT * FROM shops
        ${where}
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `,
      )
      .bind(...params, safeSize, offset)
      .all<Shop>();

    return {
      shops: results ?? [],
      total,
      page: safePage,
      pageSize: safeSize,
      totalPages,
    };
  } catch (err) {
    console.error("listShopsPaginated error:", err);
    return {
      shops: [],
      total,
      page: safePage,
      pageSize: safeSize,
      totalPages,
    };
  }
}

export async function getShopById(id: string): Promise<Shop | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    return await db
      .prepare("SELECT * FROM shops WHERE id = ? LIMIT 1")
      .bind(id)
      .first<Shop>();
  } catch (err) {
    console.error("getShopById error:", err);
    return null;
  }
}

/** URL の id 順を保って複数店舗を取得する */
export async function getShopsByIds(ids: string[]): Promise<Shop[]> {
  if (ids.length === 0) return [];

  const db = await getDb();
  if (!db) return [];

  const placeholders = ids.map(() => "?").join(", ");
  try {
    const { results } = await db
      .prepare(`SELECT * FROM shops WHERE id IN (${placeholders})`)
      .bind(...ids)
      .all<Shop>();

    const byId = new Map((results ?? []).map((shop) => [shop.id, shop]));
    const ordered: Shop[] = [];
    for (const id of ids) {
      const shop = byId.get(id);
      if (shop) ordered.push(shop);
    }
    return ordered;
  } catch (err) {
    console.error("getShopsByIds error:", err);
    return [];
  }
}

export async function listLargeAreas(options?: {
  ramenOnly?: boolean;
}): Promise<{ code: string; count: number; name: string }[]> {
  const db = await getDb();
  if (!db) return [];

  const clauses = [
    "large_area_code IS NOT NULL",
    "large_area_code != ''",
  ];
  pushRamenScope(clauses, options?.ramenOnly);

  try {
    const { results } = await db
      .prepare(
        `
        SELECT large_area_code AS code, COUNT(*) AS count
        FROM shops
        WHERE ${clauses.join(" AND ")}
        GROUP BY large_area_code
        ORDER BY count DESC
      `,
      )
      .all<{ code: string; count: number }>();

    return (results ?? []).map((row) => ({
      ...row,
      name: resolveLargeAreaName(row.code),
    }));
  } catch (err) {
    console.error("listLargeAreas error:", err);
    return [];
  }
}

export async function listMiddleAreas(
  largeAreaCode: string,
  options?: { ramenOnly?: boolean },
): Promise<{ code: string; count: number; name: string }[]> {
  const db = await getDb();
  if (!db) return [];

  const clauses = [
    "large_area_code = ?",
    "middle_area_code IS NOT NULL",
    "middle_area_code != ''",
  ];
  pushRamenScope(clauses, options?.ramenOnly);

  try {
    const { results } = await db
      .prepare(
        `
        SELECT middle_area_code AS code, COUNT(*) AS count
        FROM shops
        WHERE ${clauses.join(" AND ")}
        GROUP BY middle_area_code
        ORDER BY count DESC
      `,
      )
      .bind(largeAreaCode)
      .all<{ code: string; count: number }>();

    const labels = await getAreaLabelMap(
      (results ?? []).map((r) => r.code),
    );

    return (results ?? []).map((row) => ({
      ...row,
      name: labels.get(row.code) ?? row.code,
    }));
  } catch (err) {
    console.error("listMiddleAreas error:", err);
    return [];
  }
}

export async function listGenreTrends(
  filters: Pick<ShopFilters, "area" | "middleArea" | "ramenOnly">,
  limit = 5,
): Promise<GenreTrend[]> {
  const db = await getDb();
  if (!db) return [];

  const clauses: string[] = [
    "genre IS NOT NULL",
    "genre != ''",
  ];
  const params: unknown[] = [];
  pushRamenScope(clauses, filters.ramenOnly);

  if (filters.area) {
    clauses.push("large_area_code = ?");
    params.push(filters.area);
  }
  if (filters.middleArea) {
    clauses.push("middle_area_code = ?");
    params.push(filters.middleArea);
  }

  try {
    const { results } = await db
      .prepare(
        `
        SELECT genre, COUNT(*) AS count
        FROM shops
        WHERE ${clauses.join(" AND ")}
        GROUP BY genre
        ORDER BY count DESC
        LIMIT ?
      `,
      )
      .bind(...params, limit)
      .all<GenreTrend>();
    return results ?? [];
  } catch (err) {
    console.error("listGenreTrends error:", err);
    return [];
  }
}

export async function getAreaLabel(code: string): Promise<string | null> {
  if (AREA_LABELS[code]) return AREA_LABELS[code];

  const db = await getDb();
  if (!db) return null;

  try {
    const row = await db
      .prepare("SELECT name FROM area_labels WHERE code = ? LIMIT 1")
      .bind(code)
      .first<{ name: string }>();
    return row?.name ?? null;
  } catch {
    // area_labels 未マイグレーション時はフォールバック
    return null;
  }
}

async function getAreaLabelMap(codes: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const code of codes) {
    if (AREA_LABELS[code]) map.set(code, AREA_LABELS[code]);
  }

  const missing = codes.filter((c) => !map.has(c));
  if (missing.length === 0) return map;

  const db = await getDb();
  if (!db) return map;

  try {
    const placeholders = missing.map(() => "?").join(", ");
    const { results } = await db
      .prepare(
        `SELECT code, name FROM area_labels WHERE code IN (${placeholders})`,
      )
      .bind(...missing)
      .all<{ code: string; name: string }>();
    for (const row of results ?? []) {
      map.set(row.code, row.name);
    }
  } catch {
    // ignore missing table
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
  const db = await getDb();
  if (!db) return [];

  const paths: { path: string; updatedAt: string | null }[] = [
    { path: "/areas", updatedAt: null },
  ];

  try {
    const { results: large } = await db
      .prepare(
        `
        SELECT large_area_code AS code, MAX(updated_at) AS updated_at
        FROM shops
        WHERE large_area_code IS NOT NULL AND large_area_code != ''
        GROUP BY large_area_code
      `,
      )
      .all<{ code: string; updated_at: string | null }>();

    for (const row of large ?? []) {
      paths.push({
        path: `/areas/${row.code}`,
        updatedAt: row.updated_at,
      });
    }

    const { results: middle } = await db
      .prepare(
        `
        SELECT large_area_code AS large_code,
               middle_area_code AS middle_code,
               MAX(updated_at) AS updated_at
        FROM shops
        WHERE large_area_code IS NOT NULL AND large_area_code != ''
          AND middle_area_code IS NOT NULL AND middle_area_code != ''
        GROUP BY large_area_code, middle_area_code
      `,
      )
      .all<{
        large_code: string;
        middle_code: string;
        updated_at: string | null;
      }>();

    for (const row of middle ?? []) {
      paths.push({
        path: `/areas/${row.large_code}/${row.middle_code}`,
        updatedAt: row.updated_at,
      });
    }
  } catch (err) {
    console.error("listAllAreaPathsForSitemap error:", err);
  }

  return paths;
}

export async function countShopsForSitemap(): Promise<number> {
  return countShops({ ramenOnly: false });
}

export async function listShopSitemapEntries(
  offset: number,
  limit: number,
): Promise<{ id: string; updatedAt: string }[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const { results } = await db
      .prepare(
        `
        SELECT id, updated_at AS updatedAt
        FROM shops
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `,
      )
      .bind(limit, offset)
      .all<{ id: string; updatedAt: string }>();
    return results ?? [];
  } catch (err) {
    console.error("listShopSitemapEntries error:", err);
    return [];
  }
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
