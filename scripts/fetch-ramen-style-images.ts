/**
 * Wikimedia Commons → public/images/ramen-styles/ 取得スクリプト
 *
 * Usage:
 *   npm run fetch-ramen-style-images
 *
 * ライセンス情報は src/lib/ramen-style-images.ts を参照。
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public/images/ramen-styles");
const MAX_DIMENSION = 1280;

const FILES: { key: string; wikiTitle: string; outName: string }[] = [
  {
    key: "shoyu",
    wikiTitle: "File:Shoyu_ramen,_at_Kasukabe_Station_(2014.05.05)_1.jpg",
    outName: "shoyu.jpg",
  },
  {
    key: "miso",
    wikiTitle: "File:Miso_Ramen.JPG",
    outName: "miso.jpg",
  },
  {
    key: "tonkotsu",
    wikiTitle: "File:Hakataramen222.jpg",
    outName: "tonkotsu.jpg",
  },
  {
    key: "shio",
    wikiTitle: "File:Japanese_Salt_flavor_Sapporo_Ramen.JPG",
    outName: "shio.jpg",
  },
  {
    key: "iekei",
    wikiTitle: "File:Iekeiramen111.jpg",
    outName: "iekei.jpg",
  },
  {
    key: "jiro",
    wikiTitle: "File:Ramen_Jiro_001.jpg",
    outName: "jiro.jpg",
  },
  {
    key: "tsukemen",
    wikiTitle: "File:Tsukemen_at_a_Tokyo_restaurant.jpg",
    outName: "tsukemen.jpg",
  },
  {
    key: "tantanmen",
    wikiTitle:
      "File:Dandan_noodles_in_Japan_-_tantanmen_-_September_2014.jpg",
    outName: "tantanmen.jpg",
  },
  {
    key: "abura-soba",
    wikiTitle: "File:Abura_soba_02.jpg",
    outName: "abura-soba.jpg",
  },
];

async function fetchImageUrl(wikiTitle: string): Promise<string> {
  const params = new URLSearchParams({
    action: "query",
    titles: wikiTitle,
    prop: "imageinfo",
    iiprop: "url",
    format: "json",
  });
  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error(`Wikimedia API failed for ${wikiTitle}: ${res.status}`);
  }
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { imageinfo?: { url: string }[] }> };
  };
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  const url = page?.imageinfo?.[0]?.url;
  if (!url) {
    throw new Error(`No download URL for ${wikiTitle}`);
  }
  return url.split("?")[0]!;
}

function resizeImage(path: string): void {
  execFileSync("sips", ["-Z", String(MAX_DIMENSION), path, "--out", path], {
    stdio: "inherit",
  });
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const file of FILES) {
    const url = await fetchImageUrl(file.wikiTitle);
    console.log(`Fetching ${file.key}…`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Download failed for ${file.key}: ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const outPath = join(OUT_DIR, file.outName);
    writeFileSync(outPath, buffer);
    resizeImage(outPath);
    console.log(`  → ${outPath}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
