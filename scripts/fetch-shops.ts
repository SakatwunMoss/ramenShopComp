/**
 * HotPepper グルメサーチ → Supabase upsert バッチ
 *
 * Usage:
 *   npm run fetch-shops                  # 全国（大エリアを順次）
 *   npm run fetch-shops -- --area=Z011   # 1エリアのみ
 *   npm run fetch-shops -- --dry-run     # API取得のみ（書き込みなし）
 */

import { createClient } from "@supabase/supabase-js";

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
  address?: string;
  lat?: string;
  lng?: string;
  genre?: { name?: string };
  budget?: { name?: string };
  logo_image?: string;
  photo?: { pc?: { l?: string; m?: string } };
  urls?: { pc?: string };
  tel?: string;
  open?: string;
  close?: string;
  access?: string;
  large_area?: { code?: string; name?: string };
  middle_area?: { code?: string; name?: string };
  small_area?: { code?: string; name?: string };
};

type GourmetResponse = {
  results: {
    results_available: number | string;
    results_returned: number | string;
    results_start: number | string;
    shop?: HotpepperShop | HotpepperShop[];
    error?: { message?: string; code?: string }[];
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
  let dryRun = false;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--area=")) area = arg.slice("--area=".length);
  }
  return { area, dryRun };
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

function toRow(shop: HotpepperShop, largeAreaCode: string) {
  const image =
    shop.photo?.pc?.l || shop.photo?.pc?.m || shop.logo_image || null;
  return {
    hotpepper_id: shop.id,
    data_source: "hotpepper",
    name: shop.name,
    genre: shop.genre?.name ?? null,
    address: shop.address ?? null,
    large_area_code: shop.large_area?.code ?? largeAreaCode,
    middle_area_code: shop.middle_area?.code ?? null,
    small_area_code: shop.small_area?.code ?? null,
    lat: shop.lat ? Number(shop.lat) : null,
    lng: shop.lng ? Number(shop.lng) : null,
    budget: shop.budget?.name ?? null,
    image_url: image,
    shop_url: shop.urls?.pc ?? null,
    phone: shop.tel ?? null,
    open_hours: shop.open ?? null,
    close_days: shop.close ?? null,
    access: shop.access ?? null,
    updated_at: new Date().toISOString(),
  };
}

async function upsertShops(
  rows: ReturnType<typeof toRow>[],
  dryRun: boolean,
) {
  if (rows.length === 0) return;
  if (dryRun) {
    console.log(`  [dry-run] would upsert ${rows.length} shops`);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required",
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("shops").upsert(rows, {
    onConflict: "hotpepper_id",
  });
  if (error) throw error;
}

async function syncArea(
  apiKey: string,
  area: LargeArea,
  dryRun: boolean,
): Promise<number> {
  console.log(`\n▶ ${area.name} (${area.code})`);
  let start = 1;
  let totalUpserted = 0;
  let available = Infinity;

  while (start <= available) {
    const page = await fetchShopsPage(apiKey, area.code, start);
    available = page.available;
    console.log(
      `  start=${start} fetched=${page.shops.length} available=${available}`,
    );

    const rows = page.shops.map((s) => toRow(s, area.code));
    await upsertShops(rows, dryRun);
    totalUpserted += rows.length;

    if (page.shops.length === 0) break;
    start += PAGE_SIZE;
    if (start > available) break;
    await sleep(SLEEP_MS);
  }

  return totalUpserted;
}

async function main() {
  const apiKey = process.env.HOTPEPPER_API_KEY;
  if (!apiKey) {
    console.error("HOTPEPPER_API_KEY is not set");
    process.exit(1);
  }

  const { area: areaFilter, dryRun } = parseArgs(process.argv.slice(2));
  if (dryRun) console.log("Running in dry-run mode (no Supabase writes)");

  const areas = await fetchLargeAreas(apiKey);
  console.log(`Large areas: ${areas.length}`);

  const targets = areaFilter
    ? areas.filter((a) => a.code === areaFilter)
    : areas;

  if (targets.length === 0) {
    console.error(
      areaFilter
        ? `Area not found: ${areaFilter}. Available: ${areas.map((a) => a.code).join(", ")}`
        : "No large areas returned",
    );
    process.exit(1);
  }

  let grandTotal = 0;
  for (const area of targets) {
    grandTotal += await syncArea(apiKey, area, dryRun);
    await sleep(SLEEP_MS);
  }

  console.log(`\nDone. Upserted ${grandTotal} shop rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
