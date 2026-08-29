import type { JsonLdGraph } from "@/lib/json-ld";

type Props = {
  data: JsonLdGraph;
};

/** schema.org JSON-LD を1つの script タグで出力 */
export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
