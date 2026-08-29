import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { AREA_LABELS, getShopById } from "@/lib/shops";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const shop = await getShopById(id);
  if (!shop) return { title: "店舗が見つかりません" };
  return {
    title: shop.name,
    description: `${shop.name}の住所・営業時間・アクセス情報。`,
  };
}

export default async function ShopDetailPage({ params }: Props) {
  const { id } = await params;
  const shop = await getShopById(id);
  if (!shop) notFound();

  const mapsUrl =
    shop.lat != null && shop.lng != null
      ? `https://www.google.com/maps?q=${shop.lat},${shop.lng}`
      : shop.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`
        : null;

  const areaLabel = shop.large_area_code
    ? (AREA_LABELS[shop.large_area_code] ?? shop.large_area_code)
    : null;

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/#shops"
        className="text-sm text-ink-muted transition hover:text-lacquer"
      >
        ← 一覧へ戻る
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm tracking-wide text-lacquer">
            {[areaLabel, shop.genre].filter(Boolean).join(" / ") || "ラーメン"}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-snug tracking-wide sm:text-4xl">
            {shop.name}
          </h1>
          {shop.budget && (
            <p className="mt-3 text-sm text-ink-muted">予算目安: {shop.budget}</p>
          )}

          <dl className="mt-8 space-y-5 border-t border-line pt-8 text-sm">
            <DetailRow label="住所" value={shop.address} />
            <DetailRow label="アクセス" value={shop.access} />
            <DetailRow label="営業時間" value={shop.open_hours} />
            <DetailRow label="定休日" value={shop.close_days} />
            <DetailRow label="電話" value={shop.phone} />
            <DetailRow
              label="データ出典"
              value={
                shop.data_source === "hotpepper"
                  ? "ホットペッパーグルメ"
                  : shop.data_source
              }
            />
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            {shop.shop_url && (
              <a
                href={shop.shop_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-lacquer px-5 py-3 text-sm font-medium text-steam transition hover:bg-lacquer-deep"
              >
                HotPepperで見る
              </a>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-ink/20 bg-steam px-5 py-3 text-sm transition hover:border-lacquer hover:text-lacquer"
              >
                地図を開く
              </a>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="aspect-[4/3] overflow-hidden bg-bg-deep">
            {shop.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.image_url}
                alt={shop.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-[family-name:var(--font-display)] text-5xl text-lacquer/30">
                麺
              </div>
            )}
          </div>

          {shop.lat != null && shop.lng != null && (
            <iframe
              title={`${shop.name}の地図`}
              className="h-64 w-full border-0 bg-bg-deep"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${shop.lat},${shop.lng}&z=16&output=embed`}
            />
          )}

          <AdSenseSlot slot="shop-detail" />
        </div>
      </div>
    </article>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_1fr]">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="leading-relaxed text-ink">{value || "—"}</dd>
    </div>
  );
}
