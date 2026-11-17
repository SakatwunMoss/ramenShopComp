/**
 * Yahoo!ショッピング × バリューコマースのアフィリエイト URL 組み立て。
 *
 * 主方式: 商品 URL を vc_url に載せた referral リンクを自前で組み立てる。
 * API の affiliate_type / affiliate_id は使わない。
 * すでに valuecommerce の referral URL の場合は二重ラップしない。
 *
 * 形式:
 * https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=...&pid=...&vc_url=<encodeURIComponent(商品URL)>
 */

import {
  VALUE_COMMERCE_PID,
  VALUE_COMMERCE_SID,
} from "@/lib/site";

const VC_REFERRAL_BASE =
  "https://ck.jp.ap.valuecommerce.com/servlet/referral";

/** 計測・トラッキング用として取り除くクエリキー */
const TRACKING_QUERY_KEYS = new Set([
  "sc_i",
  "ea",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "fbclid",
  "yclid",
  "msclkid",
  "ref",
]);

/** API / 入力 URL が既に VC アフィリエイトか */
export function isValueCommerceAffiliateUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith("//") ? `https:${url}` : url);
    return (
      parsed.hostname.includes("valuecommerce.com") &&
      parsed.pathname.includes("/servlet/referral")
    );
  } catch {
    return /valuecommerce\.com\/servlet\/referral/i.test(url);
  }
}

/**
 * 商品 URL から計測用クエリ等を除いたきれいな URL を返す。
 * （path はそのまま。トラッキング系クエリと hash を除去）
 */
export function cleanProductUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(
      trimmed.startsWith("//") ? `https:${trimmed}` : trimmed,
    );
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_QUERY_KEYS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    // 空になったクエリや残骸の `?` を整理
    const qs = parsed.searchParams.toString();
    parsed.search = qs ? `?${qs}` : "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return trimmed.split("#")[0] ?? trimmed;
  }
}

/** きれいな商品 URL から VC referral リンクを組み立てる（主方式） */
export function buildValueCommerceReferralUrl(productUrl: string): string {
  const clean = cleanProductUrl(productUrl);
  const params = new URLSearchParams({
    sid: VALUE_COMMERCE_SID,
    pid: VALUE_COMMERCE_PID,
    vc_url: clean,
  });
  return `${VC_REFERRAL_BASE}?${params.toString()}`;
}

/**
 * ページに載せるアフィリエイト URL。
 * - 既に VC referral ならそのまま（二重ラップしない）
 * - それ以外は自前組み立て
 */
export function resolveYahooAffiliateUrl(productOrApiUrl: string): string {
  const raw = productOrApiUrl.trim();
  if (!raw) return "";

  if (isValueCommerceAffiliateUrl(raw)) {
    return raw.startsWith("//") ? `https:${raw}` : raw;
  }

  return buildValueCommerceReferralUrl(raw);
}
