"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AffiliateProductsView } from "@/components/AffiliateProductsView";
import { selectAffiliateProductsRandom } from "@/lib/affiliate/select";
import type {
  AffiliateProduct,
  AffiliateProductsSnapshot,
} from "@/lib/affiliate/types";

/** 選定前に確保するブロック高さ（2件グリッドのおおよその占有） */
export const AFFILIATE_PRODUCTS_PLACEHOLDER_MIN_CLASS = "min-h-[13rem]";

type AffiliateRandomContextValue = {
  snapshot: AffiliateProductsSnapshot | null;
  /** ページ内のランダム枠で共有する使用済み id */
  usedIds: Set<string>;
};

const AffiliateRandomContext =
  createContext<AffiliateRandomContextValue | null>(null);

/**
 * 同一ページにランダム商品ブロックが複数あるとき、ブロック間の重複を防ぐ。
 * スナップショットはサーバーから一度渡す。
 */
export function AffiliateRandomProvider({
  snapshot,
  children,
}: {
  snapshot: AffiliateProductsSnapshot | null;
  children: ReactNode;
}) {
  const usedIdsRef = useRef(new Set<string>());
  const value = useMemo(
    () => ({ snapshot, usedIds: usedIdsRef.current }),
    [snapshot],
  );
  return (
    <AffiliateRandomContext.Provider value={value}>
      {children}
    </AffiliateRandomContext.Provider>
  );
}

type AffiliateProductsRandomProps = {
  /** Provider 外で使う場合に渡す。Provider 内なら省略可 */
  snapshot?: AffiliateProductsSnapshot | null;
  limit?: number;
  className?: string;
};

/**
 * 混在/未指定ページ用。useEffect 内で一度だけランダム選定する。
 * レンダー中に Math.random は使わない（ハイドレーション不一致回避）。
 */
export function AffiliateProductsRandom({
  snapshot: snapshotProp,
  limit = 2,
  className = "",
}: AffiliateProductsRandomProps) {
  const ctx = useContext(AffiliateRandomContext);
  const snapshot = snapshotProp ?? ctx?.snapshot ?? null;
  const [products, setProducts] = useState<AffiliateProduct[] | null>(null);
  const didSelectRef = useRef(false);

  useEffect(() => {
    if (didSelectRef.current) return;
    if (!snapshot?.products?.length) {
      didSelectRef.current = true;
      setProducts([]);
      return;
    }

    const usedIds = ctx?.usedIds;
    const selected = selectAffiliateProductsRandom(snapshot, {
      limit,
      excludeIds: usedIds,
    });
    if (usedIds) {
      for (const product of selected) {
        usedIds.add(product.id);
      }
    }
    didSelectRef.current = true;
    setProducts(selected);
  }, [snapshot, limit, ctx?.usedIds]);

  if (!snapshot?.products?.length) return null;

  if (products === null) {
    return (
      <aside
        className={`invisible border border-lacquer/25 bg-lacquer/5 px-4 py-5 sm:px-5 ${AFFILIATE_PRODUCTS_PLACEHOLDER_MIN_CLASS} ${className}`}
        aria-hidden
      />
    );
  }

  return <AffiliateProductsView products={products} className={className} />;
}
