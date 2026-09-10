import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Undo2, Loader2, RefreshCw, ChevronDown, ChevronUp, Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useJournalEntries,
  useReverseJournalEntry,
  useUpdateRunningBalance,
  ACCOUNTING_PAGE_SIZE,
  JOURNAL_ENTRY_ENTITY_TYPE_LABELS,
} from "@/features/accounting";
import type { JournalEntryData } from "@/features/accounting";
import { OfficeSelect } from "@/components/shared/OfficeSelect";

const formatCurrency = (n: number, code?: string) => {
  const currency = code && code.length === 3 ? code : "USD";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
};

const JournalEntriesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [glAccountFilter, setGLAccountFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [submittedOnDateFrom, setSubmittedOnDateFrom] = useState("");
  const [submittedOnDateTo, setSubmittedOnDateTo] = useState("");
  const [manualOnly, setManualOnly] = useState<string>("all");
  const [transactionIdFilter, setTransactionIdFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [updatingBalance, setUpdatingBalance] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const reverseMutation = useReverseJournalEntry();
  const updateRunningBalanceMutation = useUpdateRunningBalance();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (officeFilter !== "all") count++;
    if (glAccountFilter !== "all") count++;
    if (fromDate) count++;
    if (toDate) count++;
    if (submittedOnDateFrom) count++;
    if (submittedOnDateTo) count++;
    if (manualOnly !== "all") count++;
    if (transactionIdFilter) count++;
    if (entityTypeFilter !== "all") count++;
    return count;
  }, [officeFilter, glAccountFilter, fromDate, toDate, submittedOnDateFrom, submittedOnDateTo, manualOnly, transactionIdFilter, entityTypeFilter]);

  const params = useMemo(() => {
    const p: Record<string, unknown> = {
      offset: (page - 1) * ACCOUNTING_PAGE_SIZE,
      limit: ACCOUNTING_PAGE_SIZE,
      orderBy: "transactionDate",
      sortOrder: "DESC",
      transactionDetails: true,
      runningBalance: true,
    };
    if (officeFilter !== "all") p.officeId = Number(officeFilter);
    if (glAccountFilter !== "all") p.glAccountId = Number(glAccountFilter);
    if (fromDate) p.fromDate = fromDate;
    if (toDate) p.toDate = toDate;
    if (submittedOnDateFrom) p.submittedOnDateFrom = submittedOnDateFrom;
    if (submittedOnDateTo) p.submittedOnDateTo = submittedOnDateTo;
    if (manualOnly === "manual") p.manualEntriesOnly = true;
    if (transactionIdFilter) p.transactionId = transactionIdFilter;
    if (entityTypeFilter !== "all") p.entityType = Number(entityTypeFilter);
    return p;
  }, [page, officeFilter, glAccountFilter, fromDate, toDate, submittedOnDateFrom, submittedOnDateTo, manualOnly, transactionIdFilter, entityTypeFilter]);

  const { data, isLoading, isError, error, refetch } = useJournalEntries(params);
  const entries = data?.pageItems ?? [];
  const totalRecords = data?.totalFilteredRecords ?? 0;

  const handleReverse = async (entry: JournalEntryData) => {
    if (!window.confirm(t("Reverse journal entry {{transactionId}}?", { transactionId: entry.transactionId }))) return;
    setReversingId(entry.transactionId);
    try {
      await reverseMutation.mutateAsync({ transactionId: entry.transactionId, officeId: entry.officeId });
    } finally {
      setReversingId(null);
    }
  };

  const handleUpdateRunningBalance = async () => {
    if (!window.confirm(t("Update running balances for this office? This may take a moment."))) return;
    setUpdatingBalance(true);
    try {
      await updateRunningBalanceMutation.mutateAsync({
        officeId: officeFilter !== "all" ? Number(officeFilter) : 1,
      });
    } finally {
      setUpdatingBalance(false);
    }
  };

  const clearFilters = () => {
    setOfficeFilter("all");
    setGLAccountFilter("all");
    setFromDate("");
    setToDate("");
    setSubmittedOnDateFrom("");
    setSubmittedOnDateTo("");
    setManualOnly("all");
    setTransactionIdFilter("");
    setEntityTypeFilter("all");
    setPage(1);
  };

  const columns: ColumnDef<JournalEntryData>[] = [
    {
      key: "expand",
      header: "",
      cell: (r) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            setExpandedRow(expandedRow === r.id ? null : r.id);
          }}
        >
          {expandedRow === r.id ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      ),
    },
    {
      key: "transactionId",
      header: t("Transaction ID"),
      cell: (r) => <code className="text-xs font-mono">{r.transactionId}</code>,
    },
    {
      key: "transactionDate",
      header: t("Date"),
      cell: (r) => <span className="text-sm">{r.transactionDate ?? "—"}</span>,
    },
    { key: "officeName", header: t("Office") },
    {
      key: "glAccountName",
      header: t("GL Account"),
      cell: (r) => (
        <span className="text-sm">
          {r.glAccountName} <code className="text-xs text-gray-400">({r.glAccountCode})</code>
        </span>
      ),
    },
    {
      key: "entryType",
      header: t("Type"),
      cell: (r) => (
        <Badge variant={r.entryType?.code?.includes("DEBIT") ? "info" : "default"} size="sm">
          {r.entryType?.value ?? "—"}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: t("Amount"),
      cell: (r) => <span className="font-mono text-sm">{formatCurrency(r.amount, r.currency?.code)}</span>,
    },
    {
      key: "officeRunningBalance",
      header: t("Office Balance"),
      cell: (r) =>
        r.officeRunningBalance != null ? (
          <span className="font-mono text-xs text-gray-500">{formatCurrency(r.officeRunningBalance, r.currency?.code)}</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      key: "organizationRunningBalance",
      header: t("Org Balance"),
      cell: (r) =>
        r.organizationRunningBalance != null ? (
          <span className="font-mono text-xs text-gray-500">{formatCurrency(r.organizationRunningBalance, r.currency?.code)}</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      key: "entityType",
      header: t("Entity Type"),
      cell: (r) =>
        r.entityType ? (
          <Badge variant="default" size="sm">
            {JOURNAL_ENTRY_ENTITY_TYPE_LABELS[r.entityType.id] ?? r.entityType.value}
          </Badge>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      key: "manualEntry",
      header: t("Source"),
      cell: (r) =>
        r.manualEntry ? (
          <Badge variant="warning" size="sm">
            {t("Manual")}
          </Badge>
        ) : (
          <Badge variant="default" size="sm">
            {t("System")}
          </Badge>
        ),
    },
    {
      key: "reversed",
      header: t("Status"),
      cell: (r) =>
        r.reversed ? (
          <Badge variant="error" size="sm">
            {t("Reversed")}
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            {t("Posted")}
          </Badge>
        ),
    },
    {
      key: "createdByUserName",
      header: t("Created By"),
      cell: (r) => <span className="text-sm text-gray-500">{r.createdByUserName ?? "—"}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) =>
        !r.reversed && r.manualEntry ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleReverse(r);
            }}
            disabled={reversingId === r.transactionId}
            title={t("Reverse entry")}
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
        title={t("Journal Entries")}
        description={t("View and create manual journal entries")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdateRunningBalance}
              disabled={updatingBalance}
              title={t("Update running balances")}
            >
              {updatingBalance ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {t("Update Balances")}
            </Button>
            <Button onClick={() => navigate("/accounting/journal-entries/new")} className="bg-[#D32F2F] hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" /> {t("New Journal Entry")}
            </Button>
          </div>
        }
      />

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={transactionIdFilter}
              onChange={(e) => {
                setTransactionIdFilter(e.target.value);
                setPage(1);
              }}
              placeholder={t("Search by Transaction ID...")}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <OfficeSelect
              value={officeFilter}
              onChange={(v) => {
                setOfficeFilter(v);
                setPage(1);
              }}
              includeAll={t("All Offices")}
            />
            <Select
              value={manualOnly}
              onValueChange={(v) => {
                setManualOnly(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Sources")}</SelectItem>
                <SelectItem value="manual">{t("Manual")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "border-[#D32F2F] text-[#D32F2F]" : ""}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {t("Filters")}
              {activeFilterCount > 0 && (
                <Badge variant="default" size="sm" className="ml-2 bg-[#D32F2F]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
                <X className="mr-1 h-3 w-3" />
                {t("Clear")}
              </Button>
            )}
          </div>
        </div>

         {/* Expandable Filters */}
         {showFilters && (
           <div className="mt-4 pt-4 border-t">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="space-y-1.5">
                 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("GL Account")}</label>
                 <Select
                   value={glAccountFilter}
                   onValueChange={(v) => {
                     setGLAccountFilter(v);
                     setPage(1);
                   }}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder={t("All Accounts")} />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">{t("All Accounts")}</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("Entity Type")}</label>
                 <Select
                   value={entityTypeFilter}
                   onValueChange={(v) => {
                     setEntityTypeFilter(v);
                     setPage(1);
                   }}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">{t("All Types")}</SelectItem>
                     <SelectItem value="1">{t("Loan")}</SelectItem>
                     <SelectItem value="2">{t("Savings")}</SelectItem>
                     <SelectItem value="3">{t("Client")}</SelectItem>
                     <SelectItem value="4">{t("Share")}</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("Transaction Date")}</label>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                   <Input
                     type="date"
                     value={fromDate}
                     onChange={(e) => {
                       setFromDate(e.target.value);
                       setPage(1);
                     }}
                     className="flex-1 min-w-0"
                   />
                   <span className="text-gray-400 text-xs text-center hidden sm:block">{t("to")}</span>
                   <Input
                     type="date"
                     value={toDate}
                     onChange={(e) => {
                       setToDate(e.target.value);
                       setPage(1);
                     }}
                     className="flex-1 min-w-0"
                   />
                 </div>
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("Submitted Date")}</label>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                   <Input
                     type="date"
                     value={submittedOnDateFrom}
                     onChange={(e) => {
                       setSubmittedOnDateFrom(e.target.value);
                       setPage(1);
                     }}
                     className="flex-1 min-w-0"
                   />
                   <span className="text-gray-400 text-xs text-center hidden sm:block">{t("to")}</span>
                   <Input
                     type="date"
                     value={submittedOnDateTo}
                     onChange={(e) => {
                       setSubmittedOnDateTo(e.target.value);
                       setPage(1);
                     }}
                     className="flex-1 min-w-0"
                   />
                 </div>
               </div>
             </div>
           </div>
         )}
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center gap-3 text-red-600 py-12">
              <span className="text-sm">
                {t("Failed to load:")} {error?.message ?? t("Unknown error")}
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {t("Retry")}
              </Button>
            </div>
          ) : (
            <div>
              <DataTable
                columns={columns}
                data={entries}
                emptyState={{ message: t("No journal entries found.") }}
                minWidth={1400}
              />
              {expandedRow != null && (() => {
                const entry = entries.find((e) => e.id === expandedRow);
                if (!entry) return null;
                return (
                  <div className="bg-gray-50 p-6 border-t">
                    <div className="grid grid-cols-3 gap-6 text-sm">
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-700">{t("Transaction Details")}</h4>
                        {entry.transactionDetails ? (
                          <div className="space-y-2 text-gray-600">
                            {entry.transactionDetails.paymentDetails && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">{t("Payment Type")}</span>
                                <span>{entry.transactionDetails.paymentDetails.paymentType?.name ?? "—"}</span>
                              </div>
                            )}
                            {entry.transactionDetails.paymentDetails?.accountNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">{t("Account #")}</span>
                                <span className="font-mono">{entry.transactionDetails.paymentDetails.accountNumber}</span>
                              </div>
                            )}
                            {entry.transactionDetails.paymentDetails?.checkNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">{t("Check #")}</span>
                                <span className="font-mono">{entry.transactionDetails.paymentDetails.checkNumber}</span>
                              </div>
                            )}
                            {entry.transactionDetails.paymentDetails?.routingCode && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">{t("Routing Code")}</span>
                                <span className="font-mono">{entry.transactionDetails.paymentDetails.routingCode}</span>
                              </div>
                            )}
                            {entry.transactionDetails.paymentDetails?.receiptNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">{t("Receipt #")}</span>
                                <span className="font-mono">{entry.transactionDetails.paymentDetails.receiptNumber}</span>
                              </div>
                            )}
                            {entry.transactionDetails.paymentDetails?.bankNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">{t("Bank #")}</span>
                                <span className="font-mono">{entry.transactionDetails.paymentDetails.bankNumber}</span>
                              </div>
                            )}
                        {entry.transactionDetails.transactionType && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t("Transaction Type")}</span>
                            <Badge variant="default" size="sm">{entry.transactionDetails.transactionType.value}</Badge>
                          </div>
                        )}
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">{t("No transaction details available")}</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-700">{t("Entry Info")}</h4>
                        <div className="space-y-2 text-gray-600">
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t("Description")}</span>
                            <span className="text-right max-w-48 truncate">{entry.comments ?? "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t("Reference #")}</span>
                            <span className="font-mono">{entry.referenceNumber ?? "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t("Submitted On")}</span>
                            <span>{entry.submittedOnDate ?? "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t("Entity ID")}</span>
                            <span className="font-mono">{entry.entityId ?? "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t("Created By")}</span>
                            <span>{entry.createdByUserName ?? "—"}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-700">{t("Balance Info")}</h4>
                        <div className="space-y-2 text-gray-600">
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t("Office Balance")}</span>
                            <span className="font-mono">
                              {entry.officeRunningBalance != null ? formatCurrency(entry.officeRunningBalance, entry.currency?.code) : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t("Organization Balance")}</span>
                            <span className="font-mono">
                              {entry.organizationRunningBalance != null ? formatCurrency(entry.organizationRunningBalance, entry.currency?.code) : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">{t("Balance Computed")}</span>
                            <Badge variant={entry.runningBalanceComputed ? "success" : "warning"} size="sm">
                              {entry.runningBalanceComputed ? t("Yes") : t("No")}
                            </Badge>
                          </div>
                          {entry.externalAssetOwner && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">{t("External Owner")}</span>
                              <span>{entry.externalAssetOwner}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {totalRecords > ACCOUNTING_PAGE_SIZE && (
                <div className="p-4 border-t">
                  <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(totalRecords / ACCOUNTING_PAGE_SIZE)}
                    onPageChange={setPage}
                    totalItems={totalRecords}
                    pageSize={ACCOUNTING_PAGE_SIZE}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalEntriesPage;
