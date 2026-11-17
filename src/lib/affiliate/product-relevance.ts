/**
 * インスタントラーメン以外（スープ単体・食器・カップ麺など）を除外する。
 * Yahoo API に NGKeyword が無いため、取得後に商品名でフィルタする。
 */

import { RAMEN_STYLES, type RamenStyleId } from "@/lib/types";
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

function styleKeywords(styleId: RamenStyleId): readonly string[] {
  return RAMEN_STYLES.find((s) => s.id === styleId)?.keywords ?? [];
}

export function isRelevantInstantRamenProduct(
  name: string,
  styleKey?: AffiliateStyleKey,
): boolean {
  const n = name.trim();
  if (!n) return false;
  if (EXCLUDE_NAME_PATTERNS.some((re) => re.test(n))) return false;
  if (!INCLUDE_NAME_PATTERNS.some((re) => re.test(n))) return false;

  // 系統指定時は、検索ノイズ対策として商品名に系統語が含まれることを要求
  if (styleKey && styleKey !== "general") {
    const keywords = styleKeywords(styleKey);
    if (keywords.length && !keywords.some((kw) => n.includes(kw))) {
      return false;
    }
  }

  return true;
}
