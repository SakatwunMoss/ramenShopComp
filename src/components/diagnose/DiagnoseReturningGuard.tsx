"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  clearDiagnoseReturning,
  isDiagnosePath,
  isDiagnoseRelatedPath,
  isShopOrComparePath,
  setDiagnoseReturning,
} from "@/lib/diagnose/persist";

/**
 * 診断 → 詳細/比較 の往復用 returning フラグを pathname で管理する。
 * 診断・詳細・比較以外のページに入ったらフラグを消す（ホーム経由の誤復元を防ぐ）。
 */
export function DiagnoseReturningGuard() {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (prev && isDiagnosePath(prev) && isShopOrComparePath(pathname)) {
      setDiagnoseReturning();
    }

    if (!isDiagnoseRelatedPath(pathname)) {
      clearDiagnoseReturning();
    }
  }, [pathname]);

  return null;
}
