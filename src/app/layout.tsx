import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  SITE_DESCRIPTION,
  SITE_DISPLAY_NAME,
  SITE_TITLE_DEFAULT,
} from "@/lib/site";
import "@fontsource/shippori-mincho/japanese-500.css";
import "@fontsource/shippori-mincho/japanese-700.css";
import "@fontsource/shippori-mincho/latin-500.css";
import "@fontsource/shippori-mincho/latin-700.css";
import "@fontsource/zen-kaku-gothic-new/japanese-400.css";
import "@fontsource/zen-kaku-gothic-new/japanese-500.css";
import "@fontsource/zen-kaku-gothic-new/japanese-700.css";
import "@fontsource/zen-kaku-gothic-new/latin-400.css";
import "@fontsource/zen-kaku-gothic-new/latin-500.css";
import "@fontsource/zen-kaku-gothic-new/latin-700.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "localhost:3000";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.");
  const protocol =
    headerList.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  const metadataBase = new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`,
  );

  return {
    metadataBase,
    title: {
      default: SITE_TITLE_DEFAULT,
      template: `%s｜ramen-compare`,
    },
    description: SITE_DESCRIPTION,
    openGraph: {
      title: SITE_TITLE_DEFAULT,
      description: SITE_DESCRIPTION,
      siteName: SITE_DISPLAY_NAME,
      locale: "ja_JP",
      type: "website",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: DEFAULT_OG_IMAGE_WIDTH,
          height: DEFAULT_OG_IMAGE_HEIGHT,
          alt: SITE_DISPLAY_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE_DEFAULT,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    other: {
      "google-adsense-account": "ca-pub-7938835154204291",
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
