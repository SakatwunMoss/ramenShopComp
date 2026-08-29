import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        ページが見つかりません
      </h1>
      <p className="text-sm text-ink-muted">
        指定された店舗またはページは存在しないか、削除された可能性があります。
      </p>
      <Link href="/" className="text-sm text-lacquer hover:underline">
        トップへ戻る
      </Link>
    </div>
  );
}
