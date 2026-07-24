import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Pencil, Building2, AlertTriangle } from "lucide-react";
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
import { useLoans, LOAN_STATUS_CONFIG } from "@/features/loans";
import type { Loan } from "@/features/loans";

const PAGE_SIZE = 15;

const formatCurrency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

const resolveStatusCode = (loan: Loan): string => {
  if (loan.status?.code) return loan.status.code;
  if (loan.status?.id != null) {
    const map: Record<number, string> = {
      100: "Submitted and pending approval",
      200: "Approved",
      300: "Active",
      301: "Disbursed",
      600: "Closed (obligations met)",
      601: "Closed (written off)",
      602: "Closed (rescheduled)",
      700: "Overpaid",
      800: "Rejected",
    };
    return map[loan.status.id] ?? "Unknown";
  }
  return "Unknown";
};

const LoansListPage: FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    };
    if (search) params.searchByParam = search;
    if (statusFilter !== "all") {
      const codeToId: Record<string, number> = {
        "Submitted and pending approval": 100,
        Approved: 200,
        Active: 300,
        "Closed (obligations met)": 600,
        "Closed (written off)": 601,
        "Closed (rescheduled)": 602,
        Overpaid: 700,
      };
      const statusId = codeToId[statusFilter];
      if (statusId) params.loanStatus = statusId;
    }
    return params;
  }, [page, search, statusFilter]);

  const { data: loansData, isLoading, isError, error, refetch } = useLoans(queryParams);

  const data = loansData?.pageItems ?? [];
  const totalFilteredRecords = loansData?.totalFilteredRecords ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFilteredRecords / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const filtered = useMemo(() => {
    let result = data;
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (a) =>
          (a.clientName ?? "").toLowerCase().includes(q) ||
          (a.accountNo ?? "").includes(q) ||
          (a.loanProductName ?? "").toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((a) => resolveStatusCode(a) === statusFilter);
    }
    return result;
  }, [data, search, statusFilter]);

  const columns: ColumnDef<Loan>[] = [
    {
      key: "accountNo",
      header: "Account No",
      cell: (r) => <code className="text-xs font-mono">{r.accountNo ?? `#${r.id}`}</code>,
    },
    {
      key: "clientName",
      header: "Customer",
      cell: (r) => <span className="font-medium">{r.clientName ?? `Client #${r.clientId}`}</span>,
    },
    {
      key: "loanProductName",
      header: "Product",
      cell: (r) => <span className="text-sm">{r.loanProductName}</span>,
    },
    {
      key: "principal",
      header: "Principal",
      cell: (r) => <span className="font-mono text-sm font-semibold">{formatCurrency(r.principal ?? 0)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const cfg = LOAN_STATUS_CONFIG[resolveStatusCode(r)];
        return <StatusBadge status={cfg?.variant ?? "default"} label={cfg?.label ?? resolveStatusCode(r)} size="sm" />;
      },
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/loans/view/${r.id}`);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Loans"
          description="Manage loan accounts in Finfact"
          actions={
            <Button onClick={() => navigate("/loans/create")} className="bg-[#D32F2F] hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" /> Create Loan
            </Button>
          }
        />
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm">Failed to load loans. {error?.message ?? "Please try again."}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loans"
        description="Manage loan accounts in Finfact"
        actions={
          <Button onClick={() => navigate("/loans/create")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> Create Loan
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Loans</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer, account or product..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(LOAN_STATUS_CONFIG).map(([code, cfg]) => (
                  <SelectItem key={code} value={code}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={filtered}
                emptyState={{ message: "No loans found." }}
                onRowClick={(r) => navigate(`/loans/view/${r.id}`)}
              />
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalItems={totalFilteredRecords}
                    pageSize={PAGE_SIZE}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoansListPage;
