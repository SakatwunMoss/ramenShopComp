"use client";

import Link from "next/link";
import { MAX_COMPARE } from "@/lib/compare";

type CompareItem = {
  id: string;
  name: string;
};

type CompareFloatingBarProps = {
  selected: CompareItem[];
  compareHref: string;
  onRemove: (id: string) => void;
  onClear: () => void;
};

export function CompareFloatingBar({
  selected,
  compareHref,
  onRemove,
  onClear,
}: CompareFloatingBarProps) {
  if (selected.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-steam/95 shadow-[0_-4px_24px_rgba(74,47,44,0.1)] backdrop-blur-sm"
      role="region"
      aria-label="比較中の店舗"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-lacquer">
            比較中（{selected.length}/{MAX_COMPARE}）
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {selected.map((item) => (
              <li key={item.id}>
                <span className="inline-flex max-w-full items-center gap-1.5 border border-line bg-bg/80 px-2.5 py-1 text-xs text-ink">
                  <span className="truncate">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-ink-muted transition-colors hover:bg-lacquer/15 hover:text-lacquer"
                    aria-label={`${item.name}を比較から外す`}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-bg hover:text-ink"
          >
            クリア
          </button>
          <Link
            href={compareHref}
            className="inline-flex items-center justify-center bg-lacquer px-4 py-2.5 text-sm font-medium text-steam transition-colors hover:bg-lacquer-deep"
          >
            比較する
          </Link>
        </div>
      </div>
    </div>
  );
}
