import { getCloudflareContext } from "@opennextjs/cloudflare";
import sampleSnapshot from "../../../data/affiliate-products.sample.json";
import { loadLocalAffiliateSnapshot } from "./load-local-snapshot";
import type { AffiliateProductsSnapshot } from "./types";

type AffiliateR2Bucket = {
  get: (key: string) => Promise<{ text: () => Promise<string> } | null>;
};

const R2_OBJECT_KEY = "affiliate-products.json";
const CACHE_URL =
  "https://ramen-compare.internal/cache/affiliate-products.json";
/** 週次バッチ更新に合わせて 1 日キャッシュ */
const CACHE_TTL_SECONDS = 86_400;

let isolateSnapshot: AffiliateProductsSnapshot | null | undefined;
let loadingPromise: Promise<AffiliateProductsSnapshot | null> | null = null;

function allowDevFallback(): boolean {
  // ローカル JSON / サンプルは開発専用。本番（R2 欠損時）では出さない。
  return process.env.NODE_ENV !== "production";
}

/** R2 欠損時: output JSON → sample の順（開発のみ） */
async function loadDevFallbackSnapshot(): Promise<AffiliateProductsSnapshot | null> {
  if (!allowDevFallback()) return null;
  const local = await loadLocalAffiliateSnapshot();
  if (local?.products?.length) return local;
  return sampleSnapshot as AffiliateProductsSnapshot;
}

async function getR2(): Promise<AffiliateR2Bucket | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bucket = (env as CloudflareEnv & { ASSETS_R2?: AffiliateR2Bucket })
      .ASSETS_R2;
    return bucket ?? null;
  } catch {
    return null;
  }
}

async function fetchFromR2(): Promise<AffiliateProductsSnapshot | null> {
  const r2 = await getR2();
  if (!r2) return null;

  const object = await r2.get(R2_OBJECT_KEY);
  if (!object) return null;

  const text = await object.text();
  return JSON.parse(text) as AffiliateProductsSnapshot;
}

async function loadAffiliateSnapshotInner(): Promise<AffiliateProductsSnapshot | null> {
  if (isolateSnapshot !== undefined) return isolateSnapshot;

  try {
    const cacheApi =
      typeof caches !== "undefined"
        ? (caches as CacheStorage & { default?: Cache }).default
        : undefined;

    if (cacheApi) {
      const cacheRequest = new Request(CACHE_URL);
      const cached = await cacheApi.match(cacheRequest);
      if (cached) {
        const data = (await cached.json()) as AffiliateProductsSnapshot;
        isolateSnapshot = data;
        return data;
      }
    }

    const fromR2 = await fetchFromR2();
    if (fromR2?.products?.length) {
      if (cacheApi) {
        const response = new Response(JSON.stringify(fromR2), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
          },
        });
        await cacheApi.put(new Request(CACHE_URL), response);
      }
      isolateSnapshot = fromR2;
      return fromR2;
    }

    const fallback = await loadDevFallbackSnapshot();
    isolateSnapshot = fallback;
    return fallback;
  } catch (err) {
    console.error("loadAffiliateSnapshot error:", err);
    const fallback = await loadDevFallbackSnapshot();
    isolateSnapshot = fallback;
    return fallback;
  }
}

/** R2 の affiliate-products.json を読む。本番で欠損時は null（ダミー非表示） */
export function loadAffiliateSnapshot(): Promise<AffiliateProductsSnapshot | null> {
  if (isolateSnapshot !== undefined) {
    return Promise.resolve(isolateSnapshot);
  }
  if (!loadingPromise) {
    loadingPromise = loadAffiliateSnapshotInner().finally(() => {
      loadingPromise = null;
    });
  }
  return loadingPromise;
}
