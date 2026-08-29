import type { MetadataRoute } from "next";
import { getSiteUrl, SITEMAP_SHOP_CHUNK } from "@/lib/site";
import {
  countShopsForSitemap,
  listAllAreaPathsForSitemap,
  listShopSitemapEntries,
} from "@/lib/shops";

export const dynamic = "force-dynamic";

/**
 * id=0: トップ・about・エリア系
 * id=1..n: 店舗詳細（チャンク分割）
 */
export async function generateSitemaps() {
  const shopCount = await countShopsForSitemap();
  const shopChunks = Math.max(1, Math.ceil(shopCount / SITEMAP_SHOP_CHUNK));
  return Array.from({ length: 1 + shopChunks }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const base = getSiteUrl();

  if (id === 0) {
    const areas = await listAllAreaPathsForSitemap();
    const now = new Date();

    return [
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
      ...areas.map((area) => ({
        url: `${base}${area.path}`,
        lastModified: area.updatedAt ? new Date(area.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: area.path === "/areas" ? 0.8 : 0.7,
      })),
    ];
  }

  const offset = (id - 1) * SITEMAP_SHOP_CHUNK;
  const shops = await listShopSitemapEntries(offset, SITEMAP_SHOP_CHUNK);

  return shops.map((shop) => ({
    url: `${base}/shops/${shop.id}`,
    lastModified: shop.updatedAt ? new Date(shop.updatedAt) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
}
