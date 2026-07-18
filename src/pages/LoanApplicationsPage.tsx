import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Eye, CheckCircle, XCircle, DollarSign, Clock, TrendingUp, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import {
  useLoans,
  useApproveLoan,
  useDisburseLoan,
  useRejectLoan,
  useCloseLoan,
  LOAN_STATUS_CONFIG,
} from "@/features/loans";
import type { Loan } from "@/features/loans";

const PAGE_SIZE = 10;

const LoanApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [statusDialog, setStatusDialog] = useState<{ app: Loan; newCommand: string } | null>(null);

  // ─── React Query hooks ─────────────────────────────────────────
  const { data: loansData, isLoading, isError, error } = useLoans({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const approveMutation = useApproveLoan();
  const disburseMutation = useDisburseLoan();
  const rejectMutation = useRejectLoan();
  const closeMutation = useCloseLoan();

  const data = loansData?.pageItems ?? [];
  const totalFilteredRecords = loansData?.totalFilteredRecords ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFilteredRecords / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // ─── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pending = data.filter((l) => l.status?.code === "loanStatusType.submitted.and.pending.approval").length;
    const approved = data.filter((l) => l.status?.code === "loanStatusType.approved" || l.status?.code === "loanStatusType.active").length;
    const active = data.filter((l) => l.status?.code === "loanStatusType.active").length;
    const totalDisbursed = data.reduce((sum, l) => sum + (l.totalRepayment ?? 0), 0);
    return { total: totalFilteredRecords, pending, approved, active, totalDisbursed };
  }, [data, totalFilteredRecords]);

  // ─── Filtering ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = data;
    const q = search.toLowerCase();
    if (q) result = result.filter((l) => (l.clientName ?? "").toLowerCase().includes(q) || (l.accountNo ?? "").toLowerCase().includes(q) || l.loanProductName.toLowerCase().includes(q));
    if (statusFilter !== "all") result = result.filter((l) => l.status?.code === statusFilter);
    return result;
  }, [data, search, statusFilter]);

  const handleStatusChange = (app: Loan, command: string) => setStatusDialog({ app, newCommand: command });

  const confirmStatusChange = () => {
    if (!statusDialog) return;
    const { app, newCommand } = statusDialog;
    const loanId = app.id;
    const basePayload = { locale: "en", dateFormat: "dd MMMM yyyy" };
    switch (newCommand) {
      case "approve":
        approveMutation.mutate({ loanId, payload: { ...basePayload, approvedOnDate: new Date().toISOString().split("T")[0] } });
        break;
      case "disburse":
        disburseMutation.mutate({ loanId, payload: { ...basePayload, actualDisbursementDate: new Date().toISOString().split("T")[0] } });
        break;
      case "reject":
        rejectMutation.mutate({ loanId, payload: { ...basePayload, rejectedOnDate: new Date().toISOString().split("T")[0] } });
        break;
      case "close":
        closeMutation.mutate({ loanId, payload: { ...basePayload, closedOnDate: new Date().toISOString().split("T")[0] } });
        break;
    }
    setStatusDialog(null);
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const columns: ColumnDef<Loan>[] = [
    { key: "accountNo", header: "Loan #", cell: (r) => <code className="text-xs font-mono">{r.accountNo ?? `#${r.id}`}</code> },
    { key: "clientName", header: "Customer", cell: (r) => <span className="font-medium">{r.clientName ?? `Client #${r.clientId}`}</span> },
    { key: "loanProductName", header: "Product" },
    { key: "principal", header: "Amount", cell: (r) => <span className="font-mono text-sm font-medium">{formatCurrency(r.principal ?? 0)}</span> },
    { key: "numberOfRepayments", header: "Tenure", cell: (r) => `${r.numberOfRepayments} × ${r.repaymentEvery} ${r.repaymentFrequencyType?.value?.toLowerCase() ?? "mo"}` },
    { key: "annualInterestRate", header: "Rate", cell: (r) => `${r.annualInterestRate ?? 0}%` },
    { key: "status", header: "Status", cell: (r) => { const c = LOAN_STATUS_CONFIG[r.status?.code ?? ""]; return <StatusBadge status={c?.variant ?? "default"} label={c?.label ?? r.status?.code ?? "Unknown"} size="sm" />; } },
    { key: "loanOfficerName", header: "Officer", cell: (r) => <span className="text-xs">{r.loanOfficerName ?? "—"}</span> },
    { key: "timeline", header: "Submitted", cell: (r) => <span className="text-xs">{r.timeline?.submittedOnDate ? new Date(r.timeline.submittedOnDate).toLocaleDateString() : "—"}</span> },
    {
      key: "actions", header: "",
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => navigate(`/lending/applications/${r.id}`)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
            {r.status?.code === "loanStatusType.submitted.and.pending.approval" && (
              <>
                <DropdownMenuItem onClick={() => handleStatusChange(r, "approve")}><CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Approve</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(r, "reject")}><XCircle className="mr-2 h-4 w-4 text-red-600" /> Reject</DropdownMenuItem>
              </>
            )}
            {r.status?.code === "loanStatusType.approved" && (
              <DropdownMenuItem onClick={() => handleStatusChange(r, "disburse")}><DollarSign className="mr-2 h-4 w-4 text-blue-600" /> Disburse</DropdownMenuItem>
            )}
            {r.status?.code === "loanStatusType.active" && (
              <DropdownMenuItem onClick={() => handleStatusChange(r, "close")}><XCircle className="mr-2 h-4 w-4 text-gray-600" /> Close</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isError) return (
    <div className="flex items-center justify-center h-64"><div className="text-center"><AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" /><p className="text-red-600">Failed to load loans: {String(error)}</p><Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>Retry</Button></div></div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Loan Applications" description="Manage loan applications, approvals, disbursements and repayments"
        actions={<Button onClick={() => navigate("/lending/applications/new")}><Plus className="mr-2 h-4 w-4" />New Application</Button>} />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-24 rounded-xl" />))}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total Loans" value={stats.total} icon={DollarSign} />
          <StatCard title="Pending Review" value={stats.pending} icon={Clock} variant="warning" />
          <StatCard title="Approved" value={stats.approved} icon={CheckCircle} variant="success" />
          <StatCard title="Active Loans" value={stats.active} icon={TrendingUp} variant="success" />
        </div>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Loan Applications</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search by customer, ID, product..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" /></div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(LOAN_STATUS_CONFIG).map(([code, cfg]) => (<SelectItem key={code} value={code}>{cfg.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>) : (
            <>
              <DataTable columns={columns} data={filtered} emptyState={{ message: "No loan applications found" }} />
              {totalPages > 1 && (<div className="mt-4"><Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={totalFilteredRecords} pageSize={PAGE_SIZE} /></div>)}
            </>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Change Loan Status</DialogTitle><DialogDescription>Update {statusDialog?.app.clientName ?? `Loan #${statusDialog?.app.id}`} to <strong>{statusDialog?.newCommand}</strong>?</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setStatusDialog(null)}>Cancel</Button><Button onClick={confirmStatusChange} disabled={approveMutation.isPending || disburseMutation.isPending || rejectMutation.isPending || closeMutation.isPending}>{approveMutation.isPending || disburseMutation.isPending || rejectMutation.isPending || closeMutation.isPending ? "Processing…" : "Confirm"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanApplicationsPage;
