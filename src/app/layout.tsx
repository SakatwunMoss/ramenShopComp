import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const siteTitle = "Ramen Compare | 全国ラーメン店比較";
const siteDescription =
  "全国のラーメン店をエリア・系統から比較・検索。ホットペッパーグルメ掲載店舗を中心に掲載しています。";

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
      default: siteTitle,
      template: "%s | Ramen Compare",
    },
    description: siteDescription,
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      siteName: "Ramen Compare",
      locale: "ja_JP",
      type: "website",
      images: [
        {
          url: "/hero-ramen.png",
          width: 1584,
          height: 672,
          alt: "Ramen Compare",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: ["/hero-ramen.png"],
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
