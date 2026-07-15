import React, { useState, useMemo } from "react";
import { Search, X, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { auditLogs } from "@/mock/data";
import type { AuditLog } from "@/types";

const PAGE_SIZE = 10;

function truncateValue(value: string | null, maxLen = 80): string {
    if (value === null || value === undefined) return "-";
    if (value.length <= maxLen) return value;
    return value.slice(0, maxLen) + "\u2026";
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

const actionVariantMap: Record<string, "info" | "warning" | "error" | "success" | "default"> = {
    create: "info",
    update: "warning",
    delete: "error",
    activate: "success",
    deactivate: "default",
    publish: "info",
    approve: "success",
};

const auditActions = ["create", "update", "delete", "activate", "deactivate", "publish", "approve"];

const columns: ColumnDef<AuditLog>[] = [
    {
        key: "userName",
        header: "User",
        cell: (row) => <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{row.userName}</span>,
    },
    {
        key: "action",
        header: "Action",
        cell: (row) => (
            <Badge variant={actionVariantMap[row.action] ?? "default"} size="sm" rounded>
                {row.action}
            </Badge>
        ),
    },
    {
        key: "entityType",
        header: "Entity Type",
        cell: (row) => (
            <Badge variant="default" size="sm">
                {row.entityType}
            </Badge>
        ),
    },
    {
        key: "entityId",
        header: "Entity ID",
        cell: (row) => <code className="text-xs font-mono text-gray-700 dark:text-gray-300">{row.entityId}</code>,
    },
    {
        key: "oldValue",
        header: "Old Value",
        cell: (row) =>
            row.oldValue === null ? (
                <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
            ) : (
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-45 truncate inline-block">
                    {truncateValue(row.oldValue)}
                </span>
            ),
    },
    {
        key: "newValue",
        header: "New Value",
        cell: (row) =>
            row.newValue === null ? (
                <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
            ) : (
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-45 truncate inline-block">
                    {truncateValue(row.newValue)}
                </span>
            ),
    },
    {
        key: "timestamp",
        header: "Timestamp",
        cell: (row) => <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(row.timestamp)}</span>,
    },
    {
        key: "ipAddress",
        header: "IP Address",
        cell: (row) => <code className="text-xs font-mono text-gray-500 dark:text-gray-400">{row.ipAddress}</code>,
    },
];

const AuditLogsPage: React.FC = () => {
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = useMemo(() => {
        let result = [...auditLogs];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (log) =>
                    log.userName.toLowerCase().includes(q) ||
                    log.action.toLowerCase().includes(q) ||
                    log.entityType.toLowerCase().includes(q) ||
                    log.entityId.toLowerCase().includes(q) ||
                    (log.oldValue ?? "").toLowerCase().includes(q) ||
                    (log.newValue ?? "").toLowerCase().includes(q) ||
                    log.ipAddress.toLowerCase().includes(q),
            );
        }

        if (actionFilter !== "all") {
            result = result.filter((log) => log.action === actionFilter);
        }

        if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            result = result.filter((log) => new Date(log.timestamp) >= from);
        }

        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter((log) => new Date(log.timestamp) <= to);
        }

        return result;
    }, [search, actionFilter, dateFrom, dateTo]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);

    const paginated = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, safePage]);

    return (
        <div className="space-y-6">
            <PageHeader title="Audit Logs" description="Track all changes and actions across the formula engine." />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                    <CardTitle>Audit Logs</CardTitle>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search audit logs…"
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
                            value={actionFilter}
                            onValueChange={(v) => {
                                setActionFilter(v);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All actions</SelectItem>
                                {auditActions.map((a) => (
                                    <SelectItem key={a} value={a}>
                                        {a.charAt(0).toUpperCase() + a.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-36 text-xs"
                                placeholder="From"
                            />
                            <span className="text-sm text-gray-400">–</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-36 text-xs"
                                placeholder="To"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={paginated}
                        emptyState={{
                            title: "No audit logs found",
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

export default AuditLogsPage;
