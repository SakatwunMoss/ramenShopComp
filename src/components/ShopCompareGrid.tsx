"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CompareFloatingBar } from "@/components/CompareFloatingBar";
import { ShopGrid } from "@/components/ShopGrid";
import { comparePagePath, MAX_COMPARE } from "@/lib/compare";
import { sanitizeSelectedIds } from "@/lib/diagnose/persist";
import type { Shop } from "@/lib/types";

type ShopCompareGridProps = {
  shops: Shop[];
  /** 診断結果のマッチ理由（一致タグ） */
  matchReasonsById?: Record<string, string[]>;
  /** 診断結果の比較選択を親で保持・復元するとき */
  initialSelectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
};

function shopsFromIds(shops: Shop[], ids: string[] | undefined): Shop[] {
  if (!ids || ids.length === 0) return [];
  const byId = new Map(shops.map((shop) => [shop.id, shop]));
  const selected: Shop[] = [];
  for (const id of sanitizeSelectedIds(ids, byId.keys(), MAX_COMPARE)) {
    const shop = byId.get(id);
    if (shop) selected.push(shop);
  }
  return selected;
}

export function ShopCompareGrid({
  shops,
  matchReasonsById,
  initialSelectedIds,
  onSelectedIdsChange,
}: ShopCompareGridProps) {
  const [selectedIds, setSelectedIds] = useState(() =>
    sanitizeSelectedIds(
      initialSelectedIds,
      shops.map((shop) => shop.id),
      MAX_COMPARE,
    ),
  );
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const selected = useMemo(
    () => shopsFromIds(shops, selectedIds),
    [shops, selectedIds],
  );
  const visibleSelectedIds = useMemo(
    () => selected.map((item) => item.id),
    [selected],
  );

  useEffect(() => {
    if (!limitMessage) {
      return;
    }
    const timer = window.setTimeout(() => setLimitMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [limitMessage]);

  useEffect(() => {
    onSelectedIdsChange?.(visibleSelectedIds);
  }, [visibleSelectedIds, onSelectedIdsChange]);

  const toggleSelection = useCallback(
    (shop: Shop) => {
      setSelectedIds((current) => {
        if (current.includes(shop.id)) {
          return current.filter((id) => id !== shop.id);
        }
        const visibleCount = shopsFromIds(shops, current).length;
        if (visibleCount >= MAX_COMPARE) {
          setLimitMessage(`比較は${MAX_COMPARE}店舗まで選択できます`);
          return current;
        }
        return sanitizeSelectedIds(
          [...current, shop.id],
          shops.map((item) => item.id),
          MAX_COMPARE,
        );
      });
    },
    [shops],
  );

  const removeSelection = useCallback((id: string) => {
    setSelectedIds((current) => current.filter((item) => item !== id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return (
    <>
      {limitMessage ? (
        <p
          className="mt-4 border border-[#e8b86d]/50 bg-[#fff6e8] px-4 py-3 text-sm text-[#7a5520]"
          role="alert"
        >
          {limitMessage}
        </p>
      ) : null}

      <ShopGrid
        shops={shops}
        compare={{
          selectedIds: visibleSelectedIds,
          onToggle: toggleSelection,
        }}
        matchReasonsById={matchReasonsById}
      />

      <CompareFloatingBar
        compareHref={comparePagePath(visibleSelectedIds)}
        selected={selected.map((item) => ({
          id: item.id,
          name: item.name,
        }))}
        onRemove={removeSelection}
        onClear={clearSelection}
      />

      {selected.length > 0 ? (
        <div className="h-28 sm:h-24" aria-hidden="true" />
      ) : null}
    </>
  );
}
