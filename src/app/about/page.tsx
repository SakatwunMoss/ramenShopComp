import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "このサイトについて",
  description:
    "Ramen Compare（ramen-compare）は全国のラーメン店をエリア・系統で比較・検索するサイトです。データの出典や掲載範囲について説明します。",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
        このサイトについて
      </h1>
      <div
        lang="ja"
        className="mt-8 space-y-6 text-sm leading-relaxed text-ink-muted sm:text-base"
      >
        <p>
          <span className="text-ink">Ramen Compare</span>{" "}
          は、全国のラーメン店をエリアや系統（味噌・醤油・豚骨など）で比較・検索するための個人開発サイトです。
        </p>
        <p>
          店舗データはリクルートのホットペッパーグルメ Webサービスから取得しています。掲載対象はホットペッパーグルメに公開されている店舗に限られるため、個人経営の小規模店などは含まれない場合があります。将来的には他のデータソース追加も想定した設計にしています。
        </p>
        <p>
          表示情報の正確性・最新性については、各店舗の公式情報やホットペッパーグルメのページをご確認ください。
        </p>
      </div>

      <hr className="mt-12 border-ink/10" />

      <section lang="en" className="mt-10">
        <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide sm:text-2xl">
          English
        </h2>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink-muted sm:text-base">
          <p>
            Ramen Compare is an independently run site for comparing and
            searching ramen shops across Japan by area and style (miso, shoyu,
            tonkotsu, and more). Shop data comes from Recruit’s Hot Pepper
            Gourmet Web Service; listings are limited to shops published there,
            and the site includes a “Powered by Hot Pepper Gourmet Web Service”
            attribution. Accuracy and currency of displayed information should
            be checked on each shop’s official sources or Hot Pepper Gourmet.
          </p>
        </div>
      </section>
    </div>
  );
}
