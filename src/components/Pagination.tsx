import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  /** ページ番号以外のクエリ（page は上書き） */
  basePath: string;
  searchParams?: Record<string, string | undefined>;
};

function hrefFor(
  basePath: string,
  searchParams: Record<string, string | undefined> | undefined,
  page: number,
): string {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      if (value) params.set(key, value);
    }
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  const [path, existingHash] = basePath.split("#");
  const withQs = qs ? `${path}?${qs}` : path;
  return existingHash ? `${withQs}#${existingHash}` : withQs;
}

/** クロールしやすいよう、前後に加え番号リンクを浅く張る */
function pageWindow(current: number, total: number, radius = 2): number[] {
  const start = Math.max(1, current - radius);
  const end = Math.min(total, current + radius);
  const pages: number[] = [];
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (!pages.includes(1)) pages.unshift(1);
  if (!pages.includes(total) && total > 1) pages.push(total);
  return [...new Set(pages)].sort((a, b) => a - b);
}

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: Props) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;
  const windowPages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="ページネーション"
      className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-sm"
    >
      <p className="text-ink-muted">
        {page} / {totalPages} ページ
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {prev ? (
          <Link
            href={hrefFor(basePath, searchParams, prev)}
            className="border border-line bg-steam px-3 py-2 transition hover:border-lacquer hover:text-lacquer"
            rel="prev"
          >
            前へ
          </Link>
        ) : (
          <span className="border border-transparent px-3 py-2 text-ink-muted/40">
            前へ
          </span>
        )}

        {windowPages.map((p, i) => {
          const showEllipsis =
            i > 0 && p - windowPages[i - 1]! > 1;
          return (
            <span key={p} className="contents">
              {showEllipsis ? (
                <span className="px-1 text-ink-muted/50" aria-hidden>
                  …
                </span>
              ) : null}
              {p === page ? (
                <span
                  aria-current="page"
                  className="border border-lacquer bg-lacquer px-3 py-2 text-steam"
                >
                  {p}
                </span>
              ) : (
                <Link
                  href={hrefFor(basePath, searchParams, p)}
                  className="border border-line bg-steam px-3 py-2 transition hover:border-lacquer hover:text-lacquer"
                >
                  {p}
                </Link>
              )}
            </span>
          );
        })}

        {next ? (
          <Link
            href={hrefFor(basePath, searchParams, next)}
            className="border border-line bg-steam px-3 py-2 transition hover:border-lacquer hover:text-lacquer"
            rel="next"
          >
            次へ
          </Link>
        ) : (
          <span className="border border-transparent px-3 py-2 text-ink-muted/40">
            次へ
          </span>
        )}
      </div>
    </nav>
  );
}
