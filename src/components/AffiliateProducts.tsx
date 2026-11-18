import { AffiliateProductsRandom } from "@/components/AffiliateProductsRandom";
import { AffiliateProductsView } from "@/components/AffiliateProductsView";
import { loadAffiliateSnapshot } from "@/lib/affiliate/products-data";
import {
  isDeterminedAffiliateStyle,
  selectAffiliateProducts,
} from "@/lib/affiliate/select";
import type {
  AffiliateProduct,
  AffiliateProductsSnapshot,
  AffiliateStyleKey,
} from "@/lib/affiliate/types";

type AffiliateProductsProps = {
  /** 系統キー（ちょうど1つなら系統枠、0/複数なら全商品からランダム） */
  styleKeys?: Array<AffiliateStyleKey | string | null | undefined>;
  limit?: number;
  className?: string;
  /** 診断などクライアント側で既に選定済みの場合 */
  products?: AffiliateProduct[];
  /** クライアント側でスナップショットから選定する場合 */
  snapshot?: AffiliateProductsSnapshot | null;
};

/**
 * サーバーコンポーネント用。
 * - 系統確定: サーバーで選定して描画
 * - 混在/未指定: スナップショットをクライアントへ渡し、useEffect でランダム選定
 * 商品が無い場合はブロックごと非表示。
 */
export async function AffiliateProducts({
  styleKeys = [],
  limit = 2,
  className = "",
  products,
  snapshot,
}: AffiliateProductsProps) {
  if (products) {
    return <AffiliateProductsView products={products} className={className} />;
  }

  const data = snapshot ?? (await loadAffiliateSnapshot());

  if (isDeterminedAffiliateStyle(styleKeys)) {
    const selected = selectAffiliateProducts(data, styleKeys, limit);
    return <AffiliateProductsView products={selected} className={className} />;
  }

  return (
    <AffiliateProductsRandom
      snapshot={data}
      limit={limit}
      className={className}
    />
  );
}
