"use client";

import { useMemo, useState, useTransition } from "react";
import {
  runDiagnose,
  type DiagnoseActionResult,
} from "@/app/diagnose/actions";
import { BilingualText } from "@/components/diagnose/BilingualText";
import { DiagnoseAreaSelect } from "@/components/diagnose/DiagnoseAreaSelect";
import { ShopCompareGrid } from "@/components/ShopCompareGrid";
import {
  diagnoseCopy,
  errorToBilingual,
  optionEn,
} from "@/lib/diagnose/copy";
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

const STEPS: {
  id: StepId;
  title: { ja: string; en: string };
}[] = [
  { id: "area", title: diagnoseCopy.steps.area },
  { id: "soup", title: diagnoseCopy.steps.soup },
  { id: "spicy", title: diagnoseCopy.steps.spicy },
  { id: "richness", title: diagnoseCopy.steps.richness },
  { id: "inbound", title: diagnoseCopy.steps.inbound },
  { id: "result", title: diagnoseCopy.steps.result },
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
    "min-h-[3.25rem] border px-4 py-3 text-left transition",
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

  /** マッチ理由は JA / EN を併記した表示用文字列 */
  const matchReasonsDisplayById = useMemo(() => {
    if (!matchReasonsById) return undefined;
    const map: Record<string, string[]> = {};
    for (const [id, tags] of Object.entries(matchReasonsById)) {
      map[id] = tags.map((tag) => `${tag} / ${optionEn(tag)}`);
    }
    return map;
  }, [matchReasonsById]);

  function goNext() {
    setError(null);
    if (step.id === "area") {
      if (!draft.largeArea || !draft.middleArea) {
        setError(diagnoseCopy.area.areaRequired.ja);
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

  const errorCopy = error ? errorToBilingual(error) : null;
  const primaryAction = pending
    ? diagnoseCopy.actions.diagnosing
    : step.id === "inbound"
      ? diagnoseCopy.actions.seeResults
      : diagnoseCopy.actions.next;

  return (
    <div className="border-y border-line py-6 sm:py-8">
      <ol className="flex flex-wrap gap-x-2 gap-y-3 text-xs tracking-wider text-ink-muted uppercase">
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
              <span className="inline-flex flex-col">
                <span>
                  {i + 1}. {s.title.ja}
                </span>
                <span
                  lang="en"
                  className="text-[10px] font-normal tracking-normal normal-case opacity-80 sm:text-[11px]"
                >
                  {s.title.en}
                </span>
              </span>
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
            <BilingualText
              as="h2"
              ja={diagnoseCopy.area.question.ja}
              en={diagnoseCopy.area.question.en}
              className="font-[family-name:var(--font-display)] text-xl tracking-wide"
              jaClassName="block"
              enClassName="mt-1 font-sans tracking-normal"
            />
            <BilingualText
              as="p"
              ja={diagnoseCopy.area.hint.ja}
              en={diagnoseCopy.area.hint.en}
              className="mt-2 text-sm text-ink-muted"
              tone="muted"
            />
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
            title={diagnoseCopy.questions.soup}
            options={SOUP_OPTIONS}
            value={draft.soup}
            onChange={(soup) =>
              setDraft((d) => ({ ...d, soup: soup as SoupPreference }))
            }
          />
        ) : null}

        {step.id === "spicy" ? (
          <ChoiceStep
            title={diagnoseCopy.questions.spicy}
            options={SPICY_OPTIONS}
            value={draft.spicy}
            onChange={(spicy) =>
              setDraft((d) => ({ ...d, spicy: spicy as SpicyPreference }))
            }
          />
        ) : null}

        {step.id === "richness" ? (
          <ChoiceStep
            title={diagnoseCopy.questions.richness}
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
            title={diagnoseCopy.questions.inbound}
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
            matchReasonsById={matchReasonsDisplayById}
            onRestart={restart}
          />
        ) : null}
      </div>

      {errorCopy ? (
        <div
          className="mt-6 border border-[#e8b86d]/50 bg-[#fff6e8] px-4 py-3 text-sm text-[#7a5520]"
          role="alert"
        >
          <BilingualText
            ja={errorCopy.ja}
            en={errorCopy.en}
            enClassName="text-[#7a5520]/80"
          />
        </div>
      ) : null}

      {step.id !== "result" ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-11 flex-col items-start justify-center border border-line bg-steam px-5 py-2 text-sm text-ink transition hover:border-lacquer"
            >
              <BilingualText
                ja={diagnoseCopy.actions.back.ja}
                en={diagnoseCopy.actions.back.en}
              />
            </button>
          ) : null}
          <button
            type="button"
            onClick={goNext}
            disabled={pending}
            className="inline-flex min-h-11 flex-col items-start justify-center bg-lacquer px-6 py-2 text-sm font-medium text-steam transition hover:bg-lacquer-deep disabled:opacity-60"
          >
            <BilingualText
              ja={primaryAction.ja}
              en={primaryAction.en}
              tone="onLacquer"
              jaClassName="font-medium"
            />
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
  title: { ja: string; en: string };
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section>
      <BilingualText
        as="h2"
        ja={title.ja}
        en={title.en}
        className="font-[family-name:var(--font-display)] text-xl tracking-wide"
        jaClassName="block"
        enClassName="mt-1 font-sans tracking-normal"
      />
      <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <li key={option}>
            <button
              type="button"
              className={`w-full ${optionButtonClass(value === option)}`}
              onClick={() => onChange(option)}
              aria-pressed={value === option}
            >
              <span lang="ja" className="block text-sm leading-snug">
                {option}
              </span>
              <span
                lang="en"
                className="mt-0.5 block text-[11px] leading-snug text-ink-muted sm:text-xs"
              >
                {optionEn(option)}
              </span>
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
    ? diagnoseCopy.results.preferenceMatch
    : diagnoseCopy.results.areaRecommend(result.middleAreaName);

  if (result.candidateCount === 0) {
    const emptyBody = diagnoseCopy.results.emptyBody(
      result.largeAreaName,
      result.middleAreaName,
    );
    return (
      <section>
        <BilingualText
          as="h2"
          ja={diagnoseCopy.results.emptyTitle.ja}
          en={diagnoseCopy.results.emptyTitle.en}
          className="font-[family-name:var(--font-display)] text-xl tracking-wide"
          jaClassName="block"
          enClassName="mt-1 font-sans tracking-normal"
        />
        <BilingualText
          as="p"
          ja={emptyBody.ja}
          en={emptyBody.en}
          className="mt-3 text-sm text-ink-muted"
          tone="muted"
        />
        <button
          type="button"
          onClick={onRestart}
          className="mt-6 inline-flex min-h-11 flex-col items-start justify-center bg-lacquer px-6 py-2 text-sm font-medium text-steam transition hover:bg-lacquer-deep"
        >
          <BilingualText
            ja={diagnoseCopy.actions.restartFromScratch.ja}
            en={diagnoseCopy.actions.restartFromScratch.en}
            tone="onLacquer"
            jaClassName="font-medium"
          />
        </button>
      </section>
    );
  }

  const shops = result.results.map((r) => r.shop);
  const summary = diagnoseCopy.results.summary(
    result.largeAreaName,
    result.middleAreaName,
    result.candidateCount,
    shops.length,
  );

  return (
    <section>
      <BilingualText
        as="h2"
        ja={heading.ja}
        en={heading.en}
        className="font-[family-name:var(--font-display)] text-xl tracking-wide sm:text-2xl"
        jaClassName="block"
        enClassName="mt-1 font-sans text-base tracking-normal sm:text-lg"
      />
      <BilingualText
        as="p"
        ja={summary.ja}
        en={summary.en}
        className="mt-2 text-sm text-ink-muted"
        tone="muted"
      />

      <ShopCompareGrid shops={shops} matchReasonsById={matchReasonsById} />

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex min-h-11 flex-col items-start justify-center border border-line bg-steam px-5 py-2 text-sm text-ink transition hover:border-lacquer"
        >
          <BilingualText
            ja={diagnoseCopy.actions.restart.ja}
            en={diagnoseCopy.actions.restart.en}
          />
        </button>
      </div>
    </section>
  );
}
