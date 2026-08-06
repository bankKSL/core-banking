import { type FC, useCallback, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useLoanProductTemplate } from "../hooks/useLoanProducts";
import { useLoanTemplate } from "../hooks/useLoanTemplate";
import { useCreateLoan } from "../hooks/useCreateLoan";
import { useUpdateLoan } from "../hooks/useUpdateLoan";
import { useLoan } from "../hooks/useLoan";
import LoanForm, { type FormFields } from "../components/LoanForm";
import LoanScheduleTable from "../components/LoanScheduleTable";
import { calculateLoanSchedule } from "../api/loan";
import type { CreateLoanFormValues } from "../schemas/loan.schema";
import type { Loan, LoanCreateRequest, LoanRepaymentSchedule, LoanTemplate } from "../types/loan";
import { currentDate } from "@/lib/utils";

const LoanFormPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success: toastSuccess } = useToast();
  const isEditMode = !!id;
  const urlClientId = searchParams.get("clientId") ? Number(searchParams.get("clientId")) : undefined;

  const [clientId, setClientId] = useState<number | undefined>(urlClientId);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);

  const { data: productTemplate } = useLoanProductTemplate();
  // Template-first flow (doc §3): fetch template once a client is chosen; product defaults
  // arrive when a product is selected and the template is re-fetched with &productId=.
  const { data: loanTemplate, isLoading: templateLoading } = useLoanTemplate(
    isEditMode ? undefined : clientId,
    isEditMode ? undefined : selectedProductId,
  );
  // Update flow (doc §4): GET /loans/{loanId}?template=true&associations=all
  const { data: loan, isLoading: loanLoading } = useLoan(id, { template: true });
  const createMutation = useCreateLoan();
  const updateMutation = useUpdateLoan();

  // Edit mode: values + template option sets come from the loan detail (?template=true).
  // Create mode: they come from GET /v1/loans/template.
  const template = (isEditMode ? loan : loanTemplate) as (Loan & Partial<LoanTemplate>) | undefined;
  const templateProducts = template?.productOptions ?? template?.loanProductOptions ?? [];
  // In edit mode the current product may not appear in the returned option list; keep it visible.
  const products =
    templateProducts.length > 0 || !isEditMode || !loan
      ? templateProducts
      : [{ id: loan.loanProductId, name: loan.loanProductName ?? `Product #${loan.loanProductId}` }];
  const fundOptions = template?.fundOptions ?? [];
  const loanOfficerOptions = template?.loanOfficerOptions ?? [];
  const loanPurposeOptions = template?.loanPurposeOptions ?? [];
  const accountLinkingOptions = template?.accountLinkingOptions ?? [];
  const strategyOptions =
    template?.transactionProcessingStrategyOptions ?? productTemplate?.transactionProcessingStrategyOptions ?? [];

  const [previewOpen, setPreviewOpen] = useState(false);
  const previewMutation = useMutation({
    mutationFn: (values: FormFields) =>
      calculateLoanSchedule({
        clientId: values.clientId,
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
        transactionProcessingStrategyCode: values.transactionProcessingStrategyCode ?? "mifos-standard-strategy",
        loanType: "individual",
      }),
    onSuccess: () => setPreviewOpen(true),
  });

  const handleClientChange = useCallback(
    (cid: number) => {
      setClientId(cid || undefined);
      if (!isEditMode) {
        setSelectedProductId(undefined);
      }
    },
    [isEditMode],
  );

  const handleProductIdChange = useCallback((pid: number) => {
    setSelectedProductId(pid || undefined);
  }, []);

  // Never block the create form while the template loads — the product dropdown and
  // option sets simply populate asynchronously once the client-scoped template arrives.
  // Only edit mode blocks while the existing loan (with ?template=true) is being fetched.
  const isLoading = isEditMode && loanLoading;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = useCallback(
    async (values: CreateLoanFormValues & { originators?: Array<{ id: number; name?: string | null }> }) => {
      // Strip null values since LoanCreateRequest doesn't accept null
      const cleaned = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== null)) as Record<
        string,
        unknown
      >;

      const payload: Record<string, unknown> = {
        ...cleaned,
        clientId: values.clientId,
        submittedOnDate: currentDate(values.submittedOnDate),
        expectedDisbursementDate: currentDate(values.expectedDisbursementDate),
        dateFormat: "yyyy-MM-dd",
        locale: "en",
        loanType: "individual",
      };

      if (isEditMode && id) {
        delete payload.originators;
        await updateMutation.mutateAsync({ loanId: Number(id), payload: payload as Partial<LoanCreateRequest> });
        toastSuccess("Loan updated successfully");
        navigate(`/loans/view/${id}`);
      } else {
        const result = await createMutation.mutateAsync(payload as unknown as LoanCreateRequest);
        toastSuccess("Loan application submitted successfully");
        navigate(`/loans/view/${result.resourceId ?? result.loanId}`);
      }
    },
    [createMutation, updateMutation, navigate, isEditMode, id, toastSuccess],
  );

  const error = createMutation.error?.message ?? updateMutation.error?.message ?? null;
  const previewSchedule: LoanRepaymentSchedule | undefined = previewMutation.data;

  // Status gate (doc §4 / §10.4): applications can only be modified while "Submitted and pending approval".
  if (isEditMode && !isLoading && loan && loan.status?.id !== 100) {
    return (
      <div className="p-6 max-w-6xl m-auto">
        <PageHeader
          title="Edit Loan"
          description={`Editing loan ${loan.accountNo ?? `#${id}`}`}
          actions={
            <Button variant="outline" onClick={() => navigate(`/loans/view/${id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Loan
            </Button>
          }
        />
        <ErrorState
          title="Loan cannot be modified"
          message={`This loan is in "${loan.status?.value ?? "Unknown"}" state. Loan applications can only be modified while their status is "Submitted and pending approval".`}
          onRetry={() => navigate(`/loans/view/${id}`)}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl m-auto">
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
    <div className="p-6 max-w-6xl m-auto">
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
        template={template}
        templateLoading={templateLoading}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        mode={isEditMode ? "edit" : "create"}
        clientId={clientId ?? 0}
        onClientChange={handleClientChange}
        onProductIdChange={handleProductIdChange}
        strategyOptions={strategyOptions}
        fundOptions={fundOptions}
        loanOfficerOptions={loanOfficerOptions}
        loanPurposeOptions={loanPurposeOptions}
        accountLinkingOptions={accountLinkingOptions}
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
