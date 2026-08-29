import Link from "next/link";

type AreaLink = {
  code: string;
  name: string;
  count: number;
  href: string;
};

type Props = {
  title: string;
  areas: AreaLink[];
};

export function RelatedAreas({ title, areas }: Props) {
  if (areas.length === 0) return null;

  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide">
        {title}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {areas.map((area) => (
          <li key={area.code}>
            <Link
              href={area.href}
              className="inline-block border border-line bg-steam/80 px-3 py-1.5 text-sm transition hover:border-lacquer hover:text-lacquer"
            >
              {area.name}
              <span className="ml-1 text-ink-muted">({area.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
