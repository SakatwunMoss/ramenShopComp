import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Pagination } from "@/components/Pagination";
import { RelatedAreas } from "@/components/RelatedAreas";
import { ShopCompareGrid } from "@/components/ShopCompareGrid";
import {
  buildBreadcrumbNode,
  buildItemListNode,
  buildJsonLdGraph,
} from "@/lib/json-ld";
import { areaLargePath, buildPageMetadata } from "@/lib/seo";
import { SHOPS_PAGE_SIZE } from "@/lib/site";
import {
  AREA_LABELS,
  buildAreaIntro,
  getAreaLabel,
  listGenreTrends,
  listLargeAreas,
  listMiddleAreas,
  listShopsPaginated,
} from "@/lib/shops";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ largeAreaCode: string }>;
  searchParams: Promise<{ page?: string }>;
};

async function resolveLargeName(code: string): Promise<string> {
  return (
    AREA_LABELS[code] ?? (await getAreaLabel(code)) ?? code
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { largeAreaCode } = await params;
  const name = await resolveLargeName(largeAreaCode);
  const { total } = await listShopsPaginated(
    { area: largeAreaCode, ramenOnly: true },
    1,
    1,
  );

  if (total === 0 && !AREA_LABELS[largeAreaCode]) {
    return { title: "エリアが見つかりません" };
  }

  const genres = await listGenreTrends(
    { area: largeAreaCode, ramenOnly: true },
    3,
  );
  const genreHint =
    genres.length > 0
      ? `主なジャンルは${genres.map((g) => g.genre).join("、")}など。`
      : "";

  return buildPageMetadata({
    title: `${name}のラーメン店一覧・比較`,
    description: `${name}のラーメン店を ${total.toLocaleString("ja-JP")} 件掲載。${genreHint}系統や予算で絞り込んで横並び比較できます。`,
    path: areaLargePath(largeAreaCode),
  });
}

export default async function LargeAreaPage({ params, searchParams }: Props) {
  const { largeAreaCode } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const areaName = await resolveLargeName(largeAreaCode);

  const [paginated, middleAreas, genres, siblingAreas] = await Promise.all([
    listShopsPaginated(
      { area: largeAreaCode, ramenOnly: true },
      page,
      SHOPS_PAGE_SIZE,
    ),
    listMiddleAreas(largeAreaCode, { ramenOnly: true }),
    listGenreTrends({ area: largeAreaCode, ramenOnly: true }, 5),
    listLargeAreas({ ramenOnly: true }),
  ]);

  if (paginated.total === 0) {
    notFound();
  }

  const path = areaLargePath(largeAreaCode);
  const crumbs = [
    { name: "トップ", path: "/" },
    { name: "エリア一覧", path: "/areas" },
    { name: areaName, path },
  ];

  const intro = buildAreaIntro({
    areaName,
    shopCount: paginated.total,
    genres,
  });

  const jsonLd = buildJsonLdGraph([
    buildBreadcrumbNode(crumbs),
    buildItemListNode(
      paginated.shops,
      path,
      `${areaName}のラーメン店一覧`,
    ),
  ]);

  const related = siblingAreas
    .filter((a) => a.code !== largeAreaCode)
    .slice(0, 12)
    .map((a) => ({
      code: a.code,
      name: a.name,
      count: a.count,
      href: areaLargePath(a.code),
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />

      <header className="mt-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
          {areaName}のラーメン店一覧・比較
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
          {intro}
        </p>
      </header>

      {middleAreas.length > 0 && (
        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide">
            {areaName}のエリアから絞り込む
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {middleAreas.map((area) => (
              <li key={area.code}>
                <Link
                  href={`/areas/${largeAreaCode}/${area.code}`}
                  className="inline-block border border-line bg-steam/80 px-3 py-1.5 text-sm transition hover:border-lacquer hover:text-lacquer"
                >
                  {area.name}
                  <span className="ml-1 text-ink-muted">({area.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AdSenseSlot className="my-8" slot="area-large" />

      <section className="pb-8">
        <div className="mb-2 flex items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
            店舗一覧
          </h2>
          <p className="text-sm text-ink-muted">
            {paginated.total.toLocaleString("ja-JP")} 件中{" "}
            {paginated.shops.length} 件表示
          </p>
        </div>
        <p className="mb-4 text-sm text-ink-muted">
          最大3店舗まで選んでくらべられます
        </p>

        {paginated.shops.length > 0 && (
          <ShopCompareGrid shops={paginated.shops} />
        )}

        <Pagination
          page={page}
          totalPages={paginated.totalPages}
          basePath={path}
        />
      </section>

      <RelatedAreas title="ほかのエリア" areas={related} />

      <p className="mt-8 text-sm text-ink-muted">
        <Link href="/areas" className="text-lacquer underline-offset-2 hover:underline">
          エリア一覧へ
        </Link>
        {" · "}
        <Link href="/#shops" className="text-lacquer underline-offset-2 hover:underline">
          全国の店舗一覧へ
        </Link>
      </p>
    </div>
  );
}
