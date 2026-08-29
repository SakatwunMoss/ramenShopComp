import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--ink)] text-[var(--paper)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group block">
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide transition-opacity group-hover:opacity-90 sm:text-3xl">
            麺くらべ
          </p>
          <p className="mt-0.5 text-[11px] tracking-[0.2em] text-[var(--paper-dim)] uppercase">
            Ramen Compare
          </p>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[var(--paper-dim)]">
          <Link href="/" className="transition-colors hover:text-[var(--paper)]">
            店舗を探す
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface-muted)]">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-[var(--muted)] sm:px-6">
        <p className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          麺くらべ
        </p>
        <p className="mt-2 max-w-xl leading-relaxed">
          掲載店舗はホットペッパーグルメに登録されている店舗が中心です。個人経営の小規模店など、網羅しきれない場合があります。
        </p>
        <p className="mt-4 text-xs">
          © {new Date().getFullYear()} 麺くらべ · Powered by HotPepper Gourmet
          Search API
        </p>
      </div>
    </footer>
  );
}
