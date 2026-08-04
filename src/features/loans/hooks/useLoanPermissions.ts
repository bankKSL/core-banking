import { useCurrentUser } from "@/features/authentication";
import type { Loan } from "../types/loan";
import { LOAN_STATUS_ID_MAP } from "../constants/status";

/**
 * Action → required `{ACTION}_LOAN` permission per doc §18.
 * Maker-checker `_CHECKER` variants are auto-derived.
 */
export const LOAN_ACTION_PERMISSIONS = {
  approve: "APPROVE_LOAN",
  undoApproval: "APPROVALUNDO_LOAN",
  reject: "REJECT_LOAN",
  withdraw: "WITHDRAW_LOAN",
  disburse: "DISBURSE_LOAN",
  disburseToSavings: "DISBURSE_LOAN",
  undoDisbursal: "DISBURSALUNDO_LOAN",
  assignLoanOfficer: "UPDATELOANOFFICER_LOAN",
  unassignLoanOfficer: "REMOVELOANOFFICER_LOAN",
  bulkReassign: "BULKREASSIGN_LOAN",
  repayment: "REPAYMENT_LOAN",
  recoveryPayment: "RECOVERYPAYMENT_LOAN",
  waiveInterest: "WAIVEINTERESTPORTION_LOAN",
  writeOff: "WRITEOFF_LOAN",
  undoWriteOff: "UNDOWRITEOFF_LOAN",
  close: "CLOSE_LOAN",
  closeRescheduled: "CLOSEASRESCHEDULED_LOAN",
  foreclosure: "FORECLOSURE_LOAN",
  creditBalanceRefund: "CREDITBALANCEREFUND_LOAN",
  chargeOff: "CHARGEOFF_LOAN",
  undoChargeOff: "UNDOCHARGEOFF_LOAN",
  downPayment: "DOWNPAYMENT_LOAN",
  reAge: "REAGE_LOAN",
  undoReAge: "UNDO_REAGE_LOAN",
  reAmortize: "REAMORTIZE_LOAN",
  undoReAmortize: "UNDO_REAMORTIZE_LOAN",
  goodWillCredit: "GOODWILLCREDIT_LOAN",
  merchantIssuedRefund: "MERCHANTISSUEDREFUND_LOAN",
  payoutRefund: "PAYOUTREFUND_LOAN",
  chargeRefund: "CHARGEREFUND_LOAN",
  interestPaymentWaiver: "INTERESTPAYMENTWAIVER_LOAN",
  refundByCash: "REFUNDBYCASH_LOAN",
  markAsFraud: "SETFRAUD_LOAN",
  recoverGuarantees: "RECOVERGUARANTEES_LOAN",
  update: "UPDATE_LOAN",
  delete: "DELETE_LOAN",
  create: "CREATE_LOAN",
  addCharge: "CREATE_LOANCHARGE",
  updateCharge: "UPDATE_LOANCHARGE",
  deleteCharge: "DELETE_LOANCHARGE",
  waiveCharge: "WAIVE_LOANCHARGE",
  payCharge: "PAY_LOANCHARGE",
  createGuarantor: "CREATE_GUARANTOR",
  updateGuarantor: "UPDATE_GUARANTOR",
  deleteGuarantor: "DELETE_GUARANTOR",
  createCollateral: "CREATE_COLLATERAL",
  updateCollateral: "UPDATE_COLLATERAL",
  deleteCollateral: "DELETE_COLLATERAL",
  addNote: "CREATE_LOANNOTE",
  updateNote: "UPDATE_LOANNOTE",
  deleteNote: "DELETE_LOANNOTE",
  uploadDocument: "CREATE_DOCUMENT",
  reschedule: "CREATE_RESCHEDULELOAN",
  approveReschedule: "APPROVE_RESCHEDULELOAN",
  rejectReschedule: "REJECT_RESCHEDULELOAN",
  contractTermination: "CONTRACTTERMINATION_LOAN",
  undoContractTermination: "UNDOCONTRACTTERMINATION_LOAN",
  createDelinquencyAction: "CREATE_DELINQUENCY_ACTION",
  readDelinquencyTags: "READ_DELINQUENCY_TAGS",
  // Synthetic actions that don't have a one-to-one permission.
  edit: "UPDATE_LOAN",
  prepayLoan: "REPAYMENT_LOAN",
} as const satisfies Record<string, string>;

export type LoanAction = keyof typeof LOAN_ACTION_PERMISSIONS;

/**
 * Per-status action matrix (doc §17.3). A status id → array of actions that
 * are valid in that state. Used to combine with the permission check so we
 * never offer a button that the backend would reject with 400.
 */
const STATUS_ACTIONS: Record<number, ReadonlyArray<LoanAction>> = {
  // 100: Pending — full set of approval-side actions + Edit / Delete
  100: [
    "approve",
    "reject",
    "withdraw",
    "edit",
    "delete",
    "addCharge",
    "createCollateral",
    "createGuarantor",
    "addNote",
    "uploadDocument",
    "markAsFraud",
  ],
  // 200: Approved — disburse / disburseToSavings / undoApproval
  200: ["disburse", "disburseToSavings", "undoApproval", "update", "addNote"],
  // 300: Active — most of the workflow
  300: [
    "repayment",
    "downPayment",
    "prepayLoan",
    "waiveInterest",
    "interestPaymentWaiver",
    "writeOff",
    "chargeOff",
    "close",
    "closeRescheduled",
    "foreclosure",
    "creditBalanceRefund",
    "goodWillCredit",
    "merchantIssuedRefund",
    "payoutRefund",
    "chargeRefund",
    "refundByCash",
    "reAge",
    "undoReAge",
    "reAmortize",
    "undoReAmortize",
    "undoDisbursal",
    "undoWriteOff",
    "recoveryPayment",
    "reschedule",
    "addCharge",
    "updateCharge",
    "deleteCharge",
    "addNote",
    "uploadDocument",
    "assignLoanOfficer",
    "unassignLoanOfficer",
    "contractTermination",
  ],
  // 601: Written off — recovery + undo
  601: ["undoWriteOff", "recoveryPayment", "addNote"],
  // 700: Overpaid
  700: ["creditBalanceRefund", "refundByCash", "goodWillCredit", "addNote"],
};

function statusId(loan: Loan | undefined | null): number | undefined {
  if (!loan?.status) return undefined;
  return loan.status.id;
}

function statusName(loan: Loan | undefined | null): string | undefined {
  if (!loan?.status) return undefined;
  if (loan.status.code) return loan.status.code;
  if (loan.status.id != null) return LOAN_STATUS_ID_MAP[loan.status.id];
  return undefined;
}

/**
 * Hook returning `can(action)` / `canAny(actions)` helpers for the current
 * user. Combines:
 *   - doc §18 permission set (resolved from the auth store);
 *   - doc §17.3 status-action matrix (action only valid in certain statuses);
 *   - doc §16 business rules (e.g. foreclosure disabled when interest
 *     recalculation is enabled, re-amortize on interest-recalc only).
 */
export function useLoanPermissions(loan?: Loan | null) {
  const user = useCurrentUser();
  const permissions = new Set(user?.permissions ?? []);

  const id = statusId(loan);

  const can = (action: LoanAction): boolean => {
    const required = LOAN_ACTION_PERMISSIONS[action];
    const hasPermission = permissions.has(required) || permissions.has(`${required}_CHECKER`);

    console.log({ permissions });

    if (!hasPermission) return false;
    // Generic CRUD actions are always allowed (caller decides when to show).
    if (action === "update" || action === "delete" || action === "create") {
      return true;
    }
    if (id == null) return true;
    const allowed = STATUS_ACTIONS[id];
    return !!allowed?.includes(action);
  };

  const canAny = (actions: ReadonlyArray<LoanAction>): boolean => actions.some(can);

  return {
    can,
    canAny,
    permissions,
    isOverpaid: statusName(loan) === "Overpaid",
    isWrittenOff: statusName(loan) === "Closed (written off)",
    isActive: statusName(loan) === "Active",
    isApproved: statusName(loan) === "Approved",
    isPending: statusName(loan) === "Submitted and pending approval",
    isClosed: id != null && [400, 500, 600, 601, 602].includes(id),
    // doc §16: foreclosure is disabled when interest recalculation is enabled
    // on the product. The product data is not in the Loan payload, so callers
    // should provide this from the loan product. Default to true (eligible).
    isForeclosureEligible: true,
  };
}
