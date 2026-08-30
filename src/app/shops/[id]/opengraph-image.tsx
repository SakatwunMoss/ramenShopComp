import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  fetchHeroImageBuffer,
  fetchImageAsArrayBuffer,
  loadOgFonts,
} from "@/lib/og-image";
import { AREA_LABELS, getAreaLabel, getShopById } from "@/lib/shops";
import type { Shop } from "@/lib/types";

export const alt = "店舗情報";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamic = "force-dynamic";

async function resolveAreaText(shop: Shop): Promise<string> {
  const largeLabel = shop.large_area_code
    ? (AREA_LABELS[shop.large_area_code] ??
      (await getAreaLabel(shop.large_area_code)) ??
      shop.large_area_code)
    : null;
  const middleLabel = shop.middle_area_code
    ? ((await getAreaLabel(shop.middle_area_code)) ?? shop.middle_area_code)
    : null;

  return [largeLabel, middleLabel].filter(Boolean).join(" / ");
}

async function resolveShopImageSrc(
  shop: Shop,
): Promise<ArrayBuffer | null> {
  const url = shop.image_url?.trim();
  if (url) {
    const buffer = await fetchImageAsArrayBuffer(url);
    if (buffer) return buffer;
  }

  return fetchHeroImageBuffer();
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shop = await getShopById(id);
  if (!shop) notFound();

  const [areaText, imageSrc, fonts] = await Promise.all([
    resolveAreaText(shop),
    resolveShopImageSrc(shop),
    loadOgFonts(),
  ]);

  const genre = shop.genre?.trim() || "ラーメン";
  const budget = shop.budget?.trim();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: `linear-gradient(135deg, ${OG_COLORS.heroShade} 0%, ${OG_COLORS.lacquerDeep} 100%)`,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "55%",
            height: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              position: "relative",
            }}
          >
            {imageSrc ? (
              <img
                src={imageSrc as unknown as string}
                alt=""
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  background: `linear-gradient(160deg, ${OG_COLORS.ink} 0%, ${OG_COLORS.lacquerDeep} 100%)`,
                }}
              />
            )}
            <div
              style={{
                display: "flex",
                position: "absolute",
                top: 0,
                right: 0,
                width: 120,
                height: "100%",
                background: `linear-gradient(90deg, rgba(92, 56, 52, 0) 0%, rgba(74, 47, 44, 0.92) 100%)`,
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "45%",
            height: "100%",
            padding: "48px 52px 48px 28px",
            background: `linear-gradient(180deg, rgba(74, 47, 44, 0.96) 0%, rgba(92, 56, 52, 0.98) 55%, rgba(212, 107, 88, 0.35) 100%)`,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Noto Sans JP",
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: OG_COLORS.steam,
            }}
          >
            <span style={{ color: OG_COLORS.lacquer }}>Ramen</span>
            <span style={{ marginLeft: 8 }}>Compare</span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {areaText ? (
                <span
                  style={{
                    display: "flex",
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(232, 137, 118, 0.22)",
                    color: OG_COLORS.bgDeep,
                    fontFamily: "Noto Sans JP",
                    fontSize: 20,
                    fontWeight: 500,
                  }}
                >
                  {areaText}
                </span>
              ) : null}
              <span
                style={{
                  display: "flex",
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: "rgba(255, 248, 246, 0.12)",
                  color: OG_COLORS.steam,
                  fontFamily: "Noto Sans JP",
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                {genre}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Noto Sans JP",
                fontSize: 40,
                fontWeight: 700,
                lineHeight: 1.35,
                color: OG_COLORS.steam,
              }}
            >
              {shop.name}
            </div>

            {budget ? (
              <div
                style={{
                  display: "flex",
                  fontFamily: "Noto Sans JP",
                  fontSize: 24,
                  fontWeight: 500,
                  color: OG_COLORS.bgDeep,
                }}
              >
                予算目安: {budget}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: fonts.map((font) => ({
        name: font.name,
        data: font.data,
        style: "normal" as const,
        weight: font.weight,
      })),
    },
  );
}
