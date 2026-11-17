import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import {
  buildBreadcrumbNode,
  buildJsonLdGraph,
} from "@/lib/json-ld";
import { buildPageMetadata } from "@/lib/seo";
import {
  appendEnglishMeta,
  appendEnglishSentence,
} from "@/lib/seo-en";
import { listLargeAreas } from "@/lib/shops";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const areas = await listLargeAreas({ ramenOnly: true });
  const total = areas.reduce((sum, a) => sum + a.count, 0);
  const descriptionJa =
    total > 0
      ? `全国 ${areas.length} エリア・合計 ${total.toLocaleString("ja-JP")} 件のラーメン店をエリア別に探せます。都道府県・地方から比較一覧へ。`
      : "全国のラーメン店をエリア別に探せます。都道府県・地方から比較一覧へ。";

  return buildPageMetadata({
    title: appendEnglishMeta(
      "エリアからラーメン店を探す",
      "Find ramen shops by area in Japan",
    ),
    description: appendEnglishSentence(
      descriptionJa,
      "Browse ramen shops across Japan by prefecture and city.",
    ),
    path: "/areas",
  });
}

export default async function AreasIndexPage() {
  const areas = await listLargeAreas({ ramenOnly: true });
  const total = areas.reduce((sum, a) => sum + a.count, 0);

  const crumbs = [
    { name: "トップ", path: "/" },
    { name: "エリア一覧", path: "/areas" },
  ];

  const jsonLd = buildJsonLdGraph([buildBreadcrumbNode(crumbs)]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={crumbs} />

      <header className="mt-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
          エリアからラーメン店を探す
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
          {total > 0
            ? `掲載中のラーメン店は合計 ${total.toLocaleString("ja-JP")} 件（${areas.length} エリア）。気になるエリアを選ぶと、店舗一覧と比較に進めます。`
            : "エリア別のラーメン店一覧です。データ取り込み後に件数が表示されます。"}
        </p>
      </header>

      {areas.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">
          表示できるエリアがありません。店舗データの取り込み後に再度お試しください。
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <li key={area.code}>
              <Link
                href={`/areas/${area.code}`}
                className="flex items-baseline justify-between gap-3 border border-line bg-steam/70 px-4 py-4 transition hover:border-lacquer/50 hover:bg-steam"
              >
                <span className="font-[family-name:var(--font-display)] text-lg tracking-wide">
                  {area.name}
                </span>
                <span className="text-sm text-ink-muted">
                  {area.count.toLocaleString("ja-JP")} 件
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-sm text-ink-muted">
        <Link href="/#shops" className="text-lacquer underline-offset-2 hover:underline">
          全国の店舗一覧へ
        </Link>
      </p>
    </div>
  );
}
