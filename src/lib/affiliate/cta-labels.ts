import type { AffiliateProviderId } from "./types";

/** アフィリエイト CTA ボタン文言（プロバイダごと・表示用の単一の定義場所） */
export const AFFILIATE_CTA_LABEL: Record<AffiliateProviderId, string> = {
  rakuten: "楽天市場で見る",
  yahoo: "Yahoo!ショッピングで見る",
};
