import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-steam/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg tracking-wide text-ink">
          <span className="text-lacquer">Ramen</span> Compare
        </Link>
        <nav className="flex items-center gap-5 text-sm text-ink-muted">
          <Link href="/#shops" className="transition hover:text-lacquer">
            店舗一覧
          </Link>
          <Link
            href="/diagnose"
            className="inline-flex items-baseline gap-1.5 transition hover:text-lacquer"
          >
            <span lang="ja">好み診断</span>
            <span
              lang="en"
              className="text-[10px] text-ink-muted/80 normal-case tracking-normal sm:text-[11px]"
            >
              Quiz
            </span>
          </Link>
          <Link href="/areas" className="transition hover:text-lacquer">
            エリアから探す
          </Link>
          <Link href="/about" className="transition hover:text-lacquer">
            このサイトについて
          </Link>
        </nav>
      </div>
    </header>
  );
}
