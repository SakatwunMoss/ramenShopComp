/**
 * HotPepper グルメサーチ → Cloudflare D1 upsert バッチ
 *
 * Usage:
 *   npm run fetch-shops                  # 全国（大エリアを順次）
 *   npm run fetch-shops -- --area=Z011   # 1エリアのみ
 *   npm run fetch-shops -- --labels-only # エリア名のみ同期（店舗は更新しない）
 *   npm run fetch-shops -- --dry-run     # API取得のみ（書き込みなし）
 *   npm run fetch-shops -- --local       # ローカル D1（wrangler）へ書き込み
 *
 * Required env:
 *   HOTPEPPER_API_KEY
 *   （--local 以外の書き込み時）CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / CLOUDFLARE_D1_DATABASE_ID
 */

import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GOURMET_URL = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/";
const LARGE_AREA_URL =
  "https://webservice.recruit.co.jp/hotpepper/large_area/v1/";
const MIDDLE_AREA_URL =
  "https://webservice.recruit.co.jp/hotpepper/middle_area/v1/";
const KEYWORD = "ラーメン";
const PAGE_SIZE = 100;
const SLEEP_MS = 200;
const UPSERT_CHUNK = 25;

/** --local 時は wrangler 経由でローカル D1 に書く */
let writeToLocalD1 = false;

type LargeArea = { code: string; name: string };

type MiddleArea = {
  code: string;
  name: string;
  large_area?: { code?: string; name?: string };
};

type MiddleAreaResponse = {
  results: {
    middle_area?: MiddleArea | MiddleArea[];
    error?: { message?: string }[];
  };
};

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

type ShopRow = {
  id: string;
  hotpepper_id: string;
  data_source: string;
  name: string;
  genre: string | null;
  address: string | null;
  large_area_code: string | null;
  middle_area_code: string | null;
  small_area_code: string | null;
  lat: number | null;
  lng: number | null;
  budget: string | null;
  image_url: string | null;
  shop_url: string | null;
  phone: string | null;
  open_hours: string | null;
  close_days: string | null;
  access: string | null;
  updated_at: string;
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
  let labelsOnly = false;
  let local = false;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--labels-only") labelsOnly = true;
    else if (arg === "--local") local = true;
    else if (arg.startsWith("--area=")) area = arg.slice("--area=".length);
  }
  return { area, dryRun, labelsOnly, local };
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

async function fetchMiddleAreas(
  apiKey: string,
  largeAreaCode: string,
): Promise<MiddleArea[]> {
  const url = new URL(MIDDLE_AREA_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("large_area", largeAreaCode);
  const data = await fetchJson<MiddleAreaResponse>(url);
  if (data.results.error?.length) {
    throw new Error(
      `middle_area API error: ${data.results.error.map((e) => e.message).join(", ")}`,
    );
  }
  return asArray(data.results.middle_area);
}

const UPSERT_AREA_LABEL_SQL = `
INSERT INTO area_labels (code, name, parent_code, level, updated_at)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(code) DO UPDATE SET
  name = excluded.name,
  parent_code = excluded.parent_code,
  level = excluded.level,
  updated_at = excluded.updated_at
`;

async function upsertAreaLabels(
  rows: {
    code: string;
    name: string;
    parent_code: string | null;
    level: "large" | "middle";
  }[],
  dryRun: boolean,
) {
  if (rows.length === 0) return;
  if (dryRun) {
    for (const row of rows) {
      console.log(`  [dry-run] ${row.level} ${row.code} → ${row.name}`);
    }
    console.log(`  [dry-run] would upsert ${rows.length} area labels`);
    return;
  }

  const now = new Date().toISOString();
  await d1Batch(
    rows.map((row) => ({
      sql: UPSERT_AREA_LABEL_SQL,
      params: [row.code, row.name, row.parent_code, row.level, now],
    })),
  );
}

async function syncAreaLabelsForLarge(
  apiKey: string,
  area: LargeArea,
  dryRun: boolean,
) {
  await upsertAreaLabels(
    [
      {
        code: area.code,
        name: area.name,
        parent_code: null,
        level: "large",
      },
    ],
    dryRun,
  );

  const middle = await fetchMiddleAreas(apiKey, area.code);
  await upsertAreaLabels(
    middle.map((m) => ({
      code: m.code,
      name: m.name,
      parent_code: m.large_area?.code ?? area.code,
      level: "middle" as const,
    })),
    dryRun,
  );
  console.log(`  area labels: large=1 middle=${middle.length}`);
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

function toRow(shop: HotpepperShop, largeAreaCode: string): ShopRow {
  const image =
    shop.photo?.pc?.l || shop.photo?.pc?.m || shop.logo_image || null;
  return {
    id: randomUUID(),
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

function getD1Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  if (!accountId || !apiToken || !databaseId) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and CLOUDFLARE_D1_DATABASE_ID are required for writes",
    );
  }
  return { accountId, apiToken, databaseId };
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid numeric SQL param: ${value}`);
    }
    return String(value);
  }
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function bindSql(sql: string, params: unknown[]): string {
  let index = 0;
  return sql.replaceAll("?", () => {
    if (index >= params.length) {
      throw new Error("Not enough SQL params for placeholders");
    }
    return sqlLiteral(params[index++]);
  });
}

function d1BatchLocal(statements: { sql: string; params: unknown[] }[]) {
  const dir = mkdtempSync(join(tmpdir(), "ramen-d1-"));
  const file = join(dir, "batch.sql");
  try {
    const body = statements.map((s) => `${bindSql(s.sql, s.params)};`).join("\n");
    writeFileSync(file, body, "utf8");
    execFileSync(
      "npx",
      ["wrangler", "d1", "execute", "ramen-compare", "--local", "--file", file],
      { stdio: "inherit" },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function d1Batch(
  statements: { sql: string; params: unknown[] }[],
): Promise<void> {
  if (statements.length === 0) return;

  if (writeToLocalD1) {
    for (let i = 0; i < statements.length; i += UPSERT_CHUNK) {
      d1BatchLocal(statements.slice(i, i + UPSERT_CHUNK));
    }
    return;
  }

  const { accountId, apiToken, databaseId } = getD1Config();
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  // D1 HTTP API は 1 リクエストに複数 SQL を送れるが、サイズ制限に配慮してチャンク化
  for (let i = 0; i < statements.length; i += UPSERT_CHUNK) {
    const chunk = statements.slice(i, i + UPSERT_CHUNK);
    for (const stmt of chunk) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: stmt.sql, params: stmt.params }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        errors?: { message?: string }[];
      };
      if (!res.ok || body.success === false) {
        throw new Error(
          `D1 write failed: ${body.errors?.map((e) => e.message).join(", ") || res.status}`,
        );
      }
    }
    if (i + UPSERT_CHUNK < statements.length) await sleep(50);
  }
}

const UPSERT_SQL = `
INSERT INTO shops (
  id, hotpepper_id, data_source, name, genre, address,
  large_area_code, middle_area_code, small_area_code,
  lat, lng, budget, image_url, shop_url, phone,
  open_hours, close_days, access, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(hotpepper_id) DO UPDATE SET
  data_source = excluded.data_source,
  name = excluded.name,
  genre = excluded.genre,
  address = excluded.address,
  large_area_code = excluded.large_area_code,
  middle_area_code = excluded.middle_area_code,
  small_area_code = excluded.small_area_code,
  lat = excluded.lat,
  lng = excluded.lng,
  budget = excluded.budget,
  image_url = excluded.image_url,
  shop_url = excluded.shop_url,
  phone = excluded.phone,
  open_hours = excluded.open_hours,
  close_days = excluded.close_days,
  access = excluded.access,
  updated_at = excluded.updated_at
`;

async function upsertShops(rows: ShopRow[], dryRun: boolean) {
  if (rows.length === 0) return;
  if (dryRun) {
    console.log(`  [dry-run] would upsert ${rows.length} shops`);
    return;
  }

  const statements = rows.map((row) => ({
    sql: UPSERT_SQL,
    params: [
      row.id,
      row.hotpepper_id,
      row.data_source,
      row.name,
      row.genre,
      row.address,
      row.large_area_code,
      row.middle_area_code,
      row.small_area_code,
      row.lat,
      row.lng,
      row.budget,
      row.image_url,
      row.shop_url,
      row.phone,
      row.open_hours,
      row.close_days,
      row.access,
      row.updated_at,
    ],
  }));

  await d1Batch(statements);
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

  const { area: areaFilter, dryRun, labelsOnly, local } = parseArgs(
    process.argv.slice(2),
  );
  writeToLocalD1 = local;
  if (dryRun) console.log("Running in dry-run mode (no D1 writes)");
  if (labelsOnly) console.log("Labels-only mode (skip shop upsert)");
  if (local) console.log("Writing to local D1 via wrangler");

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
    await syncAreaLabelsForLarge(apiKey, area, dryRun);
    await sleep(SLEEP_MS);
    if (labelsOnly) continue;
    grandTotal += await syncArea(apiKey, area, dryRun);
    await sleep(SLEEP_MS);
  }

  if (labelsOnly) {
    console.log(`\nDone. Synced area labels for ${targets.length} large area(s).`);
  } else {
    console.log(`\nDone. Upserted ${grandTotal} shop rows.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
