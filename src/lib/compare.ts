export const MAX_COMPARE = 3;

export function parseCompareIds(
  raw: string | string[] | undefined,
): string[] {
  const value = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  const ids = value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return [...new Set(ids)];
}

export function comparePagePath(ids: string[]): string {
  if (ids.length === 0) {
    return "/compare";
  }
  return `/compare?ids=${ids.map(encodeURIComponent).join(",")}`;
}
