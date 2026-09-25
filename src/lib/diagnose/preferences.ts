/** 好み診断の質問・選択肢定義（UI とスコアリングで共有） */

export const ANY_PREFERENCE = "こだわらない" as const;

export type AnyPreference = typeof ANY_PREFERENCE;

export const SOUP_OPTIONS = [
  "豚骨",
  "醤油",
  "味噌",
  "塩",
  "つけ麺",
  ANY_PREFERENCE,
] as const;

export type SoupPreference = (typeof SOUP_OPTIONS)[number];

export const SPICY_OPTIONS = ["辛いメニューも食べたい", ANY_PREFERENCE] as const;

export type SpicyPreference = (typeof SPICY_OPTIONS)[number];

/** UI ラベル → 店舗 tags 上のタグ名 */
export const SPICY_TAG_BY_PREFERENCE = {
  辛いメニューも食べたい: "辛い系対応あり",
} as const satisfies Record<
  Exclude<SpicyPreference, AnyPreference>,
  string
>;

export const RICHNESS_OPTIONS = [
  "がっつり系",
  "あっさり系",
  ANY_PREFERENCE,
] as const;

export type RichnessPreference = (typeof RICHNESS_OPTIONS)[number];

export const INBOUND_OPTIONS = [
  "ハラール対応",
  "ベジタリアン対応",
  ANY_PREFERENCE,
] as const;

export type InboundPreference = (typeof INBOUND_OPTIONS)[number];

export type DiagnosePreferences = {
  largeArea: string;
  middleArea: string;
  soup: SoupPreference;
  spicy: SpicyPreference;
  richness: RichnessPreference;
  inbound: InboundPreference;
};

export const DIAGNOSE_TOP_N = 5;

/** 上位結果のうちスコア ≥ この値の店が1件でもあれば「好みに近い」見出し */
export const PREFERENCE_MATCH_SCORE_THRESHOLD = 1;

export function isAnyPreference(value: string): value is AnyPreference {
  return value === ANY_PREFERENCE;
}
