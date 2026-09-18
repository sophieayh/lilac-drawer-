export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;
}

export function formatPriceFixed(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function calculateDiscountPercent(
  priceCents: number,
  compareAtPriceCents: number | null | undefined
): number | null {
  if (!compareAtPriceCents || compareAtPriceCents <= priceCents) return null;
  return Math.round(((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
