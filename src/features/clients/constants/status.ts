import i18n from "@/i18n";
import type { ClientStatus } from "../types/client";

/** Map Fineract client status codes to display labels */
export const CLIENT_STATUS_LABELS: Record<string, string> = {
  pending: i18n.t("Pending"),
  active: i18n.t("Active"),
  closed: i18n.t("Closed"),
  rejected: i18n.t("Rejected"),
  "transfer in progress": i18n.t("Transfer In Progress"),
  "transfer on hold": i18n.t("Transfer On Hold"),
};

/** Map Fineract numeric status IDs to status strings */
export const STATUS_ID_MAP: Record<number, ClientStatus> = {
  100: "pending",
  300: "active",
  600: "closed",
  700: "rejected",
  800: "transfer in progress",
  900: "transfer on hold",
};

/** Badge variant config per Fineract client status */
export const CLIENT_STATUS_CONFIG: Record<
  string,
  {
    variant: "success" | "warning" | "error" | "info" | "default";
    label: string;
  }
> = {
  pending: { variant: "info", label: i18n.t("Pending") },
  active: { variant: "success", label: i18n.t("Active") },
  closed: { variant: "default", label: i18n.t("Closed") },
  rejected: { variant: "error", label: i18n.t("Rejected") },
  "transfer in progress": { variant: "warning", label: i18n.t("Transfer In Progress") },
  "transfer on hold": { variant: "warning", label: i18n.t("Transfer On Hold") },
};

/** Default page size for client lists */
export const CLIENTS_PAGE_SIZE = 15;

/** Debounce delay for search input (ms) */
export const SEARCH_DEBOUNCE_MS = 400;

/** Accepted sortable columns */
export const CLIENT_SORT_COLUMNS = [
  "displayName",
  "accountNo",
  "officeName",
  "staffName",
  "status",
  "activationDate",
] as const;

export type ClientSortColumn = (typeof CLIENT_SORT_COLUMNS)[number];
