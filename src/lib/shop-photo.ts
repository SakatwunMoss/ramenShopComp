/**
 * HotPepper 店舗写真 URL のサイズ違い（非公式）。
 * 正規形の _238 のみ _480 に置換し、失敗時は呼び出し側で fallback に戻す。
 */

const PHOTO_SIZE_FALLBACK = "238";
const PHOTO_SIZE_LARGE = "480";

/** 表示上限（フォールバック画像 = photo.pc.l 相当） */
export const SHOP_PHOTO_FALLBACK_MAX_PX = Number(PHOTO_SIZE_FALLBACK);

/** 表示上限（高解像度候補） */
export const SHOP_PHOTO_LARGE_MAX_PX = Number(PHOTO_SIZE_LARGE);

/**
 * imgfp.hotp.jp の IMGH 正規形:
 * https://imgfp.hotp.jp/IMGH/{xx}/{yy}/{P…}/{P…}_238.jpg
 */
const CANONICAL_FALLBACK_PHOTO_RE = new RegExp(
  `^https://imgfp\\.hotp\\.jp/IMGH/\\d{2}/\\d{2}/(P\\d+)/\\1_${PHOTO_SIZE_FALLBACK}\\.jpg$`,
  "i",
);

const FALLBACK_SIZE_TOKEN = `_${PHOTO_SIZE_FALLBACK}.`;
const LARGE_SIZE_TOKEN = `_${PHOTO_SIZE_LARGE}.`;

export type ShopPhotoSrcPair = {
  /** 先に試す URL（正規形なら large、それ以外は元 URL） */
  src: string;
  /** 読み込み失敗時に戻す URL（常に入力 URL） */
  fallback: string;
};

/**
 * 正規形の店舗写真 URL なら large サイズを優先し、それ以外はそのまま返す。
 * noimage / null 相当 / 非正規形は変換しない（src === fallback）。
 */
export function preferShopPhotoLarge(
  url: string | null | undefined,
): ShopPhotoSrcPair | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (!CANONICAL_FALLBACK_PHOTO_RE.test(trimmed)) {
    return { src: trimmed, fallback: trimmed };
  }

  return {
    src: trimmed.replace(FALLBACK_SIZE_TOKEN, LARGE_SIZE_TOKEN),
    fallback: trimmed,
  };
}
