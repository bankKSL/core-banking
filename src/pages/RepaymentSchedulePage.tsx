import React, { useState, useMemo } from "react";
import { Search, Download, Calculator, TrendingDown, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoans, useRepaymentSchedule, LOAN_STATUS_CONFIG } from "@/features/loans";
import type { LoanRepaymentPeriod } from "@/features/loans";

const PAGE_SIZE = 12;

const RepaymentSchedulePage: React.FC = () => {
  const [selectedLoanId, setSelectedLoanId] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: loansData, isLoading: loansLoading } = useLoans({ limit: 100 });
  const { data: scheduleLoan, isLoading: scheduleLoading } = useRepaymentSchedule(selectedLoanId);

  const loans = loansData?.pageItems ?? [];
  const scheduleData: LoanRepaymentPeriod[] = scheduleLoan?.repaymentSchedule ?? [];

  const filteredSchedule = useMemo(() => {
    let items = scheduleData;
    if (statusFilter !== "all") {
      if (statusFilter === "paid") items = items.filter((s) => s.principalOutstanding <= 0 && s.interestOutstanding <= 0);
      else if (statusFilter === "pending") items = items.filter((s) => s.principalOutstanding > 0 || s.interestOutstanding > 0);
      else if (statusFilter === "overdue") items = items.filter((s) => (s.principalOutstanding > 0 || s.interestOutstanding > 0) && new Date(s.dueDate) < new Date());
    }
    return items;
  }, [scheduleData, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedule.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => filteredSchedule.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filteredSchedule, safePage]);

  const stats = useMemo(() => {
    const total = scheduleData.length;
    const paid = scheduleData.filter((s) => s.principalOutstanding <= 0 && s.interestOutstanding <= 0).length;
    const pending = scheduleData.filter((s) => s.principalOutstanding > 0 || s.interestOutstanding > 0).length;
    const totalPaid = scheduleData.reduce((sum, s) => sum + (s.principalPaid ?? 0) + (s.interestPaid ?? 0), 0);
    return { total, paid, pending, totalPaid };
  }, [scheduleData]);

  const formatCurrency = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

  const columns: ColumnDef<LoanRepaymentPeriod>[] = [
    { key: "period", header: "#", cell: (r) => <span className="font-mono text-sm">#{r.period}</span> },
    { key: "dueDate", header: "Due Date", cell: (r) => new Date(r.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
    { key: "principalOriginalDue", header: "Principal", cell: (r) => <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400">{formatCurrency(r.principalOriginalDue)}</span> },
    { key: "interestOriginalDue", header: "Interest", cell: (r) => <span className="font-mono text-sm text-amber-700 dark:text-amber-400">{formatCurrency(r.interestOriginalDue)}</span> },
    { key: "totalDueForPeriod", header: "Total", cell: (r) => <span className="font-mono text-sm font-semibold">{formatCurrency(r.totalDueForPeriod)}</span> },
    { key: "totalOutstandingForPeriod", header: "Outstanding", cell: (r) => <span className="font-mono text-sm text-red-600">{formatCurrency(r.totalOutstandingForPeriod)}</span> },
    {
      key: "status", header: "Status",
      cell: (r) => {
        const isPaid = r.totalOutstandingForPeriod <= 0;
        const isOverdue = !isPaid && new Date(r.dueDate) < new Date();
        return <StatusBadge status={isPaid ? "success" : isOverdue ? "error" : "warning"} size="sm">{isPaid ? "Paid" : isOverdue ? "Overdue" : "Pending"}</StatusBadge>;
      },
    },
    { key: "daysInPeriod", header: "Days" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Repayment Schedule" description="View amortization schedule and track installment payments"
        actions={<Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export Schedule</Button>} />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <Select value={selectedLoanId ? String(selectedLoanId) : ""} onValueChange={(v) => { setSelectedLoanId(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select a loan" /></SelectTrigger>
                <SelectContent>
                  {loans.map((l) => (<SelectItem key={l.id} value={String(l.id)}>{l.accountNo ?? `#${l.id}`} — {l.clientName} ({formatCurrency(l.principal ?? 0)})</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedLoanId && scheduleLoan && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total Installments" value={stats.total} icon={Calculator} />
          <StatCard title="Paid" value={stats.paid} icon={TrendingDown} variant="success" />
          <StatCard title="Pending" value={stats.pending} variant="warning" />
          <StatCard title="Total Paid" value={formatCurrency(stats.totalPaid)} variant="success" />
        </div>
      )}

      {scheduleLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
      ) : (
        <DataTable
          columns={columns}
          data={paginated}
          emptyState={{ title: "No schedule found", message: selectedLoanId ? "No repayment schedule available for this loan" : "Select a loan to view its repayment schedule" }}
        />
      )}

      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={filteredSchedule.length} pageSize={PAGE_SIZE} />
    </div>
  );
};

export default RepaymentSchedulePage;
