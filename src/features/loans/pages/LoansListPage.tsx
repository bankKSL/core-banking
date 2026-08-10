import { type FC, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  LOAN_PAGE_SIZE_OPTIONS,
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [externalIdInput, setExternalIdInput] = useState("");
  const [externalId, setExternalId] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orderBy, setOrderBy] = useState<string>(LOAN_DEFAULT_ORDER_BY);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">(LOAN_DEFAULT_SORT_ORDER);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(LOANS_PAGE_SIZE);

  // Debounce the search input (doc §27 #7) so we don't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), LOAN_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => setExternalId(externalIdInput), LOAN_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [externalIdInput]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      offset: (page - 1) * pageSize,
      limit: pageSize,
      orderBy,
      sortOrder,
    };
    // doc §10: `accountNo` and `externalId` exact-match search.
    if (search) params.accountNo = search;
    if (externalId) params.externalId = externalId;
    if (statusFilter !== "all") {
      const statusId = STATUS_NAME_TO_ID[statusFilter];
      if (statusId) params.status = statusId;
    }
    return params;
  }, [page, pageSize, search, externalId, statusFilter, orderBy, sortOrder]);

  const { data: loansData, isLoading, isError, error, refetch } = useLoans(queryParams);

  const data = useMemo(() => loansData?.pageItems ?? [], [loansData]);
  const totalFilteredRecords = loansData?.totalFilteredRecords ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFilteredRecords / pageSize));
  const safePage = Math.min(page, totalPages);

  // Partial-match client-side filter for the visible page only (doc §10 inference).
  const filtered = useMemo(() => {
    const q = searchInput.toLowerCase();
    const eid = externalIdInput.toLowerCase();
    return data.filter((a) => {
      const matchesQuery =
        !q ||
        (a.clientName ?? "").toLowerCase().includes(q) ||
        (a.accountNo ?? "").toLowerCase().includes(q) ||
        (a.loanProductName ?? "").toLowerCase().includes(q);
      const matchesExternalId = !eid || (a.externalId ?? "").toLowerCase().includes(eid);
      return matchesQuery && matchesExternalId;
    });
  }, [data, searchInput, externalIdInput]);

  const columns: ColumnDef<Loan>[] = [
    {
      key: "accountNo",
      header: t("Account No"),
      cell: (r) => <code className="text-xs font-mono">{r.accountNo ?? `#${r.id}`}</code>,
    },
    {
      key: "clientName",
      header: t("Customer"),
      cell: (r) => <span className="font-medium">{r.clientName ?? r.groupName ?? `Client #${r.clientId}`}</span>,
    },
    {
      key: "loanProductName",
      header: t("Product"),
      cell: (r) => <span className="text-sm">{r.loanProductName}</span>,
    },
    {
      key: "principal",
      header: t("Principal"),
      cell: (r) => <span className="font-mono text-sm font-semibold">{formatCurrency(r.principal ?? 0)}</span>,
    },
    {
      key: "status",
      header: t("Status"),
      cell: (r) => {
        const cfg = LOAN_STATUS_CONFIG[resolveStatusCode(r)];
        return <StatusBadge status={cfg?.variant ?? "default"} label={cfg?.label ?? resolveStatusCode(r)} size="sm" />;
      },
    },
    {
      key: "loanOfficerName",
      header: t("Loan Officer"),
      cell: (r) => <span className="text-sm">{r.loanOfficerName ?? "—"}</span>,
    },
    {
      key: "officeName",
      header: t("Office"),
      cell: (r) => <span className="text-sm">{r.officeName ?? "—"}</span>,
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
          title={t("Loans")}
          description={t("Manage loan accounts")}
          actions={
            <Button onClick={() => navigate("/loans/create")} className="bg-[#D32F2F] hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" /> {t("Create Loan")}
            </Button>
          }
        />
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{t("Failed to load loans.")} {error?.message ?? t("Please try again.")}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("Retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Loans")}
        description={t("Manage loan accounts")}
        actions={
          <Button onClick={() => navigate("/loans/create")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> {t("Create Loan")}
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("Loans")}</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("Search by customer, account or product...")}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("External ID...")}
                value={externalIdInput}
                onChange={(e) => {
                  setExternalIdInput(e.target.value);
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
                <SelectValue placeholder={t("Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All")}</SelectItem>
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
                <SelectValue placeholder={t("Sort by")} />
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
            emptyState={{ message: t("No loans found.") }}
            onRowClick={(r) => navigate(`/loans/view/${r.id}`)}
          />
          {totalFilteredRecords > 0 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t("Rows per page")}</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={totalFilteredRecords}
                pageSize={pageSize}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoansListPage;
