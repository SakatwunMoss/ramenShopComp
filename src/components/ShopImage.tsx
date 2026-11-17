import type { CSSProperties } from "react";
import Image from "next/image";

/** HotPepper photo.pc.l の長辺。これ以上に引き伸ばさない */
export const SHOP_PHOTO_MAX_PX = 238;

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
 * Cloudflare Workers では Next 標準の画像最適化がそのままでは動かないため、
 * 当面は unoptimized で配信（width/height または fill で CLS を抑制）。
 * Cloudflare Images（IMAGES バインディング）有効後は unoptimized を外せる。
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

/**
 * 店舗詳細ヒーロー: 広い 4:3 枠 + ぼかし背景 + 最大 238px のシャープ前景。
 */
export function ShopHeroImage({ src, alt, priority, className }: MediaProps) {
  const usable = isUsableShopPhoto(src);

  return (
    <div
      className={`relative aspect-[4/3] overflow-hidden bg-bg-deep ${className ?? ""}`}
    >
      {!usable ? (
        <ShopPhotoPlaceholder className="absolute inset-0" />
      ) : (
        <>
          <Image
            src={src}
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
              src={src}
              alt={alt}
              width={SHOP_PHOTO_MAX_PX}
              height={SHOP_PHOTO_MAX_PX}
              unoptimized
              priority={priority}
              sizes={`${SHOP_PHOTO_MAX_PX}px`}
              className="h-auto max-h-[238px] w-full max-w-[238px] rounded-md object-contain shadow-[0_8px_24px_rgba(28,20,16,0.28)]"
            />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 一覧カード用: カード全幅の帯の中に、最大 238px・4:3・object-cover を中央寄せ。
 * 余白は bg-bg-deep（一覧でぼかし二重読み込みを避けて軽くする）。
 */
export function ShopCardImage({ src, alt, priority, className }: MediaProps) {
  const usable = isUsableShopPhoto(src);

  return (
    <div
      className={`flex justify-center overflow-hidden bg-bg-deep ${className ?? ""}`}
    >
      <div className="relative aspect-[4/3] w-full max-w-[238px]">
        {!usable ? (
          <ShopPhotoPlaceholder className="absolute inset-0" />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            unoptimized
            priority={priority}
            sizes={`${SHOP_PHOTO_MAX_PX}px`}
            className="object-cover"
          />
        )}
      </div>
    </div>
  );
}
