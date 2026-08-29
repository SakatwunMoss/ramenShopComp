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

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: Props) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      aria-label="ページネーション"
      className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-sm"
    >
      <p className="text-ink-muted">
        {page} / {totalPages} ページ
      </p>
      <div className="flex items-center gap-3">
        {prev ? (
          <Link
            href={hrefFor(basePath, searchParams, prev)}
            className="border border-line bg-steam px-4 py-2 transition hover:border-lacquer hover:text-lacquer"
            rel="prev"
          >
            前へ
          </Link>
        ) : (
          <span className="border border-transparent px-4 py-2 text-ink-muted/40">
            前へ
          </span>
        )}
        {next ? (
          <Link
            href={hrefFor(basePath, searchParams, next)}
            className="border border-line bg-steam px-4 py-2 transition hover:border-lacquer hover:text-lacquer"
            rel="next"
          >
            次へ
          </Link>
        ) : (
          <span className="border border-transparent px-4 py-2 text-ink-muted/40">
            次へ
          </span>
        )}
      </div>
    </nav>
  );
}
