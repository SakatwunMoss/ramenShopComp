import type { Shop } from "./types";

export type AreaCountEntry = {
  ramen: number;
  all: number;
};

export type ShopsSnapshot = {
  generated_at: string;
  shops: Shop[];
  area_counts: {
    large: Record<string, AreaCountEntry>;
    middle: Record<string, Record<string, AreaCountEntry>>;
  };
};
