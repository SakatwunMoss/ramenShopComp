import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "麺くらべ | 全国ラーメン店比較",
    template: "%s | 麺くらべ",
  },
  description:
    "全国のラーメン店をエリア・系統から比較・検索。ホットペッパーグルメ掲載店舗を中心に掲載しています。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
