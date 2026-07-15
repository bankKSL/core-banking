import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Filter, Eye, CheckCircle, XCircle,
  DollarSign, Clock, AlertTriangle, TrendingUp, TrendingDown,
  Users, FileText, MoreHorizontal, Pencil, Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { loanApplications } from "@/mock/data";
import type { LoanApplication, LoanStatus } from "@/types";

const PAGE_SIZE = 10;

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  personal_loan: "Personal Loan",
  mortgage: "Mortgage",
  auto_loan: "Auto Loan",
  business_loan: "Business Loan",
  education_loan: "Education Loan",
  home_equity: "Home Equity",
};

const LoanApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<LoanApplication[]>(loanApplications);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LoanStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [statusDialog, setStatusDialog] = useState<{ app: LoanApplication; newStatus: LoanStatus } | null>(null);

  const stats = useMemo(() => {
    const total = data.length;
    const pending = data.filter((a) => a.status === "pending" || a.status === "under_review").length;
    const approved = data.filter((a) => a.status === "approved" || a.status === "disbursed").length;
    const active = data.filter((a) => a.status === "active").length;
    const defaulted = data.filter((a) => a.status === "defaulted").length;
    const totalDisbursed = data
      .filter((a) => a.status === "active" || a.status === "disbursed" || a.status === "closed")
      .reduce((sum, a) => sum + a.amount, 0);
    return { total, pending, approved, active, defaulted, totalDisbursed };
  }, [data]);

  const filtered = useMemo(() => {
    let result = data;
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (a) =>
          a.customerName.toLowerCase().includes(q) ||
          a.applicationId.toLowerCase().includes(q) ||
          a.productName.toLowerCase().includes(q) ||
          a.assignedTo.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    return result;
  }, [data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);

  const handleStatusChange = useCallback((app: LoanApplication, newStatus: LoanStatus) => {
    setStatusDialog({ app, newStatus });
  }, []);

  const confirmStatusChange = useCallback(() => {
    if (!statusDialog) return;
    const now = new Date().toISOString();
    setData((prev) =>
      prev.map((a) => {
        if (a.id !== statusDialog.app.id) return a;
        const updates: Partial<LoanApplication> = { status: statusDialog.newStatus, updatedAt: now };
        if (statusDialog.newStatus === "approved") updates.approvedDate = now;
        if (statusDialog.newStatus === "disbursed") updates.disbursedDate = now;
        if (statusDialog.newStatus === "closed") updates.closedDate = now;
        return { ...a, ...updates };
      }),
    );
    setStatusDialog(null);
  }, [statusDialog]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const columns: ColumnDef<LoanApplication>[] = [
    {
      key: "applicationId", header: "Application ID",
      cell: (row) => <code className="text-xs font-mono text-gray-700 dark:text-gray-300">{row.applicationId}</code>,
    },
    {
      key: "customerName", header: "Customer",
      cell: (row) => (
        <div>
          <span className="font-medium text-gray-900 dark:text-gray-100">{row.customerName}</span>
          <p className="text-xs text-gray-500">{row.customerType === "business" ? "Business" : "Individual"}</p>
        </div>
      ),
    },
    {
      key: "productType", header: "Product",
      cell: (row) => <span className="text-sm">{PRODUCT_TYPE_LABELS[row.productType] ?? row.productName}</span>,
    },
    {
      key: "amount", header: "Amount",
      cell: (row) => <span className="font-mono text-sm font-medium">{formatCurrency(row.amount)}</span>,
    },
    { key: "tenure", header: "Tenure", cell: (row) => `${row.tenure} mo` },
    { key: "interestRate", header: "Rate", cell: (row) => `${row.interestRate}%` },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} size="sm" /> },
    { key: "assignedTo", header: "Assigned To", cell: (row) => <span className="text-xs">{row.assignedTo}</span> },
    {
      key: "appliedDate", header: "Applied",
      cell: (row) => <span className="text-xs">{new Date(row.appliedDate).toLocaleDateString()}</span>,
    },
    {
      key: "actions", header: "Actions",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate(`/lending/applications/${row.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
            {(row.status === "pending" || row.status === "draft") && (
              <DropdownMenuItem onClick={() => handleStatusChange(row, "under_review")}>
                <FileText className="mr-2 h-4 w-4" /> Send to Review
              </DropdownMenuItem>
            )}
            {row.status === "under_review" && (
              <>
                <DropdownMenuItem onClick={() => handleStatusChange(row, "approved")}>
                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" /> Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(row, "rejected")}>
                  <XCircle className="mr-2 h-4 w-4 text-red-600" /> Reject
                </DropdownMenuItem>
              </>
            )}
            {row.status === "approved" && (
              <DropdownMenuItem onClick={() => handleStatusChange(row, "disbursed")}>
                <DollarSign className="mr-2 h-4 w-4 text-emerald-600" /> Disburse
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Applications"
        description="Manage loan origination pipeline from application to disbursement"
        actions={
          <Button onClick={() => navigate("/lending/applications/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Application
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Total Applications" value={stats.total} icon={FileText} />
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} variant="warning" />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle} variant="success" />
        <StatCard title="Active Loans" value={stats.active} icon={TrendingUp} variant="success" />
        <StatCard title="Defaulted" value={stats.defaulted} icon={AlertTriangle} variant="error" />
        <StatCard title="Total Disbursed" value={formatCurrency(stats.totalDisbursed)} icon={DollarSign} />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Loan Applications</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer, ID, product..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as LoanStatus | "all"); setPage(1); }}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={paginated} emptyState={{ message: "No loan applications found" }} />
          {filtered.length > PAGE_SIZE && (
            <div className="mt-4">
              <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage}
                totalItems={filtered.length} pageSize={PAGE_SIZE} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Confirmation */}
      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Application Status</DialogTitle>
            <DialogDescription>
              Change status of {statusDialog?.app.customerName}'s application
              ({statusDialog?.app.applicationId}) to{' '}
              <strong>{statusDialog?.newStatus.replace(/_/g, " ")}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>Cancel</Button>
            <Button onClick={confirmStatusChange}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanApplicationsPage;
