import type { MetadataRoute } from "next";
import { getSiteUrl, SITEMAP_SHOP_CHUNK } from "@/lib/site";
import {
  countShopsForSitemap,
  listAllAreaPathsForSitemap,
  listShopSitemapEntries,
} from "@/lib/shops";

export const dynamic = "force-dynamic";

/** 店舗数が増えたら generateSitemaps() で分割に戻す（現状 ~3,000 URL） */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();
  const areas = await listAllAreaPathsForSitemap();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}/guide/ramen-styles`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...areas.map((area) => ({
      url: `${base}${area.path}`,
      lastModified: area.updatedAt ? new Date(area.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: area.path === "/areas" ? 0.8 : 0.7,
    })),
  ];

  const shopCount = await countShopsForSitemap();
  const shopEntries: MetadataRoute.Sitemap = [];

  for (let offset = 0; offset < shopCount; offset += SITEMAP_SHOP_CHUNK) {
    const shops = await listShopSitemapEntries(offset, SITEMAP_SHOP_CHUNK);
    shopEntries.push(
      ...shops.map((shop) => ({
        url: `${base}/shops/${shop.id}`,
        lastModified: shop.updatedAt ? new Date(shop.updatedAt) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    );
  }

  return [...staticEntries, ...shopEntries];
}
