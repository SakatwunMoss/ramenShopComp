"use client";

import { useCallback, useEffect, useState } from "react";
import { CompareFloatingBar } from "@/components/CompareFloatingBar";
import { ShopGrid } from "@/components/ShopGrid";
import { comparePagePath, MAX_COMPARE } from "@/lib/compare";
import type { Shop } from "@/lib/types";

type ShopCompareGridProps = {
  shops: Shop[];
};

export function ShopCompareGrid({ shops }: ShopCompareGridProps) {
  const [selected, setSelected] = useState<Shop[]>([]);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!limitMessage) {
      return;
    }
    const timer = window.setTimeout(() => setLimitMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [limitMessage]);

  const toggleSelection = useCallback((shop: Shop) => {
    setSelected((current) => {
      const isSelected = current.some((item) => item.id === shop.id);
      if (isSelected) {
        return current.filter((item) => item.id !== shop.id);
      }
      if (current.length >= MAX_COMPARE) {
        setLimitMessage(`比較は${MAX_COMPARE}店舗まで選択できます`);
        return current;
      }
      return [...current, shop];
    });
  }, []);

  const removeSelection = useCallback((id: string) => {
    setSelected((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelected([]);
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
          selectedIds: selected.map((item) => item.id),
          onToggle: toggleSelection,
        }}
      />

      <CompareFloatingBar
        compareHref={comparePagePath(selected.map((item) => item.id))}
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
