/** サイト共通の定数・URLヘルパー */

export const SITE_NAME = "ramen-compare";
export const SITE_DISPLAY_NAME = "Ramen Compare";
export const SITE_TITLE_DEFAULT =
  "全国ラーメン店比較｜エリア・系統でくらべる";
export const SITE_DESCRIPTION =
  "全国のラーメン店をエリア・系統から比較・検索。ホットペッパーグルメ掲載店舗を中心に、系統や予算で横並び比較できます。";
export const DEFAULT_OG_IMAGE = "/og-default.png";
export const DEFAULT_OG_IMAGE_WIDTH = 1376;
export const DEFAULT_OG_IMAGE_HEIGHT = 768;

/** 一覧の1ページあたり件数（LCP対策） */
export const SHOPS_PAGE_SIZE = 24;

/** サイトマップ1ファイルあたりの店舗URL上限（Google上限50,000未満） */
export const SITEMAP_SHOP_CHUNK = 5000;

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
