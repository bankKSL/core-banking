import type { FC } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TRANSACTION_COMMAND_LABELS,
  TRANSACTION_AMOUNT_COMMANDS,
  TRANSACTION_PAYMENT_TYPE_COMMANDS,
  TRANSACTION_PAYMENT_DETAILS_COMMANDS,
  TRANSACTION_NO_DATE_COMMANDS,
  TRANSACTION_DESTRUCTIVE_COMMANDS,
} from "../constants/transactions";

export type TransactionFormValues = {
  transactionDate?: string;
  transactionAmount?: number;
  paymentTypeId?: number;
  receiptNumber?: string;
  bankNumber?: string;
  checkNumber?: string;
  routingCode?: string;
  note?: string;
  approvedOnDate?: string;
  actualDisbursementDate?: string;
};

interface LoanTransactionFormProps {
  transactionType: string;
  paymentTypeOptions?: Array<{ id: number; name: string }>;
  loanSummary?: { outstandingLoanBalance?: number; amount?: number };
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

const LoanTransactionForm: FC<LoanTransactionFormProps> = ({
  transactionType,
  paymentTypeOptions,
  loanSummary,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const defaultDate = new Date().toISOString().split("T")[0];
  const { register, handleSubmit, setValue, watch } = useForm<TransactionFormValues>({
    defaultValues: {
      transactionDate: defaultDate,
      approvedOnDate: defaultDate,
      actualDisbursementDate: defaultDate,
      transactionAmount: loanSummary?.outstandingLoanBalance ?? loanSummary?.amount ?? 0,
      paymentTypeId: undefined,
      receiptNumber: "",
      bankNumber: "",
      checkNumber: "",
      routingCode: "",
      note: "",
    },
  });

  const needsDate = !TRANSACTION_NO_DATE_COMMANDS.has(transactionType);
  const needsAmount = TRANSACTION_AMOUNT_COMMANDS.has(transactionType);
  const needsPaymentType = TRANSACTION_PAYMENT_TYPE_COMMANDS.has(transactionType);
  const needsPaymentDetails = TRANSACTION_PAYMENT_DETAILS_COMMANDS.has(transactionType);
  const isDestructive = TRANSACTION_DESTRUCTIVE_COMMANDS.has(transactionType);
  const label = TRANSACTION_COMMAND_LABELS[transactionType] ?? transactionType;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 ">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      {loanSummary?.outstandingLoanBalance != null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(
                loanSummary.outstandingLoanBalance,
              )}
            </p>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{label}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {needsDate && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transactionDate">
                {transactionType === "approve"
                  ? "Approval Date"
                  : transactionType === "disburse" || transactionType === "disburseToSavings"
                    ? "Disbursement Date"
                    : "Transaction Date"}
              </Label>
              <Input
                id="transactionDate"
                type="date"
                {...register(
                  transactionType === "approve"
                    ? "approvedOnDate"
                    : transactionType === "disburse" || transactionType === "disburseToSavings"
                      ? "actualDisbursementDate"
                      : "transactionDate",
                )}
                disabled={isSubmitting}
              />
            </div>
          )}
          {needsAmount && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transactionAmount">Amount</Label>
              <Input
                id="transactionAmount"
                type="number"
                step="0.01"
                {...register("transactionAmount", { valueAsNumber: true })}
                disabled={isSubmitting}
              />
            </div>
          )}
          {needsPaymentType && (
            <div className="flex flex-col gap-1.5">
              <Label>Payment Type</Label>
              <Select
                value={watch("paymentTypeId") ? String(watch("paymentTypeId")) : ""}
                onValueChange={(v) => setValue("paymentTypeId", Number(v))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  {(paymentTypeOptions ?? []).map((pt) => (
                    <SelectItem key={pt.id} value={String(pt.id)}>
                      {pt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
      {needsPaymentDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Receipt Number</Label>
              <Input {...register("receiptNumber")} disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Bank Number</Label>
              <Input {...register("bankNumber")} disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Check Number</Label>
              <Input {...register("checkNumber")} disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Routing Code</Label>
              <Input {...register("routingCode")} disabled={isSubmitting} />
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Note</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea {...register("note")} disabled={isSubmitting} placeholder="Optional note..." rows={3} />
        </CardContent>
      </Card>
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          variant={isDestructive ? "destructive" : "default"}
          className={!isDestructive ? "bg-[#D32F2F] hover:bg-red-700" : undefined}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            `Submit ${label}`
          )}
        </Button>
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default LoanTransactionForm;
export type { LoanTransactionFormProps };
