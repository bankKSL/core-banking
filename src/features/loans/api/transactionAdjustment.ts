import client from "@/api/client";
import { currentDate } from "@/lib/utils";

/**
 * Adjustment commands supported by Fineract per doc §7.15:
 *   - chargeback                   (CHARGEBACK_LOAN)
 *   - capitalizedIncomeAdjustment  (CAPITALIZEDINCOMEADJUSTMENT_LOAN)
 *   - buyDownFeeAdjustment         (BUYDOWNFEEADJUSTMENT_LOAN)
 *   - interest-refund              (MANUAL_INTEREST_REFUND_TRANSACTION_LOAN)
 */
export type AdjustmentCommand = "chargeback" | "capitalizedIncomeAdjustment" | "buyDownFeeAdjustment" | "interest-refund";

export interface AdjustmentPayload {
  transactionDate?: string;
  transactionAmount?: number;
  note?: string;
  externalId?: string;
  reversalExternalId?: string;
  paymentTypeId?: number;
  accountNumber?: string;
  checkNumber?: string;
  routingCode?: string;
  receiptNumber?: string;
  bankNumber?: string;
}

export async function adjustTransaction(
  loanId: number,
  transactionId: number,
  command: AdjustmentCommand,
  payload: AdjustmentPayload = {},
): Promise<void> {
  const { transactionDate, ...rest } = payload;
  await client.post(`/loans/${loanId}/transactions/${transactionId}`, {
    ...rest,
    transactionDate: transactionDate ? (currentDate(transactionDate) ?? transactionDate) : undefined,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  }, { params: { command } });
}

/** Backwards-compat alias used by `AdjustTransactionDialog`. */
export const undoTransaction = (loanId: number, transactionId: number) =>
  adjustTransaction(loanId, transactionId, "chargeback");

/** Backwards-compat alias — modify is implemented as chargeback in this codebase. */
export const modifyTransaction = (
  loanId: number,
  transactionId: number,
  payload: AdjustmentPayload,
) => adjustTransaction(loanId, transactionId, "chargeback", payload);

