import { type FC, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoanSearch } from "@/components/shared/LoanSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRescheduleTemplate, useCreateRescheduleRequest } from "../hooks/useRescheduleLoans";
import { createRescheduleRequestSchema, type CreateRescheduleRequestFormValues } from "../schemas/loan.schema";

const today = () => new Date().toISOString().split("T")[0];

const RescheduleLoanFormPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loanIdParam = searchParams.get("loanId") ? Number(searchParams.get("loanId")) : undefined;

  const templateQuery = useRescheduleTemplate();
  const createMutation = useCreateRescheduleRequest();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRescheduleRequestFormValues>({
    resolver: zodResolver(createRescheduleRequestSchema),
    defaultValues: {
      loanId: loanIdParam ?? 0,
      rescheduleFromDate: today(),
      rescheduleReasonId: 0,
      submittedOnDate: today(),
      adjustedDueDate: "",
      graceOnPrincipal: undefined,
      graceOnInterest: undefined,
      newInterestRate: undefined,
      extraTerms: undefined,
    },
  });

  const reasonOptions = templateQuery.data?.rescheduleReasons ?? [];
  const isSubmitting = createMutation.isPending;

  const onSubmit = useCallback(
    async (values: CreateRescheduleRequestFormValues) => {
      await createMutation.mutateAsync({
        loanId: values.loanId,
        rescheduleFromDate: values.rescheduleFromDate,
        rescheduleReasonId: values.rescheduleReasonId,
        submittedOnDate: values.submittedOnDate,
        adjustedDueDate: values.adjustedDueDate || undefined,
        graceOnPrincipal: values.graceOnPrincipal,
        graceOnInterest: values.graceOnInterest,
        newInterestRate: values.newInterestRate,
        extraTerms: values.extraTerms,
      });
      navigate("/rescheduling");
    },
    [createMutation, navigate],
  );

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title="New Reschedule Request"
        description="Request a repayment schedule adjustment for a loan"
        actions={
          <Button variant="outline" onClick={() => navigate("/rescheduling")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {createMutation.isError && (
        <ErrorState
          title="Failed to create request"
          message={
            createMutation.error instanceof Error ? createMutation.error.message : "An unexpected error occurred."
          }
          onRetry={() => createMutation.reset()}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reschedule Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LoanSearch
              value={watch("loanId")}
              onChange={(id) => setValue("loanId", id, { shouldValidate: true })}
              disabled={isSubmitting || !!loanIdParam}
              error={errors.loanId?.message}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Reason *</label>
              <Select
                value={watch("rescheduleReasonId") ? String(watch("rescheduleReasonId")) : ""}
                onValueChange={(v) => setValue("rescheduleReasonId", Number(v), { shouldValidate: true })}
                disabled={isSubmitting || templateQuery.isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={templateQuery.isLoading ? "Loading reasons..." : "Select reason"} />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((reason) => (
                    <SelectItem key={reason.id} value={String(reason.id)}>
                      {reason.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rescheduleReasonId && <p className="text-xs text-red-500">{errors.rescheduleReasonId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Reschedule From Date *</label>
              <Input
                type="date"
                {...register("rescheduleFromDate")}
                disabled={isSubmitting}
                error={errors.rescheduleFromDate?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Submitted On Date *</label>
              <Input
                type="date"
                {...register("submittedOnDate")}
                disabled={isSubmitting}
                error={errors.submittedOnDate?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Adjusted Due Date</label>
              <Input type="date" {...register("adjustedDueDate")} disabled={isSubmitting} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adjustments</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Grace on Principal</label>
              <Input type="number" {...register("graceOnPrincipal", { valueAsNumber: true })} disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Grace on Interest</label>
              <Input type="number" {...register("graceOnInterest", { valueAsNumber: true })} disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Extra Terms</label>
              <Input type="number" {...register("extraTerms", { valueAsNumber: true })} disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">New Interest Rate (%)</label>
              <Input
                type="number"
                step="0.01"
                {...register("newInterestRate", { valueAsNumber: true })}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit Request"
            )}
          </Button>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => window.history.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RescheduleLoanFormPage;
