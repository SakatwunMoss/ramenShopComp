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
