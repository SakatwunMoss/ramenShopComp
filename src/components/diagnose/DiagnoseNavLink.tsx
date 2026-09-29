"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { clearFinishedDiagnoseState } from "@/lib/diagnose/persist";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: string;
  children: ReactNode;
};

/**
 * /diagnose へのナビリンク。完了済みの診断結果だけ破棄してから遷移する。
 * （質問途中の下書きは残し、詳細画面からのブラウザバックでは結果を復元する）
 */
export const DIAGNOSE_FRESH_NAV_EVENT = "ramen-diagnose-fresh-nav";

export function DiagnoseNavLink({
  href = "/diagnose",
  onClick,
  children,
  ...rest
}: Props) {
  return (
    <Link
      href={href}
      {...rest}
      onClick={(event) => {
        clearFinishedDiagnoseState();
        window.dispatchEvent(new Event(DIAGNOSE_FRESH_NAV_EVENT));
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
