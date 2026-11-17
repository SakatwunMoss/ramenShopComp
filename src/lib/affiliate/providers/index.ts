import { rakutenAffiliateProvider } from "./rakuten";
import type { AffiliateProvider } from "./types";
import type { AffiliateProviderId } from "../types";

const PROVIDERS: Record<AffiliateProviderId, AffiliateProvider | null> = {
  rakuten: rakutenAffiliateProvider,
  /** 将来: ValueCommerce 経由の Yahoo!ショッピング */
  yahoo: null,
};

export function getAffiliateProvider(
  id: AffiliateProviderId,
): AffiliateProvider {
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new Error(`Affiliate provider "${id}" is not implemented yet`);
  }
  return provider;
}

export type { AffiliateFetchCredentials, AffiliateProvider } from "./types";
