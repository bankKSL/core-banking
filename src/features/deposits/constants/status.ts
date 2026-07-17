import type { SavingsAccountStatus } from "../types/deposit";

export const SAVINGS_STATUS_LABELS: Record<string, string> = {
    "Submitted and pending approval": "Pending",
    "Approved": "Approved",
    "Active": "Active",
    "Closed": "Closed",
    "Rejected": "Rejected",
    "Withdrawn by applicant": "Withdrawn",
    "Matured": "Matured",
    "Premature Closed": "Premature Closed",
};

export const SAVINGS_STATUS_CONFIG: Record<string, {
    variant: "success" | "warning" | "error" | "info" | "default";
    label: string;
}> = {
    "Submitted and pending approval": { variant: "info", label: "Pending" },
    "Approved": { variant: "success", label: "Approved" },
    "Active": { variant: "success", label: "Active" },
    "Closed": { variant: "default", label: "Closed" },
    "Rejected": { variant: "error", label: "Rejected" },
    "Withdrawn by applicant": { variant: "warning", label: "Withdrawn" },
    "Matured": { variant: "info", label: "Matured" },
    "Premature Closed": { variant: "warning", label: "Premature Closed" },
};

export const DEPOSIT_ACCOUNTS_PAGE_SIZE = 15;
export const DEPOSIT_SEARCH_DEBOUNCE_MS = 400;

/** Deposit account type display labels */
export const DEPOSIT_TYPE_LABELS: Record<string, string> = {
    savings: "Savings",
    fixed_deposit: "Fixed Deposit",
    recurring_deposit: "Recurring Deposit",
};
