"use client";

import type { AreaStat } from "@/lib/shops";
import { BilingualText } from "@/components/diagnose/BilingualText";
import { diagnoseCopy } from "@/lib/diagnose/copy";

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
  const middlePlaceholder = !largeArea
    ? diagnoseCopy.area.selectLargeFirst
    : middleAreas.length === 0
      ? diagnoseCopy.area.noMiddle
      : diagnoseCopy.area.selectPlaceholder;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-xs tracking-wider text-ink-muted uppercase">
        <BilingualText
          ja={diagnoseCopy.area.largeLabel.ja}
          en={diagnoseCopy.area.largeLabel.en}
          jaClassName="tracking-wider uppercase"
          enClassName="normal-case tracking-normal"
        />
        <select
          value={largeArea}
          onChange={(e) => onLargeChange(e.target.value)}
          className={selectClassName}
          required
        >
          <option value="">
            {diagnoseCopy.area.selectPlaceholder.ja} /{" "}
            {diagnoseCopy.area.selectPlaceholder.en}
          </option>
          {largeAreas.map((a) => (
            <option key={a.code} value={a.code}>
              {a.name}（{a.count}）
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-xs tracking-wider text-ink-muted uppercase">
        <BilingualText
          ja={diagnoseCopy.area.middleLabel.ja}
          en={diagnoseCopy.area.middleLabel.en}
          jaClassName="tracking-wider uppercase"
          enClassName="normal-case tracking-normal"
        />
        <select
          value={middleArea}
          onChange={(e) => onMiddleChange(e.target.value)}
          className={selectClassName}
          required
          disabled={!largeArea || middleAreas.length === 0}
        >
          <option value="">
            {middlePlaceholder.ja} / {middlePlaceholder.en}
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
