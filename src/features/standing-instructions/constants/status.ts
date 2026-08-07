import i18n from "@/i18n";

type StatusBadgeVariant = "success" | "warning" | "error" | "info" | "default";

export const STANDING_INSTRUCTION_STATUS_CONFIG: Record<number, { variant: StatusBadgeVariant; label: string }> = {
  1: { variant: "success", label: i18n.t("Active") },
  2: { variant: "warning", label: i18n.t("Disabled") },
  3: { variant: "error", label: i18n.t("Deleted") },
};

export const PRIORITY_CONFIG: Record<number, { variant: StatusBadgeVariant; label: string }> = {
  1: { variant: "error", label: i18n.t("Urgent") },
  2: { variant: "warning", label: i18n.t("High") },
  3: { variant: "info", label: i18n.t("Medium") },
  4: { variant: "default", label: i18n.t("Low") },
};

export const INSTRUCTION_TYPE_LABELS: Record<number, string> = {
  1: i18n.t("Fixed"),
  2: i18n.t("Dues"),
};

export const RECURRENCE_TYPE_LABELS: Record<number, string> = {
  1: i18n.t("Periodic"),
  2: i18n.t("As Per Dues"),
};

export const TRANSFER_TYPE_LABELS: Record<number, string> = {
  1: i18n.t("Account Transfer"),
  2: i18n.t("Loan Repayment"),
  3: i18n.t("Charge Payment"),
};

export const ACCOUNT_TYPE_LABELS: Record<number, string> = {
  1: i18n.t("Savings"),
  2: i18n.t("Loan"),
};

export const RECURRENCE_FREQUENCY_LABELS: Record<number, string> = {
  0: i18n.t("Days"),
  1: i18n.t("Weeks"),
  2: i18n.t("Months"),
  3: i18n.t("Years"),
};
