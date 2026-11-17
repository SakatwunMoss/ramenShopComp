import type { AffiliateProduct, AffiliateProviderId } from "../types";
import type { AffiliateStyleKey } from "../types";

export type AffiliateFetchCredentials = {
  /** 楽天: applicationId / accessKey / affiliateId など。yahoo は別キーを追加予定 */
  rakuten?: {
    applicationId: string;
    accessKey: string;
    affiliateId: string;
  };
  yahoo?: {
    // 将来: ValueCommerce 経由の認証情報
    [key: string]: string;
  };
};

export type AffiliateFetchRequest = {
  styleKey: AffiliateStyleKey;
  keyword: string;
  /** 候補を多めに取り、呼び出し側で閾値緩和・重複排除する */
  hits: number;
};

export type AffiliateProvider = {
  id: AffiliateProviderId;
  /**
   * キーワード検索で候補商品を返す。
   * リンクは必ず API が返す affiliateUrl を使い、自前組み立てしない。
   */
  search(
    request: AffiliateFetchRequest,
    credentials: AffiliateFetchCredentials,
  ): Promise<AffiliateProduct[]>;
};
