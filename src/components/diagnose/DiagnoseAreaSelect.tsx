"use client";

import type { AreaStat } from "@/lib/shops";

type Props = {
  largeAreas: AreaStat[];
  middleAreas: AreaStat[];
  largeArea: string;
  middleArea: string;
  onLargeChange: (code: string) => void;
  onMiddleChange: (code: string) => void;
};

const selectClassName =
  "h-11 border border-line bg-steam px-3 text-sm text-ink outline-none focus:border-lacquer";

export function DiagnoseAreaSelect({
  largeAreas,
  middleAreas,
  largeArea,
  middleArea,
  onLargeChange,
  onMiddleChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-xs tracking-wider text-ink-muted uppercase">
        都道府県・大エリア
        <select
          value={largeArea}
          onChange={(e) => onLargeChange(e.target.value)}
          className={selectClassName}
          required
        >
          <option value="">選択してください</option>
          {largeAreas.map((a) => (
            <option key={a.code} value={a.code}>
              {a.name}（{a.count}）
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-xs tracking-wider text-ink-muted uppercase">
        エリア（中エリア）
        <select
          value={middleArea}
          onChange={(e) => onMiddleChange(e.target.value)}
          className={selectClassName}
          required
          disabled={!largeArea || middleAreas.length === 0}
        >
          <option value="">
            {!largeArea
              ? "先に大エリアを選択"
              : middleAreas.length === 0
                ? "候補がありません"
                : "選択してください"}
          </option>
          {middleAreas.map((a) => (
            <option key={a.code} value={a.code}>
              {a.name}（{a.count}）
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
