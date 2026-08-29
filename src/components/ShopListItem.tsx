import Link from "next/link";
import type { Shop } from "@/lib/types";

type Props = {
  shop: Shop;
};

export function ShopListItem({ shop }: Props) {
  return (
    <li className="group border-b border-line last:border-b-0">
      <Link
        href={`/shops/${shop.id}`}
        className="flex gap-4 px-1 py-4 transition duration-300 hover:bg-lacquer/[0.04] sm:gap-5 sm:px-2"
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-bg-deep sm:h-24 sm:w-24">
          {shop.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.image_url}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-lacquer/40 text-2xl">
              麺
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-[family-name:var(--font-display)] text-lg tracking-wide text-ink transition group-hover:text-lacquer">
            {shop.name}
          </h3>
          <p className="mt-1 truncate text-sm text-ink-muted">
            {[shop.genre, shop.budget].filter(Boolean).join(" · ") || "ジャンル未設定"}
          </p>
          <p className="mt-1 truncate text-sm text-ink-muted/80">
            {shop.address ?? "住所情報なし"}
          </p>
        </div>
      </Link>
    </li>
  );
}
