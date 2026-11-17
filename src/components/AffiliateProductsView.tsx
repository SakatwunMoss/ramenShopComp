import Image from "next/image";
import { AFFILIATE_CTA_LABEL } from "@/lib/affiliate/cta-labels";
import type { AffiliateProduct } from "@/lib/affiliate/types";

function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}

/** 表示用（サーバー／クライアント共通）。商品が空なら何も出さない */
export function AffiliateProductsView({
  products,
  className = "",
}: {
  products: AffiliateProduct[];
  className?: string;
}) {
  if (products.length === 0) return null;

  return (
    <aside
      className={`border border-lacquer/25 bg-lacquer/5 px-4 py-5 sm:px-5 ${className}`}
      aria-label="アフィリエイト商品"
    >
      <p className="text-xs text-ink-muted">※アフィリエイト広告を含みます</p>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <li key={product.id} className="flex gap-3">
            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="relative h-20 w-20 shrink-0 overflow-hidden bg-bg-deep"
            >
              <Image
                src={product.imageUrl}
                alt=""
                width={300}
                height={300}
                unoptimized
                className="h-full w-full object-cover"
              />
            </a>
            <div className="min-w-0 flex-1">
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                className="line-clamp-2 text-sm font-medium text-ink transition hover:text-lacquer"
              >
                {product.name}
              </a>
              <p className="mt-1 text-sm text-lacquer">
                {formatPrice(product.price)}
              </p>
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                className="mt-2 inline-flex bg-lacquer px-3 py-1.5 text-xs font-medium text-steam transition hover:bg-lacquer-deep"
              >
                {AFFILIATE_CTA_LABEL[product.provider]}
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-muted/75">
        価格は取得時点のものです。変動する場合があります。
      </p>
    </aside>
  );
}
