import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { executionLogs } from "@/mock/data";
import type { ExecutionLog } from "@/types";

const PAGE_SIZE = 10;

function truncateJson(text: string, maxLen = 100): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "\u2026";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const columns: ColumnDef<ExecutionLog>[] = [
  {
    key: "executionId",
    header: "Execution ID",
    cell: (row) => <code className="text-xs font-mono text-gray-700 dark:text-gray-300">{row.executionId}</code>,
  },
  {
    key: "campaignName",
    header: "Campaign",
    cell: (row) => <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.campaignName}</span>,
  },
  {
    key: "matched",
    header: "Matched",
    cell: (row) =>
      row.matched ? (
        <Badge variant="success" size="sm" rounded>
          Yes
        </Badge>
      ) : (
        <Badge variant="default" size="sm" rounded>
          No
        </Badge>
      ),
  },
  {
    key: "duration",
    header: "Duration",
    cell: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{row.duration} ms</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} size="sm" />,
  },
  {
    key: "request",
    header: "Request",
    cell: (row) => (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <code className="text-xs font-mono text-gray-600 dark:text-gray-400 cursor-default max-w-50 truncate inline-block">
              {truncateJson(row.request)}
            </code>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-105 break-all font-mono text-xs leading-relaxed">
            {row.request}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
  {
    key: "response",
    header: "Response",
    cell: (row) => (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <code className="text-xs font-mono text-gray-600 dark:text-gray-400 cursor-default max-w-50 truncate inline-block">
              {truncateJson(row.response)}
            </code>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-105 break-all font-mono text-xs leading-relaxed">
            {row.response}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
  {
    key: "timestamp",
    header: "Timestamp",
    cell: (row) => (
      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(row.timestamp)}</span>
    ),
  },
];

const ExecutionLogsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...executionLogs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (log) =>
          log.executionId.toLowerCase().includes(q) ||
          log.campaignName.toLowerCase().includes(q) ||
          log.request.toLowerCase().includes(q) ||
          log.response.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((log) => log.status === statusFilter);
    }

    return result;
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  return (
    <div className="space-y-6">
      <PageHeader title="Execution Logs" description="View real-time execution logs for formula engine evaluations." />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Execution Logs</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-8"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={paginated}
            emptyState={{
              title: "No execution logs found",
              message: "Try adjusting your search or filters.",
            }}
          />
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutionLogsPage;
