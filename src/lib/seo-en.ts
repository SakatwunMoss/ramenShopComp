import type { Shop } from "./types";
import { RAMEN_STYLES, type RamenStyleId } from "./types";

/** 大エリア（都道府県）コード → 英語名（HotPepper 現行 large_area に対応） */
export const LARGE_AREA_EN: Record<string, string> = {
  Z011: "Tokyo",
  Z012: "Kanagawa",
  Z013: "Saitama",
  Z014: "Chiba",
  Z015: "Ibaraki",
  Z016: "Tochigi",
  Z017: "Gunma",
  Z021: "Shiga",
  Z022: "Kyoto",
  Z023: "Osaka",
  Z024: "Hyogo",
  Z025: "Nara",
  Z026: "Wakayama",
  Z031: "Gifu",
  Z032: "Shizuoka",
  Z033: "Aichi",
  Z034: "Mie",
  Z041: "Hokkaido",
  Z051: "Aomori",
  Z052: "Iwate",
  Z053: "Miyagi",
  Z054: "Akita",
  Z055: "Yamagata",
  Z056: "Fukushima",
  Z061: "Niigata",
  Z062: "Toyama",
  Z063: "Ishikawa",
  Z064: "Fukui",
  Z065: "Yamanashi",
  Z066: "Nagano",
  Z071: "Tottori",
  Z072: "Shimane",
  Z073: "Okayama",
  Z074: "Hiroshima",
  Z075: "Yamaguchi",
  Z081: "Tokushima",
  Z082: "Kagawa",
  Z083: "Ehime",
  Z084: "Kochi",
  Z091: "Fukuoka",
  Z092: "Saga",
  Z093: "Nagasaki",
  Z094: "Kumamoto",
  Z095: "Oita",
  Z096: "Miyazaki",
  Z097: "Kagoshima",
  Z098: "Okinawa",
};

/**
 * 中エリアコード → 英語名（観光・検索需要の高いエリア中心）。
 * HotPepper の middle area code は全国で一意。
 */
export const MIDDLE_AREA_EN_BY_CODE: Record<string, string> = {
  Y005: "Ginza / Yurakucho / Shimbashi / Tsukiji",
  Y006: "Suidobashi / Iidabashi / Kagurazaka",
  Y007: "Odaiba",
  Y010: "Tokyo Station / Otemachi / Nihonbashi",
  Y013: "Yotsuya / Kojimachi / Ichigaya",
  Y015: "Ueno / Asakusa",
  Y020: "Kanda / Akihabara / Ochanomizu",
  Y025: "Shinagawa / Meguro / Tamachi / Gotanda",
  Y030: "Shibuya",
  Y035: "Harajuku / Aoyama / Omotesando",
  Y040: "Ebisu / Nakameguro / Daikanyama",
  Y045: "Akasaka / Roppongi / Azabu-juban",
  Y050: "Ikebukuro",
  Y055: "Shinjuku",
  Y056: "Shin-Okubo / Okubo",
  Y070: "Shimokitazawa",
  Y072: "Takadanobaba",
  Y100: "Kichijoji / Ogikubo / Mitaka",
  Y105: "Machida",
};

/** 地名部分一致用（コード未登録エリア向けフォールバック） */
const PLACE_NAME_EN: [string, string][] = [
  ["表参道", "Omotesando"],
  ["麻布十番", "Azabu-juban"],
  ["中目黒", "Nakameguro"],
  ["代官山", "Daikanyama"],
  ["下北沢", "Shimokitazawa"],
  ["高田馬場", "Takadanobaba"],
  ["新大久保", "Shin-Okubo"],
  ["吉祥寺", "Kichijoji"],
  ["秋葉原", "Akihabara"],
  ["六本木", "Roppongi"],
  ["お台場", "Odaiba"],
  ["原宿", "Harajuku"],
  ["浅草", "Asakusa"],
  ["渋谷", "Shibuya"],
  ["新宿", "Shinjuku"],
  ["池袋", "Ikebukuro"],
  ["銀座", "Ginza"],
  ["上野", "Ueno"],
  ["品川", "Shinagawa"],
  ["目黒", "Meguro"],
  ["恵比寿", "Ebisu"],
  ["赤坂", "Akasaka"],
  ["青山", "Aoyama"],
  ["神田", "Kanda"],
  ["日本橋", "Nihonbashi"],
  ["築地", "Tsukiji"],
  ["大阪", "Osaka"],
  ["難波", "Namba"],
  ["梅田", "Umeda"],
  ["心斎橋", "Shinsaibashi"],
  ["京都", "Kyoto"],
  ["祇園", "Gion"],
  ["札幌", "Sapporo"],
  ["福岡", "Fukuoka"],
  ["博多", "Hakata"],
  ["名古屋", "Nagoya"],
  ["横浜", "Yokohama"],
  ["神戸", "Kobe"],
  ["那覇", "Naha"],
];

const STYLE_EN: Record<RamenStyleId, string> = {
  miso: "Miso Ramen",
  shoyu: "Shoyu Ramen",
  shio: "Shio Ramen",
  tonkotsu: "Tonkotsu Ramen",
  tsukemen: "Tsukemen",
  iekei: "Iekei Ramen",
  jiro: "Jiro-style Ramen",
};

/** 複数ヒット時はより特徴的な系統を優先 */
const STYLE_INFER_ORDER: RamenStyleId[] = [
  "jiro",
  "iekei",
  "tonkotsu",
  "tsukemen",
  "miso",
  "shoyu",
  "shio",
];

export type InferredRamenStyle = {
  id: RamenStyleId;
  labelJa: string;
  labelEn: string;
};

export function appendEnglishMeta(ja: string, en: string): string {
  const left = ja.trim();
  const right = en.trim();
  if (!right) return left;
  if (!left) return right;
  return `${left} | ${right}`;
}

export function appendEnglishSentence(ja: string, en: string): string {
  const left = ja.trim();
  const right = en.trim();
  if (!right) return left;
  if (!left) return right;
  const joiner = /[。．.!?！？]$/.test(left) ? " " : ". ";
  return `${left}${joiner}${right}`;
}

export function largeAreaEn(
  code: string | null | undefined,
): string | null {
  if (!code) return null;
  return LARGE_AREA_EN[code] ?? null;
}

export function middleAreaEn(
  code: string | null | undefined,
  jaName: string,
): string | null {
  if (code && MIDDLE_AREA_EN_BY_CODE[code]) {
    return MIDDLE_AREA_EN_BY_CODE[code];
  }
  for (const [ja, en] of PLACE_NAME_EN) {
    if (jaName.includes(ja)) return en;
  }
  return null;
}

/** 日本語地名に英語を括弧併記（例: 東京（Tokyo）） */
export function areaJaWithEn(
  jaName: string,
  en: string | null | undefined,
): string {
  if (!en || jaName.includes(en)) return jaName;
  return `${jaName}（${en}）`;
}

export function inferRamenStyleFromText(
  text: string,
): InferredRamenStyle | null {
  if (!text.trim()) return null;
  for (const id of STYLE_INFER_ORDER) {
    const style = RAMEN_STYLES.find((s) => s.id === id);
    if (!style) continue;
    if (style.keywords.some((kw) => text.includes(kw))) {
      return {
        id,
        labelJa: style.label,
        labelEn: STYLE_EN[id],
      };
    }
  }
  return null;
}

export function inferRamenStyleFromShop(
  shop: Pick<Shop, "name" | "genre" | "access">,
): InferredRamenStyle | null {
  return inferRamenStyleFromText(
    `${shop.name} ${shop.genre ?? ""} ${shop.access ?? ""}`,
  );
}

/** 店舗メタのジャンル表記（日本語 + 英語系統） */
export function formatGenreMetaLabel(
  genre: string | null | undefined,
  style: InferredRamenStyle | null,
): string | null {
  if (!genre && !style) return null;
  if (style) {
    const iekeiNote =
      style.id === "iekei" ? " / Yokohama-style" : "";
    if (genre) {
      return `ジャンル: ${genre}（${style.labelEn}${iekeiNote}）。`;
    }
    return `ジャンル: ${style.labelJa}（${style.labelEn}${iekeiNote}）。`;
  }
  return genre ? `ジャンル: ${genre}。` : null;
}
