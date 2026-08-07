import i18n from "@/i18n";
import type { SavingsAccountStatus } from "../types/deposit";

export const SAVINGS_STATUS_LABELS: Record<string, string> = {
  "Submitted and pending approval": i18n.t("Pending"),
  Approved: i18n.t("Approved"),
  Active: i18n.t("Active"),
  Closed: i18n.t("Closed"),
  Rejected: i18n.t("Rejected"),
  "Withdrawn by applicant": i18n.t("Withdrawn"),
  Matured: i18n.t("Matured"),
  "Premature Closed": i18n.t("Premature Closed"),
};

export const SAVINGS_STATUS_CONFIG: Record<
  string,
  {
    variant: "success" | "warning" | "error" | "info" | "default";
    label: string;
  }
> = {
  "Submitted and pending approval": { variant: "info", label: i18n.t("Pending") },
  Approved: { variant: "success", label: i18n.t("Approved") },
  Active: { variant: "success", label: i18n.t("Active") },
  Closed: { variant: "default", label: i18n.t("Closed") },
  Rejected: { variant: "error", label: i18n.t("Rejected") },
  "Withdrawn by applicant": { variant: "warning", label: i18n.t("Withdrawn") },
  Matured: { variant: "info", label: i18n.t("Matured") },
  "Premature Closed": { variant: "warning", label: i18n.t("Premature Closed") },
};

export const DEPOSIT_ACCOUNTS_PAGE_SIZE = 15;
export const DEPOSIT_SEARCH_DEBOUNCE_MS = 400;

/** Section 11.6: Pre-Closure Penalty Interest On Types */
export const PRE_CLOSURE_PENALTY_TYPES = [
  { id: 1, label: i18n.t("Principal Amount") },
  { id: 2, label: i18n.t("Interest Amount") },
  { id: 3, label: i18n.t("Principal + Interest") },
];

/** Section 11.6: Chart Slab Period Types */
export const CHART_SLAB_PERIOD_TYPES = [
  { id: 0, label: i18n.t("Days") },
  { id: 2, label: i18n.t("Months") },
  { id: 3, label: i18n.t("Years") },
];

/** Accounting rule types */
export const ACCOUNTING_RULES = [
  { id: 1, label: i18n.t("None") },
  { id: 2, label: i18n.t("Cash") },
  { id: 3, label: i18n.t("Accrual") },
];

/** Deposit account type display labels */
export const DEPOSIT_TYPE_LABELS: Record<string, string> = {
  savings: i18n.t("Savings"),
  fixed_deposit: i18n.t("Fixed Deposit"),
  recurring_deposit: i18n.t("Recurring Deposit"),
};

/** Section 10.7: Deposit Period Frequencies */
export const DEPOSIT_PERIOD_FREQUENCIES = [
  { id: 0, label: i18n.t("Days"), code: "deposit.period.savingsPeriodFrequencyType.days" },
  { id: 1, label: i18n.t("Weeks"), code: "deposit.period.savingsPeriodFrequencyType.weeks" },
  { id: 2, label: i18n.t("Months"), code: "deposit.period.savingsPeriodFrequencyType.months" },
  { id: 3, label: i18n.t("Years"), code: "deposit.period.savingsPeriodFrequencyType.years" },
];

/** Section 10: Fixed deposit status display labels */
export const FIXED_DEPOSIT_STATUS_CONFIG: Record<
  string,
  { variant: "success" | "warning" | "error" | "info" | "default"; label: string }
> = {
  "Fixed deposit account status - submitted and pending approval": { variant: "info", label: i18n.t("Pending") },
  "Fixed deposit account status - approved": { variant: "success", label: i18n.t("Approved") },
  "Fixed deposit account status - active": { variant: "success", label: i18n.t("Active") },
  "Fixed deposit account status - closed": { variant: "default", label: i18n.t("Closed") },
  "Fixed deposit account status - rejected": { variant: "error", label: i18n.t("Rejected") },
  "Fixed deposit account status - withdrawn by applicant": { variant: "warning", label: i18n.t("Withdrawn") },
  "Fixed deposit account status - matured": { variant: "info", label: i18n.t("Matured") },
  "Fixed deposit account status - premature closed": { variant: "warning", label: i18n.t("Premature Closed") },
};

/** Section 7: Recurring deposit status display labels */
export const RECURRING_DEPOSIT_STATUS_CONFIG: Record<
  string,
  { variant: "success" | "warning" | "error" | "info" | "default"; label: string }
> = {
  "Recurring deposit account status - submitted and pending approval": { variant: "info", label: i18n.t("Pending") },
  "Recurring deposit account status - approved": { variant: "success", label: i18n.t("Approved") },
  "Recurring deposit account status - active": { variant: "success", label: i18n.t("Active") },
  "Recurring deposit account status - closed": { variant: "default", label: i18n.t("Closed") },
  "Recurring deposit account status - rejected": { variant: "error", label: i18n.t("Rejected") },
  "Recurring deposit account status - withdrawn by applicant": { variant: "warning", label: i18n.t("Withdrawn") },
  "Recurring deposit account status - premature closed": { variant: "warning", label: i18n.t("Premature Closed") },
};
