import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { CONTACT_EMAIL, SITE_DISPLAY_NAME } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "プライバシーポリシー",
  description:
    "Ramen Compare のプライバシーポリシー。取得情報、Cookie、アフィリエイト、データの出典について説明します。",
  path: "/privacy",
});

/** 改定日（内容を変えたらここを更新） */
const LAST_UPDATED = "2026-11-17";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
        プライバシーポリシー
      </h1>
      <p className="mt-3 text-sm text-ink-muted">改定日: {LAST_UPDATED}</p>

      <div
        lang="ja"
        className="mt-8 space-y-8 text-sm leading-relaxed text-ink-muted sm:text-base"
      >
        <section className="space-y-3">
          <h2 className="font-medium text-ink">1. 取得する情報と利用目的</h2>
          <p>
            {SITE_DISPLAY_NAME}
            （以下「当サイト」）では、サービス提供・改善および不正利用の防止のため、アクセスログ（IPアドレス、ブラウザ種別、参照元、閲覧ページなど）を取得・利用する場合があります。個人を特定する目的での利用は行いません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-ink">2. Cookie 等の利用</h2>
          <p>
            当サイトおよび第三者サービスは、Cookie
            などの類似技術を利用することがあります。ブラウザ設定により Cookie
            を無効化できますが、一部機能が利用できなくなる場合があります。
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-ink">Google Analytics</span>
              ：アクセス解析のため Cookie
              を利用します。オプトアウトは{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                className="text-lacquer underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Analytics オプトアウト アドオン
              </a>
              から行えます。
            </li>
            <li>
              <span className="text-ink">Google AdSense</span>
              ：広告配信のため Cookie
              を利用する場合があります（審査・導入状況により利用が変わります）。詳細・オプトアウトは{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                className="text-lacquer underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google の広告に関するポリシー
              </a>
              および{" "}
              <a
                href="https://adssettings.google.com/"
                className="text-lacquer underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                広告設定
              </a>
              をご確認ください。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-ink">3. アフィリエイト広告</h2>
          <p>
            当サイトはアフィリエイトプログラム（例:
            楽天アフィリエイト）を利用し、商品リンク経由の購入等について成果報酬を受け取る場合があります。表示価格は取得時点のものであり、実際の販売条件はリンク先でご確認ください。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-ink">4. 店舗データの出典</h2>
          <p>
            掲載店舗データはリクルートのホットペッパーグルメ Webサービスを利用しています。Powered
            by{" "}
            <a
              href="https://webservice.recruit.co.jp/"
              className="text-lacquer underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ホットペッパーグルメ Webサービス
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-ink">5. 免責事項</h2>
          <p>
            当サイトの情報は現状有姿で提供されます。店舗情報・商品情報・価格などの正確性・最新性・完全性について保証するものではありません。ご利用により生じた損害について、当サイトは責任を負いません。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-ink">6. お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは、次のメールアドレスまでご連絡ください。
          </p>
          <p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-lacquer underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-xs text-ink-muted/80">
            ※ プレースホルダです。運用開始時に実アドレスへ差し替えます。
          </p>
        </section>
      </div>

      <hr className="mt-12 border-ink/10" />

      <section lang="en" className="mt-10">
        <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide sm:text-2xl">
          Privacy Policy (English)
        </h2>
        <p className="mt-3 text-sm text-ink-muted">Last updated: {LAST_UPDATED}</p>
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink-muted sm:text-base">
          <p>
            {SITE_DISPLAY_NAME} may collect access logs (such as IP address,
            browser type, referrer, and pages viewed) to operate and improve the
            service and to prevent abuse. We do not use this data to identify
            individuals.
          </p>
          <p>
            Cookies and similar technologies may be used by this site and by
            third parties, including Google Analytics and (when enabled) Google
            AdSense. You can disable cookies in your browser settings; some
            features may stop working. See Google&apos;s opt-out tools for
            Analytics and ad settings linked in the Japanese section above.
          </p>
          <p>
            This site participates in affiliate programs (for example, Rakuten
            Affiliate). We may receive a commission when you purchase through
            product links. Prices shown are as of the time of data collection;
            please confirm current terms on the destination site.
          </p>
          <p>
            Shop listings are powered by Hot Pepper Gourmet Web Service. Content
            is provided as-is without warranty. For questions, contact{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-lacquer underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>

      <p className="mt-12 text-sm text-ink-muted">
        <Link
          href="/about"
          className="text-lacquer underline-offset-2 hover:underline"
        >
          このサイトについて
        </Link>
      </p>
    </div>
  );
}
