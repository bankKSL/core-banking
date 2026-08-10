import i18n from "@/i18n";

export const WC_LOAN_STATUS_LABELS: Record<string, string> = {
  "Submitted and pending approval": i18n.t("Pending"),
  Approved: i18n.t("Approved"),
  Active: i18n.t("Active"),
  Closed: i18n.t("Closed"),
  Rejected: i18n.t("Rejected"),
};

export const WC_LOAN_STATUS_CONFIG: Record<
  string,
  { variant: "success" | "warning" | "error" | "info" | "default"; label: string }
> = {
  "Submitted and pending approval": { variant: "info", label: i18n.t("Pending") },
  Approved: { variant: "success", label: i18n.t("Approved") },
  Active: { variant: "success", label: i18n.t("Active") },
  Closed: { variant: "default", label: i18n.t("Closed") },
  Rejected: { variant: "error", label: i18n.t("Rejected") },
};

export const WC_LOAN_STATUS_ID_MAP: Record<number, string> = {
  100: "Submitted and pending approval",
  200: "Approved",
  300: "Active",
  600: "Closed",
  500: "Rejected",
};

export const WC_LOAN_CODE_TO_KEY: Record<string, string> = {
  "loanStatusType.submitted.and.pending.approval": "Submitted and pending approval",
  "loanStatusType.approved": "Approved",
  "loanStatusType.active": "Active",
  "loanStatusType.closed.obligations.met": "Closed",
  "loanStatusType.closed": "Closed",
  "loanStatusType.rejected": "Rejected",
};

export const WC_LOANS_PAGE_SIZE = 20;
export const WC_LOAN_PAGE_SIZE_OPTIONS = [20, 50, 100];
export const WC_LOAN_SEARCH_DEBOUNCE_MS = 400;

export const AMORTIZATION_TYPE_OPTIONS = [{ value: "EIR", label: "EIR (Effective Interest Rate)" }];

export const FREQUENCY_TYPE_OPTIONS = [
  { value: "DAYS", label: i18n.t("Days") },
  { value: "WEEKS", label: i18n.t("Weeks") },
  { value: "MONTHS", label: i18n.t("Months") },
];

export const DELINQUENCY_START_TYPE_OPTIONS = [
  { value: "DISBURSEMENT", label: i18n.t("Disbursement") },
  { value: "LOAN_CREATION", label: i18n.t("Loan Creation") },
];

export function resolveWCStatusCode(loan: { status?: { id?: number; code?: string; value?: string } }): string {
  const s = loan.status;
  if (!s) return "Unknown";
  if (s.code && s.code in WC_LOAN_CODE_TO_KEY) return WC_LOAN_CODE_TO_KEY[s.code];
  if (s.value && s.value in WC_LOAN_STATUS_LABELS) return s.value;
  if (s.id != null && s.id in WC_LOAN_STATUS_ID_MAP) return WC_LOAN_STATUS_ID_MAP[s.id];
  return s.value ?? s.code ?? "Unknown";
}
