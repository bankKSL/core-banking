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
  | "CLOSE"
  | "RESCHEDULE"
  | "WRITE_OFF"
  | "RECOVER"
  | "DELETE";

export const LOAN_ACTION_PERMISSIONS: Record<LoanAction, string> = {
  CREATE: "CREATE_LOAN",
  APPROVE: "APPROVE_LOAN",
  DISBURSE: "DISBURSE_LOAN",
  REJECT: "REJECT_LOAN",
  WITHDRAW: "WITHDRAW_LOAN",
  UNDO_APPROVAL: "UNDOAPPROVE_LOAN",
  UNDO_DISBURSE: "UNDODISBURSE_LOAN",
  CLOSE: "CLOSE_LOAN",
  RESCHEDULE: "RESCHEDULE_LOAN",
  WRITE_OFF: "WRITEOFF_LOAN",
  RECOVER: "RECOVER_LOAN",
  DELETE: "DELETE_LOAN",
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
