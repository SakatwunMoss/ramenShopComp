"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";

type NavLink = {
  href: string;
  label: ReactNode;
};

const NAV_LINKS: NavLink[] = [
  { href: "/#shops", label: "店舗一覧" },
  {
    href: "/diagnose",
    label: (
      <>
        <span lang="ja">好み診断</span>
        <span
          lang="en"
          className="text-[10px] text-ink-muted/80 normal-case tracking-normal sm:text-[11px]"
        >
          Quiz
        </span>
      </>
    ),
  },
  { href: "/areas", label: "エリアから探す" },
  { href: "/about", label: "このサイトについて" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-0 bg-ink/20 sm:hidden"
          aria-label="メニューを閉じる"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="relative z-10 border-b border-line/70 bg-steam/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="shrink-0 font-[family-name:var(--font-display)] text-lg tracking-wide text-ink"
            onClick={() => setOpen(false)}
          >
            <span className="text-lacquer">Ramen</span> Compare
          </Link>

          <nav
            className="hidden items-center gap-5 text-sm text-ink-muted sm:flex"
            aria-label="メインナビゲーション"
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-baseline gap-1.5 transition hover:text-lacquer"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-ink transition hover:text-lacquer sm:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "メニューを閉じる" : "メニューを開く"}
            onClick={() => setOpen((prev) => !prev)}
          >
            <span className="relative block h-4 w-5" aria-hidden="true">
              <span
                className={`absolute left-0 top-0 block h-0.5 w-5 origin-center bg-current transition-transform ${
                  open ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] block h-0.5 w-5 bg-current transition-opacity ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] block h-0.5 w-5 origin-center bg-current transition-transform ${
                  open ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>

        <div
          id={menuId}
          className={`border-t border-line/70 bg-steam sm:hidden ${
            open ? "block" : "hidden"
          }`}
        >
          <nav
            className="mx-auto flex max-w-6xl flex-col px-2 py-2 text-base text-ink"
            aria-label="モバイルナビゲーション"
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center gap-1.5 px-3 py-2 transition hover:bg-lacquer/10 hover:text-lacquer"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
