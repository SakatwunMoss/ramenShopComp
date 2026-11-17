"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import {
  preferShopPhotoLarge,
  SHOP_PHOTO_FALLBACK_MAX_PX,
  SHOP_PHOTO_LARGE_MAX_PX,
  type ShopPhotoSrcPair,
} from "@/lib/shop-photo";

type PlainProps = {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
};

/**
 * HotPepper の noimage GIF / 空文字は表示不能扱い（ぼかし背景にも使わない）。
 */
export function isUsableShopPhoto(
  src: string | null | undefined,
): src is string {
  if (!src?.trim()) return false;
  return !src.toLowerCase().includes("noimage");
}

function ShopPhotoPlaceholder({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-bg-deep font-[family-name:var(--font-display)] text-4xl text-lacquer/35 ${className ?? ""}`}
      style={style}
    >
      麺
    </div>
  );
}

/**
 * large を先に試し、失敗したら fallback へ1回だけ切り替える。
 * 店舗 URL が変わったときは親が key でリマウントして状態をリセットする。
 * ハイドレーション前の壊れた画像は callback ref の complete チェックで拾う。
 */
function useShopPhotoSrc(pair: ShopPhotoSrcPair) {
  const [hasFallenBack, setHasFallenBack] = useState(false);

  const canFallback = pair.src !== pair.fallback;
  const currentSrc = hasFallenBack ? pair.fallback : pair.src;
  const usingLarge = canFallback && !hasFallenBack;

  function fallBackOnce() {
    if (!canFallback) return;
    setHasFallenBack((prev) => (prev ? prev : true));
  }

  function imgRef(node: HTMLImageElement | null) {
    if (node?.complete && node.naturalWidth === 0) {
      fallBackOnce();
    }
  }

  function onError() {
    fallBackOnce();
  }

  return { currentSrc, usingLarge, imgRef, onError };
}

/**
 * Cloudflare Workers では Next 標準の画像最適化がそのままでは動かないため、
 * 当面は unoptimized で配信（width/height または fill で CLS を抑制）。
 * Cloudflare Images（IMAGES バインディング）有効後は unoptimized を外せる。
 *
 * 比較表など小さい枠向け。URL 変換はせず、渡された src をそのまま表示する。
 */
export function ShopImage({
  src,
  alt,
  width,
  height,
  className,
  priority,
  sizes,
  fill,
}: PlainProps) {
  if (!isUsableShopPhoto(src)) {
    if (fill) {
      return <ShopPhotoPlaceholder className={className} />;
    }
    return (
      <ShopPhotoPlaceholder className={className} style={{ width, height }} />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={sizes ?? "100vw"}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}

type MediaProps = {
  src: string | null | undefined;
  alt: string;
  priority?: boolean;
  className?: string;
};

type UsableMediaProps = {
  src: string;
  alt: string;
  priority?: boolean;
};

/**
 * 店舗詳細ヒーロー: 広い 4:3 枠 + ぼかし背景 + シャープ前景。
 * large 成功時は前景最大 480px、フォールバック時は 238px。枠は固定。
 */
export function ShopHeroImage({ src, alt, priority, className }: MediaProps) {
  return (
    <div
      className={`relative aspect-[4/3] overflow-hidden bg-bg-deep ${className ?? ""}`}
    >
      {!isUsableShopPhoto(src) ? (
        <ShopPhotoPlaceholder className="absolute inset-0" />
      ) : (
        <ShopHeroImageInner
          key={src}
          src={src}
          alt={alt}
          priority={priority}
        />
      )}
    </div>
  );
}

function ShopHeroImageInner({ src, alt, priority }: UsableMediaProps) {
  const pair = preferShopPhotoLarge(src) ?? { src, fallback: src };
  const { currentSrc, usingLarge, imgRef, onError } = useShopPhotoSrc(pair);
  const maxPx = usingLarge
    ? SHOP_PHOTO_LARGE_MAX_PX
    : SHOP_PHOTO_FALLBACK_MAX_PX;

  return (
    <>
      {/* 前景と同じ currentSrc を共有（失敗状態を二重に持たない） */}
      <Image
        src={currentSrc}
        alt=""
        fill
        unoptimized
        aria-hidden={true}
        loading="lazy"
        sizes="(max-width: 1024px) 100vw, 40vw"
        className="scale-110 object-cover blur-xl"
      />
      <div className="absolute inset-0 bg-black/10" aria-hidden={true} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Image
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          width={maxPx}
          height={maxPx}
          unoptimized
          priority={priority}
          sizes={`${maxPx}px`}
          onError={onError}
          className="h-auto w-full rounded-md object-contain shadow-[0_8px_24px_rgba(28,20,16,0.28)]"
          style={{ maxWidth: maxPx, maxHeight: maxPx }}
        />
      </div>
    </>
  );
}

/**
 * 一覧カード用: カード全幅の帯の中に、最大 238px・4:3・object-cover を中央寄せ。
 * ソースは large 優先（枠サイズは変えず鮮明さのみ向上）。
 */
export function ShopCardImage({ src, alt, priority, className }: MediaProps) {
  return (
    <div
      className={`flex justify-center overflow-hidden bg-bg-deep ${className ?? ""}`}
    >
      <div
        className="relative aspect-[4/3] w-full"
        style={{ maxWidth: SHOP_PHOTO_FALLBACK_MAX_PX }}
      >
        {!isUsableShopPhoto(src) ? (
          <ShopPhotoPlaceholder className="absolute inset-0" />
        ) : (
          <ShopCardImageInner
            key={src}
            src={src}
            alt={alt}
            priority={priority}
          />
        )}
      </div>
    </div>
  );
}

function ShopCardImageInner({ src, alt, priority }: UsableMediaProps) {
  const pair = preferShopPhotoLarge(src) ?? { src, fallback: src };
  const { currentSrc, imgRef, onError } = useShopPhotoSrc(pair);

  return (
    <Image
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      fill
      unoptimized
      priority={priority}
      sizes={`${SHOP_PHOTO_FALLBACK_MAX_PX}px`}
      onError={onError}
      className="object-cover"
    />
  );
}
