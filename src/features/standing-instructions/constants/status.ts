type StatusBadgeVariant = "success" | "warning" | "error" | "info" | "default";

export const STANDING_INSTRUCTION_STATUS_CONFIG: Record<number, { variant: StatusBadgeVariant; label: string }> = {
  1: { variant: "success", label: "Active" },
  2: { variant: "warning", label: "Disabled" },
  3: { variant: "error", label: "Deleted" },
};

export const PRIORITY_CONFIG: Record<number, { variant: StatusBadgeVariant; label: string }> = {
  1: { variant: "error", label: "Urgent" },
  2: { variant: "warning", label: "High" },
  3: { variant: "info", label: "Medium" },
  4: { variant: "default", label: "Low" },
};

export const INSTRUCTION_TYPE_LABELS: Record<number, string> = {
  1: "Fixed",
  2: "Dues",
};

export const RECURRENCE_TYPE_LABELS: Record<number, string> = {
  1: "Periodic",
  2: "As Per Dues",
};

export const TRANSFER_TYPE_LABELS: Record<number, string> = {
  1: "Account Transfer",
  2: "Loan Repayment",
  3: "Charge Payment",
};

export const ACCOUNT_TYPE_LABELS: Record<number, string> = {
  1: "Savings",
  2: "Loan",
};

export const RECURRENCE_FREQUENCY_LABELS: Record<number, string> = {
  0: "Days",
  1: "Weeks",
  2: "Months",
  3: "Years",
};
