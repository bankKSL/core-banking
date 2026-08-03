import { type FC, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Pencil, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useLoans,
  LOAN_STATUS_CONFIG,
  LOANS_PAGE_SIZE,
  LOAN_SEARCH_DEBOUNCE_MS,
  LOAN_SORT_OPTIONS,
  LOAN_DEFAULT_ORDER_BY,
  LOAN_DEFAULT_SORT_ORDER,
  STATUS_NAME_TO_ID,
  resolveStatusCode,
} from "@/features/loans";
import type { Loan } from "@/features/loans";

const formatCurrency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

const LoansListPage: FC = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orderBy, setOrderBy] = useState<string>(LOAN_DEFAULT_ORDER_BY);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">(LOAN_DEFAULT_SORT_ORDER);
  const [page, setPage] = useState(1);

  // Debounce the search input (doc §27 #7) so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), LOAN_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      offset: (page - 1) * LOANS_PAGE_SIZE,
      limit: LOANS_PAGE_SIZE,
      orderBy,
      sortOrder,
    };
    // doc §10: only `accountNo` and `externalId` exact-match search is supported.
    if (search) params.accountNo = search;
    if (statusFilter !== "all") {
      const statusId = STATUS_NAME_TO_ID[statusFilter];
      if (statusId) params.status = statusId;
    }
    return params;
  }, [page, search, statusFilter, orderBy, sortOrder]);

  const { data: loansData, isLoading, isError, error, refetch } = useLoans(queryParams);

  const data = useMemo(() => loansData?.pageItems ?? [], [loansData]);
  const totalFilteredRecords = loansData?.totalFilteredRecords ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFilteredRecords / LOANS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // Partial-match client-side filter for the visible page only (doc §10 inference).
  const filtered = useMemo(() => {
    const q = searchInput.toLowerCase();
    if (!q) return data;
    return data.filter(
      (a) =>
        (a.clientName ?? "").toLowerCase().includes(q) ||
        (a.accountNo ?? "").toLowerCase().includes(q) ||
        (a.loanProductName ?? "").toLowerCase().includes(q),
    );
  }, [data, searchInput]);

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
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer, account or product..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
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
              <SelectTrigger className="w-44">
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
            <Select
              value={`${orderBy}:${sortOrder}`}
              onValueChange={(v) => {
                const [col, dir] = v.split(":");
                if (col) setOrderBy(col);
                if (dir === "ASC" || dir === "DESC") setSortOrder(dir);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {LOAN_SORT_OPTIONS.map((opt) => (
                  <SelectItem key={`${opt.value}:DESC`} value={`${opt.value}:DESC`}>
                    {opt.label} (desc)
                  </SelectItem>
                ))}
                {LOAN_SORT_OPTIONS.map((opt) => (
                  <SelectItem key={`${opt.value}:ASC`} value={`${opt.value}:ASC`}>
                    {opt.label} (asc)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filtered}
            loading={isLoading}
            emptyState={{ message: "No loans found." }}
            onRowClick={(r) => navigate(`/loans/view/${r.id}`)}
          />
          {totalFilteredRecords > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={totalFilteredRecords}
                pageSize={LOANS_PAGE_SIZE}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoansListPage;
