import Image from "next/image";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import {
  formatImageCredit,
  RAMEN_STYLE_IMAGES,
  type RamenStyleImageKey,
} from "@/lib/ramen-style-images";
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

const STYLES: {
  styleId?: RamenStyleId;
  imageKey: RamenStyleImageKey;
  name: string;
  description: string;
}[] = [
  {
    styleId: "shoyu",
    imageKey: "shoyu",
    name: "Shoyu (Soy Sauce)",
    description:
      "A clear, brown broth seasoned with soy sauce. Balanced and savory — the most classic ramen style in Japan.",
  },
  {
    styleId: "miso",
    imageKey: "miso",
    name: "Miso",
    description:
      "A rich, hearty broth made with fermented soybean paste. Nutty, slightly sweet, and often paired with butter or corn.",
  },
  {
    styleId: "tonkotsu",
    imageKey: "tonkotsu",
    name: "Tonkotsu (Pork Bone)",
    description:
      "A creamy, milky-white broth simmered from pork bones for hours. Deep, fatty, and full-bodied — famous as the base for Hakata-style ramen.",
  },
  {
    styleId: "shio",
    imageKey: "shio",
    name: "Shio (Salt)",
    description:
      "A light, clear broth seasoned simply with salt. Delicate and clean, letting the base stock's flavor shine through.",
  },
  {
    styleId: "iekei",
    imageKey: "iekei",
    name: "Iekei",
    description:
      "A Yokohama-born style blending tonkotsu and shoyu, served with thick, flat noodles and a slice of nori. Rich but not as heavy as pure tonkotsu. Also known as EAK.",
  },
  {
    styleId: "jiro",
    imageKey: "jiro",
    name: "Jiro-inspired (Jiro-kei)",
    description:
      "Known for massive portions, thick noodles, mountains of garlic, and generous fatty pork slices. Not for the faint of appetite.",
  },
  {
    styleId: "tsukemen",
    imageKey: "tsukemen",
    name: "Tsukemen (Dipping Noodles)",
    description:
      "Noodles and broth are served separately — you dip the noodles into a concentrated, often thicker sauce before eating.",
  },
  {
    imageKey: "tantanmen",
    name: "Tantanmen",
    description:
      "A spicy, sesame-based ramen with roots in Sichuan cuisine. Often features ground pork and a numbing chili kick.",
  },
  {
    imageKey: "abura-soba",
    name: "Abura Soba (Oil Noodles)",
    description:
      'A "brothless" ramen tossed in seasoned oil and sauce instead of served in soup. Rich and noodle-forward.',
  },
];

export default function RamenStylesGuidePage() {
  const imageCredits = Object.values(RAMEN_STYLE_IMAGES);

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

        <div className="space-y-10">
          {STYLES.map((style) => {
            const labelJa = style.styleId
              ? STYLE_LABELS[style.styleId]
              : undefined;
            const image = RAMEN_STYLE_IMAGES[style.imageKey];

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

                <figure className="mt-3">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-bg-deep">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-1.5 text-xs text-ink-muted/70">
                    {formatImageCredit(image)}
                  </figcaption>
                </figure>

                <p className="mt-3">{style.description}</p>
              </section>
            );
          })}
        </div>

        <section
          aria-labelledby="photo-credits-heading"
          className="border-t border-ink/10 pt-8"
        >
          <h2
            id="photo-credits-heading"
            className="text-xs font-medium uppercase tracking-wider text-ink-muted/80"
          >
            Photo credits
          </h2>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-muted/70">
            {imageCredits.map((image) => (
              <li key={image.src}>
                <span className="text-ink-muted">{image.originalFileName}</span>
                {" — "}
                {image.author}
                {" / "}
                <a
                  href={image.licenseUrl}
                  className="underline decoration-ink/20 underline-offset-2 hover:text-ink"
                  rel="license noopener noreferrer"
                  target="_blank"
                >
                  {image.license}
                </a>
                {" / "}
                <a
                  href={image.filePageUrl}
                  className="underline decoration-ink/20 underline-offset-2 hover:text-ink"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Wikimedia Commons
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
