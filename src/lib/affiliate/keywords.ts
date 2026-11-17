import { RAMEN_STYLES, type RamenStyleId } from "@/lib/types";
import type { AffiliateStyleKey } from "./types";

/**
 * 系統ごとの検索キーワード（提供元共通）。
 * 先頭が主キーワード。足りない場合に続くバリエーションで補充する。
 */
const STYLE_KEYWORDS: Record<RamenStyleId, readonly string[]> = {
  miso: [
    "インスタントラーメン 味噌",
    "味噌ラーメン 袋麺",
    "みそラーメン インスタント",
  ],
  shoyu: [
    "インスタントラーメン 醤油",
    "醤油ラーメン 袋麺",
    "しょうゆラーメン インスタント",
  ],
  shio: [
    "インスタントラーメン 塩",
    "塩ラーメン 袋麺",
    "塩らーめん インスタント",
  ],
  tonkotsu: [
    "インスタントラーメン 豚骨",
    "豚骨ラーメン 袋麺",
    "とんこつラーメン インスタント",
  ],
  tsukemen: [
    "インスタントラーメン つけ麺",
    "つけ麺 袋麺",
    "つけ麺 インスタント",
  ],
  iekei: [
    "家系 インスタント ラーメン",
    "家系ラーメン 袋麺",
    "横浜家系 インスタント",
  ],
  jiro: [
    "二郎系 インスタント",
    "二郎系 ラーメン 袋麺",
    "二郎インスパイア インスタント",
  ],
};

const GENERAL_KEYWORDS = [
  "インスタントラーメン",
  "袋麺 ラーメン",
  "即席めん ラーメン",
] as const;

export type AffiliateSearchTarget = {
  styleKey: AffiliateStyleKey;
  /** 主キーワード＋補充用バリエーション（先頭から試す） */
  keywords: readonly string[];
};

/** RAMEN_STYLES 順 + general */
export function listAffiliateSearchTargets(): AffiliateSearchTarget[] {
  const styles: AffiliateSearchTarget[] = RAMEN_STYLES.map((style) => ({
    styleKey: style.id,
    keywords: STYLE_KEYWORDS[style.id],
  }));
  return [
    ...styles,
    { styleKey: "general", keywords: GENERAL_KEYWORDS },
  ];
}
