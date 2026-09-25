import { matchesRamenScope } from "../shop-filters";
import type { Shop } from "../types";
import {
  ANY_PREFERENCE,
  DIAGNOSE_TOP_N,
  PREFERENCE_MATCH_SCORE_THRESHOLD,
  SPICY_TAG_BY_PREFERENCE,
  type DiagnosePreferences,
} from "./preferences";

export type ScoredShop = {
  shop: Shop;
  score: number;
  /** ユーザー選択と一致したタグ名（マッチ理由表示用） */
  matchedTags: string[];
};

export type ScoreShopsResult = {
  results: ScoredShop[];
  candidateCount: number;
  /** 上位結果にスコア閾値以上が1件でもあれば true */
  hasPreferenceMatch: boolean;
};

function desiredTags(prefs: DiagnosePreferences): string[] {
  const tags: string[] = [];

  if (prefs.soup !== ANY_PREFERENCE) {
    tags.push(prefs.soup);
  }
  if (prefs.spicy !== ANY_PREFERENCE) {
    tags.push(SPICY_TAG_BY_PREFERENCE[prefs.spicy]);
  }
  if (prefs.richness !== ANY_PREFERENCE) {
    tags.push(prefs.richness);
  }
  if (prefs.inbound !== ANY_PREFERENCE) {
    tags.push(prefs.inbound);
  }

  return tags;
}

function scoreOne(shop: Shop, wanted: readonly string[]): ScoredShop {
  const shopTags = shop.tags ?? [];
  const matchedTags = wanted.filter((tag) => shopTags.includes(tag));
  return {
    shop,
    score: matchedTags.length,
    matchedTags,
  };
}

/** Fisher–Yates（呼び出し側が渡す乱数でテスト可能） */
export function shuffleInPlace<T>(
  items: T[],
  random: () => number = Math.random,
): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = items[i]!;
    items[i] = items[j]!;
    items[j] = tmp;
  }
  return items;
}

/**
 * 同点グループ内をシャッフルしたうえでスコア降順を保つ。
 * 全体を一度にソートすると同点が機械的な元配列順に固定されるため、
 * スコアごとに分けてから結合する。
 */
export function rankScoredShops(
  scored: ScoredShop[],
  random: () => number = Math.random,
): ScoredShop[] {
  const byScore = new Map<number, ScoredShop[]>();
  for (const item of scored) {
    const bucket = byScore.get(item.score);
    if (bucket) bucket.push(item);
    else byScore.set(item.score, [item]);
  }

  const scores = [...byScore.keys()].sort((a, b) => b - a);
  const ranked: ScoredShop[] = [];
  for (const score of scores) {
    const group = byScore.get(score) ?? [];
    ranked.push(...shuffleInPlace(group, random));
  }
  return ranked;
}

/**
 * 中エリア必須のハードフィルタ＋タグ一致のソフト加点。
 * タグ不一致・タグなしでも除外・減点しない。
 */
export function scoreShops(
  shops: readonly Shop[],
  prefs: DiagnosePreferences,
  options?: {
    limit?: number;
    random?: () => number;
  },
): ScoreShopsResult {
  const limit = options?.limit ?? DIAGNOSE_TOP_N;
  const random = options?.random ?? Math.random;

  const large = prefs.largeArea.trim();
  const middle = prefs.middleArea.trim();
  if (!large || !middle) {
    return { results: [], candidateCount: 0, hasPreferenceMatch: false };
  }

  const candidates = shops.filter(
    (shop) =>
      matchesRamenScope(shop, true) &&
      shop.large_area_code === large &&
      shop.middle_area_code === middle,
  );

  const wanted = desiredTags(prefs);
  const scored = candidates.map((shop) => scoreOne(shop, wanted));
  const ranked = rankScoredShops(scored, random);
  const results = ranked.slice(0, limit);
  const hasPreferenceMatch = results.some(
    (r) => r.score >= PREFERENCE_MATCH_SCORE_THRESHOLD,
  );

  return {
    results,
    candidateCount: candidates.length,
    hasPreferenceMatch,
  };
}
