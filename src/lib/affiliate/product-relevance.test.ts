import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inferAffiliateStyleFromName } from "./product-relevance";

describe("inferAffiliateStyleFromName", () => {
  it("二郎系＋醤油豚骨 → jiro（下位の醤油・豚骨より優先）", () => {
    const name =
      "パーフェクトラーメンBUTA【S】2食セット 麺とスープ 二郎インスパイア 二郎系 にんにく背脂醤油豚骨ラーメン";
    assert.equal(inferAffiliateStyleFromName(name), "jiro");
  });

  it("味噌ラーメン 5食 → miso", () => {
    assert.equal(inferAffiliateStyleFromName("味噌ラーメン 5食"), "miso");
  });

  it("家系ラーメン 豚骨醤油 → iekei", () => {
    assert.equal(
      inferAffiliateStyleFromName("家系ラーメン 豚骨醤油"),
      "iekei",
    );
  });

  it("つけ麺 醤油 → tsukemen", () => {
    assert.equal(inferAffiliateStyleFromName("つけ麺 醤油"), "tsukemen");
  });

  it("醤油豚骨のみ（二郎・家系なし）→ tonkotsu", () => {
    assert.equal(
      inferAffiliateStyleFromName("濃厚醤油豚骨ラーメン 袋麺"),
      "tonkotsu",
    );
  });
});
