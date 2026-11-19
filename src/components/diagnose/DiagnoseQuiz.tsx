"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Ref,
} from "react";
import Link from "next/link";
import {
  runDiagnose,
  type DiagnoseActionResult,
} from "@/app/diagnose/actions";
import { AffiliateProductsRandom } from "@/components/AffiliateProductsRandom";
import { AffiliateProductsView } from "@/components/AffiliateProductsView";
import { BilingualText } from "@/components/diagnose/BilingualText";
import { DiagnoseAreaSelect } from "@/components/diagnose/DiagnoseAreaSelect";
import { DIAGNOSE_FRESH_NAV_EVENT } from "@/components/diagnose/DiagnoseNavLink";
import { ShopCompareGrid } from "@/components/ShopCompareGrid";
import {
  selectAffiliateProducts,
  soupPreferenceToStyleKey,
} from "@/lib/affiliate/select";
import type { AffiliateProductsSnapshot } from "@/lib/affiliate/types";
import {
  diagnoseCopy,
  errorToBilingual,
  optionEn,
} from "@/lib/diagnose/copy";
import {
  clearDiagnoseReturning,
  clearDiagnoseState,
  hasValidDiagnoseReturning,
  readDiagnoseState,
  sanitizeSelectedIds,
  writeDiagnoseState,
} from "@/lib/diagnose/persist";
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

const RESULT_STEP_INDEX = STEPS.findIndex((s) => s.id === "result");

/** sticky ヘッダー h-14（56px）＋余白。scroll-mt-20（80px）と揃える */
const HEADER_SCROLL_MARGIN_PX = 80;

const stepHeadingClassName =
  "scroll-mt-20 font-[family-name:var(--font-display)] text-xl tracking-wide outline-none";

export type MiddleAreasByLarge = Record<string, AreaStat[]>;

type Props = {
  largeAreas: AreaStat[];
  middleByLarge: MiddleAreasByLarge;
  affiliateSnapshot?: AffiliateProductsSnapshot | null;
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

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getScrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}

/** 先頭が sticky ヘッダー下に見えていればスクロール不要 */
function isAnchorVisibleInViewport(
  el: Element,
  headerOffset = HEADER_SCROLL_MARGIN_PX,
): boolean {
  const rect = el.getBoundingClientRect();
  return rect.top >= headerOffset - 1 && rect.top < window.innerHeight;
}

function scrollElementIntoView(
  el: Element | null,
  options?: { force?: boolean; block?: ScrollLogicalPosition },
): void {
  if (!el) return;
  if (!options?.force && isAnchorVisibleInViewport(el)) return;
  const block = options?.block ?? "start";
  try {
    el.scrollIntoView({ block, behavior: getScrollBehavior() });
  } catch {
    el.scrollIntoView();
  }
}

const optionButtonClass = (selected: boolean, compact = false) =>
  [
    // min-h-11 = 44px（タップ領域の下限）
    compact
      ? "min-h-11 h-full border px-3 py-2.5 text-left transition sm:min-h-[3.25rem] sm:px-4 sm:py-3"
      : "min-h-[3.25rem] border px-4 py-3 text-left transition",
    selected
      ? "border-lacquer bg-lacquer/10 text-ink"
      : "border-line bg-steam/70 text-ink hover:border-lacquer/50",
  ].join(" ");

export function DiagnoseQuiz({
  largeAreas,
  middleByLarge,
  affiliateSnapshot = null,
}: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [result, setResult] = useState<Extract<
    DiagnoseActionResult,
    { ok: true }
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
  const [restoringResults, setRestoringResults] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const errorAlertRef = useRef<HTMLDivElement | null>(null);
  const skipPersistRef = useRef(true);
  /** 初回表示・sessionStorage 復元直後は自動スクロールしない */
  const skipAutoScrollRef = useRef(true);
  const prevViewKeyRef = useRef<string | null>(null);
  const resultRef = useRef(result);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const handleSelectedIdsChange = useCallback((ids: string[]) => {
    setSelectedIds((current) => {
      if (
        current.length === ids.length &&
        current.every((id, i) => id === ids[i])
      ) {
        return current;
      }
      return ids;
    });
  }, []);

  const step = STEPS[stepIndex]!;
  const finished = step.id === "result" && result !== null;
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

  // マウント後に sessionStorage から復元（SSR ハイドレーション不一致を避ける）
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const saved = readDiagnoseState(
        { largeAreas, middleByLarge },
        STEPS.length,
      );

      if (!saved) {
        if (!cancelled) {
          skipPersistRef.current = false;
          setHydrated(true);
        }
        return;
      }

      // 完了済みは returning があるときだけ復元（詳細→ホーム→診断の誤復元を防ぐ）
      if (saved.finished && !hasValidDiagnoseReturning()) {
        clearDiagnoseState();
        if (!cancelled) {
          skipPersistRef.current = false;
          setHydrated(true);
        }
        return;
      }

      if (cancelled) return;

      setDraft(saved.draft);
      setError(null);
      setSelectedIds(saved.selectedIds);

      if (saved.finished) {
        setRestoringResults(true);
        setStepIndex(RESULT_STEP_INDEX);
        try {
          const res = await runDiagnose(saved.draft);
          if (cancelled) return;
          if (!res.ok) {
            clearDiagnoseState();
            setDraft(initialDraft());
            setStepIndex(0);
            setResult(null);
            setSelectedIds([]);
            setError(res.error);
          } else {
            const validIds = res.results.map((item) => item.shop.id);
            setSelectedIds(
              sanitizeSelectedIds(saved.selectedIds, validIds),
            );
            setResult(res);
            setStepIndex(RESULT_STEP_INDEX);
          }
        } catch {
          if (cancelled) return;
          clearDiagnoseState();
          setDraft(initialDraft());
          setStepIndex(0);
          setResult(null);
          setSelectedIds([]);
        } finally {
          if (!cancelled) {
            setRestoringResults(false);
            skipPersistRef.current = false;
            setHydrated(true);
          }
        }
        return;
      }

      setStepIndex(saved.stepIndex);
      setResult(null);
      setSelectedIds([]);
      skipPersistRef.current = false;
      setHydrated(true);
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, [largeAreas, middleByLarge]);

  // draft / stepIndex / finished / selectedIds の変化ごとに保存
  useEffect(() => {
    if (!hydrated || skipPersistRef.current) return;
    writeDiagnoseState({
      draft,
      stepIndex,
      finished,
      selectedIds: finished ? selectedIds : [],
    });
  }, [draft, stepIndex, finished, selectedIds, hydrated]);

  // ステップ切替・結果表示切替時に質問/結果見出しへスクロール＆フォーカス
  useEffect(() => {
    if (!hydrated || restoringResults) return;

    const viewKey = finished ? "result" : `step-${stepIndex}`;

    if (skipAutoScrollRef.current) {
      skipAutoScrollRef.current = false;
      prevViewKeyRef.current = viewKey;
      return;
    }

    if (prevViewKeyRef.current === viewKey) return;
    prevViewKeyRef.current = viewKey;

    const heading = stepHeadingRef.current;
    if (!heading) return;

    if (!isAnchorVisibleInViewport(heading)) {
      scrollElementIntoView(heading, { force: true });
    }
    heading.focus({ preventScroll: true });
  }, [hydrated, restoringResults, stepIndex, finished]);

  // バリデーション等のエラー表示時はメッセージが見える位置へ
  useEffect(() => {
    if (!hydrated || restoringResults || !error) return;
    scrollElementIntoView(errorAlertRef.current, {
      force: true,
      block: "nearest",
    });
  }, [error, hydrated, restoringResults]);

  // ヘッダー等から診断へ再入場したとき、完了済み UI を最初からに戻す
  useEffect(() => {
    function onFreshNav() {
      if (!resultRef.current) return;
      setDraft(initialDraft());
      setResult(null);
      setSelectedIds([]);
      setError(null);
      setStepIndex(0);
    }
    window.addEventListener(DIAGNOSE_FRESH_NAV_EVENT, onFreshNav);
    return () => {
      window.removeEventListener(DIAGNOSE_FRESH_NAV_EVENT, onFreshNav);
    };
  }, []);

  function goNext() {
    setError(null);
    if (step.id === "area") {
      if (!draft.largeArea) {
        setError(diagnoseCopy.area.areaRequired.ja);
        // 同一エラーの再クリックでも見える位置へ（effect は同一値だと再発火しない）
        requestAnimationFrame(() => {
          scrollElementIntoView(errorAlertRef.current, {
            force: true,
            block: "nearest",
          });
        });
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
        setSelectedIds([]);
        setResult(res);
        setStepIndex(RESULT_STEP_INDEX);
      });
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    if (step.id === "result") {
      setResult(null);
      setSelectedIds([]);
      setStepIndex(STEPS.findIndex((s) => s.id === "inbound"));
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function restart() {
    clearDiagnoseState();
    clearDiagnoseReturning();
    setDraft(initialDraft());
    setResult(null);
    setSelectedIds([]);
    setError(null);
    setStepIndex(0);
  }

  const errorCopy = error ? errorToBilingual(error) : null;
  const primaryAction = pending
    ? diagnoseCopy.actions.diagnosing
    : step.id === "inbound"
      ? diagnoseCopy.actions.seeResults
      : diagnoseCopy.actions.next;

  const showPlaceholder = !hydrated || restoringResults;

  return (
    <div className="border-y border-line py-6 sm:py-8">
      <ol className="flex flex-wrap gap-x-2 gap-y-3 text-xs tracking-wider text-ink-muted uppercase">
        {STEPS.filter((s) => s.id !== "result").map((s, i) => {
          const active = !showPlaceholder && s.id === step.id;
          const done =
            !showPlaceholder && (i < stepIndex || step.id === "result");
          return (
            <li
              key={s.id}
              className={
                showPlaceholder
                  ? "text-ink-muted/60"
                  : active
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
        {showPlaceholder ? (
          <div
            className="flex min-h-[220px] items-center justify-center"
            aria-busy="true"
            aria-live="polite"
          >
            <BilingualText
              as="p"
              ja={diagnoseCopy.actions.restoring.ja}
              en={diagnoseCopy.actions.restoring.en}
              className="text-sm text-ink-muted"
              tone="muted"
            />
          </div>
        ) : null}

        {!showPlaceholder && step.id === "area" ? (
          <section>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className={stepHeadingClassName}
            >
              <BilingualText
                ja={diagnoseCopy.area.question.ja}
                en={diagnoseCopy.area.question.en}
                jaClassName="block"
                enClassName="mt-1 font-sans tracking-normal"
              />
            </h2>
            <BilingualText
              as="p"
              ja={diagnoseCopy.area.hint.ja}
              en={diagnoseCopy.area.hint.en}
              className="mt-1.5 text-sm leading-snug text-ink-muted sm:mt-2 sm:leading-relaxed"
              tone="muted"
            />
            <div className="mt-4 sm:mt-6">
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

        {!showPlaceholder && step.id === "soup" ? (
          <ChoiceStep
            title={diagnoseCopy.questions.soup}
            options={SOUP_OPTIONS}
            value={draft.soup}
            headingRef={stepHeadingRef}
            compactMobileGrid
            onChange={(soup) =>
              setDraft((d) => ({ ...d, soup: soup as SoupPreference }))
            }
          />
        ) : null}

        {!showPlaceholder && step.id === "spicy" ? (
          <ChoiceStep
            title={diagnoseCopy.questions.spicy}
            options={SPICY_OPTIONS}
            value={draft.spicy}
            headingRef={stepHeadingRef}
            onChange={(spicy) =>
              setDraft((d) => ({ ...d, spicy: spicy as SpicyPreference }))
            }
          />
        ) : null}

        {!showPlaceholder && step.id === "richness" ? (
          <ChoiceStep
            title={diagnoseCopy.questions.richness}
            options={RICHNESS_OPTIONS}
            value={draft.richness}
            headingRef={stepHeadingRef}
            onChange={(richness) =>
              setDraft((d) => ({
                ...d,
                richness: richness as RichnessPreference,
              }))
            }
          />
        ) : null}

        {!showPlaceholder && step.id === "inbound" ? (
          <ChoiceStep
            title={diagnoseCopy.questions.inbound}
            options={INBOUND_OPTIONS}
            value={draft.inbound}
            headingRef={stepHeadingRef}
            onChange={(inbound) =>
              setDraft((d) => ({
                ...d,
                inbound: inbound as InboundPreference,
              }))
            }
          />
        ) : null}

        {!showPlaceholder && step.id === "result" && result ? (
          <ResultsSection
            result={result}
            soup={draft.soup}
            affiliateSnapshot={affiliateSnapshot}
            matchReasonsById={matchReasonsDisplayById}
            initialSelectedIds={selectedIds}
            onSelectedIdsChange={handleSelectedIdsChange}
            onRestart={restart}
            headingRef={stepHeadingRef}
          />
        ) : null}
      </div>

      {errorCopy && !showPlaceholder ? (
        <div
          ref={errorAlertRef}
          className="mt-6 scroll-mt-20 border border-[#e8b86d]/50 bg-[#fff6e8] px-4 py-3 text-sm text-[#7a5520]"
          role="alert"
        >
          <BilingualText
            ja={errorCopy.ja}
            en={errorCopy.en}
            enClassName="text-[#7a5520]/80"
          />
        </div>
      ) : null}

      {!showPlaceholder && step.id !== "result" ? (
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
  headingRef,
  compactMobileGrid = false,
}: {
  title: { ja: string; en: string };
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  headingRef?: Ref<HTMLHeadingElement>;
  /** スマホでも2列（スープ6択向け）。sm以上は他ステップと同じ2列 */
  compactMobileGrid?: boolean;
}) {
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1} className={stepHeadingClassName}>
        <BilingualText
          ja={title.ja}
          en={title.en}
          jaClassName="block"
          enClassName="mt-1 font-sans tracking-normal"
        />
      </h2>
      <ul
        className={
          compactMobileGrid
            ? "mt-6 grid grid-cols-2 gap-2"
            : "mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2"
        }
      >
        {options.map((option) => (
          <li key={option} className={compactMobileGrid ? "flex" : undefined}>
            <button
              type="button"
              className={`flex w-full flex-col justify-center ${optionButtonClass(value === option, compactMobileGrid)}`}
              onClick={() => onChange(option)}
              aria-pressed={value === option}
            >
              <span lang="ja" className="block text-sm leading-snug">
                {option}
              </span>
              <span
                lang="en"
                className={
                  compactMobileGrid
                    ? "mt-0.5 block text-[10px] leading-snug break-words text-ink-muted sm:text-xs"
                    : "mt-0.5 block text-[11px] leading-snug text-ink-muted sm:text-xs"
                }
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
  soup,
  affiliateSnapshot,
  matchReasonsById,
  initialSelectedIds,
  onSelectedIdsChange,
  onRestart,
  headingRef,
}: {
  result: Extract<DiagnoseActionResult, { ok: true }>;
  soup: SoupPreference;
  affiliateSnapshot: AffiliateProductsSnapshot | null;
  matchReasonsById?: Record<string, string[]>;
  initialSelectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onRestart: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const heading = result.hasPreferenceMatch
    ? diagnoseCopy.results.preferenceMatch
    : diagnoseCopy.results.areaRecommend(
        result.largeAreaName,
        result.middleAreaName,
      );

  if (result.candidateCount === 0) {
    const emptyBody = diagnoseCopy.results.emptyBody(
      result.largeAreaName,
      result.middleAreaName,
    );
    return (
      <section>
        <h2 ref={headingRef} tabIndex={-1} className={stepHeadingClassName}>
          <BilingualText
            ja={diagnoseCopy.results.emptyTitle.ja}
            en={diagnoseCopy.results.emptyTitle.en}
            jaClassName="block"
            enClassName="mt-1 font-sans tracking-normal"
          />
        </h2>
        <BilingualText
          as="p"
          ja={emptyBody.ja}
          en={emptyBody.en}
          className="mt-3 text-sm text-ink-muted"
          tone="muted"
        />
        <p className="mt-4">
          <Link
            href="/guide/ramen-styles"
            className="inline-flex min-h-11 flex-col justify-center text-sm text-lacquer underline-offset-2 hover:underline"
          >
            <BilingualText
              ja={diagnoseCopy.results.styleGuideLink.ja}
              en={diagnoseCopy.results.styleGuideLink.en}
            />
          </Link>
        </p>
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
  const styleKey = soupPreferenceToStyleKey(soup);
  const affiliateProducts = styleKey
    ? selectAffiliateProducts(affiliateSnapshot, [styleKey], 2)
    : null;

  return (
    <section>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className={`${stepHeadingClassName} sm:text-2xl`}
      >
        <BilingualText
          ja={heading.ja}
          en={heading.en}
          jaClassName="block"
          enClassName="mt-1 font-sans text-base tracking-normal sm:text-lg"
        />
      </h2>
      <BilingualText
        as="p"
        ja={summary.ja}
        en={summary.en}
        className="mt-2 text-sm text-ink-muted"
        tone="muted"
      />

      {/* 系統フィルタ廃止後の代替導線。guide 側に系統アンカーは無いためページ先頭へ */}
      <p className="mt-4">
        <Link
          href="/guide/ramen-styles"
          className="inline-flex min-h-11 flex-col justify-center text-sm text-lacquer underline-offset-2 hover:underline"
        >
          <BilingualText
            ja={diagnoseCopy.results.styleGuideLink.ja}
            en={diagnoseCopy.results.styleGuideLink.en}
          />
        </Link>
      </p>

      <ShopCompareGrid
        shops={shops}
        matchReasonsById={matchReasonsById}
        initialSelectedIds={initialSelectedIds}
        onSelectedIdsChange={onSelectedIdsChange}
      />

      {affiliateProducts ? (
        <AffiliateProductsView products={affiliateProducts} className="mt-8" />
      ) : (
        <AffiliateProductsRandom
          snapshot={affiliateSnapshot}
          limit={2}
          className="mt-8"
        />
      )}

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
