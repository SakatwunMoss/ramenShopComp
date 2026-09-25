import type { Metadata } from "next";
import { BilingualText } from "@/components/diagnose/BilingualText";
import {
  DiagnoseQuiz,
  type MiddleAreasByLarge,
} from "@/components/diagnose/DiagnoseQuiz";
import { diagnoseCopy } from "@/lib/diagnose/copy";
import { buildPageMetadata } from "@/lib/seo";
import { listLargeAreas, listMiddleAreas } from "@/lib/shops";
import type { AreaStat } from "@/lib/shops";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "好み診断",
  description:
    "エリアとこだわり条件から、あなたに合いそうなラーメン店を提案します。結果からそのまま店舗比較もできます。 Find ramen shops that match your taste — then compare them side by side.",
  path: "/diagnose",
  noIndex: true,
});

async function loadAreaOptions(): Promise<{
  largeAreas: AreaStat[];
  middleByLarge: MiddleAreasByLarge;
}> {
  const largeAreas = await listLargeAreas({ ramenOnly: true });
  const middleEntries = await Promise.all(
    largeAreas.map(async (area) => {
      const middle = await listMiddleAreas(area.code, { ramenOnly: true });
      return [area.code, middle] as const;
    }),
  );
  return {
    largeAreas,
    middleByLarge: Object.fromEntries(middleEntries),
  };
}

export default async function DiagnosePage() {
  const { largeAreas, middleByLarge } = await loadAreaOptions();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-2xl">
        <BilingualText
          as="h1"
          ja={diagnoseCopy.page.title.ja}
          en={diagnoseCopy.page.title.en}
          className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-ink sm:text-4xl"
          jaClassName="block"
          enClassName="mt-1.5 font-sans text-sm tracking-normal sm:text-base"
        />
        <BilingualText
          as="p"
          ja={diagnoseCopy.page.lead.ja}
          en={diagnoseCopy.page.lead.en}
          className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base"
          tone="muted"
        />
      </header>

      <div className="mt-10">
        <DiagnoseQuiz largeAreas={largeAreas} middleByLarge={middleByLarge} />
      </div>
    </div>
  );
}
