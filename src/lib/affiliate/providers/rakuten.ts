import type { AffiliateProduct } from "../types";
import type {
  AffiliateFetchCredentials,
  AffiliateFetchRequest,
  AffiliateProvider,
} from "./types";

/** 旧エンドポイントは使わない（2026-07-01 版） */
const ENDPOINT =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";

const DEFAULT_HITS = 30;

type RakutenItem = {
  itemName?: string;
  itemCode?: string;
  itemPrice?: number;
  affiliateUrl?: string;
  itemUrl?: string;
  shopName?: string;
  shopCode?: string;
  reviewAverage?: number | string;
  reviewCount?: number | string;
  availability?: number | string;
  imageFlag?: number | string;
  mediumImageUrls?: Array<string | { imageUrl?: string }>;
  smallImageUrls?: Array<string | { imageUrl?: string }>;
};

type RakutenSearchResponse = {
  Items?: Array<RakutenItem | { Item?: RakutenItem }>;
  items?: Array<RakutenItem | { Item?: RakutenItem }>;
  error?: string;
  error_description?: string;
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

function pickImageUrl(item: RakutenItem): string | null {
  const pools = [item.mediumImageUrls, item.smallImageUrls];
  for (const pool of pools) {
    if (!pool?.length) continue;
    const first = pool[0];
    if (typeof first === "string" && first.startsWith("http")) return first;
    if (
      first &&
      typeof first === "object" &&
      typeof first.imageUrl === "string" &&
      first.imageUrl.startsWith("http")
    ) {
      return first.imageUrl;
    }
  }
  return null;
}

function unwrapItem(
  entry: RakutenItem | { Item?: RakutenItem },
): RakutenItem | null {
  if (!entry || typeof entry !== "object") return null;
  if ("Item" in entry && entry.Item) return entry.Item;
  return entry as RakutenItem;
}

async function fetchWithRetry(
  url: string,
  accessKey: string,
  retries = 3,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          accessKey,
          Accept: "application/json",
        },
      });
      if (res.status === 429 || res.status >= 500) {
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
    : new Error("Rakuten API request failed");
}

export const rakutenAffiliateProvider: AffiliateProvider = {
  id: "rakuten",

  async search(
    request: AffiliateFetchRequest,
    credentials: AffiliateFetchCredentials,
  ): Promise<AffiliateProduct[]> {
    const creds = credentials.rakuten;
    if (!creds?.applicationId || !creds.accessKey || !creds.affiliateId) {
      throw new Error(
        "RAKUTEN_APPLICATION_ID, RAKUTEN_ACCESS_KEY, and RAKUTEN_AFFILIATE_ID are required",
      );
    }

    const hits = Math.min(Math.max(request.hits || DEFAULT_HITS, 1), 30);
    const params = new URLSearchParams({
      applicationId: creds.applicationId,
      accessKey: creds.accessKey,
      affiliateId: creds.affiliateId,
      keyword: request.keyword,
      hits: String(hits),
      page: "1",
      sort: "-reviewCount",
      imageFlag: "1",
      availability: "1",
      format: "json",
      formatVersion: "2",
      // 新APIに adult/used フラグが無いため NGKeyword で除外
      NGKeyword: "中古 アダルト adult",
    });

    const url = `${ENDPOINT}?${params.toString()}`;
    const res = await fetchWithRetry(url, creds.accessKey);
    const body = (await res.json()) as RakutenSearchResponse;

    if (!res.ok || body.error) {
      throw new Error(
        `Rakuten API error: ${body.error ?? res.status} ${body.error_description ?? ""}`.trim(),
      );
    }

    const rawItems = body.items ?? body.Items ?? [];
    const fetchedAt = new Date().toISOString();
    const products: AffiliateProduct[] = [];

    for (const entry of rawItems) {
      const item = unwrapItem(entry);
      if (!item) continue;

      const name = item.itemName?.trim();
      const itemCode = item.itemCode?.trim();
      const affiliateUrl = item.affiliateUrl?.trim() || item.itemUrl?.trim();
      const imageUrl = pickImageUrl(item);
      const price = asNumber(item.itemPrice, NaN);
      const availability = asNumber(item.availability, 0);

      if (!name || !itemCode || !affiliateUrl || !imageUrl) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      if (availability !== 1) continue;
      // 念のため文言でも中古・アダルトを除外
      if (/中古|アダルト|adult/i.test(name)) continue;

      products.push({
        id: `rakuten:${itemCode}`,
        provider: "rakuten",
        styleKey: request.styleKey,
        name,
        price,
        imageUrl,
        affiliateUrl,
        shopName: item.shopName?.trim() || "楽天市場",
        reviewAverage: asNumber(item.reviewAverage, 0),
        reviewCount: asNumber(item.reviewCount, 0),
        fetchedAt,
      });
    }

    return products;
  },
};
