// ─── Group Status Configuration ─────────────────────────────────

export const GROUP_STATUS_CONFIG: Record<
  string,
  {
    variant: "success" | "warning" | "error" | "info" | "default";
    label: string;
  }
> = {
  "grouping.status.pending": { variant: "info", label: "Pending" },
  "grouping.status.active": { variant: "success", label: "Active" },
  "grouping.status.closed": { variant: "default", label: "Closed" },
  "grouping.status.transfer.in.progress": { variant: "warning", label: "Transfer in Progress" },
  pending: { variant: "info", label: "Pending" },
  active: { variant: "success", label: "Active" },
  closed: { variant: "default", label: "Closed" },
};

/** Fineract numeric group status → label mapping */
export const GROUP_STATUS_ID_MAP: Record<number, string> = {
  100: "Pending",
  300: "Active",
  600: "Closed",
};

/** Normalize a group row to a human-readable status label */
export const resolveGroupStatusLabel = (status?: { id?: number; code?: string; description?: string }): string => {
  if (status?.description) return status.description;
  if (status?.code && GROUP_STATUS_CONFIG[status.code]) return GROUP_STATUS_CONFIG[status.code].label;
  if (status?.id != null) return GROUP_STATUS_ID_MAP[status.id] ?? "Unknown";
  return "Unknown";
};

export const GROUPS_PAGE_SIZE = 10;
export const GROUP_SEARCH_DEBOUNCE_MS = 400;
export const GROUP_DATE_FORMAT = "yyyy-MM-dd";
export const GROUP_LOCALE = "en";
