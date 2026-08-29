import Link from "next/link";
import { RAMEN_STYLES } from "@/lib/types";
import type { AreaStat } from "@/lib/shops";

type Props = {
  areas: AreaStat[];
  currentArea?: string;
  /** 選択中エリアの表示名（未指定時は areas から解決） */
  currentAreaName?: string;
  currentStyle?: string;
  currentQ?: string;
  /** 省略時・"ramen" = ラーメン店のみ / "all" = キーワード該当すべて */
  currentScope?: string;
};

export function ShopFilters({
  areas,
  currentArea,
  currentAreaName: currentAreaNameProp,
  currentStyle,
  currentQ,
  currentScope = "ramen",
}: Props) {
  const hasActive =
    currentArea || currentStyle || currentQ || currentScope === "all";
  const currentAreaName =
    currentAreaNameProp ??
    areas.find((a) => a.code === currentArea)?.name ??
    currentArea;

  return (
    <form
      method="get"
      action="/#shops"
      className="flex flex-col gap-4 border-y border-line py-5"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs tracking-wider text-ink-muted uppercase">
          エリア
          <select
            name="area"
            defaultValue={currentArea ?? ""}
            className="h-11 border border-line bg-steam px-3 text-sm text-ink outline-none focus:border-lacquer"
          >
            <option value="">全国</option>
            {areas.map((a) => (
              <option key={a.code} value={a.code}>
                {a.name}（{a.count}）
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs tracking-wider text-ink-muted uppercase">
          系統
          <select
            name="style"
            defaultValue={currentStyle ?? ""}
            className="h-11 border border-line bg-steam px-3 text-sm text-ink outline-none focus:border-lacquer"
          >
            <option value="">すべて</option>
            {RAMEN_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-xs tracking-wider text-ink-muted uppercase">
          対象
          <select
            name="scope"
            defaultValue={currentScope === "all" ? "all" : "ramen"}
            className="h-11 border border-line bg-steam px-3 text-sm text-ink outline-none focus:border-lacquer"
          >
            <option value="ramen">ラーメン店のみ</option>
            <option value="all">キーワード該当すべて</option>
          </select>
        </label>

        <label className="flex min-w-[180px] flex-[2] flex-col gap-1 text-xs tracking-wider text-ink-muted uppercase">
          店名
          <input
            type="search"
            name="q"
            defaultValue={currentQ ?? ""}
            placeholder="例: 一蘭"
            className="h-11 border border-line bg-steam px-3 text-sm text-ink outline-none placeholder:text-ink-muted/50 focus:border-lacquer"
          />
        </label>

        <button
          type="submit"
          className="h-11 bg-lacquer px-6 text-sm font-medium text-steam transition hover:bg-lacquer-deep"
        >
          絞り込む
        </button>
      </div>

      {hasActive && (
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/#shops"
            className="text-sm text-lacquer underline-offset-2 hover:underline"
          >
            条件をクリア
          </Link>
          {currentArea ? (
            <Link
              href={`/areas/${currentArea}`}
              className="text-sm text-ink-muted underline-offset-2 hover:text-lacquer hover:underline"
            >
              {currentAreaName}
              のエリアページを見る
            </Link>
          ) : (
            <Link
              href="/areas"
              className="text-sm text-ink-muted underline-offset-2 hover:text-lacquer hover:underline"
            >
              エリア別ページ一覧
            </Link>
          )}
        </div>
      )}
      {!hasActive && (
        <Link
          href="/areas"
          className="text-sm text-ink-muted underline-offset-2 hover:text-lacquer hover:underline"
        >
          エリア別ページから探す
        </Link>
      )}
    </form>
  );
}
