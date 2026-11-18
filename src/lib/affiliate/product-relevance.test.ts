import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inferAffiliateStyleFromName,
  isMultiFlavorAssortment,
  isSameProductQuantityVariant,
  stripQuantityNoiseFromName,
} from "./product-relevance";

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

describe("isMultiFlavorAssortment", () => {
  it("醤油と味噌が並ぶ詰め合わせ → true", () => {
    const name =
      "旭川ラーメン 醤油 袋麺 札幌ラーメン 味噌 旭川醤油ラーメン / 札幌味噌ラーメン 乾麺 各1袋";
    assert.equal(isMultiFlavorAssortment(name), true);
  });

  it("醤油豚骨（単一味呼称）→ false", () => {
    assert.equal(isMultiFlavorAssortment("濃厚醤油豚骨ラーメン 袋麺"), false);
    assert.equal(isMultiFlavorAssortment("家系ラーメン 豚骨醤油"), false);
  });

  it("つけ麺＋醤油（単一系統の味付け）→ false", () => {
    assert.equal(isMultiFlavorAssortment("つけ麺 醤油"), false);
  });

  it("二郎＋醤油豚骨 → false", () => {
    const name =
      "パーフェクトラーメンBUTA【S】2食セット 二郎系 にんにく背脂醤油豚骨ラーメン";
    assert.equal(isMultiFlavorAssortment(name), false);
  });
});

describe("isSameProductQuantityVariant", () => {
  it("広島つけ麺 4食 / 2食 は同一系統の個数違い", () => {
    const a = {
      name: "広島つけ麺 4食セット ごま＆唐辛子付 ラーメン つけ麺 生麺 本格",
      shopName: "aemotion",
    };
    const b = {
      name: "広島つけ麺 2食セット ごま＆唐辛子付 ラーメン つけ麺 本格 生麺",
      shopName: "aemotion",
    };
    assert.equal(isSameProductQuantityVariant(a, b), true);
    assert.notEqual(stripQuantityNoiseFromName(a.name), a.name);
  });

  it("個数除去後の名前が一致すればストアが違っても同一", () => {
    const a = {
      name: "広島つけ麺 4食セット",
      shopName: "shop-a",
    };
    const b = {
      name: "広島つけ麺 2食セット",
      shopName: "shop-b",
    };
    assert.equal(isSameProductQuantityVariant(a, b), true);
  });

  it("ストアが違い先頭だけ似ている別商品は同一にしない", () => {
    const a = {
      name: "北海道味噌ラーメン 名店の味 濃厚 4食セット ご当地",
      shopName: "shop-a",
    };
    const b = {
      name: "北海道味噌ラーメン 札幌風 あっさり 2食セット 乾麺",
      shopName: "shop-b",
    };
    assert.equal(isSameProductQuantityVariant(a, b), false);
  });
});
