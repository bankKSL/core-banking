/**
 * Formatting helpers for Fineract/Fineract payloads.
 * Dates are returned either as ISO strings or [yyyy, mm, dd] arrays.
 */

/** Convert a Fineract date (array or string) to ISO yyyy-MM-dd, or null */
export function toIsoDate(raw: unknown): string | null {
  if (raw == null) return null;
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, d] = raw as number[];
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  if (typeof raw === "string" && raw.length > 0) {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return parsed.toISOString().split("T")[0];
  }
  return null;
}

/** Human-readable date (locale) from a Fineract date value */
export function formatFineractDate(raw: unknown): string {
  const iso = toIsoDate(raw);
  if (!iso) return "—";
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleDateString();
}

/** Currency formatting (defaults to USD) */
export function formatMoney(amount: number | null | undefined, code = "USD", maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits,
  }).format(amount ?? 0);
}
