import { useCallback } from "react";
import { useAuthStore } from "@/store";

export type FixedDepositAction =
  | "CREATE"
  | "APPROVE"
  | "ACTIVATE"
  | "REJECT"
  | "WITHDRAW"
  | "UNDO_APPROVAL"
  | "CLOSE"
  | "PREMATURE_CLOSE"
  | "DELETE"
  | "CALCULATEINTEREST"
  | "POSTINTEREST"
  | "DEPOSIT"
  | "WITHDRAWAL";

export const FIXED_DEPOSIT_ACTION_PERMISSIONS: Record<FixedDepositAction, string> = {
  CREATE: "CREATE_FIXEDDEPOSITACCOUNT",
  APPROVE: "APPROVE_FIXEDDEPOSITACCOUNT",
  ACTIVATE: "ACTIVATE_FIXEDDEPOSITACCOUNT",
  REJECT: "REJECT_FIXEDDEPOSITACCOUNT",
  WITHDRAW: "WITHDRAW_FIXEDDEPOSITACCOUNT",
  UNDO_APPROVAL: "APPROVALUNDO_FIXEDDEPOSITACCOUNT",
  CLOSE: "CLOSE_FIXEDDEPOSITACCOUNT",
  PREMATURE_CLOSE: "CLOSE_FIXEDDEPOSITACCOUNT",
  DELETE: "DELETE_FIXEDDEPOSITACCOUNT",
  CALCULATEINTEREST: "CALCULATEINTEREST_FIXEDDEPOSITACCOUNT",
  POSTINTEREST: "POSTINTEREST_FIXEDDEPOSITACCOUNT",
  DEPOSIT: "DEPOSIT_FIXEDDEPOSITACCOUNT",
  WITHDRAWAL: "WITHDRAWAL_FIXEDDEPOSITACCOUNT",
};

export function useFixedDepositPermissions() {
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);

  const hasPermission = useCallback(
    (action: FixedDepositAction) => {
      const code = FIXED_DEPOSIT_ACTION_PERMISSIONS[action];

      return permissions.includes(code);
    },
    [permissions],
  );

  return { hasPermission, permissions };
}
