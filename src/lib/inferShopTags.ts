import { TAG_CATEGORIES, type TagCategoryId } from "./tagKeywords";
import type { Shop } from "./types";

/** タグ推定に使うテキストフィールド（メニュー等は将来ここに足す） */
export type ShopTagSource = Pick<
  Shop,
  "name" | "genre" | "catch" | "access"
>;

export function buildShopTagHaystack(shop: ShopTagSource): string {
  return [shop.name, shop.genre, shop.catch, shop.access]
    .filter((v): v is string => Boolean(v && v.trim()))
    .join(" ");
}

/** 1店舗分のタグをキーワード部分一致で推定 */
export function inferShopTags(shop: ShopTagSource): string[] {
  const haystack = buildShopTagHaystack(shop);
  if (!haystack) return [];

  const tags: string[] = [];
  for (const category of TAG_CATEGORIES) {
    for (const entry of category.tags) {
      if (entry.keywords.some((kw) => haystack.includes(kw))) {
        tags.push(entry.tag);
      }
    }
  }
  return tags;
}

export type TagInferenceStats = {
  totalShops: number;
  taggedShops: number;
  untaggedShops: number;
  /** タグ名 → 該当店舗数 */
  tagCounts: Record<string, number>;
  /** カテゴリ → 1つ以上ヒットした店舗数 */
  categoryHitShops: Record<TagCategoryId, number>;
};

export function createEmptyTagStats(): TagInferenceStats {
  const tagCounts: Record<string, number> = {};
  for (const category of TAG_CATEGORIES) {
    for (const entry of category.tags) {
      tagCounts[entry.tag] = 0;
    }
  }
  const categoryHitShops = {
    soup: 0,
    spicy: 0,
    richness: 0,
    noodle: 0,
    inbound: 0,
  } satisfies Record<TagCategoryId, number>;

  return {
    totalShops: 0,
    taggedShops: 0,
    untaggedShops: 0,
    tagCounts,
    categoryHitShops,
  };
}

export function recordTagInference(
  stats: TagInferenceStats,
  tags: readonly string[],
): void {
  stats.totalShops += 1;
  if (tags.length === 0) {
    stats.untaggedShops += 1;
    return;
  }
  stats.taggedShops += 1;

  const hitCategories = new Set<TagCategoryId>();
  for (const tag of tags) {
    stats.tagCounts[tag] = (stats.tagCounts[tag] ?? 0) + 1;
    for (const category of TAG_CATEGORIES) {
      if (category.tags.some((e) => e.tag === tag)) {
        hitCategories.add(category.id);
      }
    }
  }
  for (const id of hitCategories) {
    stats.categoryHitShops[id] += 1;
  }
}

/** GitHub Actions / ローカルで精度確認しやすいログ */
export function logTagInferenceStats(stats: TagInferenceStats): void {
  const pct = (n: number) =>
    stats.totalShops === 0
      ? "0.0%"
      : `${((100 * n) / stats.totalShops).toFixed(1)}%`;

  console.log(
    `[tags] shops=${stats.totalShops} tagged=${stats.taggedShops} (${pct(stats.taggedShops)}) untagged=${stats.untaggedShops} (${pct(stats.untaggedShops)})`,
  );

  const tagParts = Object.entries(stats.tagCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .map(([tag, count]) => `${tag}=${count}`);
  console.log(`[tags] ${tagParts.join(" ")}`);

  const catParts = TAG_CATEGORIES.map((c) => {
    const n = stats.categoryHitShops[c.id];
    return `${c.label}=${n}(${pct(n)})`;
  });
  console.log(`[tags] by-category ${catParts.join(" ")}`);
}

/** shops 配列に tags を付与し、統計を返す */
export function applyInferredTags<T extends ShopTagSource>(
  shops: T[],
): { shops: (T & { tags: string[] })[]; stats: TagInferenceStats } {
  const stats = createEmptyTagStats();
  const withTags = shops.map((shop) => {
    const tags = inferShopTags(shop);
    recordTagInference(stats, tags);
    return { ...shop, tags };
  });
  return { shops: withTags, stats };
}
