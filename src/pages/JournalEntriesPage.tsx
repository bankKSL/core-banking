import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Undo2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useJournalEntries, useReverseJournalEntry, ACCOUNTING_PAGE_SIZE } from "@/features/accounting";
import type { JournalEntryData } from "@/features/accounting";
import { OfficeSelect } from "@/components/shared/OfficeSelect";

const formatCurrency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(n);

const JournalEntriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [manualOnly, setManualOnly] = useState<string>("all");
  const [reversingId, setReversingId] = useState<string | null>(null);

  const reverseMutation = useReverseJournalEntry();

  const params = useMemo(() => {
    const p: Record<string, unknown> = {
      offset: (page - 1) * ACCOUNTING_PAGE_SIZE,
      limit: ACCOUNTING_PAGE_SIZE,
      orderBy: "transactionDate",
      sortOrder: "DESC",
      transactionDetails: true,
    };
    if (officeFilter !== "all") p.officeId = Number(officeFilter);
    if (fromDate) p.fromDate = fromDate;
    if (toDate) p.toDate = toDate;
    if (manualOnly === "manual") p.manualEntriesOnly = true;
    return p;
  }, [page, officeFilter, fromDate, toDate, manualOnly]);

  const { data, isLoading, isError, error, refetch } = useJournalEntries(params);
  const entries = data?.pageItems ?? [];
  const totalRecords = data?.totalFilteredRecords ?? 0;

  const handleReverse = async (entry: JournalEntryData) => {
    if (!window.confirm(`Reverse journal entry ${entry.transactionId}?`)) return;
    setReversingId(entry.transactionId);
    try {
      await reverseMutation.mutateAsync({ transactionId: entry.transactionId, officeId: entry.officeId });
    } finally {
      setReversingId(null);
    }
  };

  const columns: ColumnDef<JournalEntryData>[] = [
    {
      key: "transactionId",
      header: "Transaction ID",
      cell: (r) => <code className="text-xs font-mono">{r.transactionId}</code>,
    },
    {
      key: "transactionDate",
      header: "Date",
      cell: (r) => <span className="text-sm">{r.transactionDate ?? "—"}</span>,
    },
    { key: "officeName", header: "Office" },
    {
      key: "glAccountName",
      header: "GL Account",
      cell: (r) => (
        <span className="text-sm">
          {r.glAccountName} <code className="text-xs text-gray-400">({r.glAccountCode})</code>
        </span>
      ),
    },
    {
      key: "entryType",
      header: "Type",
      cell: (r) => (
        <Badge variant={r.entryType?.code?.includes("DEBIT") ? "info" : "default"} size="sm">
          {r.entryType?.value ?? "—"}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (r) => <span className="font-mono text-sm">{formatCurrency(r.amount, r.currency?.code)}</span>,
    },
    {
      key: "manualEntry",
      header: "Source",
      cell: (r) =>
        r.manualEntry ? (
          <Badge variant="warning" size="sm">
            Manual
          </Badge>
        ) : (
          <Badge variant="default" size="sm">
            System
          </Badge>
        ),
    },
    {
      key: "reversed",
      header: "Status",
      cell: (r) =>
        r.reversed ? (
          <Badge variant="error" size="sm">
            Reversed
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            Posted
          </Badge>
        ),
    },
    {
      key: "createdByUserName",
      header: "Created By",
      cell: (r) => <span className="text-sm text-gray-500">{r.createdByUserName ?? "—"}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) =>
        !r.reversed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleReverse(r);
            }}
            disabled={reversingId === r.transactionId}
            title="Reverse entry"
          >
            {reversingId === r.transactionId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Undo2 className="h-4 w-4 text-amber-500" />
            )}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal Entries"
        description="View and create manual journal entries"
        actions={
          <Button onClick={() => navigate("/accounting/journal-entries/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> New Journal Entry
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Entries</CardTitle>
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Office</label>
              <OfficeSelect
                value={officeFilter}
                onChange={(v) => {
                  setOfficeFilter(v);
                  setPage(1);
                }}
                includeAll="All Offices"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">From</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-36"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">To</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-36"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">Source</label>
              <Select
                value={manualOnly}
                onValueChange={(v) => {
                  setManualOnly(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-sm">Failed to load: {error?.message ?? "Unknown error"}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={entries}
                emptyState={{ message: "No journal entries found." }}
                minWidth={1100}
              />
              {totalRecords > ACCOUNTING_PAGE_SIZE && (
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil(totalRecords / ACCOUNTING_PAGE_SIZE)}
                  onPageChange={setPage}
                  totalItems={totalRecords}
                  pageSize={ACCOUNTING_PAGE_SIZE}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalEntriesPage;
