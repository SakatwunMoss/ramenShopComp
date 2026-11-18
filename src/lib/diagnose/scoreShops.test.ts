import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ANY_PREFERENCE, type DiagnosePreferences } from "./preferences";
import { scoreShops } from "./scoreShops";
import type { Shop } from "../types";

function shop(partial: {
  id: string;
  large_area_code: string | null;
  middle_area_code: string | null;
  tags?: string[];
}): Shop {
  return {
    id: partial.id,
    hotpepper_id: null,
    data_source: "test",
    name: `ラーメン ${partial.id}`,
    genre: "ラーメン",
    address: null,
    large_area_code: partial.large_area_code,
    middle_area_code: partial.middle_area_code,
    small_area_code: null,
    lat: null,
    lng: null,
    budget: null,
    image_url: null,
    shop_url: null,
    phone: null,
    open_hours: null,
    close_days: null,
    access: null,
    tags: partial.tags,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function prefs(
  overrides: Partial<DiagnosePreferences> = {},
): DiagnosePreferences {
  return {
    largeArea: "Z011",
    middleArea: "",
    soup: ANY_PREFERENCE,
    spicy: ANY_PREFERENCE,
    richness: ANY_PREFERENCE,
    inbound: ANY_PREFERENCE,
    ...overrides,
  };
}

/** 同点シャッフルを固定してアサーションを安定させる */
const fixedRandom = () => 0;

const shops: Shop[] = [
  shop({ id: "tokyo-a", large_area_code: "Z011", middle_area_code: "Y005" }),
  shop({ id: "tokyo-b", large_area_code: "Z011", middle_area_code: "Y006" }),
  shop({ id: "osaka-a", large_area_code: "Z023", middle_area_code: "Y500" }),
];

describe("scoreShops", () => {
  it("中エリアを指定したとき：その中エリアの店舗だけが候補になる", () => {
    const result = scoreShops(
      shops,
      prefs({ largeArea: "Z011", middleArea: "Y005" }),
      { random: fixedRandom },
    );
    assert.equal(result.candidateCount, 1);
    assert.deepEqual(
      result.results.map((r) => r.shop.id),
      ["tokyo-a"],
    );
  });

  it("中エリアが空のとき：その大エリアの店舗すべてが候補になり、別の大エリアは含まれない", () => {
    const result = scoreShops(
      shops,
      prefs({ largeArea: "Z011", middleArea: "" }),
      { random: fixedRandom },
    );
    assert.equal(result.candidateCount, 2);
    const ids = result.results.map((r) => r.shop.id).sort();
    assert.deepEqual(ids, ["tokyo-a", "tokyo-b"]);
    assert.ok(!ids.includes("osaka-a"));
  });

  it("大エリアが空のとき：0 件", () => {
    const result = scoreShops(
      shops,
      prefs({ largeArea: "", middleArea: "Y005" }),
      { random: fixedRandom },
    );
    assert.equal(result.candidateCount, 0);
    assert.deepEqual(result.results, []);
    assert.equal(result.hasPreferenceMatch, false);
  });
});
