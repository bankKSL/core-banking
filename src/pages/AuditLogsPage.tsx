import { type FC, useState, useCallback, useRef } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, X, Calendar, Eye, RotateCw, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import client from "@/api/client";

const PAGE_SIZE = 10;

const PROCESSING_RESULTS = ["success", "failure"];

interface AuditEntry {
  id: number;
  resourceId?: number;
  entityName?: string;
  actionName?: string;
  maker?: string;
  madeOnDate?: string;
  checker?: string;
  checkedOnDate?: string;
  processingResult?: string;
  commandAsJson?: string;
}

interface AuditFilters {
  actionName: string;
  entityName: string;
  resourceId: string;
  makerId: string;
  makerDateTimeFrom: string;
  makerDateTimeTo: string;
  processingResult: string;
}

const defaultFilters: AuditFilters = {
  actionName: "",
  entityName: "",
  resourceId: "",
  makerId: "",
  makerDateTimeFrom: "",
  makerDateTimeTo: "",
  processingResult: "",
};

const actionVariant: Record<string, "info" | "warning" | "error" | "success" | "default"> = {
  CREATE: "info",
  UPDATE: "warning",
  DELETE: "error",
  ACTIVATE: "success",
  REJECT: "error",
  CLOSE: "default",
  APPROVE: "success",
  WITHDRAW: "warning",
};

const formatDate = (iso?: string): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const AuditLogsPage: FC = () => {
  const [filters, setFilters] = useState<AuditFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [viewPayload, setViewPayload] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(false);

  const queryKey = ["audits", appliedFilters, page, sortBy, sortOrder] as const;

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: Record<string, unknown> = {
        offset: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        orderBy: sortBy,
        sortOrder,
        paged: true,
        dateFormat: "yyyy-MM-dd",
        locale: "en",
      };
      if (appliedFilters.actionName) params.actionName = appliedFilters.actionName;
      if (appliedFilters.entityName) params.entityName = appliedFilters.entityName;
      if (appliedFilters.resourceId) params.resourceId = Number(appliedFilters.resourceId);
      if (appliedFilters.makerId) params.makerId = Number(appliedFilters.makerId);
      if (appliedFilters.makerDateTimeFrom) params.makerDateTimeFrom = appliedFilters.makerDateTimeFrom;
      if (appliedFilters.makerDateTimeTo) params.makerDateTimeTo = appliedFilters.makerDateTimeTo;
      if (appliedFilters.processingResult) params.processingResult = appliedFilters.processingResult;

      // API returns Observable<string> — must JSON.parse
      const { data: raw } = await client.get<string>("/audits", { params });
      const result = typeof raw === "string" ? JSON.parse(raw) : raw;
      const items: AuditEntry[] = result?.pageItems ?? (Array.isArray(result) ? result : []);
      const totalFiltered = result?.totalFilteredRecords ?? result?.totalRecords;

      // Heuristic: if page is full, estimate more records exist
      const total =
        items.length === PAGE_SIZE
          ? (page - 1) * PAGE_SIZE + PAGE_SIZE + 1
          : (totalFiltered ?? (page - 1) * PAGE_SIZE + items.length);

      return { items: items as AuditEntry[], totalRecords: total as number };
    },
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });

  const items = data?.items ?? [];
  const totalRecords = data?.totalRecords ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const handleApply = useCallback(() => {
    setAppliedFilters({ ...filters });
    setPage(1);
  }, [filters]);

  const handleReset = useCallback(() => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
  }, []);

  const setField = (field: keyof AuditFilters, value: string) => setFilters((f) => ({ ...f, [field]: value }));

  const columns: ColumnDef<AuditEntry>[] = [
    { key: "id", header: "ID", accessorFn: (r) => <code className="text-xs font-mono">{r.id}</code>, sortable: true },
    {
      key: "resourceId",
      header: "Resource ID",
      accessorFn: (r) => <code className="text-xs">{r.resourceId ?? "—"}</code>,
      sortable: true,
    },
    {
      key: "entityName",
      header: "Entity",
      accessorFn: (r) => <span className="text-sm font-medium">{r.entityName ?? "—"}</span>,
      sortable: true,
    },
    {
      key: "actionName",
      header: "Action",
      accessorFn: (r) => (
        <Badge variant={actionVariant[r.actionName ?? ""] ?? "default"} size="sm">
          {r.actionName ?? "—"}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "maker",
      header: "Maker",
      accessorFn: (r) => <span className="text-sm">{r.maker ?? "—"}</span>,
      sortable: true,
    },
    {
      key: "madeOnDate",
      header: "Made On",
      accessorFn: (r) => <span className="text-sm text-gray-500">{formatDate(r.madeOnDate)}</span>,
      sortable: true,
    },
    { key: "checker", header: "Checker", accessorFn: (r) => <span className="text-sm">{r.checker ?? "—"}</span> },
    {
      key: "checkedOnDate",
      header: "Checked On",
      accessorFn: (r) => <span className="text-sm text-gray-500">{formatDate(r.checkedOnDate)}</span>,
    },
    {
      key: "processingResult",
      header: "Result",
      accessorFn: (r) =>
        r.processingResult === "success" ? (
          <Badge variant="success" size="sm">
            Success
          </Badge>
        ) : r.processingResult === "failure" ? (
          <Badge variant="error" size="sm">
            Failure
          </Badge>
        ) : (
          <span className="text-sm text-gray-400">{r.processingResult ?? "—"}</span>
        ),
    },
    {
      key: "actions",
      header: "",
      accessorFn: (r) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8"
          title="View Details"
          onClick={(e) => {
            e.stopPropagation();
            setViewPayload(r.commandAsJson ?? JSON.stringify(r, null, 2));
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Security audit trail of system activities"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        }
      />

      {showFilters && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filter Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Action Name"
                value={filters.actionName}
                onChange={(e) => setField("actionName", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
              />
              <Input
                placeholder="Entity Name"
                value={filters.entityName}
                onChange={(e) => setField("entityName", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
              />
              <Input
                placeholder="Resource ID"
                type="number"
                value={filters.resourceId}
                onChange={(e) => setField("resourceId", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
              />
              <Input
                placeholder="Maker ID"
                type="number"
                value={filters.makerId}
                onChange={(e) => setField("makerId", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
              />
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={filters.makerDateTimeFrom}
                  onChange={(e) => setField("makerDateTimeFrom", e.target.value)}
                  className="text-xs"
                />
                <span className="text-xs text-gray-400">–</span>
                <Input
                  type="date"
                  value={filters.makerDateTimeTo}
                  onChange={(e) => setField("makerDateTimeTo", e.target.value)}
                  className="text-xs"
                />
              </div>
              <Select value={filters.processingResult} onValueChange={(v) => setField("processingResult", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Processing Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  {PROCESSING_RESULTS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
                <Button size="sm" onClick={handleApply}>
                  Apply
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Audit Trail</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RotateCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <p className="text-red-500">Failed to load audit logs.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={items}
                emptyState={{ title: "No audit logs", message: "No audit records match your filters." }}
                minWidth={1000}
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={totalRecords}
                  pageSize={PAGE_SIZE}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewPayload} onOpenChange={() => setViewPayload(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Audit Payload Details</DialogTitle>
          </DialogHeader>
          <pre className="overflow-auto rounded-lg bg-gray-50 dark:bg-gray-900 p-4 text-xs font-mono leading-relaxed max-h-[60vh]">
            {viewPayload ?? ""}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsPage;
