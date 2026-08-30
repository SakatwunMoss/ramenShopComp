import { getSiteUrl } from "./site";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export const OG_COLORS = {
  steam: "#fff8f6",
  lacquer: "#e88976",
  lacquerDeep: "#d46b58",
  bgDeep: "#ffd8ce",
  ink: "#4a2f2c",
  heroShade: "#5c3834",
} as const;

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 500 | 700;
};

const FONT_URLS = {
  shipporiBold:
    "https://cdn.jsdelivr.net/npm/@fontsource/shippori-mincho@5.3.0/files/shippori-mincho-japanese-700-normal.woff",
  zenMedium:
    "https://cdn.jsdelivr.net/npm/@fontsource/zen-kaku-gothic-new@5.3.0/files/zen-kaku-gothic-new-japanese-500-normal.woff",
  notoMedium:
    "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.2.5/files/noto-sans-jp-japanese-500-normal.woff",
  notoBold:
    "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.2.5/files/noto-sans-jp-japanese-700-normal.woff",
} as const;

export function resolveOgBaseUrl(headerList: Headers): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "ramen-compare.com";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.");
  const protocol =
    headerList.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function fetchImageAsArrayBuffer(
  url: string,
): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function fetchHeroImageBuffer(
  baseUrl?: string,
): Promise<ArrayBuffer | null> {
  const origin = baseUrl?.replace(/\/$/, "") ?? getSiteUrl();
  const url = new URL("/hero-ramen.png", origin).toString();
  return fetchImageAsArrayBuffer(url);
}

async function fetchFont(
  url: string,
  name: string,
  weight: 500 | 700,
): Promise<OgFont> {
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 7 } });
  if (!res.ok) {
    throw new Error(`Failed to fetch font: ${name} ${weight}`);
  }
  return {
    name,
    data: await res.arrayBuffer(),
    weight,
  };
}

export async function loadSiteOgFonts(): Promise<OgFont[]> {
  return Promise.all([
    fetchFont(FONT_URLS.shipporiBold, "Shippori Mincho", 700),
    fetchFont(FONT_URLS.zenMedium, "Zen Kaku Gothic New", 500),
  ]);
}

export async function loadShopOgFonts(): Promise<OgFont[]> {
  return Promise.all([
    fetchFont(FONT_URLS.notoMedium, "Noto Sans JP", 500),
    fetchFont(FONT_URLS.notoBold, "Noto Sans JP", 700),
  ]);
}

export async function safeLoadSiteOgFonts(): Promise<OgFont[]> {
  try {
    return await loadSiteOgFonts();
  } catch (error) {
    console.error("loadSiteOgFonts error:", error);
    return [];
  }
}

export async function safeLoadShopOgFonts(): Promise<OgFont[]> {
  try {
    return await loadShopOgFonts();
  } catch (error) {
    console.error("loadShopOgFonts error:", error);
    return [];
  }
}
