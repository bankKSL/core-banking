import { type FC, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Users, CheckSquare, Square, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OfficeSelect } from "@/components/shared/OfficeSelect";
import { useToast } from "@/components/ui/toast";
import { useReassignmentTemplate, useExecuteReassignment } from "../hooks/useLoanReassignment";
import { useLoanPermissions } from "../hooks/useLoanPermissions";
import type { LoanSummary, ClientSummary, GroupSummary } from "../api/loanReassignment";

const loanReassignmentSchema = z.object({
  officeId: z.number().optional(),
  fromLoanOfficerId: z.number({ message: "From Loan Officer is required" }).min(1, "From Loan Officer is required"),
  toLoanOfficerId: z.number({ message: "To Loan Officer is required" }).min(1, "To Loan Officer is required"),
  assignmentDate: z.string().min(1, "Assignment Date is required"),
});

type LoanReassignmentFormValues = z.infer<typeof loanReassignmentSchema>;

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatStatusBadge(status: { code: string; value: string }): string {
  return status.value;
}

function getLoanStatusColor(code: string): string {
  if (code.includes("active")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (code.includes("pending")) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  if (code.includes("closed")) return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
}

const LoanReassignmentPage: FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const { can } = useLoanPermissions();
  const [selectedLoanIds, setSelectedLoanIds] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasPermission = can("bulkReassign");

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<LoanReassignmentFormValues>({
    resolver: zodResolver(loanReassignmentSchema),
    defaultValues: {
      officeId: undefined,
      fromLoanOfficerId: undefined,
      toLoanOfficerId: undefined,
      assignmentDate: todayIso(),
    },
  });

  const officeId = watch("officeId");
  const fromLoanOfficerId = watch("fromLoanOfficerId");
  const toLoanOfficerId = watch("toLoanOfficerId");

  const { data: template, isLoading: isTemplateLoading } = useReassignmentTemplate(officeId);
  const {
    data: accountSummary,
    isLoading: isAccountSummaryLoading,
    isFetching: isAccountSummaryFetching,
  } = useReassignmentTemplate(officeId, fromLoanOfficerId || undefined);

  const executeMutation = useExecuteReassignment();

  const loanOfficerOptions = template?.loanOfficerOptions ?? [];
  const accountSummaryData = accountSummary?.accountSummaryCollection;

  const clients = useMemo(() => accountSummaryData?.clients ?? [], [accountSummaryData]);
  const groups = useMemo(() => accountSummaryData?.groups ?? [], [accountSummaryData]);

  const allLoans = useMemo(() => {
    const loans: LoanSummary[] = [];
    for (const c of clients) loans.push(...c.loans);
    for (const g of groups) loans.push(...g.loans);
    return loans;
  }, [clients, groups]);

  const hasLoans = allLoans.length > 0;
  const allSelected = hasLoans && selectedLoanIds.size === allLoans.length;

  const toggleLoan = useCallback((loanId: number) => {
    setSelectedLoanIds((prev) => {
      const next = new Set(prev);
      if (next.has(loanId)) next.delete(loanId);
      else next.add(loanId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedLoanIds((prev) => {
      if (prev.size === allLoans.length) return new Set<number>();
      return new Set(allLoans.map((l) => l.id));
    });
  }, [allLoans]);

  const handleFromOfficerChange = useCallback(
    (value: string) => {
      if (value) {
        setValue("fromLoanOfficerId", Number(value), { shouldValidate: true });
        setSelectedLoanIds(new Set());
      }
    },
    [setValue],
  );

  const onSubmit = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const confirmSubmit = useCallback(async () => {
    const formValues = getValues();

    await executeMutation.mutateAsync({
      fromLoanOfficerId: formValues.fromLoanOfficerId!,
      toLoanOfficerId: formValues.toLoanOfficerId!,
      assignmentDate: formValues.assignmentDate,
      loans: Array.from(selectedLoanIds),
    });

    setConfirmOpen(false);
    success("Loans reassigned", `${selectedLoanIds.size} loan(s) have been reassigned successfully.`);
    navigate("/loans");
  }, [executeMutation, navigate, selectedLoanIds, success, getValues]);

  if (!hasPermission) {
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
        <ErrorState title="Permission denied" message="You do not have permission to perform bulk loan reassignment." />
      </div>
    );
  }

  if (isTemplateLoading) {
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
    <div className="p-6 max-w-3xl m-auto space-y-6">
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
          message={
            executeMutation.error instanceof Error ? executeMutation.error.message : "An unexpected error occurred."
          }
          onRetry={() => executeMutation.reset()}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reassignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OfficeSelect
              value={watch("officeId") ? String(watch("officeId")) : ""}
              onChange={(v) => setValue("officeId", v ? Number(v) : undefined, { shouldValidate: true })}
              error={errors.officeId?.message}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">From Loan Officer *</label>
                <Controller
                  name="fromLoanOfficerId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => handleFromOfficerChange(v)}
                    >
                      <SelectTrigger id="fromLoanOfficer">
                        <SelectValue placeholder="Select officer..." />
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
                {errors.fromLoanOfficerId && (
                  <p className="text-xs text-red-500">{errors.fromLoanOfficerId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">To Loan Officer *</label>
                <Controller
                  name="toLoanOfficerId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger id="toLoanOfficer">
                        <SelectValue placeholder="Select officer..." />
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
                {errors.toLoanOfficerId && (
                  <p className="text-xs text-red-500">{errors.toLoanOfficerId.message}</p>
                )}
              </div>
            </div>

            <Controller
              name="assignmentDate"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Assignment Date *</label>
                  <input
                    type="date"
                    {...field}
                    max={todayIso()}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D32F2F]/50 focus-visible:border-[#D32F2F] disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                  {errors.assignmentDate && <p className="text-xs text-red-500">{errors.assignmentDate.message}</p>}
                </div>
              )}
            />

            {toLoanOfficerId && fromLoanOfficerId && toLoanOfficerId === fromLoanOfficerId && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> From and To officers must be different.
              </p>
            )}
          </CardContent>
        </Card>

        {fromLoanOfficerId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base">
                Loans to Reassign
                {selectedLoanIds.size > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({selectedLoanIds.size} of {allLoans.length} selected)
                  </span>
                )}
              </CardTitle>
              {hasLoans && (
                <Button type="button" variant="ghost" size="sm" onClick={toggleAll} className="h-8 text-xs">
                  {allSelected ? (
                    <>
                      <Square className="mr-1 h-3 w-3" /> Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="mr-1 h-3 w-3" /> Select All
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isAccountSummaryLoading || isAccountSummaryFetching ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : !hasLoans ? (
                <EmptyState
                  icon={Users}
                  title="No loans to reassign"
                  description="The selected officer has no active loans assigned."
                />
              ) : (
                <div className="space-y-4">
                  {clients.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Clients</h4>
                      <div className="space-y-2">
                        {clients.map((client) => (
                          <ClientGroupCard
                            key={client.id}
                            entity={client}
                            selectedLoanIds={selectedLoanIds}
                            onToggleLoan={toggleLoan}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {groups.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Groups</h4>
                      <div className="space-y-2">
                        {groups.map((group) => (
                          <ClientGroupCard
                            key={group.id}
                            entity={group}
                            selectedLoanIds={selectedLoanIds}
                            onToggleLoan={toggleLoan}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/loans")}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              executeMutation.isPending ||
              selectedLoanIds.size === 0 ||
              !fromLoanOfficerId ||
              !toLoanOfficerId ||
              (toLoanOfficerId != null && fromLoanOfficerId != null && toLoanOfficerId === fromLoanOfficerId)
            }
          >
            {executeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reassigning...
              </>
            ) : (
              `Reassign ${selectedLoanIds.size > 0 ? `${selectedLoanIds.size} ` : ""}Loan${selectedLoanIds.size !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={confirmSubmit}
        title="Confirm Bulk Reassignment"
        description={`You are about to reassign ${selectedLoanIds.size} loan(s). This action cannot be undone.`}
        confirmLabel={executeMutation.isPending ? "Reassigning..." : "Confirm Reassignment"}
        loading={executeMutation.isPending}
      />
    </div>
  );
};

interface ClientGroupCardProps {
  entity: ClientSummary | GroupSummary;
  selectedLoanIds: Set<number>;
  onToggleLoan: (loanId: number) => void;
}

function ClientGroupCard({ entity, selectedLoanIds, onToggleLoan }: ClientGroupCardProps) {
  const allSelected = entity.loans.every((l) => selectedLoanIds.has(l.id));
  const someSelected = entity.loans.some((l) => selectedLoanIds.has(l.id)) && !allSelected;

  const toggleEntityLoans = () => {
    const newSet = new Set(selectedLoanIds);
    if (allSelected) {
      entity.loans.forEach((l) => newSet.delete(l.id));
    } else {
      entity.loans.forEach((l) => newSet.add(l.id));
    }
    // We need to set state in parent — use a dedicated callback
    entity.loans.forEach((l) => {
      if (allSelected && selectedLoanIds.has(l.id)) onToggleLoan(l.id);
      else if (!allSelected && !selectedLoanIds.has(l.id)) onToggleLoan(l.id);
    });
  };

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={toggleEntityLoans}
          />
          <span className="text-sm font-medium">{entity.displayName}</span>
        </div>
        <span className="text-xs text-gray-500">
          {entity.loans.length} loan{entity.loans.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="ml-6 space-y-1">
        {entity.loans.map((loan) => (
          <label
            key={loan.id}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1 py-0.5 -mx-1"
          >
            <Checkbox
              checked={selectedLoanIds.has(loan.id)}
              onCheckedChange={() => onToggleLoan(loan.id)}
            />
            <span className="flex-1">{loan.accountNo}</span>
            <span className="text-xs text-gray-500">{loan.loanProductName}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${getLoanStatusColor(loan.status.code)}`}>
              {formatStatusBadge(loan.status)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default LoanReassignmentPage;
