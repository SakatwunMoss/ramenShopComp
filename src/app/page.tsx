import { AdSenseSlot } from "@/components/AdSenseSlot";
import { ShopFilters } from "@/components/ShopFilters";
import { ShopListItem } from "@/components/ShopListItem";
import { listLargeAreas, listShops } from "@/lib/shops";

type SearchParams = Promise<{
  area?: string;
  style?: string;
  q?: string;
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const [shops, areas] = await Promise.all([
    listShops({
      area: params.area,
      style: params.style,
      q: params.q,
    }),
    listLargeAreas(),
  ]);

  const hasDb = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="steam-blob pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-lacquer/10 blur-3xl"
        />
        <div
          aria-hidden
          className="steam-blob pointer-events-none absolute right-0 top-24 h-56 w-56 rounded-full bg-ink/5 blur-3xl"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <p className="animate-rise font-[family-name:var(--font-display)] text-5xl leading-none tracking-wide text-ink sm:text-7xl md:text-8xl">
            <span className="text-lacquer">麺</span>くらべ
          </p>
          <h1 className="animate-rise-delay mt-6 max-w-xl text-xl font-medium leading-relaxed text-ink sm:text-2xl">
            全国のラーメン店を、エリアと系統でくらべる。
          </h1>
          <p className="animate-rise-delay mt-4 max-w-lg text-sm leading-relaxed text-ink-muted sm:text-base">
            HotPepper掲載店を横断検索。次の一杯を、迷わず決めるための比較サイトです。
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
              className="border border-ink/20 bg-steam/70 px-6 py-3 text-sm text-ink transition hover:border-lacquer hover:text-lacquer"
            >
              データの出典について
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdSenseSlot className="mb-10" slot="home-top" />

        <section id="shops" className="scroll-mt-20 pb-16">
          <div className="mb-2 flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
              店舗一覧
            </h2>
            <p className="text-sm text-ink-muted">{shops.length} 件表示</p>
          </div>

          <ShopFilters
            areas={areas}
            currentArea={params.area}
            currentStyle={params.style}
            currentQ={params.q}
          />

          {!hasDb && (
            <p className="mt-8 border border-line bg-steam/80 px-4 py-6 text-sm leading-relaxed text-ink-muted">
              Supabase の環境変数が未設定です。.env.local に
              NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
              を設定し、マイグレーション実行後に{" "}
              <code className="text-lacquer">npm run fetch-shops</code>{" "}
              で店舗データを取り込んでください。
            </p>
          )}

          {hasDb && shops.length === 0 && (
            <p className="mt-8 text-sm text-ink-muted">
              条件に一致する店舗がありません。バッチ未実行の場合は{" "}
              <code className="text-lacquer">npm run fetch-shops -- --area=Z011</code>{" "}
              から始めてください。
            </p>
          )}

          {shops.length > 0 && (
            <ul className="mt-2">
              {shops.map((shop) => (
                <ShopListItem key={shop.id} shop={shop} />
              ))}
            </ul>
          )}

          <AdSenseSlot className="mt-12" slot="home-bottom" />
        </section>
      </div>
    </>
  );
}
