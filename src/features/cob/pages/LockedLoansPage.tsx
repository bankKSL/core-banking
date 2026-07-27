import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, RefreshCw, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLockedLoans } from "../hooks/useCob";
import type { LoanAccountLock } from "../types/cob";

const LOCK_OWNER_LABELS: Record<string, string> = {
  LOAN_COB_CHUNK_PROCESSING: "Batch COB",
  LOAN_INLINE_COB_PROCESSING: "Inline COB",
};

const LockedLoansPage: FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 50;

  const { data: lockedData, isLoading, refetch } = useLockedLoans(page, limit);

  const filtered = !search
    ? (lockedData?.content ?? [])
    : (lockedData?.content ?? []).filter(
        (l) => String(l.loanId).includes(search) || l.lockOwner.toLowerCase().includes(search.toLowerCase()),
      );

  const columns: ColumnDef<LoanAccountLock>[] = [
    {
      key: "loanId",
      header: "Loan ID",
      cell: (r) => <span className="font-medium">{r.loanId}</span>,
    },
    {
      key: "lockOwner",
      header: "Lock Owner",
      cell: (r) => (
        <Badge variant={r.lockOwner === "LOAN_COB_CHUNK_PROCESSING" ? "info" : "warning"}>
          {LOCK_OWNER_LABELS[r.lockOwner] ?? r.lockOwner}
        </Badge>
      ),
    },
    {
      key: "lockPlacedOn",
      header: "Locked At",
      cell: (r) => new Date(r.lockPlacedOn).toLocaleString(),
    },
    {
      key: "lockPlacedOnCobBusinessDate",
      header: "COB Date",
      cell: (r) => r.lockPlacedOnCobBusinessDate,
    },
    {
      key: "error",
      header: "Error",
      cell: (r) =>
        r.error ? (
          <span className="text-red-600 text-xs max-w-[200px] truncate block" title={r.error}>
            {r.error}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "version",
      header: "Version",
      cell: (r) => r.version,
    },
  ];

  const totalPages = lockedData ? Math.ceil((lockedData.content?.length ?? 0) / limit) + page : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locked Loans"
        description="Loan accounts currently locked during COB processing"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => navigate("/cob/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Locked Accounts</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by loan ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={filtered}
                emptyState={{
                  icon: <Lock className="h-8 w-8 text-gray-300" />,
                  message: "No locked loans found.",
                }}
                minWidth={700}
              />
              {lockedData && lockedData.content.length > 0 && (
                <Pagination
                  currentPage={page + 1}
                  totalPages={totalPages || 1}
                  onPageChange={(p) => setPage(p - 1)}
                  totalItems={lockedData.content.length}
                  pageSize={limit}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LockedLoansPage;
