import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
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
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
