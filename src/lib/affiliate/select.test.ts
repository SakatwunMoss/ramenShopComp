import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  isDeterminedAffiliateStyle,
  selectAffiliateProducts,
  selectAffiliateProductsRandom,
  type RandomFn,
} from "./select";
import type {
  AffiliateProduct,
  AffiliateProductsSnapshot,
  AffiliateStyleKey,
} from "./types";

const REAL_SNAPSHOT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../output/affiliate-products.json",
);

function product(
  id: string,
  styleKey: AffiliateStyleKey,
  reviewCount = 10,
): AffiliateProduct {
  return {
    id,
    provider: "yahoo",
    styleKey,
    name: `name-${id}`,
    price: 1000,
    imageUrl: "https://example.com/img.png",
    affiliateUrl: "https://example.com/a",
    shopName: "shop",
    reviewAverage: 4,
    reviewCount,
    fetchedAt: "2026-01-01T00:00:00.000Z",
  };
}

function snapshot(products: AffiliateProduct[]): AffiliateProductsSnapshot {
  return { generated_at: "2026-01-01T00:00:00.000Z", products };
}

/** 毎回同じ値を返す乱数（先頭寄りを選ぶ） */
function constRandom(value: number): RandomFn {
  return () => value;
}

/** 呼び出し順に返す乱数 */
function sequenceRandom(values: number[]): RandomFn {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

describe("isDeterminedAffiliateStyle", () => {
  it("系統が1つだけなら true", () => {
    assert.equal(isDeterminedAffiliateStyle(["miso"]), true);
    assert.equal(isDeterminedAffiliateStyle(["miso", "miso"]), true);
  });

  it("未指定・複数なら false", () => {
    assert.equal(isDeterminedAffiliateStyle([]), false);
    assert.equal(isDeterminedAffiliateStyle(["miso", "shoyu"]), false);
    assert.equal(isDeterminedAffiliateStyle([null, undefined]), false);
  });
});

describe("selectAffiliateProducts (系統指定)", () => {
  const data = snapshot([
    product("m1", "miso", 100),
    product("m2", "miso", 50),
    product("s1", "shoyu", 200),
    product("g1", "general", 80),
  ]);

  it("系統指定時はその系統のみ（レビュー順）", () => {
    const selected = selectAffiliateProducts(data, ["miso"], 2);
    assert.deepEqual(
      selected.map((p) => p.id),
      ["m1", "m2"],
    );
    assert.ok(selected.every((p) => p.styleKey === "miso"));
  });

  it("系統が足りなければ general で補充", () => {
    const thin = snapshot([product("m1", "miso", 10), product("g1", "general", 5)]);
    const selected = selectAffiliateProducts(thin, ["miso"], 2);
    assert.deepEqual(
      selected.map((p) => p.id),
      ["m1", "g1"],
    );
  });
});

describe("selectAffiliateProductsRandom / 混在", () => {
  const data = snapshot([
    product("m1", "miso"),
    product("m2", "miso"),
    product("s1", "shoyu"),
    product("t1", "tonkotsu"),
    product("g1", "general"),
  ]);

  it("全商品から重複なく2件", () => {
    const selected = selectAffiliateProductsRandom(data, {
      limit: 2,
      random: constRandom(0),
    });
    assert.equal(selected.length, 2);
    assert.equal(new Set(selected.map((p) => p.id)).size, 2);
  });

  it("可能なら別系統を優先", () => {
    // 1件目: index 0 → m1 (miso)
    // 2件目: 別系統プール [s1,t1,g1] の index 0 → s1
    const selected = selectAffiliateProductsRandom(data, {
      limit: 2,
      random: constRandom(0),
    });
    assert.equal(selected[0]!.styleKey, "miso");
    assert.notEqual(selected[1]!.styleKey, "miso");
  });

  it("excludeIds を除外する", () => {
    const selected = selectAffiliateProductsRandom(data, {
      limit: 2,
      excludeIds: ["m1", "s1", "t1", "g1"],
      random: constRandom(0),
    });
    assert.deepEqual(
      selected.map((p) => p.id),
      ["m2"],
    );
  });

  it("styleKeys が空/複数のとき selectAffiliateProducts はランダム経路", () => {
    const a = selectAffiliateProducts(data, [], 2, {
      random: sequenceRandom([0, 0]),
    });
    const b = selectAffiliateProducts(data, ["miso", "shoyu"], 2, {
      random: sequenceRandom([0, 0]),
    });
    assert.equal(a.length, 2);
    assert.equal(b.length, 2);
    assert.equal(new Set(a.map((p) => p.id)).size, 2);
    assert.equal(new Set(b.map((p) => p.id)).size, 2);
  });
});

describe("実JSONでのランダム分布 (output/affiliate-products.json)", () => {
  const raw = JSON.parse(
    readFileSync(REAL_SNAPSHOT_PATH, "utf8"),
  ) as AffiliateProductsSnapshot;

  it("スナップショットは全系統を含み general のみではない", () => {
    assert.ok(raw.products.length >= 8, `expected many products, got ${raw.products.length}`);
    const styles = new Set(raw.products.map((p) => p.styleKey));
    assert.ok(styles.size >= 3, `expected multiple styles, got ${[...styles]}`);
    assert.ok(
      [...styles].some((s) => s !== "general"),
      "snapshot must include non-general products",
    );
  });

  it("styleKeys=[general] だと general の2件に固定される（店舗フォールバックの罠）", () => {
    const selected = selectAffiliateProducts(raw, ["general"], 2);
    assert.ok(selected.length > 0);
    assert.ok(selected.every((p) => p.styleKey === "general"));
  });

  it("混在(styleKeys=[]) の1000回選定は各商品がおおむね均等", () => {
    const counts = new Map<string, number>();
    for (const p of raw.products) counts.set(p.id, 0);

    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      const selected = selectAffiliateProducts(raw, [], 2);
      assert.equal(selected.length, 2);
      assert.equal(new Set(selected.map((p) => p.id)).size, 2);
      // 可能なら別系統
      if (
        raw.products.some((p) => p.styleKey !== selected[0]!.styleKey)
      ) {
        assert.notEqual(selected[0]!.styleKey, selected[1]!.styleKey);
      }
      for (const p of selected) {
        counts.set(p.id, (counts.get(p.id) ?? 0) + 1);
      }
    }

    const values = [...counts.values()];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const expected = (trials * 2) / raw.products.length;

    // 全商品が少なくとも一度は選ばれる
    assert.ok(min > 0, `some product never selected: ${min}`);
    // 極端な偏りがない（max/min < 2.5、かつ期待値の 0.45〜1.8 倍）
    assert.ok(
      max / min < 2.5,
      `skew too high: max=${max} min=${min} ratio=${(max / min).toFixed(2)}`,
    );
    for (const [id, count] of counts) {
      assert.ok(
        count >= expected * 0.45 && count <= expected * 1.8,
        `${id} count=${count} expected≈${expected.toFixed(1)}`,
      );
    }

    // general 2商品だけで試行の大半を占めていないこと
    const generalIds = new Set(
      raw.products.filter((p) => p.styleKey === "general").map((p) => p.id),
    );
    let bothGeneral = 0;
    for (let i = 0; i < 200; i++) {
      const selected = selectAffiliateProducts(raw, [], 2);
      if (selected.every((p) => generalIds.has(p.id))) bothGeneral += 1;
    }
    assert.ok(
      bothGeneral < 20,
      `both-general too often: ${bothGeneral}/200 (general-only fallback bug?)`,
    );
  });
});
