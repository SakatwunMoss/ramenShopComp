import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompareTable } from "@/components/CompareTable";
import {
  comparePagePath,
  MAX_COMPARE,
  parseCompareIds,
} from "@/lib/compare";
import { getDb } from "@/lib/db";
import { getShopsByIds } from "@/lib/shops";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ ids?: string | string[] }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const ids = parseCompareIds((await searchParams).ids);
  const count = ids.length;

  return {
    title: "店舗比較",
    description:
      count > 0
        ? `選択した${count}店舗をジャンル・予算・営業時間などで横並び比較。`
        : "選択したラーメン店をジャンル・予算・営業時間などで横並び比較。",
    alternates: {
      canonical: comparePagePath(ids),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ComparePage({ searchParams }: PageProps) {
  const ids = parseCompareIds((await searchParams).ids);

  if (ids.length === 0 || ids.length > MAX_COMPARE) {
    notFound();
  }

  const db = await getDb();
  if (!db) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
          店舗比較
        </h1>
        <p className="mt-6 border border-line bg-steam/80 px-4 py-6 text-sm leading-relaxed text-ink-muted">
          Cloudflare D1 に接続できません。ローカルで DB を用意してから再度お試しください。
        </p>
      </div>
    );
  }

  const shops = await getShopsByIds(ids);

  if (shops.length === 0 || shops.length !== ids.length) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="mb-6">
        <Link
          href="/#shops"
          className="text-sm text-ink-muted transition hover:text-lacquer"
        >
          ← 一覧へ戻る
        </Link>
      </p>

      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
          店舗比較
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {shops.length} 店舗を比較中
        </p>
      </header>

      <CompareTable shops={shops} />

      <p className="mt-6 text-xs text-ink-muted/70">
        ※営業時間・定休日などは変動する場合があります。来店前に各店舗の最新情報をご確認ください。
      </p>
    </div>
  );
}
