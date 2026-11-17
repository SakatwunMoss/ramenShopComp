import Link from "next/link";
import { areaLargePath } from "@/lib/seo";
import { STYLE_FEW_RESULTS_THRESHOLD } from "@/lib/site";

type Props = {
  total: number;
  hasStyle: boolean;
  areaCode?: string;
  areaLabel?: string;
};

/** 系統フィルタでヒットが少ないときのエリア誘導注意書き */
export function FewResultsNotice({
  total,
  hasStyle,
  areaCode,
  areaLabel,
}: Props) {
  if (!hasStyle || total > STYLE_FEW_RESULTS_THRESHOLD) return null;

  const href = areaCode ? areaLargePath(areaCode) : "/areas";
  const linkLabel = areaCode
    ? `${areaLabel?.trim() || areaCode}のエリアページを見る`
    : "エリア別ページを見る";

  return (
    <aside
      role="note"
      className="mt-6 border-l-4 border-lacquer/50 bg-lacquer/10 px-4 py-3 text-sm leading-relaxed text-ink-muted"
    >
      <p>
        系統によっては、店舗情報に該当する情報が少なくヒット件数が少なくなることがあります。エリア別ページでは、そのエリアの店舗をまとめてご覧いただけます。
      </p>
      <p className="mt-2">
        <Link
          href={href}
          className="font-medium text-lacquer underline-offset-2 hover:underline"
        >
          {linkLabel}
        </Link>
      </p>
    </aside>
  );
}
