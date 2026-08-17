import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecurringDepositAccounts, RECURRING_DEPOSIT_STATUS_CONFIG } from "@/features/deposits";
import type { RecurringDepositAccount } from "@/features/deposits";

const PAGE_SIZE = 15;

const formatCurrency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

const formatDate = (d?: string | number[]) => {
  if (!d) return "—";
  let iso: string;
  if (Array.isArray(d) && d.length >= 3) {
    iso = `${d[0]}-${String(d[1]).padStart(2, "0")}-${String(d[2]).padStart(2, "0")}`;
  } else {
    iso = String(d);
  }
  return new Date(iso).toLocaleDateString();
};

const RecurringDepositsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const {
    data: rdData,
    isLoading: rdLoading,
    isError: rdError,
  } = useRecurringDepositAccounts({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });

  const rds = rdData?.pageItems ?? [];
  const totalRecords = rdData?.totalFilteredRecords ?? 0;

  const filtered = useMemo(() => {
    let result = rds;
    const q = search.toLowerCase();
    if (q) result = result.filter((r) => (r.clientName ?? "").toLowerCase().includes(q) || r.accountNo.includes(q));
    if (statusFilter !== "all") result = result.filter((r) => r.status?.code === statusFilter);
    return result;
  }, [rds, search, statusFilter]);

  const columns: ColumnDef<RecurringDepositAccount>[] = [
    { key: "accountNo", header: t("RD #"), cell: (r) => <code className="text-xs font-mono">{r.accountNo}</code> },
    {
      key: "clientName",
      header: t("Customer"),
      cell: (r) => <span className="font-medium">{r.clientName ?? `#${r.clientId}`}</span>,
    },
    { key: "depositProductName", header: t("Product") },
    {
      key: "depositAmount",
      header: t("Deposit Amount"),
      cell: (r) => <span className="font-mono text-sm">{formatCurrency(r.depositAmount ?? 0, r.currency.code)}</span>,
    },
    {
      key: "depositPeriod",
      header: t("Period"),
      cell: (r) => `${r.depositPeriod} ${r.depositPeriodFrequencyType?.value?.toLowerCase() ?? "mo"}`,
    },
    {
      key: "maturityDate",
      header: t("Matures"),
      cell: (r) => formatDate(r.maturityDate),
    },
    {
      key: "status",
      header: t("Status"),
      cell: (r) => {
        const c = RECURRING_DEPOSIT_STATUS_CONFIG[r.status?.code ?? ""] ?? {
          label: r.status?.value ?? "Unknown",
        };
        return <StatusBadge status={c.label} />;
      },
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/deposits/recurring/${r.id}`)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Recurring Deposits")}
        description={t("Manage recurring deposit accounts")}
        actions={
          <Button onClick={() => navigate("/deposits/recurring/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("New Recurring Deposit")}
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("Recurring Deposits")}</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("Search...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All")}</SelectItem>
                {Object.entries(RECURRING_DEPOSIT_STATUS_CONFIG).map(([code, cfg]) => (
                  <SelectItem key={code} value={code}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {rdLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rdError ? (
            <p className="text-red-500">{t("Failed to load recurring deposits.")}</p>
          ) : (
            <>
              <DataTable columns={columns} data={filtered} emptyState={{ message: t("No recurring deposits found") }} />
              {totalRecords > PAGE_SIZE && (
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil(totalRecords / PAGE_SIZE)}
                  onPageChange={setPage}
                  totalItems={totalRecords}
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

export default RecurringDepositsPage;
