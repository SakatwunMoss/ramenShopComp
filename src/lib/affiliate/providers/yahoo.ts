import { isRelevantInstantRamenProduct } from "../product-relevance";
import type { AffiliateProduct } from "../types";
import type {
  AffiliateFetchCredentials,
  AffiliateFetchRequest,
  AffiliateProvider,
} from "./types";
import { resolveYahooAffiliateUrl } from "./yahoo/affiliateUrl";

/** https://developer.yahoo.co.jp/webapi/shopping/v3/itemsearch.html */
const ENDPOINT =
  "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch";

/** 表示向け。exImage でこのサイズの URL を取る */
const IMAGE_SIZE = 300;

const DEFAULT_RESULTS = 30;
const MAX_RETRIES = 4;

type YahooHit = {
  name?: string;
  url?: string;
  code?: string;
  condition?: string;
  inStock?: boolean;
  price?: number;
  affiliateRate?: number;
  image?: {
    small?: string;
    medium?: string;
  };
  exImage?: {
    url?: string;
    width?: number;
    height?: number;
  };
  review?: {
    rate?: number;
    count?: number;
    url?: string;
  };
  seller?: {
    sellerId?: string;
    name?: string;
    url?: string;
  };
};

type YahooSearchResponse = {
  totalResultsAvailable?: number;
  totalResultsReturned?: number;
  hits?: YahooHit[];
  Error?: {
    Message?: string;
    Code?: string;
  };
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asNumber(value: number | string | undefined, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/** image_size=300 指定時の hits/exImage.url を優先（サーバーへはコピーしない） */
function pickImageUrl(hit: YahooHit): string | null {
  const ex = hit.exImage?.url?.trim();
  if (ex?.startsWith("http")) return ex;
  // exImage 欠損時のみフォールバック
  const medium = hit.image?.medium?.trim();
  if (medium?.startsWith("http")) return medium;
  const small = hit.image?.small?.trim();
  if (small?.startsWith("http")) return small;
  return null;
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (res.status === 429) {
        const wait = 1100 * (attempt + 1);
        console.warn(
          `[yahoo] 429 Too Many Requests — retry in ${wait}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        await sleep(wait);
        lastError = new Error("HTTP 429");
        continue;
      }

      if (res.status >= 500) {
        const wait = 800 * (attempt + 1);
        await sleep(wait);
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;
      await sleep(800 * (attempt + 1));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Yahoo Shopping API request failed");
}

export const yahooAffiliateProvider: AffiliateProvider = {
  id: "yahoo",

  async search(
    request: AffiliateFetchRequest,
    credentials: AffiliateFetchCredentials,
  ): Promise<AffiliateProduct[]> {
    const clientId = credentials.yahoo?.clientId?.trim();
    if (!clientId) {
      throw new Error("YAHOO_CLIENT_ID is required");
    }

    const results = Math.min(Math.max(request.hits || DEFAULT_RESULTS, 1), 50);

    // affiliate_type / affiliate_id は付けない（VC リンクは自前組み立て）
    const params = new URLSearchParams({
      appid: clientId,
      query: request.keyword,
      results: String(results),
      start: "1",
      sort: "-review_count",
      in_stock: "true",
      condition: "new",
      image_size: String(IMAGE_SIZE),
    });

    const url = `${ENDPOINT}?${params.toString()}`;
    const res = await fetchWithRetry(url);
    const body = (await res.json()) as YahooSearchResponse;

    if (!res.ok) {
      const message =
        body.Error?.Message ?? body.Error?.Code ?? `HTTP ${res.status}`;
      throw new Error(`Yahoo Shopping API error: ${message}`);
    }

    if (body.Error?.Message || body.Error?.Code) {
      throw new Error(
        `Yahoo Shopping API error: ${body.Error.Message ?? body.Error.Code}`,
      );
    }

    const hits = body.hits ?? [];
    const fetchedAt = new Date().toISOString();
    const products: AffiliateProduct[] = [];

    for (const hit of hits) {
      const name = hit.name?.trim();
      const code = hit.code?.trim();
      const itemUrl = hit.url?.trim() ?? "";
      const imageUrl = pickImageUrl(hit);
      const price = asNumber(hit.price, NaN);

      if (!name || !code || !itemUrl || !imageUrl) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      if (hit.inStock === false) continue;
      if (hit.condition && hit.condition !== "new") continue;
      if (/中古|アダルト|adult/i.test(name)) continue;
      if (!isRelevantInstantRamenProduct(name, request.styleKey)) continue;

      const affiliateUrl = resolveYahooAffiliateUrl(itemUrl);
      if (!affiliateUrl) continue;

      products.push({
        id: `yahoo:${code}`,
        provider: "yahoo",
        styleKey: request.styleKey,
        name,
        price,
        imageUrl,
        affiliateUrl,
        shopName: hit.seller?.name?.trim() || "Yahoo!ショッピング",
        reviewAverage: asNumber(hit.review?.rate, 0),
        reviewCount: asNumber(hit.review?.count, 0),
        fetchedAt,
      });
    }

    return products;
  },
};
