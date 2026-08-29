export type Shop = {
  id: string;
  hotpepper_id: string | null;
  data_source: string;
  name: string;
  genre: string | null;
  address: string | null;
  large_area_code: string | null;
  middle_area_code: string | null;
  small_area_code: string | null;
  lat: number | null;
  lng: number | null;
  budget: string | null;
  image_url: string | null;
  shop_url: string | null;
  phone: string | null;
  open_hours: string | null;
  close_days: string | null;
  access: string | null;
  created_at: string;
  updated_at: string;
};

/** 将来の手動タグ付けを見据えたラーメン系統フィルタ */
export const RAMEN_STYLES = [
  { id: "miso", label: "味噌", keywords: ["味噌", "みそ"] },
  { id: "shoyu", label: "醤油", keywords: ["醤油", "しょうゆ"] },
  { id: "shio", label: "塩", keywords: ["塩", "しお"] },
  { id: "tonkotsu", label: "豚骨", keywords: ["豚骨", "とんこつ"] },
  { id: "tsukemen", label: "つけ麺", keywords: ["つけ麺", "付麺"] },
  { id: "iekei", label: "家系", keywords: ["家系"] },
  { id: "jiro", label: "二郎系", keywords: ["二郎"] },
] as const;

export type RamenStyleId = (typeof RAMEN_STYLES)[number]["id"];
