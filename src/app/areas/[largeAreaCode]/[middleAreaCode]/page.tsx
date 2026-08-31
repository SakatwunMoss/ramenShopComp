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
import {
  areaLargePath,
  areaMiddlePath,
  buildPageMetadata,
} from "@/lib/seo";
import {
  appendEnglishMeta,
  appendEnglishSentence,
  areaJaWithEn,
  largeAreaEn,
  middleAreaEn,
} from "@/lib/seo-en";
import { SHOPS_PAGE_SIZE } from "@/lib/site";
import {
  AREA_LABELS,
  buildAreaIntro,
  getAreaLabel,
  listGenreTrends,
  listMiddleAreas,
  listShopsPaginated,
} from "@/lib/shops";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ largeAreaCode: string; middleAreaCode: string }>;
  searchParams: Promise<{ page?: string }>;
};

async function resolveLargeName(code: string): Promise<string> {
  return AREA_LABELS[code] ?? (await getAreaLabel(code)) ?? code;
}

async function resolveMiddleName(code: string): Promise<string> {
  return (await getAreaLabel(code)) ?? code;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { largeAreaCode, middleAreaCode } = await params;
  const [largeName, middleName, paginated, genres] = await Promise.all([
    resolveLargeName(largeAreaCode),
    resolveMiddleName(middleAreaCode),
    listShopsPaginated(
      {
        area: largeAreaCode,
        middleArea: middleAreaCode,
        ramenOnly: true,
      },
      1,
      1,
    ),
    listGenreTrends(
      {
        area: largeAreaCode,
        middleArea: middleAreaCode,
        ramenOnly: true,
      },
      3,
    ),
  ]);

  if (paginated.total === 0) {
    return { title: "エリアが見つかりません" };
  }

  const genreHint =
    genres.length > 0
      ? `主なジャンルは${genres.map((g) => g.genre).join("、")}など。`
      : "";
  const largeEn = largeAreaEn(largeAreaCode);
  const middleEn = middleAreaEn(middleAreaCode, middleName);
  const locationEn = middleEn
    ? largeEn
      ? `${middleEn}, ${largeEn}`
      : middleEn
    : largeEn;
  const titleEn = middleEn
    ? `Ramen near ${middleEn}`
    : largeEn
      ? `Ramen shops in ${largeEn}`
      : "Ramen shops in Japan";
  const descLocation = locationEn
    ? areaJaWithEn(`${largeName}・${middleName}`, locationEn)
    : `${largeName}・${middleName}`;

  return buildPageMetadata({
    title: appendEnglishMeta(
      `${middleName}のラーメン店一覧・比較`,
      titleEn,
    ),
    description: appendEnglishSentence(
      `${descLocation}のラーメン店を ${paginated.total.toLocaleString("ja-JP")} 件掲載。${genreHint}系統や予算で絞り込んで比較できます。`,
      locationEn
        ? `Compare ramen shops near ${locationEn}.`
        : "Compare ramen shops in Japan by area and style.",
    ),
    path: areaMiddlePath(largeAreaCode, middleAreaCode),
  });
}

export default async function MiddleAreaPage({
  params,
  searchParams,
}: Props) {
  const { largeAreaCode, middleAreaCode } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);

  const [largeName, middleName, paginated, genres, siblingMiddles] =
    await Promise.all([
      resolveLargeName(largeAreaCode),
      resolveMiddleName(middleAreaCode),
      listShopsPaginated(
        {
          area: largeAreaCode,
          middleArea: middleAreaCode,
          ramenOnly: true,
        },
        page,
        SHOPS_PAGE_SIZE,
      ),
      listGenreTrends(
        {
          area: largeAreaCode,
          middleArea: middleAreaCode,
          ramenOnly: true,
        },
        5,
      ),
      listMiddleAreas(largeAreaCode, { ramenOnly: true }),
    ]);

  if (paginated.total === 0) {
    notFound();
  }

  const path = areaMiddlePath(largeAreaCode, middleAreaCode);
  const crumbs = [
    { name: "トップ", path: "/" },
    { name: "エリア一覧", path: "/areas" },
    { name: largeName, path: areaLargePath(largeAreaCode) },
    { name: middleName, path },
  ];

  const intro = buildAreaIntro({
    areaName: middleName,
    shopCount: paginated.total,
    genres,
    parentName: largeName,
  });

  const jsonLd = buildJsonLdGraph([
    buildBreadcrumbNode(crumbs),
    buildItemListNode(
      paginated.shops,
      path,
      `${middleName}のラーメン店一覧`,
    ),
  ]);

  const related = siblingMiddles
    .filter((a) => a.code !== middleAreaCode)
    .slice(0, 16)
    .map((a) => ({
      code: a.code,
      name: a.name,
      count: a.count,
      href: areaMiddlePath(largeAreaCode, a.code),
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />

      <header className="mt-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
          {middleName}のラーメン店一覧・比較
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
          {intro}
        </p>
      </header>

      <AdSenseSlot className="my-8" slot="area-middle" />

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

      <RelatedAreas
        title={`${largeName}のほかのエリア`}
        areas={related}
      />

      <p className="mt-8 text-sm text-ink-muted">
        <Link
          href={areaLargePath(largeAreaCode)}
          className="text-lacquer underline-offset-2 hover:underline"
        >
          {largeName}全体の一覧へ
        </Link>
        {" · "}
        <Link href="/areas" className="text-lacquer underline-offset-2 hover:underline">
          エリア一覧へ
        </Link>
      </p>
    </div>
  );
}
