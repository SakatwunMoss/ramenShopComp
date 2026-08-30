import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_DISPLAY_NAME, SITE_TITLE_DEFAULT } from "@/lib/site";

export const alt = SITE_DISPLAY_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const heroData = await readFile(
  join(process.cwd(), "public/hero-ramen.png"),
  "base64",
);
const heroSrc = `data:image/png;base64,${heroData}`;

const shipporiBold = await readFile(
  join(
    process.cwd(),
    "node_modules/@fontsource/shippori-mincho/files/shippori-mincho-japanese-700-normal.woff",
  ),
);

const zenMedium = await readFile(
  join(
    process.cwd(),
    "node_modules/@fontsource/zen-kaku-gothic-new/files/zen-kaku-gothic-new-japanese-500-normal.woff",
  ),
);

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
        }}
      >
        <img
          src={heroSrc}
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
      fonts: [
        {
          name: "Shippori Mincho",
          data: shipporiBold,
          style: "normal",
          weight: 700,
        },
        {
          name: "Zen Kaku Gothic New",
          data: zenMedium,
          style: "normal",
          weight: 500,
        },
      ],
    },
  );
}
