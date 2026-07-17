import type { ClientStatus } from "../types/client";

/** Map Fineract client status codes to display labels */
export const CLIENT_STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    active: "Active",
    closed: "Closed",
    rejected: "Rejected",
    "transfer in progress": "Transfer In Progress",
    "transfer on hold": "Transfer On Hold",
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
export const CLIENT_STATUS_CONFIG: Record<string, {
    variant: "success" | "warning" | "error" | "info" | "default";
    label: string;
}> = {
    pending: { variant: "info", label: "Pending" },
    active: { variant: "success", label: "Active" },
    closed: { variant: "default", label: "Closed" },
    rejected: { variant: "error", label: "Rejected" },
    "transfer in progress": { variant: "warning", label: "Transfer In Progress" },
    "transfer on hold": { variant: "warning", label: "Transfer On Hold" },
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
