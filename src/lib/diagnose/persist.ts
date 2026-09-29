import { MAX_COMPARE } from "@/lib/compare";
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

export const DIAGNOSE_STATE_STORAGE_KEY = "ramen-diagnose-state:v2";
export const DIAGNOSE_STATE_VERSION = 3;
/** 旧キーは読まず破棄（エリア表示マッピング是正により意味が変わるため） */
const LEGACY_DIAGNOSE_STATE_STORAGE_KEYS = [
  "ramen-diagnose-state:v1",
] as const;
const SUPPORTED_STATE_VERSIONS = new Set([3]);

export const DIAGNOSE_RETURNING_STORAGE_KEY = "ramen-diagnose-returning:v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RETURNING_TTL_MS = 30 * 60 * 1000;

export type DiagnosePersistedState = {
  version: number;
  draft: DiagnosePreferences;
  stepIndex: number;
  finished: boolean;
  selectedIds: string[];
  savedAt: number;
};

type AreaValidator = {
  largeAreas: readonly { code: string }[];
  middleByLarge: Record<string, readonly { code: string }[]>;
};

function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function isValidDraft(
  draft: unknown,
  areas: AreaValidator,
): draft is DiagnosePreferences {
  if (!draft || typeof draft !== "object") return false;
  const raw = draft as Record<string, unknown>;

  const largeArea =
    typeof raw.largeArea === "string" ? raw.largeArea.trim() : "";
  const middleArea =
    typeof raw.middleArea === "string" ? raw.middleArea.trim() : "";

  // 未回答の途中保存も許可（空文字）
  if (largeArea) {
    if (!areas.largeAreas.some((a) => a.code === largeArea)) return false;
    if (middleArea) {
      const middles = areas.middleByLarge[largeArea] ?? [];
      if (!middles.some((a) => a.code === middleArea)) return false;
    }
  } else if (middleArea) {
    return false;
  }

  if (!isOneOf(raw.soup, SOUP_OPTIONS)) return false;
  if (!isOneOf(raw.spicy, SPICY_OPTIONS)) return false;
  if (!isOneOf(raw.richness, RICHNESS_OPTIONS)) return false;
  if (!isOneOf(raw.inbound, INBOUND_OPTIONS)) return false;

  return true;
}

/** 壊れた配列・未知ID・上限超過を黙って捨てる */
export function sanitizeSelectedIds(
  ids: unknown,
  validIds?: Iterable<string>,
  max: number = MAX_COMPARE,
): string[] {
  if (!Array.isArray(ids) || max <= 0) return [];
  const valid = validIds ? new Set(validIds) : null;
  const out: string[] = [];
  for (const item of ids) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (!id) continue;
    if (valid && !valid.has(id)) continue;
    if (out.includes(id)) continue;
    out.push(id);
    if (out.length >= max) break;
  }
  return out;
}

export function readDiagnoseState(
  areas: AreaValidator,
  stepCount: number,
): DiagnosePersistedState | null {
  try {
    // 旧キーはエリア表示マッピング是正前のデータなので破棄
    for (const key of LEGACY_DIAGNOSE_STATE_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }

    const raw = sessionStorage.getItem(DIAGNOSE_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      clearDiagnoseState();
      return null;
    }
    const data = parsed as Record<string, unknown>;
    if (
      typeof data.version !== "number" ||
      !SUPPORTED_STATE_VERSIONS.has(data.version)
    ) {
      clearDiagnoseState();
      return null;
    }
    if (typeof data.savedAt !== "number" || !Number.isFinite(data.savedAt)) {
      clearDiagnoseState();
      return null;
    }
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      clearDiagnoseState();
      return null;
    }
    if (typeof data.stepIndex !== "number" || !Number.isInteger(data.stepIndex)) {
      clearDiagnoseState();
      return null;
    }
    if (data.stepIndex < 0 || data.stepIndex >= stepCount) {
      clearDiagnoseState();
      return null;
    }
    if (typeof data.finished !== "boolean") {
      clearDiagnoseState();
      return null;
    }
    if (!isValidDraft(data.draft, areas)) {
      clearDiagnoseState();
      return null;
    }

    const draft = data.draft as DiagnosePreferences;
    if (data.finished) {
      if (!draft.largeArea || !draft.middleArea) {
        clearDiagnoseState();
        return null;
      }
    }

    // selectedIds は v1 で未定義でもよい。妥当性は結果一覧確定後に再検証する
    const selectedIds = sanitizeSelectedIds(data.selectedIds);

    return {
      version: DIAGNOSE_STATE_VERSION,
      draft: {
        largeArea: draft.largeArea,
        middleArea: draft.middleArea,
        soup: draft.soup as SoupPreference,
        spicy: draft.spicy as SpicyPreference,
        richness: draft.richness as RichnessPreference,
        inbound: draft.inbound as InboundPreference,
      },
      stepIndex: data.stepIndex,
      finished: data.finished,
      selectedIds,
      savedAt: data.savedAt,
    };
  } catch {
    clearDiagnoseState();
    return null;
  }
}

export function writeDiagnoseState(
  state: Omit<DiagnosePersistedState, "version" | "savedAt">,
): void {
  try {
    const payload: DiagnosePersistedState = {
      version: DIAGNOSE_STATE_VERSION,
      draft: state.draft,
      stepIndex: state.stepIndex,
      finished: state.finished,
      selectedIds: sanitizeSelectedIds(state.selectedIds),
      savedAt: Date.now(),
    };
    sessionStorage.setItem(DIAGNOSE_STATE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Safari private mode 等 — アプリを落とさない
  }
}

export function clearDiagnoseState(): void {
  try {
    sessionStorage.removeItem(DIAGNOSE_STATE_STORAGE_KEY);
    for (const key of LEGACY_DIAGNOSE_STATE_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/**
 * ヘッダー等からの「新規に診断へ行く」遷移用。
 * 完了済み結果だけ破棄し、質問途中の下書きは残す。
 */
export function clearFinishedDiagnoseState(): void {
  try {
    const raw = sessionStorage.getItem(DIAGNOSE_STATE_STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as { finished?: unknown }).finished === true
    ) {
      clearDiagnoseState();
    }
  } catch {
    // ignore
  }
  clearDiagnoseReturning();
}

export function setDiagnoseReturning(): void {
  try {
    sessionStorage.setItem(
      DIAGNOSE_RETURNING_STORAGE_KEY,
      JSON.stringify({ setAt: Date.now() }),
    );
  } catch {
    // ignore
  }
}

export function clearDiagnoseReturning(): void {
  try {
    sessionStorage.removeItem(DIAGNOSE_RETURNING_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasValidDiagnoseReturning(): boolean {
  try {
    const raw = sessionStorage.getItem(DIAGNOSE_RETURNING_STORAGE_KEY);
    if (!raw) return false;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      clearDiagnoseReturning();
      return false;
    }
    const setAt = (parsed as { setAt?: unknown }).setAt;
    if (typeof setAt !== "number" || !Number.isFinite(setAt)) {
      clearDiagnoseReturning();
      return false;
    }
    if (Date.now() - setAt > RETURNING_TTL_MS) {
      clearDiagnoseReturning();
      return false;
    }
    return true;
  } catch {
    clearDiagnoseReturning();
    return false;
  }
}

export function isDiagnosePath(pathname: string): boolean {
  return pathname === "/diagnose" || pathname.startsWith("/diagnose/");
}

export function isShopOrComparePath(pathname: string): boolean {
  return (
    pathname.startsWith("/shops/") ||
    pathname === "/compare" ||
    pathname.startsWith("/compare/")
  );
}

/** 診断結果の往復を許可するパス（これ以外に入ったら returning を消す） */
export function isDiagnoseRelatedPath(pathname: string): boolean {
  return isDiagnosePath(pathname) || isShopOrComparePath(pathname);
}
