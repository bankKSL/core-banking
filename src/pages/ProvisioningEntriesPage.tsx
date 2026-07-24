import React, { useState } from "react";
import { Plus, Loader2, ShieldCheck, RefreshCw, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProvisioningEntries,
  useCreateProvisioningEntry,
  useProvisioningEntryCommand,
  ACCOUNTING_PAGE_SIZE,
} from "@/features/accounting";
import type { ProvisioningEntryData } from "@/features/accounting";
import { currentDate } from "@/lib/utils";

const ProvisioningEntriesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useProvisioningEntries({
    offset: (page - 1) * ACCOUNTING_PAGE_SIZE,
    limit: ACCOUNTING_PAGE_SIZE,
  });
  const createMutation = useCreateProvisioningEntry();
  const commandMutation = useProvisioningEntryCommand();

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(currentDate());
  const [createJournalEntries, setCreateJournalEntries] = useState(true);
  const [formError, setFormError] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);

  const entries = data?.pageItems ?? [];
  const totalRecords = data?.totalFilteredRecords ?? 0;

  const handleCreate = async () => {
    if (!date) {
      setFormError("Date is required.");
      return;
    }
    setFormError("");
    await createMutation.mutateAsync({
      date: currentDate(date),
      dateFormat: "yyyy-MM-dd",
      locale: "en",
      createjournalentries: createJournalEntries,
    });
    setShowForm(false);
  };

  const runCommand = async (entryId: number, command: "createjournalentry" | "recreateprovisioningentry") => {
    setActingId(entryId);
    try {
      await commandMutation.mutateAsync({ entryId, command });
    } finally {
      setActingId(null);
    }
  };

  const columns: ColumnDef<ProvisioningEntryData>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "date", header: "Date", cell: (r) => <span className="text-sm">{r.date ?? "—"}</span> },
    { key: "createdBy", header: "Created By", cell: (r) => <span className="text-sm">{r.createdBy ?? "—"}</span> },
    { key: "createdDate", header: "Created On", cell: (r) => <span className="text-sm">{r.createdDate ?? "—"}</span> },
    {
      key: "journalEntriesCreated",
      header: "Journal Entries",
      cell: (r) =>
        r.journalEntriesCreated ? (
          <Badge variant="success" size="sm">Created</Badge>
        ) : (
          <Badge variant="warning" size="sm">Pending</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {!r.journalEntriesCreated && (
            <Button
              variant="ghost"
              size="sm"
              title="Create journal entries"
              disabled={actingId === r.id}
              onClick={() => runCommand(r.id, "createjournalentry")}
            >
              {actingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            title="Recreate provisioning entry"
            disabled={actingId === r.id}
            onClick={() => runCommand(r.id, "recreateprovisioningentry")}
          >
            {actingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-amber-500" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Provisioning Entries"
        description="Create and manage loan loss provisioning entries"
        actions={
          <Button onClick={() => setShowForm((s) => !s)} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> New Provisioning Entry
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Create Provisioning Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-[240px_1fr_auto] items-end gap-4">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <Checkbox
                checked={createJournalEntries}
                onCheckedChange={(c) => setCreateJournalEntries(c === true)}
              />
              Also create journal entries
            </label>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
            {formError && <p className="col-span-3 text-sm text-red-500">{formError}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Provisioning Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
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
                emptyState={{ message: "No provisioning entries found." }}
                minWidth={800}
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

export default ProvisioningEntriesPage;
