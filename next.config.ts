import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/opengraph-image",
        destination: "/opengraph-image.png",
        permanent: true,
      },
      // 店舗別 OG 画像ルート削除後もクロールされ続ける URL → 共通 OG へ
      {
        source: "/shops/:id/opengraph-image",
        destination: "/opengraph-image.png",
        permanent: true,
      },
      {
        source: "/shops/:id/opengraph-image.png",
        destination: "/opengraph-image.png",
        permanent: true,
      },
      // 旧 generateSitemaps() 時代の分割 URL
      {
        source: "/sitemap/:id.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/sitemap/:id",
        destination: "/sitemap.xml",
        permanent: true,
      },
    ];
  },
  images: {
    // Cloudflare Workers では標準の Image Optimization が使えない。
    // OpenNext の IMAGES バインディング（Cloudflare Images）を有効化するまで
    // unoptimized で next/image のレイアウト機能のみ利用する。
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imgfp.hotp.jp",
      },
      {
        protocol: "https",
        hostname: "thumbnail.image.rakuten.co.jp",
      },
      {
        protocol: "https",
        hostname: "tshop.r10s.jp",
      },
      {
        protocol: "https",
        hostname: "shop.r10s.jp",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;

// `next dev` 時のみ Cloudflare バインディングをローカルで模擬
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  });
}
