import type { Bilingual } from "@/lib/diagnose/copy";

type Tone = "default" | "onLacquer" | "muted";

type Props = {
  ja: string;
  en: string;
  /** ラッパー要素 */
  as?: "span" | "p" | "h1" | "h2" | "div";
  className?: string;
  jaClassName?: string;
  enClassName?: string;
  /** onLacquer: 塗りボタン上 / muted: 補足文向け */
  tone?: Tone;
  /** true のとき英語を横並び（狭いナビ向け） */
  inline?: boolean;
};

const enToneClass: Record<Tone, string> = {
  default: "text-ink-muted",
  onLacquer: "text-steam/80",
  muted: "text-ink-muted/80",
};

/**
 * 日本語を主、英語を小さめに併記（サイト全体 i18n ではない診断まわり専用）。
 */
export function BilingualText({
  ja,
  en,
  as: Tag = "span",
  className,
  jaClassName,
  enClassName,
  tone = "default",
  inline = false,
}: Props) {
  return (
    <Tag className={className}>
      <span lang="ja" className={jaClassName}>
        {ja}
      </span>
      {inline ? (
        <span
          lang="en"
          className={[
            "ml-1.5 text-[10px] font-normal leading-snug tracking-normal normal-case sm:text-[11px]",
            enToneClass[tone],
            enClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {en}
        </span>
      ) : (
        <span
          lang="en"
          className={[
            "mt-0.5 block text-[11px] font-normal leading-snug tracking-normal normal-case sm:text-xs",
            enToneClass[tone],
            enClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {en}
        </span>
      )}
    </Tag>
  );
}

export function bilingualProps(copy: Bilingual): Pick<Props, "ja" | "en"> {
  return { ja: copy.ja, en: copy.en };
}
