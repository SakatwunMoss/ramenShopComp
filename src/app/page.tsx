import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { JsonLd } from "@/components/JsonLd";
import { Pagination } from "@/components/Pagination";
import { ShopCompareGrid } from "@/components/ShopCompareGrid";
import { ShopFilters } from "@/components/ShopFilters";
import {
  buildBreadcrumbNode,
  buildItemListNode,
  buildJsonLdGraph,
} from "@/lib/json-ld";
import { getDb } from "@/lib/db";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_DESCRIPTION, SHOPS_PAGE_SIZE } from "@/lib/site";
import { getAreaLabel, listLargeAreas, listShopsPaginated } from "@/lib/shops";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  area?: string;
  style?: string;
  q?: string;
  scope?: string;
  page?: string;
}>;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "全国ラーメン店比較｜エリア・系統でくらべる",
    description: SITE_DESCRIPTION,
    path: "/",
    absoluteTitle: true,
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const ramenOnly = params.scope !== "all";
  const page = Math.max(1, Number(params.page) || 1);
  const db = await getDb();
  const hasDb = Boolean(db);

  const [paginated, areas, selectedAreaLabel] = await Promise.all([
    listShopsPaginated(
      {
        area: params.area,
        style: params.style,
        q: params.q,
        ramenOnly,
      },
      page,
      SHOPS_PAGE_SIZE,
    ),
    listLargeAreas({ ramenOnly }),
    params.area ? getAreaLabel(params.area) : Promise.resolve(null),
  ]);

  const { shops, total, totalPages } = paginated;

  const jsonLd = buildJsonLdGraph([
    buildBreadcrumbNode([{ name: "トップ", path: "/" }]),
    buildItemListNode(shops, "/", "全国のラーメン店一覧"),
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <section>
        <div className="relative isolate aspect-[1584/672] w-full overflow-hidden">
          <Image
            src="/hero-ramen.png"
            alt="ラーメンの湯気と丼ぶり"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center animate-[hero-zoom_18s_ease-in-out_infinite_alternate]"
          />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <p className="animate-rise font-[family-name:var(--font-display)] text-2xl leading-none tracking-wide text-ink sm:text-5xl md:text-6xl">
            <span className="text-lacquer">Ramen</span> Compare
          </p>
          <h1 className="animate-rise-delay mt-1.5 max-w-xl text-xs font-medium leading-snug text-ink sm:mt-3 sm:text-lg md:text-xl">
            全国のラーメン店を、エリアと系統でくらべる。
          </h1>
          <p className="animate-rise-delay mt-1 hidden max-w-md text-sm leading-relaxed text-ink-muted sm:mt-2 sm:block">
            気になる店を選んで横並び比較。次に行く一杯を、迷わず決める。
          </p>
          <div className="animate-rise-delay mt-2.5 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
            <a
              href="#shops"
              className="bg-lacquer px-3.5 py-1.5 text-xs font-medium text-steam transition hover:bg-lacquer-deep sm:px-6 sm:py-2.5 sm:text-sm"
            >
              店舗を探す
            </a>
            <Link
              href="/areas"
              className="border border-line bg-steam px-3.5 py-1.5 text-xs text-ink transition hover:border-lacquer/40 hover:bg-bg sm:px-6 sm:py-2.5 sm:text-sm"
            >
              エリアから探す
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdSenseSlot className="my-10" slot="home-top" />

        <section id="shops" className="scroll-mt-20 pb-16">
          <div className="mb-2 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
                店舗一覧
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {total > 0
                  ? `${total.toLocaleString("ja-JP")} 件のラーメン店から最大3店舗まで選んでくらべられます`
                  : "最大3店舗まで選んでくらべられます"}
              </p>
            </div>
            <p className="text-sm text-ink-muted">
              {shops.length} 件表示
              {totalPages > 1 ? `（${page}/${totalPages}）` : ""}
            </p>
          </div>

          <ShopFilters
            areas={areas}
            currentArea={params.area}
            currentAreaName={selectedAreaLabel ?? undefined}
            currentStyle={params.style}
            currentQ={params.q}
            currentScope={ramenOnly ? "ramen" : "all"}
          />

          {areas.length > 0 && (
            <p className="mt-4 text-sm text-ink-muted">
              エリア別の一覧は{" "}
              <Link href="/areas" className="text-lacquer underline-offset-2 hover:underline">
                エリアから探す
              </Link>
              からも閲覧できます。
            </p>
          )}

          {!hasDb && (
            <p className="mt-8 border border-line bg-steam/80 px-4 py-6 text-sm leading-relaxed text-ink-muted">
              Cloudflare D1 に接続できません。
              <code className="text-lacquer">
                npx wrangler d1 create ramen-compare
              </code>{" "}
              で DB を作り、
              <code className="text-lacquer">wrangler.toml</code> の database_id
              を更新したうえで{" "}
              <code className="text-lacquer">
                npx wrangler d1 migrations apply DB --local
              </code>{" "}
              と{" "}
              <code className="text-lacquer">
                npm run fetch-shops -- --area=Z011
              </code>{" "}
              を実行してください。
            </p>
          )}

          {hasDb && shops.length === 0 && (
            <p className="mt-8 text-sm text-ink-muted">
              条件に一致する店舗がありません。「対象」を「キーワード該当すべて」にするか、別エリアを取り込んでください。
            </p>
          )}

          {shops.length > 0 && <ShopCompareGrid shops={shops} />}

          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/#shops"
            searchParams={{
              area: params.area,
              style: params.style,
              q: params.q,
              scope: params.scope,
            }}
          />

          <AdSenseSlot className="mt-12" slot="home-bottom" />
        </section>
      </div>
    </>
  );
}
