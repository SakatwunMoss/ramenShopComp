import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { ShopsSnapshot } from "./shops-snapshot";

type ShopsR2Bucket = {
  get: (key: string) => Promise<{ text: () => Promise<string> } | null>;
};

const R2_OBJECT_KEY = "shops.json";
const CACHE_URL = "https://ramen-compare.internal/cache/shops.json";
const CACHE_TTL_SECONDS = 3600;

let isolateSnapshot: ShopsSnapshot | null = null;
let loadingPromise: Promise<ShopsSnapshot | null> | null = null;

async function getR2(): Promise<ShopsR2Bucket | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bucket = (env as CloudflareEnv & { ASSETS_R2?: ShopsR2Bucket })
      .ASSETS_R2;
    return bucket ?? null;
  } catch {
    return null;
  }
}

async function fetchFromR2(): Promise<ShopsSnapshot | null> {
  const r2 = await getR2();
  if (!r2) return null;

  const object = await r2.get(R2_OBJECT_KEY);
  if (!object) return null;

  const text = await object.text();
  return JSON.parse(text) as ShopsSnapshot;
}

async function loadShopsSnapshotInner(): Promise<ShopsSnapshot | null> {
  if (isolateSnapshot) return isolateSnapshot;

  try {
    const cache = (caches as CacheStorage & { default: Cache }).default;
    const cacheRequest = new Request(CACHE_URL);
    const cached = await cache.match(cacheRequest);
    if (cached) {
      const data = (await cached.json()) as ShopsSnapshot;
      isolateSnapshot = data;
      return data;
    }

    const data = await fetchFromR2();
    if (!data) return null;

    const response = new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    });
    await cache.put(cacheRequest, response);

    isolateSnapshot = data;
    return data;
  } catch (err) {
    console.error("loadShopsSnapshot error:", err);
    return null;
  }
}

/** R2 の shops.json を読み込む（Isolate 内 + Cache API でキャッシュ） */
export function loadShopsSnapshot(): Promise<ShopsSnapshot | null> {
  if (isolateSnapshot) return Promise.resolve(isolateSnapshot);
  if (!loadingPromise) {
    loadingPromise = loadShopsSnapshotInner().finally(() => {
      loadingPromise = null;
    });
  }
  return loadingPromise;
}

export async function isShopsDataAvailable(): Promise<boolean> {
  const snapshot = await loadShopsSnapshot();
  return snapshot !== null;
}
