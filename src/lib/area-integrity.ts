import type { ShopsSnapshot } from "./shops-snapshot";

export type AreaIntegrityIssue = {
  kind:
    | "missing_middle_label"
    | "parent_mismatch"
    | "duplicate_large_name"
    | "raw_code_display"
    | "empty_label_name";
  message: string;
};

type ResolveLargeName = (code: string) => string | null | undefined;

/**
 * スナップショットのエリア親子・表示名の整合性を検査する（Workers でも使える純関数）。
 * area_counts を正とし、area_labels の parent_code / name と突き合わせる。
 */
export function checkAreaIntegrity(
  snapshot: ShopsSnapshot,
  resolveLargeFallback?: ResolveLargeName,
): AreaIntegrityIssue[] {
  const issues: AreaIntegrityIssue[] = [];
  const labels = snapshot.area_labels ?? {};

  for (const [largeCode, byMiddle] of Object.entries(
    snapshot.area_counts.middle,
  )) {
    for (const middleCode of Object.keys(byMiddle)) {
      const label = labels[middleCode];
      if (!label) {
        issues.push({
          kind: "missing_middle_label",
          message: `middle ${middleCode} under ${largeCode} has no area_labels entry`,
        });
        continue;
      }
      if (!label.name?.trim()) {
        issues.push({
          kind: "empty_label_name",
          message: `middle ${middleCode} under ${largeCode} has empty name`,
        });
      }
      if (label.parent_code !== largeCode) {
        issues.push({
          kind: "parent_mismatch",
          message: `middle ${middleCode} (${label.name}) parent=${label.parent_code ?? "null"} but grouped under ${largeCode}`,
        });
      }
    }
  }

  const nameToCodes = new Map<string, string[]>();
  for (const [code, counts] of Object.entries(snapshot.area_counts.large)) {
    if (counts.ramen <= 0 && counts.all <= 0) continue;
    const name =
      labels[code]?.name?.trim() ||
      resolveLargeFallback?.(code)?.trim() ||
      code;
    if (name === code || /^Z\d{3}$/i.test(name)) {
      issues.push({
        kind: "raw_code_display",
        message: `large ${code} would display as raw code (no name in area_labels/fallback)`,
      });
    }
    const list = nameToCodes.get(name) ?? [];
    list.push(code);
    nameToCodes.set(name, list);
  }

  for (const [name, codes] of nameToCodes) {
    if (codes.length > 1) {
      issues.push({
        kind: "duplicate_large_name",
        message: `large area name "${name}" shared by codes: ${codes.join(", ")}`,
      });
    }
  }

  return issues;
}

/**
 * 全都道府県について、middle の親が選択 large と一致することを検証。
 */
export function verifyMiddleParentsByLarge(
  snapshot: ShopsSnapshot,
  resolveLargeFallback?: ResolveLargeName,
): {
  prefectureCount: number;
  okCount: number;
  failures: {
    largeCode: string;
    largeName: string;
    badMiddles: { code: string; name: string; parent: string | null }[];
  }[];
} {
  const labels = snapshot.area_labels ?? {};
  const failures: {
    largeCode: string;
    largeName: string;
    badMiddles: { code: string; name: string; parent: string | null }[];
  }[] = [];

  const largeCodes = Object.keys(snapshot.area_counts.large);
  for (const largeCode of largeCodes) {
    const largeName =
      labels[largeCode]?.name?.trim() ||
      resolveLargeFallback?.(largeCode) ||
      largeCode;
    const byMiddle = snapshot.area_counts.middle[largeCode] ?? {};
    const badMiddles: {
      code: string;
      name: string;
      parent: string | null;
    }[] = [];

    for (const middleCode of Object.keys(byMiddle)) {
      const label = labels[middleCode];
      const parent = label?.parent_code ?? null;
      if (parent !== largeCode) {
        badMiddles.push({
          code: middleCode,
          name: label?.name?.trim() || middleCode,
          parent,
        });
      }
    }

    if (badMiddles.length > 0) {
      failures.push({ largeCode, largeName, badMiddles });
    }
  }

  return {
    prefectureCount: largeCodes.length,
    okCount: largeCodes.length - failures.length,
    failures,
  };
}
