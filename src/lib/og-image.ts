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

type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 500 | 700;
};

let fontsPromise: Promise<OgFont[]> | null = null;

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

export async function fetchHeroImageBuffer(): Promise<ArrayBuffer | null> {
  const url = new URL("/hero-ramen.png", getSiteUrl()).toString();
  return fetchImageAsArrayBuffer(url);
}

export function loadOgFonts(): Promise<OgFont[]> {
  if (!fontsPromise) {
    fontsPromise = fetchOgFonts();
  }
  return fontsPromise;
}

async function fetchGoogleFont(
  family: string,
  weight: number,
): Promise<ArrayBuffer> {
  const familyParam = family.replace(/ /g, "+");
  const cssUrl = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weight}&display=swap`;
  const css = await fetch(cssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  }).then((response) => response.text());

  const matches = [
    ...css.matchAll(
      /src: url\((.+?)\) format\('(?:opentype|truetype|woff2|woff)'\)/g,
    ),
  ];
  if (matches.length === 0) {
    throw new Error(`Font not found: ${family} ${weight}`);
  }

  const fontUrl = matches[matches.length - 1]?.[1];
  if (!fontUrl) {
    throw new Error(`Font URL missing: ${family} ${weight}`);
  }

  return fetch(fontUrl).then((response) => response.arrayBuffer());
}

async function fetchOgFonts(): Promise<OgFont[]> {
  const [medium, bold] = await Promise.all([
    fetchGoogleFont("Noto Sans JP", 500),
    fetchGoogleFont("Noto Sans JP", 700),
  ]);

  return [
    { name: "Noto Sans JP", data: medium, weight: 500 },
    { name: "Noto Sans JP", data: bold, weight: 700 },
  ];
}
