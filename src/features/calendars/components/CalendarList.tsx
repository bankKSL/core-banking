import React, { useState, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useCalendars, useDeleteCalendar } from "../hooks/useCalendars";
import CalendarFormDialog from "./CalendarFormDialog";
import type { CalendarData } from "../api/calendars";

interface CalendarListProps {
  entityType: string;
  entityId: number;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const CalendarList: React.FC<CalendarListProps> = ({ entityType, entityId }) => {
  const { data: calendars, isLoading } = useCalendars(entityType, entityId);
  const deleteMutation = useDeleteCalendar();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<CalendarData | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CalendarData | null>(null);

  const list = useMemo(() => calendars ?? [], [calendars]);

  const handleEdit = useCallback((cal: CalendarData) => {
    setEditingCalendar(cal);
    setFormOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingCalendar(undefined);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({
      entityType,
      entityId,
      calendarId: deleteTarget.id,
    });
    setDeleteTarget(null);
  }, [deleteTarget, entityType, entityId, deleteMutation]);

  const columns: ColumnDef<CalendarData>[] = useMemo(
    () => [
      { key: "title", header: "Title", accessorFn: (row) => row.title },
      { key: "type", header: "Type", accessorFn: (row) => row.type?.value ?? "—" },
      {
        key: "startDate",
        header: "Start Date",
        accessorFn: (row) => formatDate(row.startDate),
      },
      {
        key: "recurrence",
        header: "Recurrence",
        accessorFn: (row) => row.humanReadable ?? (row.repeating ? "Repeating" : "None"),
      },
      {
        key: "nextDates",
        header: "Next 3 Dates",
        accessorFn: (row) => {
          const dates = row.nextTenRecurringDates ?? row.recurringDates ?? [];
          const next3 = dates.slice(0, 3);
          if (next3.length === 0) return "—";
          return next3.map((d) => formatDate(d)).join(", ");
        },
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [handleEdit],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create Calendar
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={list}
        loading={isLoading}
        emptyState={{ message: "No calendars found." }}
      />

      <CalendarFormDialog
        entityType={entityType}
        entityId={entityId}
        open={formOpen}
        onOpenChange={setFormOpen}
        calendar={editingCalendar}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Delete Calendar"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export { CalendarList };
