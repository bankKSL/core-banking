import { type FC, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLoanProducts } from "../hooks/useLoanProducts";
import { useCreateLoan } from "../hooks/useCreateLoan";
import { useUpdateLoan } from "../hooks/useUpdateLoan";
import { useLoan } from "../hooks/useLoan";
import LoanForm from "../components/LoanForm";
import type { CreateLoanFormValues } from "../schemas/loan.schema";
import { currentDate } from "@/lib/utils";

const LoanFormPage: FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const clientId = searchParams.get("clientId") ? Number(searchParams.get("clientId")) : undefined;

    const { data: products = [], isLoading: productsLoading } = useLoanProducts();
    const { data: loan, isLoading: loanLoading } = useLoan(id);
    const createMutation = useCreateLoan();
    const updateMutation = useUpdateLoan();

    const isLoading = productsLoading || (isEditMode && loanLoading);
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const handleSubmit = useCallback(
        async (values: CreateLoanFormValues) => {
            // Strip null values since LoanCreateRequest doesn't accept null
            const cleaned = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== null)) as Record<string, unknown>;

            const payload = {
                ...cleaned,
                clientId: clientId ?? values.clientId,
                submittedOnDate: currentDate(values.submittedOnDate),
                expectedDisbursementDate: currentDate(values.expectedDisbursementDate),
                dateFormat: "yyyy-MM-dd" as const,
                locale: "en" as const,
                loanType: "individual",
                transactionProcessingStrategyCode: "mifos-standard-strategy",
            };

            if (isEditMode && id) {
                await updateMutation.mutateAsync({ loanId: Number(id), payload });
                navigate(`/loans/view/${id}`);
            } else {
                const result = await createMutation.mutateAsync(payload as any);
                navigate(`/loans/view/${result.resourceId ?? result.loanId}`);
            }
        },
        [createMutation, updateMutation, navigate, isEditMode, id, clientId],
    );

    const error = createMutation.error?.message ?? updateMutation.error?.message ?? null;

    if (isLoading) {
        return (
            <div className="p-6 max-w-4xl m-auto">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-4 rounded-xl border p-6">
                            <Skeleton className="h-5 w-32" />
                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3].map((j) => (
                                    <Skeleton key={j} className="h-10 w-full" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl m-auto">
            <PageHeader
                title={isEditMode ? "Edit Loan" : "Create Loan"}
                description={isEditMode ? `Editing loan ${loan?.accountNo ?? `#${id}`}` : "Register a new loan application in Apache Fineract"}
                actions={
                    <Button variant="outline" onClick={() => navigate(isEditMode ? `/loans/view/${id}` : "/loans")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {isEditMode ? "Back to Loan" : "Back to Loans"}
                    </Button>
                }
            />
            {createMutation.isError && (
                <div className="mb-4">
                    <ErrorState title="Failed to save loan" message={createMutation.error?.message ?? "An unexpected error occurred."} onRetry={() => createMutation.reset()} />
                </div>
            )}
            <LoanForm products={products} loan={loan} onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} mode={isEditMode ? "edit" : "create"} clientId={clientId} />
        </div>
    );
};

export default LoanFormPage;
