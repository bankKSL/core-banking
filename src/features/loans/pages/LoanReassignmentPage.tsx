import { type FC, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOffices } from "@/hooks/useOffices";
import { useReassignmentTemplate, useExecuteReassignment } from "../hooks/useLoanReassignment";

const loanReassignmentSchema = z.object({
  officeId: z.number({ required_error: "Office is required" }),
  fromLoanOfficerId: z.number().nullable().optional(),
  toLoanOfficerId: z.number({ required_error: "To Loan Officer is required" }),
  loanIds: z.string().min(1, "At least one loan ID is required"),
});

type LoanReassignmentFormValues = z.infer<typeof loanReassignmentSchema>;

const LoanReassignmentPage: FC = () => {
  const navigate = useNavigate();
  const { data: offices = [] } = useOffices();
  const { data: template, isLoading } = useReassignmentTemplate();
  const executeMutation = useExecuteReassignment();

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<LoanReassignmentFormValues>({
    resolver: zodResolver(loanReassignmentSchema),
    defaultValues: {
      officeId: undefined,
      fromLoanOfficerId: null,
      toLoanOfficerId: undefined,
      loanIds: "",
    },
  });

  const loanOfficerOptions = template?.loanOfficerOptions ?? [];

  const onSubmit = useCallback(
    async (values: LoanReassignmentFormValues) => {
      await executeMutation.mutateAsync({
        officeId: values.officeId,
        fromLoanOfficerId: values.fromLoanOfficerId ?? undefined,
        toLoanOfficerId: values.toLoanOfficerId,
        loanIds: values.loanIds
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n)),
      });
      navigate("/loans");
    },
    [executeMutation, navigate],
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl m-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Card>
          <CardContent className="py-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl m-auto space-y-6">
      <PageHeader
        title="Bulk Loan Reassignment"
        description="Reassign loans between loan officers"
        actions={
          <Button variant="outline" onClick={() => navigate("/loans")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      {executeMutation.isError && (
        <ErrorState
          title="Failed to reassign loans"
          message={executeMutation.error instanceof Error ? executeMutation.error.message : "An unexpected error occurred."}
          onRetry={() => executeMutation.reset()}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reassignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="office">Office *</Label>
              <Controller
                name="officeId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="office">
                      <SelectValue placeholder="Select office" />
                    </SelectTrigger>
                    <SelectContent>
                      {offices.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.nameDecorated || o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.officeId && <p className="text-xs text-red-500">{errors.officeId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fromLoanOfficer">From Loan Officer (optional)</Label>
                <Controller
                  name="fromLoanOfficerId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                    >
                      <SelectTrigger id="fromLoanOfficer">
                        <SelectValue placeholder="All officers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All officers</SelectItem>
                        {loanOfficerOptions.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="toLoanOfficer">To Loan Officer *</Label>
                <Controller
                  name="toLoanOfficerId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger id="toLoanOfficer">
                        <SelectValue placeholder="Select officer" />
                      </SelectTrigger>
                      <SelectContent>
                        {loanOfficerOptions.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.toLoanOfficerId && <p className="text-xs text-red-500">{errors.toLoanOfficerId.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="loanIds">Loan IDs *</Label>
              <Input
                id="loanIds"
                {...register("loanIds")}
                placeholder="e.g. 1, 2, 3"
              />
              {errors.loanIds && <p className="text-xs text-red-500">{errors.loanIds.message}</p>}
              <p className="text-xs text-gray-500 mt-1">Comma-separated list of loan IDs to reassign.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/loans")}>
                Cancel
              </Button>
              <Button type="submit" disabled={executeMutation.isPending}>
                {executeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reassigning…
                  </>
                ) : (
                  "Reassign Loans"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default LoanReassignmentPage;
