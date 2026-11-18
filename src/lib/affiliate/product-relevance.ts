/**
 * インスタントラーメン商品の関連性フィルタと、商品名からの系統再判定。
 * 検索キーワードの styleKey は信用せず、取得後にこの判定で振り分ける。
 */

import type { RamenStyleId } from "@/lib/types";
import type { AffiliateStyleKey } from "./types";

/** これらを含む商品は除外 */
const EXCLUDE_NAME_PATTERNS: RegExp[] = [
  /カップ麺/,
  /カップラーメン/,
  /カップらーめん/,
  /カップ焼そば/,
  /カップ焼きそば/,
  /スープのみ/,
  /スープの素/,
  /タレのみ|たれのみ/,
  /麺なし/,
  /調味料/,
  /どんぶり|丼ぶり|ラーメン丼|ラーメン鉢/,
  /食器|箸|レンゲ|フォーク/,
  /フィギュア|ぬいぐるみ|キーホルダー/,
  /レシピ本|クックブック/,
  /具材/,
  /春雨/,
  /ラーメン風/,
  /ラーメン背脂/,
  /背脂\s*\d+\s*個/,
  /個包装.*背脂|背脂.*個包装/,
  /背脂(?!.*(麺|ラーメン|らーめん|セット))/,
  /チャーシュー(?!.*(麺|ラーメン|らーめん|セット))/,
  /乾燥野菜|フリーズドライ|ドライベジタブル/,
  /みそ汁|味噌汁/,
  /小麦粉|薄力粉|中力粉|強力粉|製粉/,
];

/** インスタント麺らしさの最低条件（いずれか） */
const INCLUDE_NAME_PATTERNS: RegExp[] = [
  /インスタント/,
  /即席麺|即席めん/,
  /袋麺/,
  /袋めん/,
  /袋入/,
  /乾麺/,
  /生麺/,
  /ラーメン/,
  /らーめん/,
  /拉麺/,
  /つけ麺/,
  /つけめん/,
];

/**
 * 系統再判定の優先順位（強い系統語ほど先）。
 * 上位にヒットしたら下位には割り当てない。
 */
const STYLE_INFER_RULES: {
  id: RamenStyleId;
  patterns: RegExp[];
}[] = [
  {
    id: "jiro",
    patterns: [/二郎/, /ジロリアン/, /jiro/i],
  },
  {
    id: "iekei",
    patterns: [/家系/, /いえけい/],
  },
  {
    id: "tsukemen",
    patterns: [/つけ麺/, /つけめん/, /つけ麵/, /付麺/],
  },
  {
    id: "tonkotsu",
    patterns: [/豚骨/, /とんこつ/, /トンコツ/],
  },
  {
    id: "miso",
    patterns: [/味噌/, /みそ/],
  },
  {
    id: "shio",
    patterns: [/塩らーめん/, /塩ラーメン/, /しおラーメン/, /塩味/, /塩そば/],
  },
  {
    id: "shoyu",
    patterns: [/醤油/, /しょうゆ/, /正油/],
  },
];

/** 「塩」単体は誤爆しやすいので、塩判定は上の強いパターンに限定しつつ補助語も見る */
const SHIO_EXTRA = [/[^ぁ-んァ-ヶ一-龥]塩[^ぁ-んァ-ヶ一-龥]/, /^塩/, /塩ら/, /しお味/, /しお$/];

export function isRelevantInstantRamenProduct(name: string): boolean {
  const n = name.trim();
  if (!n) return false;
  if (EXCLUDE_NAME_PATTERNS.some((re) => re.test(n))) return false;
  if (!INCLUDE_NAME_PATTERNS.some((re) => re.test(n))) return false;
  return true;
}

/**
 * 商品名から系統を再判定する。
 * 優先: jiro > iekei > tsukemen > tonkotsu > miso > shio > shoyu
 * 「醤油豚骨」で二郎・家系語がなければ tonkotsu。
 * どれにも当てはまらなければ general。
 */
export function inferAffiliateStyleFromName(name: string): AffiliateStyleKey {
  const n = name.trim();
  if (!n) return "general";

  for (const rule of STYLE_INFER_RULES) {
    if (rule.id === "shio") {
      const hit =
        rule.patterns.some((re) => re.test(n)) ||
        SHIO_EXTRA.some((re) => re.test(n));
      if (hit) return "shio";
      continue;
    }
    if (rule.patterns.some((re) => re.test(n))) {
      return rule.id;
    }
  }

  return "general";
}

/** スープ味の系統（詰め合わせ判定用）。優先順位ロジック自体は変えない */
const SOUP_FLAVOR_STYLE_IDS = [
  "tonkotsu",
  "miso",
  "shio",
  "shoyu",
] as const satisfies readonly RamenStyleId[];

type SoupFlavorStyleId = (typeof SOUP_FLAVOR_STYLE_IDS)[number];

/** 単一の味呼称として扱う「醤油豚骨」「豚骨醤油」系 */
const SHOYU_TONKOTSU_COMPOUND =
  /(?:醤油|しょうゆ|正油)\s*(?:豚骨|とんこつ|トンコツ)|(?:豚骨|とんこつ|トンコツ)\s*(?:醤油|しょうゆ|正油)/;

const SOUP_FLAVOR_DETECT: {
  id: SoupFlavorStyleId;
  test: (name: string) => boolean;
}[] = [
  {
    id: "tonkotsu",
    test: (n) => /豚骨|とんこつ|トンコツ/.test(n),
  },
  {
    id: "miso",
    test: (n) => /味噌|みそ/.test(n),
  },
  {
    id: "shio",
    test: (n) =>
      [/塩らーめん/, /塩ラーメン/, /しおラーメン/, /塩味/, /塩そば/].some((re) =>
        re.test(n),
      ) || SHIO_EXTRA.some((re) => re.test(n)),
  },
  {
    id: "shoyu",
    test: (n) => /醤油|しょうゆ|正油/.test(n),
  },
];

/**
 * 複数味の詰め合わせセットか。
 * スープ系統語が複合語を除いて2種以上ある場合に true。
 * 「醤油豚骨」のような単一味呼称、および二郎/家系/つけ麺＋単一スープは false。
 * （inferAffiliateStyleFromName の優先順位ロジックは変更しない）
 */
export function isMultiFlavorAssortment(name: string): boolean {
  const n = name.trim();
  if (!n) return false;

  // 醤油豚骨 / 豚骨醤油 は単一味として tonkotsu のみカウント
  const collapsed = n.replace(SHOYU_TONKOTSU_COMPOUND, "豚骨");

  const flavors = new Set<SoupFlavorStyleId>();
  for (const rule of SOUP_FLAVOR_DETECT) {
    if (rule.test(collapsed)) flavors.add(rule.id);
  }
  return flavors.size >= 2;
}

/** 個数・入り数表記を除いた比較用の商品名 */
const QUANTITY_NOISE_PATTERNS: RegExp[] = [
  /\d+\s*食(?:分|入り|入|セット)?/g,
  /\d+\s*人前/g,
  /\d+\s*袋(?:入り|入|セット)?/g,
  /\d+\s*個(?:入り|入|セット)?/g,
  /\d+\s*パック(?:入り|入)?/g,
  /\d+\s*箱(?:入り|入)?/g,
  /\d+\s*セット/g,
  /(?:1袋|一袋)\s*[×xX＊*]\s*\d+/g,
  /\d+\s*[×xX＊*]\s*\d+(?:\s*(?:袋|個|食|パック))?/g,
  /[【\[]\s*[SsMmLl]\s*[】\]]/g,
];

export function stripQuantityNoiseFromName(name: string): string {
  let n = name.trim();
  for (const re of QUANTITY_NOISE_PATTERNS) {
    n = n.replace(re, " ");
  }
  return n.replace(/\s+/g, " ").trim();
}

const VARIANT_PREFIX_LEN = 18;

/**
 * 個数違いの同一商品か。
 * 個数表記除去後の名前が一致、または同一ストアで先頭部分が一致すれば同一とみなす。
 */
export function isSameProductQuantityVariant(
  a: { name: string; shopName: string },
  b: { name: string; shopName: string },
): boolean {
  const na = stripQuantityNoiseFromName(a.name);
  const nb = stripQuantityNoiseFromName(b.name);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const sameShop =
    a.shopName.trim().length > 0 &&
    a.shopName.trim() === b.shopName.trim();
  if (!sameShop) return false;

  const prefixLen = Math.min(VARIANT_PREFIX_LEN, na.length, nb.length);
  if (prefixLen < 8) return false;
  return na.slice(0, prefixLen) === nb.slice(0, prefixLen);
}

/** 選定時の個数違い重複排除用キー（ストア + 正規化名の先頭） */
export function productQuantityVariantKey(product: {
  name: string;
  shopName: string;
}): string {
  const shop = product.shopName.trim() || "_";
  const core = stripQuantityNoiseFromName(product.name);
  const prefix = core.slice(0, VARIANT_PREFIX_LEN);
  return `${shop}::${prefix}`;
}
