import { ImageResponse } from "next/og";
import { headers } from "next/headers";
import {
  OG_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  fetchHeroImageBuffer,
  resolveOgBaseUrl,
  safeLoadSiteOgFonts,
} from "@/lib/og-image";
import { SITE_DISPLAY_NAME, SITE_TITLE_DEFAULT } from "@/lib/site";

export const alt = SITE_DISPLAY_NAME;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const headerList = await headers();
  const baseUrl = resolveOgBaseUrl(headerList);
  const [heroBuffer, fonts] = await Promise.all([
    fetchHeroImageBuffer(baseUrl),
    safeLoadSiteOgFonts(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "linear-gradient(105deg, #5c3834 0%, #d46b58 100%)",
        }}
      >
        {heroBuffer ? (
          <img
            src={heroBuffer as unknown as string}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(105deg, rgba(20, 8, 6, 0.78) 0%, rgba(92, 56, 52, 0.58) 45%, rgba(212, 107, 88, 0.42) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            width: "100%",
            height: "100%",
            padding: "56px 64px",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Shippori Mincho",
                fontSize: 52,
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#fff8f6",
              }}
            >
              <span style={{ color: "#e88976" }}>Ramen</span>
              <span style={{ marginLeft: 10 }}>Compare</span>
            </div>
            <div
              style={{
                width: 120,
                height: 4,
                background: "linear-gradient(90deg, #e88976, #ffd8ce)",
                borderRadius: 2,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "Zen Kaku Gothic New",
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.45,
              color: "#ffd8ce",
              maxWidth: 900,
            }}
          >
            {SITE_TITLE_DEFAULT}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.map((font) => ({
        name: font.name,
        data: font.data,
        style: "normal" as const,
        weight: font.weight,
      })),
    },
  );
}
