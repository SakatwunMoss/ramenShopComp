import { rakutenAffiliateProvider } from "./rakuten";
import { yahooAffiliateProvider } from "./yahoo";
import type { AffiliateProvider } from "./types";
import type { AffiliateProviderId } from "../types";

const PROVIDERS: Record<AffiliateProviderId, AffiliateProvider> = {
  rakuten: rakutenAffiliateProvider,
  yahoo: yahooAffiliateProvider,
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

export function isAffiliateProviderId(value: string): value is AffiliateProviderId {
  return value === "rakuten" || value === "yahoo";
}

export type { AffiliateFetchCredentials, AffiliateProvider } from "./types";
