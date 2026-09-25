/**
 * 好み診断用タグのキーワード辞書。
 * 店舗テキスト（店名・ジャンル・キャッチ・アクセス等）への部分一致で判定する。
 * タグ名（キー）は診断・表示で使うラベルそのもの。
 */

export type TagCategoryId =
  | "soup"
  | "spicy"
  | "richness"
  | "noodle"
  | "inbound";

export type TagKeywordEntry = {
  tag: string;
  keywords: readonly string[];
};

export type TagCategory = {
  id: TagCategoryId;
  label: string;
  tags: readonly TagKeywordEntry[];
};

/** スープ系統（複数可。ヒットなしはタグなし＝不明） */
export const SOUP_TAGS: readonly TagKeywordEntry[] = [
  { tag: "豚骨", keywords: ["豚骨", "とんこつ", "トンコツ"] },
  { tag: "醤油", keywords: ["醤油", "しょうゆ", "ショウユ"] },
  { tag: "味噌", keywords: ["味噌", "みそ", "ミソ"] },
  {
    tag: "塩",
    keywords: [
      "塩ラーメン",
      "塩らーめん",
      "塩らあめん",
      "しおラーメン",
      "しおらーめん",
      "塩そば",
      "しおそば",
      "塩味",
      "しお味",
      "塩スープ",
      "しおスープ",
      "塩ベース",
      "しおベース",
    ],
  },
  {
    tag: "つけ麺",
    keywords: ["つけ麺", "つけめん", "付麺", "付け麺", "つけそば"],
  },
  { tag: "家系", keywords: ["家系"] },
  { tag: "二郎系", keywords: ["二郎"] },
  {
    tag: "無添加・煮干し系",
    keywords: ["無添加", "煮干", "にぼし", "niboshi", "出し醤油", "出汁醤油"],
  },
] as const;

/** 辛さ（ヒット時のみ「辛い系対応あり」。なしはタグ付けしない） */
export const SPICY_TAGS: readonly TagKeywordEntry[] = [
  {
    tag: "辛い系対応あり",
    keywords: [
      "担々",
      "担担",
      "坦々",
      "坦坦",
      "辛味噌",
      "辛みそ",
      "辛口",
      "激辛",
      "辛ラーメン",
      "辛麺",
      "辣",
      "チゲ",
      "ファイヤー",
      "スパイシー",
      "spicy",
    ],
  },
] as const;

/** こってり度（該当時のみ付与。両方ヒット可） */
export const RICHNESS_TAGS: readonly TagKeywordEntry[] = [
  {
    tag: "がっつり系",
    keywords: [
      "背脂",
      "ニンニク",
      "にんにく",
      "マシマシ",
      "ましまし",
      "こってり",
      "濃厚",
      "ガッツリ",
      "がっつり",
      "ダブルスープ",
      "Wスープ",
    ],
  },
  {
    tag: "あっさり系",
    keywords: ["あっさり", "アッサリ", "さっぱり", "サッパリ", "清湯", "薄い"],
  },
] as const;

/** 麺の太さ（記載があるときのみ） */
export const NOODLE_TAGS: readonly TagKeywordEntry[] = [
  { tag: "太麺", keywords: ["太麺", "極太", "ちぢれ太", "平打ち"] },
  { tag: "細麺", keywords: ["細麺", "極細", "ストレート細"] },
] as const;

/**
 * インバウンド対応（ヒット時のみ付与。
 * 該当なしはタグなし＝診断側で「対応不明」として扱う）
 */
export const INBOUND_TAGS: readonly TagKeywordEntry[] = [
  {
    tag: "ハラール対応",
    keywords: ["ハラール", "ハラル", "halal", "Halal", "HALAL"],
  },
  {
    tag: "ベジタリアン対応",
    keywords: [
      "ベジタリアン",
      "ヴィーガン",
      "ビーガン",
      "vegetarian",
      "vegan",
      "菜食",
    ],
  },
  {
    tag: "英語メニューあり",
    keywords: [
      "英語メニュー",
      "英文メニュー",
      "English menu",
      "english menu",
      "Menu in English",
      "多言語メニュー",
    ],
  },
] as const;

export const TAG_CATEGORIES: readonly TagCategory[] = [
  { id: "soup", label: "スープ系統", tags: SOUP_TAGS },
  { id: "spicy", label: "辛さ", tags: SPICY_TAGS },
  { id: "richness", label: "こってり度", tags: RICHNESS_TAGS },
  { id: "noodle", label: "麺の太さ", tags: NOODLE_TAGS },
  { id: "inbound", label: "インバウンド対応", tags: INBOUND_TAGS },
] as const;

/** 全タグ名のフラット一覧（ログ・検証用） */
export const ALL_TAG_NAMES: readonly string[] = TAG_CATEGORIES.flatMap((c) =>
  c.tags.map((t) => t.tag),
);
