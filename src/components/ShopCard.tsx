import Link from "next/link";
import type { Shop } from "@/lib/types";

type ShopCardProps = {
  shop: Shop;
};

export function ShopCard({ shop }: ShopCardProps) {
  return (
    <article className="group border-b border-[var(--border)] py-5 first:pt-0 last:border-b-0">
      <Link
        href={`/shops/${shop.id}`}
        className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-start"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-muted)] sm:aspect-square">
          {shop.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.image_url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-[family-name:var(--font-display)] text-2xl text-[var(--muted)]">
              麺
            </div>
          )}
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] transition-colors group-hover:text-[var(--accent)] sm:text-2xl">
            {shop.name}
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--muted)]">
            {shop.genre && <span>{shop.genre}</span>}
            {shop.budget && <span>{shop.budget}</span>}
          </div>
          {shop.address && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--ink-soft)]">
              {shop.address}
            </p>
          )}
          {shop.access && (
            <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
              {shop.access}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
