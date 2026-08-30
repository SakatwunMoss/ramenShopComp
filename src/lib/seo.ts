import type { Metadata } from "next";
import type { Shop } from "./types";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  SITE_DESCRIPTION,
  SITE_DISPLAY_NAME,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  absoluteUrl,
} from "./site";

export { SITE_DESCRIPTION, SITE_DISPLAY_NAME, SITE_NAME, SITE_TITLE_DEFAULT };

type BuildPageMetaInput = {
  title: string;
  description: string;
  /** 正規URLのパス（クエリなし）。例: `/areas/Z011` */
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  /** true のとき title.template を適用せず absolute を使う（トップ用） */
  absoluteTitle?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
  noIndex = false,
  absoluteTitle = false,
}: BuildPageMetaInput): Metadata {
  const ogImage = image?.trim() || DEFAULT_OG_IMAGE;
  const isGeneratedOg =
    ogImage === DEFAULT_OG_IMAGE || ogImage.endsWith("/opengraph-image");
  const images = [
    {
      url: ogImage,
      ...(isGeneratedOg
        ? { width: DEFAULT_OG_IMAGE_WIDTH, height: DEFAULT_OG_IMAGE_HEIGHT }
        : {}),
      alt: imageAlt ?? title,
    },
  ];

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: SITE_DISPLAY_NAME,
      locale: "ja_JP",
      type,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    ...(noIndex
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

/** HotPepper の budget 文字列を schema.org priceRange 向けに変換 */
export function budgetToPriceRange(budget: string | null | undefined): string | undefined {
  if (!budget?.trim()) return undefined;
  const trimmed = budget.trim();
  // すでに ¥ / 円 を含む場合はそのまま
  if (/[¥￥円]/.test(trimmed)) return trimmed;
  return trimmed;
}

export function shopDetailPath(id: string): string {
  return `/shops/${id}`;
}

export function shopOgImagePath(shopId: string): string {
  return `/shops/${shopId}/opengraph-image`;
}

export function areaLargePath(largeAreaCode: string): string {
  return `/areas/${largeAreaCode}`;
}

export function areaMiddlePath(
  largeAreaCode: string,
  middleAreaCode: string,
): string {
  return `/areas/${largeAreaCode}/${middleAreaCode}`;
}

export function shopOgImage(shop: Shop): string {
  return shopOgImagePath(shop.id);
}
