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

export function formatDate(raw: unknown): string {
  const iso = toIsoDate(raw);
  if (!iso) return "—";
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleDateString();
}

export function formatMoney(amount: number | null | undefined, code = "USD", maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits,
  }).format(amount ?? 0);
}

/**
 * Render-safe text for fields that may be a plain string OR an
 * EnumOptionData object ({ id, code, value }) returned by Fineract.
 */
export function toDisplayText(raw: unknown): string {
  if (raw == null || raw === "") return "—";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  if (Array.isArray(raw)) return raw.map(toDisplayText).filter((s) => s !== "—").join(", ") || "—";
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["value", "name", "label", "code"] as const) {
      const v = obj[key];
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  return String(raw);
}
