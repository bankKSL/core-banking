import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Wallet, TrendingUp, Clock, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useFixedDepositAccounts, FIXED_DEPOSIT_STATUS_CONFIG } from "@/features/deposits";
import type { FixedDepositAccount } from "@/features/deposits";

const PAGE_SIZE = 15;

const formatCurrency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

const FixedDepositsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const {
    data: fdData,
    isLoading: fdLoading,
    isError: fdError,
  } = useFixedDepositAccounts({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });

  const fds = fdData ?? [];

  const fdStats = {
    active: fds.filter((f) => f.status?.code?.includes("active")).length,
    totalValue: fds.reduce((s, f) => s + (f.depositAmount ?? 0), 0),
    matured: fds.filter((f) => f.status?.code?.includes("matured")).length,
  };

  const filtered = useMemo(() => {
    let result = fds;
    const q = search.toLowerCase();
    if (q) result = result.filter((f) => (f.clientName ?? "").toLowerCase().includes(q) || f.accountNo.includes(q));
    if (statusFilter !== "all") result = result.filter((f) => f.status?.code === statusFilter);
    return result;
  }, [fds, search, statusFilter]);

  const columns: ColumnDef<FixedDepositAccount>[] = [
    { key: "accountNo", header: "FD #", cell: (r) => <code className="text-xs font-mono">{r.accountNo}</code> },
    {
      key: "clientName",
      header: "Customer",
      cell: (r) => <span className="font-medium">{r.clientName ?? `#${r.clientId}`}</span>,
    },
    { key: "depositProductName", header: "Product" },
    {
      key: "depositAmount",
      header: "Amount",
      cell: (r) => <span className="font-mono text-sm">{formatCurrency(r.depositAmount, r.currency.code)}</span>,
    },
    { key: "interestRate", header: "Rate", cell: (r) => `${r.nominalAnnualInterestRate}%` },
    {
      key: "depositPeriod",
      header: "Period",
      cell: (r) => `${r.depositPeriod} ${r.depositPeriodFrequencyType?.value?.toLowerCase() ?? "mo"}`,
    },
    {
      key: "maturityDate",
      header: "Matures",
      cell: (r) => (r.maturityDate ? new Date(r.maturityDate).toLocaleDateString() : "—"),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const c = FIXED_DEPOSIT_STATUS_CONFIG[r.status?.code ?? ""] ?? {
          label: r.status?.value ?? "Unknown",
          variant: "outline" as const,
        };
        return <StatusBadge status={c.label} />;
      },
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/deposits/fixed/${r.id}`)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fixed Deposits"
        description="Manage term deposit accounts"
        actions={
          <Button onClick={() => navigate("/deposits/fixed/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Fixed Deposit
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fixed Deposits</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(FIXED_DEPOSIT_STATUS_CONFIG).map(([code, cfg]) => (
                  <SelectItem key={code} value={code}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {fdLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : fdError ? (
            <p className="text-red-500">Failed to load fixed deposits.</p>
          ) : (
            <>
              <DataTable columns={columns} data={filtered} emptyState={{ message: "No fixed deposits found" }} />
              {fdData && fdData.length > PAGE_SIZE && (
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil(fdData.length / PAGE_SIZE)}
                  onPageChange={setPage}
                  totalItems={fdData.length}
                  pageSize={PAGE_SIZE}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedDepositsPage;
