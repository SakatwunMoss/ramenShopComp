import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
