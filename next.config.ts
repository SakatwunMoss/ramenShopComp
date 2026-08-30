import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/opengraph-image",
        destination: "/opengraph-image.png",
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
