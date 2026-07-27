import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffices } from "@/hooks/useOffices";
import { useReassignmentTemplate, useExecuteReassignment } from "../hooks/useLoanReassignment";

const LoanReassignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: offices = [] } = useOffices();
  const { data: template, isLoading } = useReassignmentTemplate();
  const executeMutation = useExecuteReassignment();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [officeId, setOfficeId] = useState<number | null>(null);
  const [fromLoanOfficerId, setFromLoanOfficerId] = useState<number | null>(null);
  const [toLoanOfficerId, setToLoanOfficerId] = useState<number | null>(null);
  const [loanIds, setLoanIds] = useState("");

  const loanOfficerOptions = template?.loanOfficerOptions ?? [];

  const handleSubmit = useCallback(async () => {
    if (!officeId || !toLoanOfficerId || !loanIds.trim()) return;
    setMutationError(null);
    try {
      await executeMutation.mutateAsync({
        officeId,
        fromLoanOfficerId: fromLoanOfficerId ?? undefined,
        toLoanOfficerId,
        loanIds: loanIds.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
      });
      navigate("/loans");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
      const msg = error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to reassign loans.";
      setMutationError(msg);
    }
  }, [officeId, fromLoanOfficerId, toLoanOfficerId, loanIds, executeMutation, navigate]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl m-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" />
        <Card><CardContent className="py-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
          ))}
        </CardContent></Card>
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

      {mutationError && <ErrorState message={mutationError} />}

      <Card>
        <CardHeader>
          <CardTitle>Reassignment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Office *</Label>
            <Select value={officeId ? String(officeId) : ""} onValueChange={(v) => setOfficeId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select office" />
              </SelectTrigger>
              <SelectContent>
                {offices.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.nameDecorated || o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>From Loan Officer (optional)</Label>
              <Select value={fromLoanOfficerId ? String(fromLoanOfficerId) : ""} onValueChange={(v) => setFromLoanOfficerId(v ? Number(v) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="All officers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All officers</SelectItem>
                  {loanOfficerOptions.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Loan Officer *</Label>
              <Select value={toLoanOfficerId ? String(toLoanOfficerId) : ""} onValueChange={(v) => setToLoanOfficerId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select officer" />
                </SelectTrigger>
                <SelectContent>
                  {loanOfficerOptions.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="loanIds">Loan IDs *</Label>
            <Input
              id="loanIds"
              value={loanIds}
              onChange={(e) => setLoanIds(e.target.value)}
              placeholder="e.g. 1, 2, 3"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list of loan IDs to reassign.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate("/loans")}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!officeId || !toLoanOfficerId || !loanIds.trim() || executeMutation.isPending}>
              {executeMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reassigning…</>
              ) : (
                "Reassign Loans"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanReassignmentPage;
