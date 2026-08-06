import { useEffect, type FC } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { t } = useTranslation();
  const defaultDate = new Date().toISOString().split("T")[0];
  const { register, handleSubmit, setValue, watch, reset } = useForm<TransactionFormValues>({
    defaultValues: {
      transactionDate: defaultDate,
      approvedOnDate: defaultDate,
      actualDisbursementDate: defaultDate,
      transactionAmount: loanSummary?.amount ?? 0,
      paymentTypeId: undefined,
      receiptNumber: "",
      bankNumber: "",
      checkNumber: "",
      routingCode: "",
      note: "",
    },
  });

  useEffect(() => {
    if (loanSummary?.amount != null) {
      reset((values) => ({ ...values, transactionAmount: loanSummary.amount }));
    }
  }, [loanSummary?.amount, reset]);

  const needsDate = !TRANSACTION_NO_DATE_COMMANDS.has(transactionType);
  const needsAmount = TRANSACTION_AMOUNT_COMMANDS.has(transactionType);
  const needsPaymentType = TRANSACTION_PAYMENT_TYPE_COMMANDS.has(transactionType);
  const needsPaymentDetails = TRANSACTION_PAYMENT_DETAILS_COMMANDS.has(transactionType);
  const isDestructive = TRANSACTION_DESTRUCTIVE_COMMANDS.has(transactionType);
  const label = TRANSACTION_COMMAND_LABELS[transactionType] ?? transactionType;

  // Doc §19: warn on overpayment / partial payment relative to the outstanding balance.
  const amount = watch("transactionAmount");
  const outstanding = loanSummary?.outstandingLoanBalance;
  const balanceWarning =
    needsAmount && amount != null && outstanding != null
      ? amount > outstanding
        ? t("Payment amount exceeds outstanding balance")
        : amount < outstanding
          ? t("Partial payment will not close the loan")
          : null
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 ">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {balanceWarning && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <span>{balanceWarning}</span>
        </div>
      )}

      {loanSummary?.outstandingLoanBalance != null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Current Balance")}</CardTitle>
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                {transactionType === "approve"
                  ? t("Approval Date")
                  : transactionType === "disburse" || transactionType === "disburseToSavings"
                    ? t("Disbursement Date")
                    : t("Transaction Date")}
              </label>
              <Input
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")}</label>
              <Input
                type="number"
                step="0.01"
                {...register("transactionAmount", { valueAsNumber: true })}
                disabled={isSubmitting}
              />
            </div>
          )}
          {needsPaymentType && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Payment Type")}</label>
              <Select
                value={watch("paymentTypeId") ? String(watch("paymentTypeId")) : ""}
                onValueChange={(v) => setValue("paymentTypeId", Number(v))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select payment type")} />
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
            <CardTitle className="text-base">{t("Payment Details")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Receipt Number")}</label>
              <Input {...register("receiptNumber")} disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Bank Number")}</label>
              <Input {...register("bankNumber")} disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Check Number")}</label>
              <Input {...register("checkNumber")} disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Routing Code")}</label>
              <Input {...register("routingCode")} disabled={isSubmitting} />
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
            <CardTitle className="text-base">{t("Note")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea {...register("note")} disabled={isSubmitting} placeholder={t("Optional note...")} rows={3} />
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
              {t("Processing...")}
            </span>
          ) : (
            `${t("Submit")} ${label}`
          )}
        </Button>
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => window.history.back()}>
          {t("Cancel")}
        </Button>
      </div>
    </form>
  );
};

export default LoanTransactionForm;
export type { LoanTransactionFormProps };
