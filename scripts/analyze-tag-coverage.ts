/**
 * HotPepper API から店舗を再取得し、catch 有無でのタグ推定カバレッジを比較する。
 *
 * Usage:
 *   npm run analyze-tag-coverage
 *   npm run analyze-tag-coverage -- --area=Z011
 *
 * Required env:
 *   HOTPEPPER_API_KEY
 */

import {
  applyInferredTags,
  logTagInferenceStats,
  type ShopTagSource,
} from "../src/lib/inferShopTags";

const GOURMET_URL = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/";
const LARGE_AREA_URL =
  "https://webservice.recruit.co.jp/hotpepper/large_area/v1/";
const KEYWORD = "ラーメン";
const PAGE_SIZE = 100;
const SLEEP_MS = 200;

type LargeArea = { code: string; name: string };

type HotpepperShop = {
  id: string;
  name: string;
  catch?: string;
  genre?: { name?: string };
  access?: string;
};

type GourmetResponse = {
  results: {
    results_available: number | string;
    shop?: HotpepperShop | HotpepperShop[];
    error?: { message?: string }[];
  };
};

type LargeAreaResponse = {
  results: {
    large_area?: LargeArea | LargeArea[];
    error?: { message?: string }[];
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseArgs(argv: string[]) {
  let area: string | undefined;
  for (const arg of argv) {
    if (arg.startsWith("--area=")) area = arg.slice("--area=".length);
  }
  return { area };
}

async function fetchJson<T>(url: URL): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url.toString()}`);
  }
  return (await res.json()) as T;
}

async function fetchLargeAreas(apiKey: string): Promise<LargeArea[]> {
  const url = new URL(LARGE_AREA_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("format", "json");
  const data = await fetchJson<LargeAreaResponse>(url);
  if (data.results.error?.length) {
    throw new Error(
      `large_area API error: ${data.results.error.map((e) => e.message).join(", ")}`,
    );
  }
  return asArray(data.results.large_area);
}

async function fetchShopsPage(
  apiKey: string,
  largeAreaCode: string,
  start: number,
): Promise<{ available: number; shops: HotpepperShop[] }> {
  const url = new URL(GOURMET_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("keyword", KEYWORD);
  url.searchParams.set("large_area", largeAreaCode);
  url.searchParams.set("count", String(PAGE_SIZE));
  url.searchParams.set("start", String(start));

  const data = await fetchJson<GourmetResponse>(url);
  if (data.results.error?.length) {
    throw new Error(
      `gourmet API error: ${data.results.error.map((e) => e.message).join(", ")}`,
    );
  }

  return {
    available: Number(data.results.results_available),
    shops: asArray(data.results.shop),
  };
}

function toSource(shop: HotpepperShop): ShopTagSource {
  return {
    name: shop.name,
    genre: shop.genre?.name ?? null,
    catch: shop.catch?.trim() || null,
    access: shop.access ?? null,
  };
}

async function collectShops(
  apiKey: string,
  areas: LargeArea[],
): Promise<ShopTagSource[]> {
  const byId = new Map<string, ShopTagSource>();

  for (const area of areas) {
    console.log(`\n▶ ${area.name} (${area.code})`);
    let start = 1;
    let available = Infinity;

    while (start <= available) {
      const page = await fetchShopsPage(apiKey, area.code, start);
      available = page.available;
      console.log(
        `  start=${start} fetched=${page.shops.length} available=${available}`,
      );

      for (const shop of page.shops) {
        byId.set(shop.id, toSource(shop));
      }

      if (page.shops.length === 0) break;
      start += PAGE_SIZE;
      if (start > available) break;
      await sleep(SLEEP_MS);
    }
    await sleep(SLEEP_MS);
  }

  return [...byId.values()];
}

async function main() {
  const apiKey = process.env.HOTPEPPER_API_KEY;
  if (!apiKey) {
    console.error("HOTPEPPER_API_KEY is not set");
    process.exit(1);
  }

  const { area: areaFilter } = parseArgs(process.argv.slice(2));
  const areas = await fetchLargeAreas(apiKey);
  const targets = areaFilter
    ? areas.filter((a) => a.code === areaFilter)
    : areas;

  if (targets.length === 0) {
    console.error(
      areaFilter
        ? `Area not found: ${areaFilter}`
        : "No large areas returned",
    );
    process.exit(1);
  }

  const shops = await collectShops(apiKey, targets);
  const withCatch = shops.filter((s) => s.catch).length;
  console.log(
    `\nCollected ${shops.length} unique shops (catch present: ${withCatch}, ${(100 * withCatch) / Math.max(shops.length, 1)}%)`,
  );

  console.log("\n=== WITHOUT catch ===");
  const withoutCatchSources = shops.map((s) => ({ ...s, catch: null }));
  const without = applyInferredTags(withoutCatchSources);
  logTagInferenceStats(without.stats);

  console.log("\n=== WITH catch ===");
  const withStats = applyInferredTags(shops);
  logTagInferenceStats(withStats.stats);

  // スープ系統だけの改善幅
  const soupBefore = without.stats.categoryHitShops.soup;
  const soupAfter = withStats.stats.categoryHitShops.soup;
  const delta = soupAfter - soupBefore;
  console.log(
    `\n[tags] soup-category improvement: ${soupBefore} → ${soupAfter} (+${delta}, ${((100 * soupAfter) / Math.max(shops.length, 1)).toFixed(1)}% of shops)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
