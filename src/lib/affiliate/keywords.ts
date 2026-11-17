import { RAMEN_STYLES, type RamenStyleId } from "@/lib/types";
import type { AffiliateStyleKey } from "./types";

/**
 * 系統ごとの楽天検索キーワード。
 * 系統キー自体は RAMEN_STYLES から導出し、キーワード文字列だけここで管理する。
 */
const STYLE_KEYWORDS: Record<RamenStyleId, string> = {
  miso: "インスタントラーメン 味噌",
  shoyu: "インスタントラーメン 醤油",
  shio: "インスタントラーメン 塩",
  tonkotsu: "インスタントラーメン 豚骨",
  tsukemen: "インスタントラーメン つけ麺",
  iekei: "家系 インスタント ラーメン",
  jiro: "二郎系 インスタント",
};

const GENERAL_KEYWORD = "インスタントラーメン";

export type AffiliateSearchTarget = {
  styleKey: AffiliateStyleKey;
  keyword: string;
};

/** RAMEN_STYLES 順 + general。ハードコードした系統リストは持たない */
export function listAffiliateSearchTargets(): AffiliateSearchTarget[] {
  const styles: AffiliateSearchTarget[] = RAMEN_STYLES.map((style) => ({
    styleKey: style.id,
    keyword: STYLE_KEYWORDS[style.id],
  }));
  return [...styles, { styleKey: "general", keyword: GENERAL_KEYWORD }];
}
