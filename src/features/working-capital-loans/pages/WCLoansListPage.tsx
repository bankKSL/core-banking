import { type FC, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Plus, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useWCLoans,
  WC_LOAN_STATUS_CONFIG,
  WC_LOANS_PAGE_SIZE,
  WC_LOAN_PAGE_SIZE_OPTIONS,
  WC_LOAN_SEARCH_DEBOUNCE_MS,
  resolveWCStatusCode,
} from "../index";
import type { WCLoan } from "../types/workingCapitalLoan";
import { formatMoney } from "../utils/format";

const WC_LOAN_STATUS_ENUM_MAP: Record<string, string> = {
  "Submitted and pending approval": "SUBMITTED_AND_PENDING_APPROVAL",
  Approved: "APPROVED",
  Active: "ACTIVE",
  Closed: "CLOSED_OBLIGATIONS_MET",
  Rejected: "REJECTED",
};

const WCLoansListPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(WC_LOANS_PAGE_SIZE);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), WC_LOAN_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page: page - 1, size: pageSize };
    if (search) params.accountNo = search;
    if (statusFilter !== "all") params.status = WC_LOAN_STATUS_ENUM_MAP[statusFilter] ?? statusFilter;
    return params;
  }, [page, pageSize, search, statusFilter]);

  const { data: loansData, isLoading } = useWCLoans(queryParams);

  const data = useMemo(() => loansData?.pageItems ?? loansData?.content ?? [], [loansData]);
  const totalRecords = loansData?.totalElements ?? data.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(page, totalPages);

  const filtered = useMemo(() => {
    const q = searchInput.toLowerCase();
    return data.filter((a) => {
      return !q ||
        (a.clientName ?? "").toLowerCase().includes(q) ||
        (a.accountNo ?? "").toLowerCase().includes(q) ||
        (a.loanProductName ?? "").toLowerCase().includes(q);
    });
  }, [data, searchInput]);

  const columns: ColumnDef<WCLoan>[] = [
    {
      key: "accountNo",
      header: t("Account No"),
      cell: (r) => <code className="text-xs font-mono">{r.accountNo ?? `#${r.id}`}</code>,
    },
    {
      key: "clientName",
      header: t("Customer"),
      cell: (r) => <span className="font-medium">{r.clientName ?? `Client #${r.clientId}`}</span>,
    },
    {
      key: "loanProductName",
      header: t("Product"),
      cell: (r) => <span className="text-sm">{r.loanProductName}</span>,
    },
    {
      key: "principal",
      header: t("Principal"),
      cell: (r) => <span className="font-mono text-sm font-semibold">{formatMoney(r.principal)}</span>,
    },
    {
      key: "status",
      header: t("Status"),
      cell: (r) => {
        const cfg = WC_LOAN_STATUS_CONFIG[resolveWCStatusCode(r)];
        return <StatusBadge status={cfg?.variant ?? "default"} label={cfg?.label ?? resolveWCStatusCode(r)} size="sm" />;
      },
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/working-capital-loans/view/${r.id}`); }}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Working Capital Loans")}
        description={t("Manage revolving working capital loan accounts")}
        actions={
          <Button onClick={() => navigate("/working-capital-loans/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            {t("Create Loan")}
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
                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder={t("Status")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All")}</SelectItem>
                {Object.entries(WC_LOAN_STATUS_CONFIG).map(([code, cfg]) => (
                  <SelectItem key={code} value={code}>{cfg.label}</SelectItem>
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
            emptyState={{ message: t("No working capital loans found.") }}
            onRowClick={(r) => navigate(`/working-capital-loans/view/${r.id}`)}
          />
          {totalRecords > 0 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t("Rows per page")}</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WC_LOAN_PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={totalRecords} pageSize={pageSize} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WCLoansListPage;
