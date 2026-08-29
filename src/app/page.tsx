import Image from "next/image";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { ShopCompareGrid } from "@/components/ShopCompareGrid";
import { ShopFilters } from "@/components/ShopFilters";
import { getDb } from "@/lib/db";
import { listLargeAreas, listShops } from "@/lib/shops";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  area?: string;
  style?: string;
  q?: string;
  scope?: string;
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const ramenOnly = params.scope !== "all";
  const db = await getDb();
  const hasDb = Boolean(db);
  const [shops, areas] = await Promise.all([
    listShops({
      area: params.area,
      style: params.style,
      q: params.q,
      ramenOnly,
    }),
    listLargeAreas({ ramenOnly }),
  ]);

  return (
    <>
      <section className="relative isolate min-h-[min(100svh,40rem)] overflow-hidden sm:min-h-[min(100svh,44rem)]">
        <Image
          src="/hero-ramen.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] animate-[hero-zoom_18s_ease-in-out_infinite_alternate]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-hero-shade/80 via-[#c47868]/45 to-[#e88976]/15"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-hero-shade/55 via-transparent to-[#ffb5a3]/20"
        />

        <div className="relative mx-auto flex min-h-[min(100svh,40rem)] max-w-6xl flex-col justify-end px-4 pb-14 pt-24 sm:min-h-[min(100svh,44rem)] sm:px-6 sm:pb-16">
          <p className="animate-rise font-[family-name:var(--font-display)] text-5xl leading-none tracking-wide text-steam sm:text-7xl md:text-8xl">
            <span className="text-[#ffb4a4]">Ramen</span> Compare
          </p>
          <h1 className="animate-rise-delay mt-5 max-w-xl text-xl font-medium leading-relaxed text-steam sm:text-2xl">
            全国のラーメン店を、エリアと系統でくらべる。
          </h1>
          <p className="animate-rise-delay mt-3 max-w-md text-sm leading-relaxed text-steam/80 sm:text-base">
            気になる店を選んで横並び比較。次に行く一杯を、迷わず決める。
          </p>
          <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
            <a
              href="#shops"
              className="bg-lacquer px-6 py-3 text-sm font-medium text-steam transition hover:bg-lacquer-deep"
            >
              店舗を探す
            </a>
            <a
              href="/about"
              className="border border-steam/40 bg-steam/15 px-6 py-3 text-sm text-steam backdrop-blur-sm transition hover:border-steam/80 hover:bg-steam/25"
            >
              データの出典について
            </a>
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
                最大3店舗まで選んでくらべられます
              </p>
            </div>
            <p className="text-sm text-ink-muted">{shops.length} 件表示</p>
          </div>

          <ShopFilters
            areas={areas}
            currentArea={params.area}
            currentStyle={params.style}
            currentQ={params.q}
            currentScope={ramenOnly ? "ramen" : "all"}
          />

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

          <AdSenseSlot className="mt-12" slot="home-bottom" />
        </section>
      </div>
    </>
  );
}
