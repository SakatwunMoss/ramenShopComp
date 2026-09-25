"use client";

import { useMemo, useState, useTransition } from "react";
import {
  runDiagnose,
  type DiagnoseActionResult,
} from "@/app/diagnose/actions";
import { DiagnoseAreaSelect } from "@/components/diagnose/DiagnoseAreaSelect";
import { ShopCompareGrid } from "@/components/ShopCompareGrid";
import {
  ANY_PREFERENCE,
  INBOUND_OPTIONS,
  RICHNESS_OPTIONS,
  SOUP_OPTIONS,
  SPICY_OPTIONS,
  type DiagnosePreferences,
  type InboundPreference,
  type RichnessPreference,
  type SoupPreference,
  type SpicyPreference,
} from "@/lib/diagnose/preferences";
import type { AreaStat } from "@/lib/shops";

type StepId = "area" | "soup" | "spicy" | "richness" | "inbound" | "result";

const STEPS: { id: StepId; title: string }[] = [
  { id: "area", title: "エリア" },
  { id: "soup", title: "スープ系統" },
  { id: "spicy", title: "辛さ" },
  { id: "richness", title: "こってり度" },
  { id: "inbound", title: "インバウンド対応" },
  { id: "result", title: "結果" },
];

export type MiddleAreasByLarge = Record<string, AreaStat[]>;

type Props = {
  largeAreas: AreaStat[];
  middleByLarge: MiddleAreasByLarge;
};

type Draft = DiagnosePreferences;

function initialDraft(): Draft {
  return {
    largeArea: "",
    middleArea: "",
    soup: ANY_PREFERENCE,
    spicy: ANY_PREFERENCE,
    richness: ANY_PREFERENCE,
    inbound: ANY_PREFERENCE,
  };
}

const optionButtonClass = (selected: boolean) =>
  [
    "border px-4 py-3 text-left text-sm transition",
    selected
      ? "border-lacquer bg-lacquer/10 text-ink"
      : "border-line bg-steam/70 text-ink hover:border-lacquer/50",
  ].join(" ");

export function DiagnoseQuiz({ largeAreas, middleByLarge }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [result, setResult] = useState<Extract<
    DiagnoseActionResult,
    { ok: true }
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const step = STEPS[stepIndex]!;
  const middleAreas = useMemo(
    () => (draft.largeArea ? (middleByLarge[draft.largeArea] ?? []) : []),
    [draft.largeArea, middleByLarge],
  );

  const matchReasonsById = useMemo(() => {
    if (!result) return undefined;
    const map: Record<string, string[]> = {};
    for (const item of result.results) {
      if (item.matchedTags.length > 0) {
        map[item.shop.id] = item.matchedTags;
      }
    }
    return Object.keys(map).length > 0 ? map : undefined;
  }, [result]);

  function goNext() {
    setError(null);
    if (step.id === "area") {
      if (!draft.largeArea || !draft.middleArea) {
        setError("大エリアと中エリアを選択してください。");
        return;
      }
    }
    if (step.id === "inbound") {
      startTransition(async () => {
        const res = await runDiagnose(draft);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setResult(res);
        setStepIndex(STEPS.findIndex((s) => s.id === "result"));
      });
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    if (step.id === "result") {
      setResult(null);
      setStepIndex(STEPS.findIndex((s) => s.id === "inbound"));
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function restart() {
    setDraft(initialDraft());
    setResult(null);
    setError(null);
    setStepIndex(0);
  }

  return (
    <div className="border-y border-line py-6 sm:py-8">
      <ol className="flex flex-wrap gap-2 text-xs tracking-wider text-ink-muted uppercase">
        {STEPS.filter((s) => s.id !== "result").map((s, i) => {
          const active = s.id === step.id;
          const done = i < stepIndex || step.id === "result";
          return (
            <li
              key={s.id}
              className={
                active
                  ? "text-lacquer"
                  : done
                    ? "text-ink"
                    : "text-ink-muted/60"
              }
            >
              {i + 1}. {s.title}
              {i < STEPS.length - 2 ? (
                <span className="ml-2 text-ink-muted/40" aria-hidden>
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 min-h-[220px]">
        {step.id === "area" ? (
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide">
              どのエリアで探しますか？
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              中エリアまで選ぶと、その範囲の店舗だけが候補になります。
            </p>
            <div className="mt-6">
              <DiagnoseAreaSelect
                largeAreas={largeAreas}
                middleAreas={middleAreas}
                largeArea={draft.largeArea}
                middleArea={draft.middleArea}
                onLargeChange={(code) =>
                  setDraft((d) => ({
                    ...d,
                    largeArea: code,
                    middleArea: "",
                  }))
                }
                onMiddleChange={(code) =>
                  setDraft((d) => ({ ...d, middleArea: code }))
                }
              />
            </div>
          </section>
        ) : null}

        {step.id === "soup" ? (
          <ChoiceStep
            title="スープ系統は？"
            options={SOUP_OPTIONS}
            value={draft.soup}
            onChange={(soup) =>
              setDraft((d) => ({ ...d, soup: soup as SoupPreference }))
            }
          />
        ) : null}

        {step.id === "spicy" ? (
          <ChoiceStep
            title="辛さへのこだわりは？"
            options={SPICY_OPTIONS}
            value={draft.spicy}
            onChange={(spicy) =>
              setDraft((d) => ({ ...d, spicy: spicy as SpicyPreference }))
            }
          />
        ) : null}

        {step.id === "richness" ? (
          <ChoiceStep
            title="こってり度は？"
            options={RICHNESS_OPTIONS}
            value={draft.richness}
            onChange={(richness) =>
              setDraft((d) => ({
                ...d,
                richness: richness as RichnessPreference,
              }))
            }
          />
        ) : null}

        {step.id === "inbound" ? (
          <ChoiceStep
            title="インバウンド対応は必要ですか？（任意）"
            options={INBOUND_OPTIONS}
            value={draft.inbound}
            onChange={(inbound) =>
              setDraft((d) => ({
                ...d,
                inbound: inbound as InboundPreference,
              }))
            }
          />
        ) : null}

        {step.id === "result" && result ? (
          <ResultsSection
            result={result}
            matchReasonsById={matchReasonsById}
            onRestart={restart}
          />
        ) : null}
      </div>

      {error ? (
        <p
          className="mt-6 border border-[#e8b86d]/50 bg-[#fff6e8] px-4 py-3 text-sm text-[#7a5520]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {step.id !== "result" ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="h-11 border border-line bg-steam px-5 text-sm text-ink transition hover:border-lacquer"
            >
              戻る
            </button>
          ) : null}
          <button
            type="button"
            onClick={goNext}
            disabled={pending}
            className="h-11 bg-lacquer px-6 text-sm font-medium text-steam transition hover:bg-lacquer-deep disabled:opacity-60"
          >
            {pending
              ? "診断中…"
              : step.id === "inbound"
                ? "結果を見る"
                : "次へ"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ChoiceStep({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide">
        {title}
      </h2>
      <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <li key={option}>
            <button
              type="button"
              className={`w-full ${optionButtonClass(value === option)}`}
              onClick={() => onChange(option)}
              aria-pressed={value === option}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResultsSection({
  result,
  matchReasonsById,
  onRestart,
}: {
  result: Extract<DiagnoseActionResult, { ok: true }>;
  matchReasonsById?: Record<string, string[]>;
  onRestart: () => void;
}) {
  const heading = result.hasPreferenceMatch
    ? "あなたの好みに近い店"
    : `${result.middleAreaName}のおすすめ店`;

  if (result.candidateCount === 0) {
    return (
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide">
          掲載店が見つかりませんでした
        </h2>
        <p className="mt-3 text-sm text-ink-muted">
          {result.largeAreaName}・{result.middleAreaName}
          には、現在ラーメン店データがありません。別のエリアで試してください。
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-6 h-11 bg-lacquer px-6 text-sm font-medium text-steam transition hover:bg-lacquer-deep"
        >
          最初からやり直す
        </button>
      </section>
    );
  }

  const shops = result.results.map((r) => r.shop);

  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide sm:text-2xl">
        {heading}
      </h2>
      <p className="mt-2 text-sm text-ink-muted">
        {result.largeAreaName}・{result.middleAreaName}の候補{" "}
        {result.candidateCount.toLocaleString("ja-JP")} 件から、上位{" "}
        {shops.length} 件を表示しています。気になる店を選んで比較できます。
      </p>

      <ShopCompareGrid shops={shops} matchReasonsById={matchReasonsById} />

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="h-11 border border-line bg-steam px-5 text-sm text-ink transition hover:border-lacquer"
        >
          もう一度診断する
        </button>
      </div>
    </section>
  );
}
