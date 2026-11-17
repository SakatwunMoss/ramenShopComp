/**
 * 系統あたりの選定で使うレビュー閾値（提供元共通）。
 * 厳しい順に試し、件数に満たなければ段階的に緩める。
 */
export const AFFILIATE_REVIEW_THRESHOLDS = [
  { minCount: 5, minAverage: 3.5 },
  { minCount: 3, minAverage: 3.0 },
  { minCount: 1, minAverage: 0 },
  { minCount: 0, minAverage: 0 },
] as const;
