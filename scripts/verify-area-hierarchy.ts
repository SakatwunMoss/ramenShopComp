/**
 * エリア親子・表示名の整合性を検証する。
 *
 * Usage:
 *   npm run verify-area-hierarchy
 *   npm run verify-area-hierarchy -- path/to/shops.json
 *
 * Exit 1 if parent mismatches, duplicate prefecture names, or raw-code labels are found.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AREA_LABELS } from "../src/lib/area-labels";
import {
  checkAreaIntegrity,
  verifyMiddleParentsByLarge,
} from "../src/lib/area-integrity";
import type { ShopsSnapshot } from "../src/lib/shops-snapshot";

const DEFAULT_PATH = join(process.cwd(), "output", "shops.json");

function resolveFallback(code: string): string | undefined {
  return AREA_LABELS[code];
}

function main() {
  const filePath = process.argv[2] ?? DEFAULT_PATH;
  console.log(`Reading ${filePath}`);
  const snapshot = JSON.parse(readFileSync(filePath, "utf8")) as ShopsSnapshot;

  const issues = checkAreaIntegrity(snapshot, resolveFallback);
  const parentCheck = verifyMiddleParentsByLarge(snapshot, resolveFallback);

  console.log(
    `\nPrefectures (large areas): ${parentCheck.prefectureCount} (ok=${parentCheck.okCount})`,
  );

  if (parentCheck.failures.length === 0) {
    console.log(
      "✓ All middle areas have parent_code matching their large area group",
    );
  } else {
    console.error("✗ Middle areas with wrong parent:");
    for (const f of parentCheck.failures) {
      console.error(`  ${f.largeCode} (${f.largeName}):`);
      for (const m of f.badMiddles) {
        console.error(
          `    ${m.code} ${m.name} parent=${m.parent ?? "null"}`,
        );
      }
    }
  }

  // UI 表示シミュレーション（スナップショット優先 → AREA_LABELS）
  const uiNames = new Map<string, string[]>();
  for (const [code, counts] of Object.entries(snapshot.area_counts.large)) {
    if (counts.ramen <= 0) continue;
    const name =
      snapshot.area_labels?.[code]?.name?.trim() ||
      resolveFallback(code) ||
      code;
    const list = uiNames.get(name) ?? [];
    list.push(`${code}(${counts.ramen})`);
    uiNames.set(name, list);
  }
  const dupUi = [...uiNames.entries()].filter(([, codes]) => codes.length > 1);
  if (dupUi.length === 0) {
    console.log("✓ No duplicate prefecture names in UI large-area list");
  } else {
    console.error("✗ Duplicate prefecture names in UI:");
    for (const [name, codes] of dupUi) {
      console.error(`  ${name}: ${codes.join(", ")}`);
    }
  }

  const otherIssues = issues.filter(
    (i) =>
      i.kind !== "parent_mismatch" && i.kind !== "duplicate_large_name",
  );
  if (otherIssues.length > 0) {
    console.error("\nOther issues:");
    for (const issue of otherIssues) {
      console.error(`  [${issue.kind}] ${issue.message}`);
    }
  } else {
    console.log("✓ No missing/empty/raw-code large labels among shop areas");
  }

  // 愛知（Z033）の中エリアがすべて愛知配下であること（回帰用スポットチェック）
  const aichiCode = "Z033";
  const aichiMiddles = Object.keys(
    snapshot.area_counts.middle[aichiCode] ?? {},
  );
  const aichiBad = aichiMiddles.filter(
    (code) => snapshot.area_labels?.[code]?.parent_code !== aichiCode,
  );
  const aichiName =
    snapshot.area_labels?.[aichiCode]?.name ?? resolveFallback(aichiCode);
  if (aichiName !== "愛知") {
    console.error(
      `✗ Expected ${aichiCode} to be 愛知, got ${aichiName ?? "(missing)"}`,
    );
  } else {
    console.log(`✓ ${aichiCode} is labeled 愛知 (${aichiMiddles.length} middles)`);
  }
  if (aichiBad.length > 0) {
    console.error(`✗ Aichi middles with wrong parent: ${aichiBad.join(", ")}`);
  }

  const failed =
    parentCheck.failures.length > 0 ||
    dupUi.length > 0 ||
    otherIssues.length > 0 ||
    aichiName !== "愛知" ||
    aichiBad.length > 0 ||
    issues.some((i) => i.kind === "duplicate_large_name");

  if (failed) {
    console.error(`\nFAILED (${issues.length} integrity issue(s))`);
    process.exit(1);
  }

  console.log("\nAll area hierarchy checks passed.");
}

main();
