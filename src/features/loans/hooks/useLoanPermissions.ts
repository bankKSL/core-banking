import { useCallback } from "react";
import { useAuthStore } from "@/store";

export type LoanAction =
  | "CREATE"
  | "APPROVE"
  | "DISBURSE"
  | "REJECT"
  | "WITHDRAW"
  | "UNDO_APPROVAL"
  | "UNDO_DISBURSE"
  | "UNDO_LAST_DISBURSAL"
  | "CLOSE"
  | "RESCHEDULE"
  | "WRITE_OFF"
  | "UNDO_WRITE_OFF"
  | "RECOVER"
  | "RECOVERYPAYMENT"
  | "DELETE"
  | "ASSIGN_LOAN_OFFICER"
  | "UNASSIGN_LOAN_OFFICER"
  | "CHARGE_OFF"
  | "UNDO_CHARGE_OFF"
  | "UNDO_WAIVE_CHARGE"
  | "REAGE"
  | "REAMORTIZE";

export const LOAN_ACTION_PERMISSIONS: Record<LoanAction, string> = {
  CREATE: "CREATE_LOAN",
  APPROVE: "APPROVE_LOAN",
  DISBURSE: "DISBURSE_LOAN",
  REJECT: "REJECT_LOAN",
  WITHDRAW: "WITHDRAW_LOAN",
  UNDO_APPROVAL: "APPROVALUNDO_LOAN",
  UNDO_DISBURSE: "DISBURSALUNDO_LOAN",
  UNDO_LAST_DISBURSAL: "DISBURSALLASTUNDO_LOAN",
  CLOSE: "CLOSE_LOAN",
  RESCHEDULE: "CREATE_RESCHEDULELOAN",
  WRITE_OFF: "WRITEOFF_LOAN",
  UNDO_WRITE_OFF: "UNDOWRITEOFF_LOAN",
  RECOVER: "RECOVERGUARANTEES_LOAN",
  RECOVERYPAYMENT: "RECOVERYPAYMENT_LOAN",
  DELETE: "DELETE_LOAN",
  ASSIGN_LOAN_OFFICER: "UPDATELOANOFFICER_LOAN",
  UNASSIGN_LOAN_OFFICER: "REMOVELOANOFFICER_LOAN",
  CHARGE_OFF: "CHARGEOFF_LOAN",
  UNDO_CHARGE_OFF: "UNDOCHARGEOFF_LOAN",
  UNDO_WAIVE_CHARGE: "UNDO_WAIVECHARGE",
  REAGE: "REAGE_LOAN",
  REAMORTIZE: "REAMORTIZE_LOAN",
};

export function useLoanPermissions() {
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);

  const hasPermission = useCallback(
    (action: LoanAction) => {
      const code = LOAN_ACTION_PERMISSIONS[action];
      return permissions.includes(code);
    },
    [permissions],
  );

  return { hasPermission, permissions };
}
