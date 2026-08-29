import Link from "next/link";
import type { ReactNode } from "react";
import { AREA_LABELS } from "@/lib/shops";
import type { Shop } from "@/lib/types";

type CompareRow = {
  key: string;
  label: string;
  render: (shop: Shop) => ReactNode;
  isImage?: boolean;
  isMultiline?: boolean;
};

function ShopImage({ shop }: { shop: Shop }) {
  return (
    <div className="flex justify-center">
      {shop.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shop.image_url}
          alt={`${shop.name}の画像`}
          className="h-[120px] w-[120px] object-cover"
        />
      ) : (
        <div className="flex h-[120px] w-[120px] items-center justify-center bg-bg-deep font-[family-name:var(--font-display)] text-3xl text-lacquer/35">
          麺
        </div>
      )}
    </div>
  );
}

function areaLabel(shop: Shop): string {
  if (!shop.large_area_code) return "—";
  return AREA_LABELS[shop.large_area_code] ?? shop.large_area_code;
}

const COMPARE_ROWS: CompareRow[] = [
  {
    key: "image",
    label: "画像",
    isImage: true,
    render: (shop) => <ShopImage shop={shop} />,
  },
  {
    key: "name",
    label: "店名",
    render: (shop) => shop.name,
  },
  {
    key: "area",
    label: "エリア",
    render: (shop) => areaLabel(shop),
  },
  {
    key: "genre",
    label: "ジャンル",
    render: (shop) => shop.genre ?? "—",
  },
  {
    key: "budget",
    label: "予算目安",
    render: (shop) => shop.budget ?? "—",
  },
  {
    key: "address",
    label: "住所",
    isMultiline: true,
    render: (shop) => shop.address ?? "—",
  },
  {
    key: "access",
    label: "アクセス",
    isMultiline: true,
    render: (shop) => shop.access ?? "—",
  },
  {
    key: "open_hours",
    label: "営業時間",
    isMultiline: true,
    render: (shop) => shop.open_hours ?? "—",
  },
  {
    key: "close_days",
    label: "定休日",
    render: (shop) => shop.close_days ?? "—",
  },
  {
    key: "phone",
    label: "電話",
    render: (shop) => shop.phone ?? "—",
  },
];

type CompareTableProps = {
  shops: Shop[];
};

export function CompareTable({ shops }: CompareTableProps) {
  return (
    <div className="overflow-x-auto border border-line bg-steam/80">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b border-line bg-bg/60 text-ink-muted">
          <tr>
            <th className="sticky left-0 z-10 min-w-[7rem] bg-bg/95 px-4 py-3 font-medium backdrop-blur-sm">
              項目
            </th>
            {shops.map((shop) => (
              <th
                key={shop.id}
                className="min-w-[10rem] px-4 py-3 font-medium text-ink"
              >
                <Link
                  href={`/shops/${shop.id}`}
                  className="font-[family-name:var(--font-display)] tracking-wide transition-colors hover:text-lacquer"
                >
                  {shop.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-ink">
          {COMPARE_ROWS.map((row) => (
            <tr key={row.key}>
              <th
                className={`sticky left-0 z-10 bg-steam font-medium text-ink-muted ${
                  row.isImage ? "px-4 py-4 align-middle" : "px-4 py-3"
                }`}
              >
                {row.label}
              </th>
              {shops.map((shop) => (
                <td
                  key={shop.id}
                  className={`${
                    row.isImage
                      ? "px-4 py-4 align-middle"
                      : "px-4 py-3 align-top"
                  } ${row.isMultiline ? "max-w-xs whitespace-pre-wrap" : ""}`}
                >
                  {row.render(shop)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th className="sticky left-0 z-10 bg-steam px-4 py-3 font-medium text-ink-muted">
              リンク
            </th>
            {shops.map((shop) => (
              <td key={shop.id} className="px-4 py-3 align-top">
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/shops/${shop.id}`}
                    className="text-lacquer transition-colors hover:text-lacquer-deep"
                  >
                    詳細を見る
                  </Link>
                  {shop.shop_url ? (
                    <a
                      href={shop.shop_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-muted transition-colors hover:text-lacquer"
                    >
                      HotPepper
                    </a>
                  ) : null}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
