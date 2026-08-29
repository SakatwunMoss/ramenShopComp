import Link from "next/link";
import { ShopImage } from "@/components/ShopImage";
import type { Shop } from "@/lib/types";
import { AREA_LABELS } from "@/lib/shops";

type CompareConfig = {
  selectedIds: string[];
  onToggle: (shop: Shop) => void;
};

type ShopGridProps = {
  shops: Shop[];
  compare: CompareConfig;
};

export function ShopGrid({ shops, compare }: ShopGridProps) {
  return (
    <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {shops.map((shop) => {
        const isSelected = compare.selectedIds.includes(shop.id);
        const detailHref = `/shops/${shop.id}`;
        const areaLabel = shop.large_area_code
          ? (AREA_LABELS[shop.large_area_code] ?? shop.large_area_code)
          : null;

        return (
          <li key={shop.id}>
            <article className="group flex h-full flex-col overflow-hidden border border-line bg-steam/70 transition duration-300 hover:border-lacquer/50 hover:bg-steam">
              <div className="border-b border-line bg-bg/40 px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => compare.onToggle(shop)}
                    className="h-4 w-4 border-line text-lacquer accent-lacquer focus:ring-lacquer"
                  />
                  <span className="font-medium">
                    {isSelected ? "比較から外す" : "比較に追加"}
                  </span>
                </label>
              </div>

              <Link
                href={detailHref}
                className="relative block h-44 overflow-hidden bg-bg-deep"
              >
                <ShopImage
                  src={shop.image_url}
                  alt={`${shop.name}の店舗画像`}
                  width={400}
                  height={176}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug tracking-wide text-ink transition group-hover:text-lacquer">
                  <Link href={detailHref}>{shop.name}</Link>
                </h3>
                <dl className="mt-3 space-y-1 text-sm text-ink-muted">
                  {areaLabel ? (
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-ink-muted/70">エリア</dt>
                      <dd>
                        {shop.large_area_code ? (
                          <Link
                            href={`/areas/${shop.large_area_code}`}
                            className="hover:text-lacquer"
                          >
                            {areaLabel}
                          </Link>
                        ) : (
                          areaLabel
                        )}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-ink-muted/70">ジャンル</dt>
                    <dd className="truncate">{shop.genre ?? "—"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-ink-muted/70">予算</dt>
                    <dd>{shop.budget ?? "—"}</dd>
                  </div>
                </dl>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-muted/80">
                  {shop.address ?? "住所情報なし"}
                </p>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
