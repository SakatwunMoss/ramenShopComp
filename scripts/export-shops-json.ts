/**
 * D1 shops テーブル全件を JSON スナップショットとしてエクスポート
 *
 * Usage:
 *   npm run export-shops-json
 *   npm run export-shops-json -- --local   # ローカル D1（wrangler）から読み出し
 *
 * Required env（--local 以外）:
 *   CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / CLOUDFLARE_D1_DATABASE_ID
 *
 * Output:
 *   output/shops.json
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { matchesRamenScope } from "../src/lib/shop-filters";
import type { AreaCountEntry, ShopsSnapshot } from "../src/lib/shops-snapshot";
import type { Shop } from "../src/lib/types";

const OUTPUT_DIR = join(process.cwd(), "output");
const OUTPUT_FILE = join(OUTPUT_DIR, "shops.json");

function parseArgs(argv: string[]) {
  let local = false;
  for (const arg of argv) {
    if (arg === "--local") local = true;
  }
  return { local };
}

function getD1Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  if (!accountId || !apiToken || !databaseId) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and CLOUDFLARE_D1_DATABASE_ID are required",
    );
  }
  return { accountId, apiToken, databaseId };
}

async function queryAllShopsRemote(): Promise<Shop[]> {
  const { accountId, apiToken, databaseId } = getD1Config();
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sql: "SELECT * FROM shops ORDER BY updated_at DESC",
    }),
  });

  const body = (await res.json()) as {
    success?: boolean;
    result?: { results?: Shop[] }[];
    errors?: { message?: string }[];
  };

  if (!res.ok || body.success === false) {
    throw new Error(
      `D1 query failed: ${body.errors?.map((e) => e.message).join(", ") || res.status}`,
    );
  }

  return body.result?.[0]?.results ?? [];
}

function queryAllShopsLocal(): Shop[] {
  const raw = execFileSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "ramen-compare",
      "--local",
      "--command",
      "SELECT * FROM shops ORDER BY updated_at DESC",
      "--json",
    ],
    { encoding: "utf8" },
  );

  const parsed = JSON.parse(raw) as {
    results?: { results?: Shop[] }[];
  };
  return parsed.results?.[0]?.results ?? [];
}

function computeAreaCounts(shops: Shop[]): ShopsSnapshot["area_counts"] {
  const large: Record<string, AreaCountEntry> = {};
  const middle: Record<string, Record<string, AreaCountEntry>> = {};

  for (const shop of shops) {
    const largeCode = shop.large_area_code?.trim();
    const middleCode = shop.middle_area_code?.trim();

    if (largeCode) {
      const entry = (large[largeCode] ??= { ramen: 0, all: 0 });
      entry.all += 1;
      if (matchesRamenScope(shop, true)) entry.ramen += 1;
    }

    if (largeCode && middleCode) {
      const byLarge = (middle[largeCode] ??= {});
      const entry = (byLarge[middleCode] ??= { ramen: 0, all: 0 });
      entry.all += 1;
      if (matchesRamenScope(shop, true)) entry.ramen += 1;
    }
  }

  return { large, middle };
}

async function main() {
  const { local } = parseArgs(process.argv.slice(2));

  console.log(
    local
      ? "Exporting shops from local D1..."
      : "Exporting shops from remote D1...",
  );

  const shops = local ? queryAllShopsLocal() : await queryAllShopsRemote();
  console.log(`Fetched ${shops.length} shops`);

  const snapshot: ShopsSnapshot = {
    generated_at: new Date().toISOString(),
    shops,
    area_counts: computeAreaCounts(shops),
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot), "utf8");
  console.log(`Wrote ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
