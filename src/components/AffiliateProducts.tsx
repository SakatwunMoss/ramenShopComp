import { AffiliateProductsView } from "@/components/AffiliateProductsView";
import { loadAffiliateSnapshot } from "@/lib/affiliate/products-data";
import { selectAffiliateProducts } from "@/lib/affiliate/select";
import type {
  AffiliateProduct,
  AffiliateProductsSnapshot,
  AffiliateStyleKey,
} from "@/lib/affiliate/types";

type AffiliateProductsProps = {
  /** 系統キー（単一・複数・未指定可） */
  styleKeys?: Array<AffiliateStyleKey | string | null | undefined>;
  limit?: number;
  className?: string;
  /** 診断などクライアント側で既に選定済みの場合 */
  products?: AffiliateProduct[];
  /** クライアント側でスナップショットから選定する場合 */
  snapshot?: AffiliateProductsSnapshot | null;
};

/**
 * サーバーコンポーネント用。R2（または開発時サンプル）から読み、系統に合う商品を表示。
 * 商品が無い場合はブロックごと非表示。
 */
export async function AffiliateProducts({
  styleKeys = [],
  limit = 2,
  className = "",
  products,
  snapshot,
}: AffiliateProductsProps) {
  let selected = products ?? null;

  if (!selected) {
    const data = snapshot ?? (await loadAffiliateSnapshot());
    selected = selectAffiliateProducts(data, styleKeys, limit);
  }

  return <AffiliateProductsView products={selected} className={className} />;
}
