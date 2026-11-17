import { getCloudflareContext } from "@opennextjs/cloudflare";
import { unstable_noStore as noStore } from "next/cache";
import type { ShopsSnapshot } from "./shops-snapshot";

type ShopsR2Bucket = {
  get: (key: string) => Promise<{ text: () => Promise<string> } | null>;
};

const R2_OBJECT_KEY = "shops.json";
const CACHE_URL = "https://ramen-compare.internal/cache/shops.json";
/** 週次バッチ更新に合わせて 1 日キャッシュ */
const CACHE_TTL_SECONDS = 86_400;

let isolateSnapshot: ShopsSnapshot | null = null;
let loadingPromise: Promise<ShopsSnapshot | null> | null = null;

function markUncacheable(): void {
  // snapshot 欠損時の空結果を ISR / 静的生成に焼かない
  noStore();
}

async function getR2(): Promise<
  { ok: true; bucket: ShopsR2Bucket } | { ok: false; reason: "no_context" | "no_binding" }
> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bucket = (env as CloudflareEnv & { ASSETS_R2?: ShopsR2Bucket })
      .ASSETS_R2;
    if (!bucket) {
      return { ok: false, reason: "no_binding" };
    }
    return { ok: true, bucket };
  } catch {
    return { ok: false, reason: "no_context" };
  }
}

async function fetchFromR2(): Promise<ShopsSnapshot | null> {
  const r2 = await getR2();
  if (!r2.ok) {
    if (r2.reason === "no_binding") {
      console.error(
        "loadShopsSnapshot: ASSETS_R2 binding is missing on the Worker",
      );
    } else {
      console.error(
        "loadShopsSnapshot: Cloudflare context unavailable (cannot reach R2 binding)",
      );
    }
    return null;
  }

  const object = await r2.bucket.get(R2_OBJECT_KEY);
  if (!object) {
    console.error(
      `loadShopsSnapshot: R2 object not found: key="${R2_OBJECT_KEY}"`,
    );
    return null;
  }

  const text = await object.text();
  return JSON.parse(text) as ShopsSnapshot;
}

async function loadShopsSnapshotInner(): Promise<ShopsSnapshot | null> {
  if (isolateSnapshot) return isolateSnapshot;

  try {
    const cacheApi =
      typeof caches !== "undefined"
        ? (caches as CacheStorage & { default?: Cache }).default
        : undefined;

    if (cacheApi) {
      const cacheRequest = new Request(CACHE_URL);
      const cached = await cacheApi.match(cacheRequest);
      if (cached) {
        const data = (await cached.json()) as ShopsSnapshot;
        isolateSnapshot = data;
        return data;
      }
    }

    const data = await fetchFromR2();
    if (!data) {
      markUncacheable();
      return null;
    }

    if (cacheApi) {
      const response = new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
        },
      });
      await cacheApi.put(new Request(CACHE_URL), response);
    }

    isolateSnapshot = data;
    return data;
  } catch (err) {
    console.error("loadShopsSnapshot error:", err);
    markUncacheable();
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

/** 店舗データ欠損時は 500 にせず案内を返す（Search Console の 5xx 抑止） */
export async function isShopsDataAvailable(): Promise<boolean> {
  try {
    const snapshot = await loadShopsSnapshot();
    return snapshot !== null;
  } catch (err) {
    console.error("isShopsDataAvailable error:", err);
    markUncacheable();
    return false;
  }
}
