/**
 * 好み診断まわりの表示用コピー（JA + EN）。
 * スコアリング用の内部値（preferences.ts の日本語ラベル）とは別。
 */

export type Bilingual = { ja: string; en: string };

export const diagnoseCopy = {
  nav: {
    diagnose: { ja: "好み診断", en: "Preference quiz" },
  },
  home: {
    startCta: { ja: "好み診断をはじめる", en: "Start preference quiz" },
    bannerTitle: {
      ja: "約30秒で、好みに近い一杯が見つかる",
      en: "Find a bowl that fits you in about 30 seconds",
    },
    bannerBody: {
      ja: "エリアと好みを答えるだけ。結果からそのまま比較もできます。",
      en: "Answer a few questions about area and taste. Compare shops from your results.",
    },
  },
  page: {
    title: { ja: "好み診断", en: "Preference quiz" },
    lead: {
      ja: "エリアと好みを答えると、近いラーメン店を最大5件提案します。結果から比較に追加できます。",
      en: "Answer area and taste preferences to get up to 5 ramen shop suggestions. Add results to compare.",
    },
  },
  steps: {
    area: { ja: "エリア", en: "Area" },
    soup: { ja: "スープ系統", en: "Soup" },
    spicy: { ja: "辛さ", en: "Spice" },
    richness: { ja: "こってり度", en: "Richness" },
    inbound: { ja: "インバウンド対応", en: "Dietary needs" },
    result: { ja: "結果", en: "Results" },
  },
  area: {
    question: {
      ja: "どのエリアで探しますか？",
      en: "Where do you want to search?",
    },
    hint: {
      ja: "中エリアまで選ぶと、その範囲の店舗だけが候補になります。",
      en: "Choose a city/district so we only search shops in that area.",
    },
    largeLabel: {
      ja: "都道府県・大エリア",
      en: "Prefecture / region",
    },
    middleLabel: {
      ja: "エリア（中エリア）",
      en: "City / district",
    },
    selectPlaceholder: { ja: "選択してください", en: "Please select" },
    selectLargeFirst: {
      ja: "先に大エリアを選択",
      en: "Select a region first",
    },
    noMiddle: { ja: "候補がありません", en: "No options available" },
    areaRequired: {
      ja: "大エリアと中エリアを選択してください。",
      en: "Please select both a region and a city/district.",
    },
  },
  questions: {
    soup: { ja: "スープ系統は？", en: "Soup style?" },
    spicy: { ja: "辛いメニューは？", en: "Want something spicy?" },
    richness: { ja: "こってり度は？", en: "Rich or light?" },
    inbound: {
      ja: "インバウンド対応は必要ですか？（任意）",
      en: "Any dietary needs? (optional)",
    },
  },
  actions: {
    back: { ja: "戻る", en: "Back" },
    next: { ja: "次へ", en: "Next" },
    seeResults: { ja: "結果を見る", en: "See results" },
    diagnosing: { ja: "診断中…", en: "Finding matches…" },
    restart: { ja: "もう一度診断する", en: "Try again" },
    restartFromScratch: {
      ja: "最初からやり直す",
      en: "Start over",
    },
  },
  results: {
    preferenceMatch: {
      ja: "あなたの好みに近い店",
      en: "Shops close to your taste",
    },
    areaRecommend: (middleAreaName: string): Bilingual => ({
      ja: `${middleAreaName}のおすすめ店`,
      en: `Recommended in ${middleAreaName}`,
    }),
    emptyTitle: {
      ja: "掲載店が見つかりませんでした",
      en: "No shops found in this area",
    },
    emptyBody: (large: string, middle: string): Bilingual => ({
      ja: `${large}・${middle}には、現在ラーメン店データがありません。別のエリアで試してください。`,
      en: `We don’t have ramen shop data for ${large} / ${middle} yet. Try another area.`,
    }),
    summary: (
      large: string,
      middle: string,
      candidateCount: number,
      shown: number,
    ): Bilingual => ({
      ja: `${large}・${middle}の候補 ${candidateCount.toLocaleString("ja-JP")} 件から、上位 ${shown} 件を表示しています。気になる店を選んで比較できます。`,
      en: `Showing top ${shown} of ${candidateCount.toLocaleString("en-US")} shops in ${large} / ${middle}. Select shops to compare.`,
    }),
  },
  errors: {
    invalidPrefs: {
      ja: "診断条件が不正です。エリアを選択してください。",
      en: "Invalid quiz answers. Please select an area.",
    },
    dataUnavailable: {
      ja: "店舗データを読み込めませんでした。",
      en: "Could not load shop data.",
    },
  },
} as const;

/** 選択肢・タグ表示用（内部値は日本語のまま） */
export const optionLabelEn: Record<string, string> = {
  豚骨: "Tonkotsu",
  醤油: "Shoyu",
  味噌: "Miso",
  塩: "Shio",
  つけ麺: "Tsukemen",
  こだわらない: "No preference",
  辛いメニューも食べたい: "I want spicy options too",
  がっつり系: "Rich & hearty",
  あっさり系: "Light & clean",
  ハラール対応: "Halal-friendly",
  ベジタリアン対応: "Vegetarian-friendly",
  英語メニューあり: "English menu",
  辛い系対応あり: "Spicy options",
  家系: "Iekei",
  二郎系: "Jiro-style",
  "無添加・煮干し系": "Additive-free / niboshi",
  太麺: "Thick noodles",
  細麺: "Thin noodles",
};

export function optionEn(ja: string): string {
  return optionLabelEn[ja] ?? ja;
}

export function errorToBilingual(message: string): Bilingual {
  if (message === diagnoseCopy.errors.invalidPrefs.ja) {
    return diagnoseCopy.errors.invalidPrefs;
  }
  if (message === diagnoseCopy.errors.dataUnavailable.ja) {
    return diagnoseCopy.errors.dataUnavailable;
  }
  if (message === diagnoseCopy.area.areaRequired.ja) {
    return diagnoseCopy.area.areaRequired;
  }
  return { ja: message, en: message };
}
