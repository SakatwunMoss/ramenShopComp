import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { RAMEN_STYLES, type RamenStyleId } from "@/lib/types";

export const metadata: Metadata = buildPageMetadata({
  title: "Ramen Style Guide | Types of Ramen Explained",
  description:
    "A quick guide to shoyu, miso, tonkotsu, shio, iekei, Jiro-inspired, tsukemen, tantanmen, and abura soba — the main ramen styles you'll find on Ramen Compare.",
  path: "/guide/ramen-styles",
  absoluteTitle: true,
});

const STYLE_LABELS = Object.fromEntries(
  RAMEN_STYLES.map((s) => [s.id, s.label]),
) as Record<RamenStyleId, string>;

const STYLES = [
  {
    styleId: "shoyu" as const,
    name: "Shoyu (Soy Sauce)",
    description:
      "A clear, brown broth seasoned with soy sauce. Balanced and savory — the most classic ramen style in Japan.",
  },
  {
    styleId: "miso" as const,
    name: "Miso",
    description:
      "A rich, hearty broth made with fermented soybean paste. Nutty, slightly sweet, and often paired with butter or corn.",
  },
  {
    styleId: "tonkotsu" as const,
    name: "Tonkotsu (Pork Bone)",
    description:
      "A creamy, milky-white broth simmered from pork bones for hours. Deep, fatty, and full-bodied — famous as the base for Hakata-style ramen.",
  },
  {
    styleId: "shio" as const,
    name: "Shio (Salt)",
    description:
      "A light, clear broth seasoned simply with salt. Delicate and clean, letting the base stock's flavor shine through.",
  },
  {
    styleId: "iekei" as const,
    name: "Iekei",
    description:
      "A Yokohama-born style blending tonkotsu and shoyu, served with thick, flat noodles and a slice of nori. Rich but not as heavy as pure tonkotsu. Also known as EAK.",
  },
  {
    styleId: "jiro" as const,
    name: "Jiro-inspired (Jiro-kei)",
    description:
      "Known for massive portions, thick noodles, mountains of garlic, and generous fatty pork slices. Not for the faint of appetite.",
  },
  {
    styleId: "tsukemen" as const,
    name: "Tsukemen (Dipping Noodles)",
    description:
      "Noodles and broth are served separately — you dip the noodles into a concentrated, often thicker sauce before eating.",
  },
  {
    name: "Tantanmen",
    description:
      "A spicy, sesame-based ramen with roots in Sichuan cuisine. Often features ground pork and a numbing chili kick.",
  },
  {
    name: "Abura Soba (Oil Noodles)",
    description:
      'A "brothless" ramen tossed in seasoned oil and sauce instead of served in soup. Rich and noodle-forward.',
  },
] as const;

export default function RamenStylesGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
        Ramen Style Guide
      </h1>

      <div
        lang="en"
        className="mt-8 space-y-8 text-sm leading-relaxed text-ink-muted sm:text-base"
      >
        <p>
          Not all ramen is the same. Here&apos;s a quick guide to the main
          styles you&apos;ll find on this site.
        </p>

        <div className="space-y-6">
          {STYLES.map((style) => {
            const labelJa =
              "styleId" in style ? STYLE_LABELS[style.styleId] : undefined;

            return (
              <section key={style.name}>
                <h2 className="font-medium text-ink">
                  {style.name}
                  {labelJa ? (
                    <span className="ml-1.5 text-sm font-normal text-ink-muted/75">
                      ({labelJa})
                    </span>
                  ) : null}
                </h2>
                <p className="mt-1">{style.description}</p>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
