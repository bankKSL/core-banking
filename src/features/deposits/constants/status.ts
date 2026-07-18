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

/** Section 10.7: Deposit Period Frequencies */
export const DEPOSIT_PERIOD_FREQUENCIES = [
    { id: 0, label: "Days", code: "deposit.period.savingsPeriodFrequencyType.days" },
    { id: 1, label: "Weeks", code: "deposit.period.savingsPeriodFrequencyType.weeks" },
    { id: 2, label: "Months", code: "deposit.period.savingsPeriodFrequencyType.months" },
    { id: 3, label: "Years", code: "deposit.period.savingsPeriodFrequencyType.years" },
];

/** Section 10: Fixed deposit status display labels */
export const FIXED_DEPOSIT_STATUS_CONFIG: Record<string, { variant: "success" | "warning" | "error" | "info" | "default"; label: string }> = {
    "Fixed deposit account status - submitted and pending approval": { variant: "info", label: "Pending" },
    "Fixed deposit account status - approved": { variant: "success", label: "Approved" },
    "Fixed deposit account status - active": { variant: "success", label: "Active" },
    "Fixed deposit account status - closed": { variant: "default", label: "Closed" },
    "Fixed deposit account status - rejected": { variant: "error", label: "Rejected" },
    "Fixed deposit account status - withdrawn by applicant": { variant: "warning", label: "Withdrawn" },
    "Fixed deposit account status - matured": { variant: "info", label: "Matured" },
    "Fixed deposit account status - premature closed": { variant: "warning", label: "Premature Closed" },
};
