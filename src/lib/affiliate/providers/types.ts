import type { AffiliateProduct, AffiliateProviderId } from "../types";
import type { AffiliateStyleKey } from "../types";

export type AffiliateFetchCredentials = {
  rakuten?: {
    applicationId: string;
    accessKey: string;
    affiliateId: string;
  };
  yahoo?: {
    /** Yahoo!デベロッパーネットワークの Client ID（appid） */
    clientId: string;
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
   * アフィリエイト URL の解決は各プロバイダ内（差し替えやすい関数）に閉じる。
   */
  search(
    request: AffiliateFetchRequest,
    credentials: AffiliateFetchCredentials,
  ): Promise<AffiliateProduct[]>;
};
