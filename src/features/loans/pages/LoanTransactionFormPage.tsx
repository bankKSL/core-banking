import { type FC, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { useLoan } from "../hooks/useLoan";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { makeTransaction, approveLoan, disburseLoan, undoDisbursal, fetchRepaymentTemplate } from "../api/loan";
import { loanKeys } from "../hooks/useLoans";
import LoanTransactionForm, { type TransactionFormValues } from "../components/LoanTransactionForm";

const TRANSACTION_LABELS: Record<string, string> = {
    repayment: "Repayment", disburse: "Disburse", approve: "Approve",
    reject: "Reject", withdrawnByClient: "Withdraw by Client",
    undoDisbursal: "Undo Disbursal", waiveinterest: "Waive Interest",
    prepayLoan: "Prepay Loan", foreclosure: "Foreclosure",
    close: "Close Loan", writeoff: "Write Off",
};

const LoanTransactionFormPage: FC = () => {
    const { loanId, transactionType } = useParams<{ loanId: string; transactionType: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const { data: loan, isLoading: loanLoading } = useLoan(loanId);

    const templateQuery = useQuery({
        queryKey: loanKeys.repaymentTemplate(Number(loanId)),
        queryFn: () => fetchRepaymentTemplate(Number(loanId)),
        enabled: !!loanId,
    });

    const mutation = useMutation({
        mutationFn: async (values: TransactionFormValues) => {
            if (!loanId || !transactionType) throw new Error("Missing loan ID or transaction type");

            const id = Number(loanId);

            // State-changing commands (POST /loans/{id}?command=...)
            if (transactionType === "approve") {
                return approveLoan(id, {
                    approvedOnDate: values.approvedOnDate ?? values.transactionDate,
                    note: values.note,
                    dateFormat: "yyyy-MM-dd", locale: "en",
                });
            }
            if (transactionType === "disburse") {
                return disburseLoan(id, {
                    actualDisbursementDate: values.actualDisbursementDate ?? values.transactionDate,
                    transactionAmount: values.transactionAmount,
                    paymentTypeId: values.paymentTypeId,
                    note: values.note,
                    dateFormat: "yyyy-MM-dd", locale: "en",
                });
            }
            if (transactionType === "undoDisbursal") {
                return undoDisbursal(id);
            }

            // Transaction sub-resource commands (POST /loans/{id}/transactions?command=...)
            const txPayload: Record<string, unknown> = {
                transactionDate: values.transactionDate,
                note: values.note,
                dateFormat: "yyyy-MM-dd",
                locale: "en",
            };

            if (values.transactionAmount != null && !["writeoff", "foreclosure", "close", "waiveinterest"].includes(transactionType)) {
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
            qc.invalidateQueries({ queryKey: loanKeys.all });
            navigate(`/loans/view/${loanId}`);
        },
    });

    const label = TRANSACTION_LABELS[transactionType ?? ""] ?? transactionType ?? "";

    const handleSubmit = useCallback(
        async (values: TransactionFormValues) => {
            await mutation.mutateAsync(values);
        },
        [mutation],
    );

    return (
        <div className="p-6 max-w-3xl m-auto">
            <PageHeader
                title={label}
                description={loan ? `Loan ${loan.accountNo ?? `#${loan.id}`} — ${loan.clientName ?? `Client #${loan.clientId}`}` : ""}
                actions={
                    <Button variant="outline" onClick={() => navigate(`/loans/view/${loanId}`)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />Back to Loan
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
                paymentTypeOptions={templateQuery.data?.paymentTypeOptions}
                loanSummary={loan?.summary ? { outstandingLoanBalance: loan.summary.totalOutstanding } : undefined}
                onSubmit={handleSubmit}
                isSubmitting={mutation.isPending}
                error={null}
            />
        </div>
    );
};

export default LoanTransactionFormPage;
