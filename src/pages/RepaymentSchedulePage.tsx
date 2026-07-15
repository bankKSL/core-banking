import React, { useState, useMemo } from "react";
import { Search, ArrowLeft, Calculator, Download, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loanApplications, repaymentSchedules } from "@/mock/data";
import type { RepaymentSchedule, LoanApplication, InstallmentStatus } from "@/types";

const PAGE_SIZE = 12;

const RepaymentSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLoanId, setSelectedLoanId] = useState<string>(loanApplications[0]?.id ?? "");
  const [statusFilter, setStatusFilter] = useState<InstallmentStatus | "all">("all");
  const [page, setPage] = useState(1);

  const selectedApplication = useMemo(
    () => loanApplications.find((a) => a.id === selectedLoanId),
    [selectedLoanId],
  );

  const scheduleData = useMemo(() => {
    let items = repaymentSchedules.filter((s) => s.loanApplicationId === selectedLoanId);
    if (statusFilter !== "all") {
      items = items.filter((s) => s.status === statusFilter);
    }
    return items;
  }, [selectedLoanId, statusFilter]);

  const stats = useMemo(() => {
    const total = scheduleData.length;
    const paid = scheduleData.filter((s) => s.status === "paid").length;
    const pending = scheduleData.filter((s) => s.status === "pending").length;
    const overdue = scheduleData.filter((s) => s.status === "overdue").length;
    const totalPaid = scheduleData.filter((s) => s.status === "paid").reduce((sum, s) => sum + (s.paidAmount ?? 0), 0);
    return { total, paid, pending, overdue, totalPaid };
  }, [scheduleData]);

  const totalPages = Math.max(1, Math.ceil(scheduleData.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => scheduleData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [scheduleData, safePage]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

  const columns: ColumnDef<RepaymentSchedule>[] = [
    { key: "installmentNo", header: "#", cell: (row) => <span className="font-mono text-sm">#{row.installmentNo}</span> },
    {
      key: "dueDate", header: "Due Date",
      cell: (row) => new Date(row.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
    {
      key: "openingBalance", header: "Opening Balance",
      cell: (row) => <span className="font-mono text-sm">{formatCurrency(row.openingBalance)}</span>,
    },
    {
      key: "emi", header: "EMI",
      cell: (row) => <span className="font-mono text-sm font-semibold">{formatCurrency(row.emi)}</span>,
    },
    {
      key: "principalComponent", header: "Principal",
      cell: (row) => <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400">{formatCurrency(row.principalComponent)}</span>,
    },
    {
      key: "interestComponent", header: "Interest",
      cell: (row) => <span className="font-mono text-sm text-amber-700 dark:text-amber-400">{formatCurrency(row.interestComponent)}</span>,
    },
    {
      key: "closingBalance", header: "Closing Balance",
      cell: (row) => <span className="font-mono text-sm">{formatCurrency(row.closingBalance)}</span>,
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} size="sm" /> },
    {
      key: "paidAmount", header: "Paid",
      cell: (row) => row.paidAmount ? (
        <div>
          <span className="font-mono text-xs">{formatCurrency(row.paidAmount)}</span>
          {row.paidDate && <p className="text-[10px] text-gray-400">{new Date(row.paidDate).toLocaleDateString()}</p>}
        </div>
      ) : <span className="text-xs text-gray-400">—</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repayment Schedule"
        description="View amortization schedule and track installment payments"
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export Schedule
          </Button>
        }
      />

      {/* Loan Selection */}
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <Select value={selectedLoanId} onValueChange={(v) => { setSelectedLoanId(v); setPage(1); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a loan application" />
                </SelectTrigger>
                <SelectContent>
                  {loanApplications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.applicationId} — {app.customerName} ({formatCurrency(app.amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as InstallmentStatus | "all"); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedApplication && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total Installments" value={stats.total} icon={Calculator} />
          <StatCard title="Paid" value={stats.paid} icon={TrendingDown} variant="success" />
          <StatCard title="Pending" value={stats.pending} variant="warning" />
          <StatCard title="Total Paid" value={formatCurrency(stats.totalPaid)} variant="success" />
        </div>
      )}

      <DataTable
        columns={columns}
        data={paginated}
        emptyState={{
          title: "No schedule found",
          message: selectedLoanId
            ? "No repayment schedule available for this loan"
            : "Select a loan application to view its repayment schedule",
        }}
      />

      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage}
        totalItems={scheduleData.length} pageSize={PAGE_SIZE} />
    </div>
  );
};

export default RepaymentSchedulePage;
