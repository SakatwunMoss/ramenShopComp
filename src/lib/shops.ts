import { getDb } from "./db";
import {
  RAMEN_STYLES,
  type RamenStyleId,
  type Shop,
} from "./types";

export type ShopFilters = {
  area?: string;
  style?: RamenStyleId | string;
  q?: string;
  /** false のとき HotPepper キーワード該当をすべて表示（居酒屋等を含む） */
  ramenOnly?: boolean;
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

export async function listShops(
  filters: ShopFilters = {},
  limit = 48,
): Promise<Shop[]> {
  const db = await getDb();
  if (!db) return [];

  const clauses: string[] = [];
  const params: unknown[] = [];

  pushRamenScope(clauses, filters.ramenOnly);

  if (filters.area) {
    clauses.push("large_area_code = ?");
    params.push(filters.area);
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

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const fetchLimit = filters.style ? Math.max(limit * 3, 120) : limit;
  params.push(fetchLimit);

  const sql = `
    SELECT * FROM shops
    ${where}
    ORDER BY updated_at DESC
    LIMIT ?
  `;

  try {
    const { results } = await db.prepare(sql).bind(...params).all<Shop>();
    let shops = results ?? [];

    if (filters.style) {
      const style = RAMEN_STYLES.find((s) => s.id === filters.style);
      if (style) {
        shops = shops
          .filter((shop) => {
            const haystack = `${shop.name} ${shop.genre ?? ""} ${shop.access ?? ""}`;
            return style.keywords.some((kw) => haystack.includes(kw));
          })
          .slice(0, limit);
      }
    }

    return shops;
  } catch (err) {
    console.error("listShops error:", err);
    return [];
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
}): Promise<{ code: string; count: number }[]> {
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
    return results ?? [];
  } catch (err) {
    console.error("listLargeAreas error:", err);
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
