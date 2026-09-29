import Link from "next/link";
import { ShopImage } from "@/components/ShopImage";
import { areaLargePath, shopDetailPath } from "@/lib/seo";
import type { Shop } from "@/lib/types";
import { AREA_LABELS } from "@/lib/shops";

type CompareConfig = {
  selectedIds: string[];
  onToggle: (shop: Shop) => void;
};

type ShopGridProps = {
  shops: Shop[];
  compare: CompareConfig;
  /** 診断結果のマッチ理由（一致タグ）。空・未指定の店は非表示 */
  matchReasonsById?: Record<string, string[]>;
};

export function ShopGrid({
  shops,
  compare,
  matchReasonsById,
}: ShopGridProps) {
  return (
    <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {shops.map((shop) => {
        const isSelected = compare.selectedIds.includes(shop.id);
        const detailHref = shopDetailPath(shop.id);
        const areaLabel = shop.large_area_code
          ? (AREA_LABELS[shop.large_area_code] ?? shop.large_area_code)
          : null;
        const matchReasons = matchReasonsById?.[shop.id]?.filter(Boolean) ?? [];

        return (
          <li key={shop.id}>
            <article
              className={[
                "group relative flex h-full cursor-pointer flex-col border border-line bg-steam/70",
                "transition duration-300",
                "hover:border-lacquer hover:bg-steam hover:shadow-[0_10px_28px_rgba(28,20,16,0.10)]",
                "has-[a[data-shop-detail]:active]:scale-[0.99] has-[a[data-shop-detail]:active]:border-lacquer has-[a[data-shop-detail]:active]:bg-steam",
                "has-[a[data-shop-detail]:focus-visible]:ring-2 has-[a[data-shop-detail]:focus-visible]:ring-lacquer has-[a[data-shop-detail]:focus-visible]:ring-offset-2 has-[a[data-shop-detail]:focus-visible]:ring-offset-bg",
              ].join(" ")}
            >
              <div className="relative z-10 border-b border-line bg-bg/40 px-4 py-3">
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

              <div className="relative h-44 overflow-hidden bg-bg-deep">
                <ShopImage
                  src={shop.image_url}
                  alt={`${shop.name}の店舗画像`}
                  width={400}
                  height={176}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-[family-name:var(--font-display)] text-lg leading-snug tracking-wide text-ink transition group-hover:text-lacquer group-hover:underline group-hover:decoration-lacquer/60 group-hover:underline-offset-4">
                  {shop.name}
                </h3>
                {matchReasons.length > 0 ? (
                  <p className="mt-2 text-sm">
                    <span className="text-ink-muted/70">マッチ理由</span>
                    <span className="mt-0.5 block text-lacquer">
                      {matchReasons.join(" / ")}
                    </span>
                  </p>
                ) : null}
                <dl className="mt-3 space-y-1 text-sm text-ink-muted">
                  {areaLabel ? (
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-ink-muted/70">エリア</dt>
                      <dd>
                        {shop.large_area_code ? (
                          <Link
                            href={areaLargePath(shop.large_area_code)}
                            className="relative z-10 hover:text-lacquer"
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

                <Link
                  href={detailHref}
                  data-shop-detail
                  aria-label={`${shop.name}の詳細を見る`}
                  className={[
                    "mt-4 inline-flex min-h-11 items-center justify-between gap-2 bg-lacquer px-4 py-2.5 text-steam",
                    "transition duration-200 hover:bg-lacquer-deep active:bg-lacquer-deep",
                    "focus-visible:outline-none",
                    "after:absolute after:inset-0 after:z-[1] after:content-['']",
                  ].join(" ")}
                >
                  <span className="relative z-[2] flex flex-col items-start leading-tight">
                    <span className="text-sm font-medium">詳細を見る</span>
                    <span
                      lang="en"
                      className="text-[11px] font-normal text-steam/80 sm:text-xs"
                    >
                      View details
                    </span>
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="relative z-[2] h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
