import type { LoanStatus } from "../types/loan";

export const LOAN_STATUS_LABELS: Record<string, string> = {
    "Submitted and pending approval": "Pending",
    "Approved": "Approved",
    "Active": "Active",
    "Disbursed": "Disbursed",
    "Closed (obligations met)": "Closed",
    "Closed (written off)": "Written Off",
    "Closed (rescheduled)": "Rescheduled",
    "Closed": "Closed",
    "Overpaid": "Overpaid",
    "Rejected": "Rejected",
};

export const LOAN_STATUS_CONFIG: Record<string, {
    variant: "success" | "warning" | "error" | "info" | "default";
    label: string;
}> = {
    "Submitted and pending approval": { variant: "info", label: "Pending" },
    "Approved": { variant: "success", label: "Approved" },
    "Active": { variant: "success", label: "Active" },
    "Disbursed": { variant: "info", label: "Disbursed" },
    "Closed (obligations met)": { variant: "default", label: "Closed" },
    "Closed (written off)": { variant: "error", label: "Written Off" },
    "Closed (rescheduled)": { variant: "warning", label: "Rescheduled" },
    "Closed": { variant: "default", label: "Closed" },
    "Overpaid": { variant: "warning", label: "Overpaid" },
    "Rejected": { variant: "error", label: "Rejected" },
};

/** Fineract numeric loan status to string mapping */
export const LOAN_STATUS_ID_MAP: Record<number, string> = {
    100: "Submitted and pending approval",
    200: "Approved",
    300: "Active",
    301: "Disbursed",
    600: "Closed (obligations met)",
    601: "Closed (written off)",
    602: "Closed (rescheduled)",
    700: "Overpaid",
    800: "Rejected",
};

export const LOANS_PAGE_SIZE = 15;
export const LOAN_SEARCH_DEBOUNCE_MS = 400;

/** Interest type labels for display */
export const INTEREST_TYPE_LABELS: Record<string, string> = {
    "Flat": "Flat Rate",
    "Declining Balance": "Reducing Balance",
};

/** Amortization type labels for display */
export const AMORTIZATION_TYPE_LABELS: Record<string, string> = {
    "Equal installments": "Equal Installments (EMI)",
    "Equal principal payments": "Equal Principal",
};

export const REPAYMENT_FREQ_LABELS: Record<string, string> = {
    "Daily": "Daily",
    "Weekly": "Weekly",
    "Every two weeks": "Bi-Weekly",
    "Monthly": "Monthly",
    "Every two months": "Bi-Monthly",
    "Quarterly": "Quarterly",
    "Semi Annual": "Semi-Annual",
    "Annual": "Annual",
};
