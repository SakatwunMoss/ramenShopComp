import Link from "next/link";
import { shopDetailPath } from "@/lib/seo";
import type { Shop } from "@/lib/types";

type Props = {
  title: string;
  shops: Shop[];
};

export function RelatedShops({ title, shops }: Props) {
  if (shops.length === 0) return null;

  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide">
        {title}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {shops.map((shop) => (
          <li key={shop.id}>
            <Link
              href={shopDetailPath(shop.id)}
              className="block border border-line bg-steam/70 px-4 py-3 transition hover:border-lacquer/50 hover:text-lacquer"
            >
              <span className="font-[family-name:var(--font-display)] text-base tracking-wide">
                {shop.name}
              </span>
              <span className="mt-1 block text-sm text-ink-muted">
                {[shop.genre, shop.budget].filter(Boolean).join(" · ") ||
                  "ラーメン"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
