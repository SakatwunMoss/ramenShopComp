import type { RamenStyleId } from "@/lib/types";

/** 商品提供元（将来 yahoo を追加予定） */
export type AffiliateProviderId = "rakuten" | "yahoo";

/** 系統キー＋汎用フォールバック */
export type AffiliateStyleKey = RamenStyleId | "general";

export type AffiliateProduct = {
  /** 提供元横断で一意（例: rakuten:shopCode:itemCode） */
  id: string;
  provider: AffiliateProviderId;
  styleKey: AffiliateStyleKey;
  name: string;
  price: number;
  imageUrl: string;
  /** アフィリエイトリンク（API の affiliateUrl をそのまま） */
  affiliateUrl: string;
  shopName: string;
  reviewAverage: number;
  reviewCount: number;
  fetchedAt: string;
};

export type AffiliateProductsSnapshot = {
  generated_at: string;
  products: AffiliateProduct[];
};
