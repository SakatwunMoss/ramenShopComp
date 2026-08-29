import type { Shop } from "./types";
import { budgetToPriceRange } from "./seo";
import { absoluteUrl } from "./site";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
};

function absoluteImage(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return absoluteUrl(url);
}

export function buildRestaurantNode(
  shop: Shop,
  path: string,
): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@type": "Restaurant",
    "@id": absoluteUrl(path),
    name: shop.name,
    servesCuisine: "ラーメン",
    url: absoluteUrl(path),
  };

  if (shop.address) {
    node.address = {
      "@type": "PostalAddress",
      streetAddress: shop.address,
      addressCountry: "JP",
    };
  }

  if (shop.lat != null && shop.lng != null) {
    node.geo = {
      "@type": "GeoCoordinates",
      latitude: shop.lat,
      longitude: shop.lng,
    };
  }

  const image = absoluteImage(shop.image_url);
  if (image) node.image = image;

  if (shop.phone) node.telephone = shop.phone;

  const priceRange = budgetToPriceRange(shop.budget);
  if (priceRange) node.priceRange = priceRange;

  return node;
}

export function buildItemListNode(
  shops: Shop[],
  path: string,
  name: string,
): Record<string, unknown> {
  return {
    "@type": "ItemList",
    "@id": `${absoluteUrl(path)}#itemlist`,
    name,
    numberOfItems: shops.length,
    itemListElement: shops.map((shop, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/shops/${shop.id}`),
      name: shop.name,
    })),
  };
}

export function buildBreadcrumbNode(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildJsonLdGraph(
  nodes: Record<string, unknown>[],
): JsonLdGraph {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
