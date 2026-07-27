import { type FC, useCallback, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLoanProducts } from "../hooks/useLoanProducts";
import { useCreateLoan } from "../hooks/useCreateLoan";
import { useUpdateLoan } from "../hooks/useUpdateLoan";
import { useLoan } from "../hooks/useLoan";
import LoanForm, { type FormFields } from "../components/LoanForm";
import LoanScheduleTable from "../components/LoanScheduleTable";
import { calculateLoanSchedule } from "../api/loan";
import type { CreateLoanFormValues } from "../schemas/loan.schema";
import type { LoanCreateRequest, LoanRepaymentSchedule } from "../types/loan";
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

  const [previewOpen, setPreviewOpen] = useState(false);
  const previewMutation = useMutation({
    mutationFn: (values: FormFields) =>
      calculateLoanSchedule({
        clientId: clientId ?? values.clientId,
        productId: values.productId,
        principal: values.principal,
        loanTermFrequency: values.loanTermFrequency,
        loanTermFrequencyType: values.loanTermFrequencyType,
        numberOfRepayments: values.numberOfRepayments,
        repaymentEvery: values.repaymentEvery,
        repaymentFrequencyType: values.repaymentFrequencyType,
        interestRatePerPeriod: values.interestRatePerPeriod,
        amortizationType: values.amortizationType ?? 1,
        interestType: values.interestType ?? 0,
        interestCalculationPeriodType: values.interestCalculationPeriodType ?? 1,
        expectedDisbursementDate: currentDate(values.expectedDisbursementDate),
        transactionProcessingStrategyCode: "mifos-standard-strategy",
        loanType: "individual",
      }),
    onSuccess: () => setPreviewOpen(true),
  });

  const isLoading = productsLoading || (isEditMode && loanLoading);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = useCallback(
    async (values: CreateLoanFormValues) => {
      // Strip null values since LoanCreateRequest doesn't accept null
      const cleaned = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== null)) as Record<
        string,
        unknown
      >;

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
        const result = await createMutation.mutateAsync(payload as unknown as LoanCreateRequest);
        navigate(`/loans/view/${result.resourceId ?? result.loanId}`);
      }
    },
    [createMutation, updateMutation, navigate, isEditMode, id, clientId],
  );

  const error = createMutation.error?.message ?? updateMutation.error?.message ?? null;
  const previewSchedule: LoanRepaymentSchedule | undefined = previewMutation.data;

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
        description={
          isEditMode ? `Editing loan ${loan?.accountNo ?? `#${id}`}` : "Register a new loan application in Finfact"
        }
        actions={
          <Button variant="outline" onClick={() => navigate(isEditMode ? `/loans/view/${id}` : "/loans")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isEditMode ? "Back to Loan" : "Back to Loans"}
          </Button>
        }
      />
      {createMutation.isError && (
        <div className="mb-4">
          <ErrorState
            title="Failed to save loan"
            message={createMutation.error?.message ?? "An unexpected error occurred."}
            onRetry={() => createMutation.reset()}
          />
        </div>
      )}
      {previewMutation.isError && (
        <div className="mb-4">
          <ErrorState
            title="Failed to calculate schedule"
            message={
              previewMutation.error instanceof Error ? previewMutation.error.message : "Please check the form values."
            }
            onRetry={() => previewMutation.reset()}
          />
        </div>
      )}
      <LoanForm
        products={products}
        loan={loan}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        mode={isEditMode ? "edit" : "create"}
        clientId={clientId}
        onPreviewSchedule={(values) => previewMutation.mutate(values)}
        previewLoading={previewMutation.isPending}
      />

      {/* Schedule preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Repayment Schedule Preview</DialogTitle>
            <DialogDescription>Projected installments based on the current form values.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <LoanScheduleTable periods={previewSchedule?.periods ?? []} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanFormPage;
