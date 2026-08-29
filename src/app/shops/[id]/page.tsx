import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { ShopImage } from "@/components/ShopImage";
import {
  buildBreadcrumbNode,
  buildJsonLdGraph,
  buildRestaurantNode,
  type BreadcrumbItem,
} from "@/lib/json-ld";
import {
  areaLargePath,
  areaMiddlePath,
  buildPageMetadata,
  shopDetailPath,
  shopOgImage,
} from "@/lib/seo";
import {
  AREA_LABELS,
  getAreaLabel,
  getShopById,
} from "@/lib/shops";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const shop = await getShopById(id);
  if (!shop) return { title: "店舗が見つかりません" };

  const areaLabel = shop.large_area_code
    ? (AREA_LABELS[shop.large_area_code] ??
      (await getAreaLabel(shop.large_area_code)) ??
      shop.large_area_code)
    : null;

  const title = areaLabel
    ? `${shop.name} - ${areaLabel}のラーメン店`
    : `${shop.name}のラーメン店情報`;

  const descriptionParts = [
    `${shop.name}の住所・営業時間・アクセス情報。`,
    areaLabel ? `${areaLabel}のラーメン店を比較できます。` : null,
    shop.genre ? `ジャンル: ${shop.genre}。` : null,
    shop.budget ? `予算目安: ${shop.budget}。` : null,
  ].filter(Boolean);

  return buildPageMetadata({
    title,
    description: descriptionParts.join(""),
    path: shopDetailPath(shop.id),
    image: shopOgImage(shop),
    imageAlt: `${shop.name}の店舗画像`,
  });
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

  const largeLabel = shop.large_area_code
    ? (AREA_LABELS[shop.large_area_code] ??
      (await getAreaLabel(shop.large_area_code)) ??
      shop.large_area_code)
    : null;
  const middleLabel = shop.middle_area_code
    ? ((await getAreaLabel(shop.middle_area_code)) ?? shop.middle_area_code)
    : null;

  const crumbs: BreadcrumbItem[] = [{ name: "トップ", path: "/" }];
  if (shop.large_area_code && largeLabel) {
    crumbs.push({
      name: largeLabel,
      path: areaLargePath(shop.large_area_code),
    });
  }
  if (shop.large_area_code && shop.middle_area_code && middleLabel) {
    crumbs.push({
      name: middleLabel,
      path: areaMiddlePath(shop.large_area_code, shop.middle_area_code),
    });
  }
  crumbs.push({ name: shop.name, path: shopDetailPath(shop.id) });

  const path = shopDetailPath(shop.id);
  const jsonLd = buildJsonLdGraph([
    buildRestaurantNode(shop, path),
    buildBreadcrumbNode(crumbs),
  ]);

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm tracking-wide text-lacquer">
            {[largeLabel, middleLabel, shop.genre].filter(Boolean).join(" / ") ||
              "ラーメン"}
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

          {shop.large_area_code && largeLabel && (
            <p className="mt-8 text-sm text-ink-muted">
              <Link
                href={areaLargePath(shop.large_area_code)}
                className="text-lacquer underline-offset-2 hover:underline"
              >
                {largeLabel}のラーメン店一覧
              </Link>
              {shop.middle_area_code && middleLabel ? (
                <>
                  {" · "}
                  <Link
                    href={areaMiddlePath(
                      shop.large_area_code,
                      shop.middle_area_code,
                    )}
                    className="text-lacquer underline-offset-2 hover:underline"
                  >
                    {middleLabel}の一覧
                  </Link>
                </>
              ) : null}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div className="relative aspect-[4/3] overflow-hidden bg-bg-deep">
            <ShopImage
              src={shop.image_url}
              alt={`${shop.name}の店舗画像`}
              width={800}
              height={600}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
              priority
            />
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
