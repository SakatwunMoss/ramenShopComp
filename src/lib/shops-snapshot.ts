import type { Shop } from "./types";

export type AreaCountEntry = {
  ramen: number;
  all: number;
};

export type AreaLabel = {
  name: string;
  parent_code: string | null;
  level: "large" | "middle";
};

export type ShopsSnapshot = {
  generated_at: string;
  shops: Shop[];
  area_counts: {
    large: Record<string, AreaCountEntry>;
    middle: Record<string, Record<string, AreaCountEntry>>;
  };
  /** D1 area_labels テーブルからエクスポート（code → ラベル） */
  area_labels?: Record<string, AreaLabel>;
};
