import { createServerSupabaseClient } from "./supabase";
import {
  RAMEN_STYLES,
  type RamenStyleId,
  type Shop,
} from "./types";

export type ShopFilters = {
  area?: string;
  style?: RamenStyleId | string;
  q?: string;
};

export async function listShops(
  filters: ShopFilters = {},
  limit = 48,
): Promise<Shop[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("shops")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (filters.area) {
    query = query.eq("large_area_code", filters.area);
  }

  if (filters.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listShops error:", error.message);
    return [];
  }

  let shops = (data ?? []) as Shop[];

  if (filters.style) {
    const style = RAMEN_STYLES.find((s) => s.id === filters.style);
    if (style) {
      shops = shops.filter((shop) => {
        const haystack = `${shop.name} ${shop.genre ?? ""} ${shop.access ?? ""}`;
        return style.keywords.some((kw) => haystack.includes(kw));
      });
    }
  }

  return shops;
}

export async function getShopById(id: string): Promise<Shop | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getShopById error:", error.message);
    return null;
  }
  return data as Shop | null;
}

export async function listLargeAreas(): Promise<
  { code: string; count: number }[]
> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("shops")
    .select("large_area_code")
    .not("large_area_code", "is", null);

  if (error || !data) return [];

  const counts = new Map<string, number>();
  for (const row of data as { large_area_code: string | null }[]) {
    if (!row.large_area_code) continue;
    counts.set(
      row.large_area_code,
      (counts.get(row.large_area_code) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
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
