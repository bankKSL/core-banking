import { type FC, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { useLoan } from "../hooks/useLoan";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeTransaction, approveLoan, disburseLoan, disburseLoanToSavings, undoDisbursal } from "../api/loan";
import { useTransactionTemplate } from "../hooks/useTransactionTemplate";
import { loanKeys } from "../hooks/useLoans";
import { TRANSACTION_COMMAND_LABELS, TRANSACTION_NO_DATE_COMMANDS } from "../constants/transactions";
import LoanTransactionForm, { type TransactionFormValues } from "../components/LoanTransactionForm";

const LoanTransactionFormPage: FC = () => {
  const { loanId, transactionType } = useParams<{ loanId: string; transactionType: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: loan } = useLoan(loanId);
  const templateQuery = useTransactionTemplate(loanId ? Number(loanId) : undefined, transactionType);

  const mutation = useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      if (!loanId || !transactionType) throw new Error("Missing loan ID or transaction type");

      const id = Number(loanId);

      // State-changing commands (POST /loans/{id}?command=...)
      if (transactionType === "approve") {
        return approveLoan(id, {
          approvedOnDate: values.approvedOnDate ?? values.transactionDate,
          note: values.note,
          dateFormat: "yyyy-MM-dd",
          locale: "en",
        });
      }
      if (transactionType === "disburse") {
        return disburseLoan(id, {
          actualDisbursementDate: values.actualDisbursementDate ?? values.transactionDate,
          transactionAmount: values.transactionAmount,
          paymentTypeId: values.paymentTypeId,
          note: values.note,
          dateFormat: "yyyy-MM-dd",
          locale: "en",
        });
      }
      if (transactionType === "disburseToSavings") {
        return disburseLoanToSavings(id, {
          actualDisbursementDate: values.actualDisbursementDate ?? values.transactionDate,
          note: values.note,
          dateFormat: "yyyy-MM-dd",
          locale: "en",
        });
      }
      if (transactionType === "undoDisbursal") {
        return undoDisbursal(id);
      }

      // Transaction sub-resource commands (POST /loans/{id}/transactions?command=...)
      const txPayload: Record<string, unknown> = {
        note: values.note,
        dateFormat: "yyyy-MM-dd",
        locale: "en",
      };

      if (!TRANSACTION_NO_DATE_COMMANDS.has(transactionType)) {
        txPayload.transactionDate = values.transactionDate;
      }
      if (values.transactionAmount != null) {
        txPayload.transactionAmount = values.transactionAmount;
      }
      if (values.paymentTypeId) txPayload.paymentTypeId = values.paymentTypeId;
      if (values.receiptNumber) txPayload.receiptNumber = values.receiptNumber;
      if (values.bankNumber) txPayload.bankNumber = values.bankNumber;
      if (values.checkNumber) txPayload.checkNumber = values.checkNumber;
      if (values.routingCode) txPayload.routingCode = values.routingCode;

      return makeTransaction(id, txPayload, transactionType!);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(loanId!) });
      qc.invalidateQueries({ queryKey: loanKeys.schedule(Number(loanId)) });
      qc.invalidateQueries({ queryKey: loanKeys.all });
      navigate(`/loans/view/${loanId}`);
    },
  });

  const label = TRANSACTION_COMMAND_LABELS[transactionType ?? ""] ?? transactionType ?? "";

  const handleSubmit = useCallback(
    async (values: TransactionFormValues) => {
      await mutation.mutateAsync(values);
    },
    [mutation],
  );

  // Command templates may carry payment type options and/or a suggested amount
  const templateData = templateQuery.data as
    | { paymentTypeOptions?: Array<{ id: number; name: string }>; amount?: number; outstandingLoanBalance?: number }
    | undefined;

  return (
    <div className="p-6 max-w-3xl m-auto">
      <PageHeader
        title={label}
        description={
          loan ? `Loan ${loan.accountNo ?? `#${loan.id}`} — ${loan.clientName ?? `Client #${loan.clientId}`}` : ""
        }
        actions={
          <Button variant="outline" onClick={() => navigate(`/loans/view/${loanId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Loan
          </Button>
        }
      />
      {mutation.isError && (
        <div className="mb-4">
          <ErrorState
            title="Transaction failed"
            message={mutation.error instanceof Error ? mutation.error.message : "An unexpected error occurred."}
            onRetry={() => mutation.reset()}
          />
        </div>
      )}
      <LoanTransactionForm
        transactionType={transactionType ?? ""}
        paymentTypeOptions={templateData?.paymentTypeOptions}
        loanSummary={
          loan?.summary
            ? { outstandingLoanBalance: loan.summary.totalOutstanding }
            : templateData?.amount != null
              ? { amount: templateData.amount }
              : undefined
        }
        onSubmit={handleSubmit}
        isSubmitting={mutation.isPending}
        error={null}
      />
    </div>
  );
};

export default LoanTransactionFormPage;
