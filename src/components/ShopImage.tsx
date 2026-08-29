import Image from "next/image";

type Props = {
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
}: Props) {
  if (!src) {
    if (fill) {
      return (
        <div
          className={`flex items-center justify-center bg-bg-deep font-[family-name:var(--font-display)] text-4xl text-lacquer/35 ${className ?? ""}`}
        >
          麺
        </div>
      );
    }
    return (
      <div
        className={`flex items-center justify-center bg-bg-deep font-[family-name:var(--font-display)] text-4xl text-lacquer/35 ${className ?? ""}`}
        style={{ width, height }}
      >
        麺
      </div>
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
