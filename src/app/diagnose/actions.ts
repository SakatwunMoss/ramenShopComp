"use server";

import {
  INBOUND_OPTIONS,
  RICHNESS_OPTIONS,
  SOUP_OPTIONS,
  SPICY_OPTIONS,
  type DiagnosePreferences,
  type InboundPreference,
  type RichnessPreference,
  type SoupPreference,
  type SpicyPreference,
} from "@/lib/diagnose/preferences";
import { scoreShops } from "@/lib/diagnose/scoreShops";
import { getAreaLabel, isShopsDataAvailable } from "@/lib/shops";
import { loadShopsSnapshot } from "@/lib/shops-data";
import type { Shop } from "@/lib/types";

export type DiagnoseResultItem = {
  shop: Shop;
  score: number;
  matchedTags: string[];
};

export type DiagnoseActionResult =
  | {
      ok: true;
      results: DiagnoseResultItem[];
      candidateCount: number;
      hasPreferenceMatch: boolean;
      middleAreaName: string;
      largeAreaName: string;
    }
  | { ok: false; error: string };

function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function parsePreferences(input: unknown): DiagnosePreferences | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;

  const largeArea =
    typeof raw.largeArea === "string" ? raw.largeArea.trim() : "";
  const middleArea =
    typeof raw.middleArea === "string" ? raw.middleArea.trim() : "";
  if (!largeArea || !middleArea) return null;

  if (!isOneOf(raw.soup, SOUP_OPTIONS)) return null;
  if (!isOneOf(raw.spicy, SPICY_OPTIONS)) return null;
  if (!isOneOf(raw.richness, RICHNESS_OPTIONS)) return null;
  if (!isOneOf(raw.inbound, INBOUND_OPTIONS)) return null;

  return {
    largeArea,
    middleArea,
    soup: raw.soup as SoupPreference,
    spicy: raw.spicy as SpicyPreference,
    richness: raw.richness as RichnessPreference,
    inbound: raw.inbound as InboundPreference,
  };
}

export async function runDiagnose(
  input: unknown,
): Promise<DiagnoseActionResult> {
  const prefs = parsePreferences(input);
  if (!prefs) {
    return { ok: false, error: "診断条件が不正です。エリアを選択してください。" };
  }

  const available = await isShopsDataAvailable();
  if (!available) {
    return { ok: false, error: "店舗データを読み込めませんでした。" };
  }

  const snapshot = await loadShopsSnapshot();
  if (!snapshot) {
    return { ok: false, error: "店舗データを読み込めませんでした。" };
  }

  const { results, candidateCount, hasPreferenceMatch } = scoreShops(
    snapshot.shops,
    prefs,
  );

  const [largeAreaName, middleAreaName] = await Promise.all([
    getAreaLabel(prefs.largeArea),
    getAreaLabel(prefs.middleArea),
  ]);

  return {
    ok: true,
    results: results.map((r) => ({
      shop: r.shop,
      score: r.score,
      matchedTags: r.matchedTags,
    })),
    candidateCount,
    hasPreferenceMatch,
    largeAreaName: largeAreaName ?? prefs.largeArea,
    middleAreaName: middleAreaName ?? prefs.middleArea,
  };
}
