import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, CalendarDays, X } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMeetings, useDeleteMeeting } from "../hooks/useCalendars";
import { MeetingFormDialog } from "./MeetingFormDialog";
import type { MeetingData, MeetingAttendanceData } from "../api/calendars";

interface MeetingListProps {
  entityType: string;
  entityId: number;
}

function formatDate(dateStr: string): string {
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

const ATTENDANCE_LABELS: Record<number, string> = {
  1: "Present",
  2: "Absent",
  3: "Approved",
  4: "Leave",
  5: "Late",
};

const MeetingList: React.FC<MeetingListProps> = ({ entityType, entityId }) => {
  const { t } = useTranslation();
  const { data: meetings, isLoading } = useMeetings(entityType, entityId);
  const deleteMutation = useDeleteMeeting();

  const [formOpen, setFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingData | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<MeetingData | null>(null);
  const [detailTarget, setDetailTarget] = useState<MeetingData | null>(null);

  const list = useMemo(() => meetings ?? [], [meetings]);

  const handleCreate = useCallback(() => {
    setEditingMeeting(undefined);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({
      entityType,
      entityId,
      meetingId: deleteTarget.id,
    });
    setDeleteTarget(null);
  }, [deleteTarget, entityType, entityId, deleteMutation]);

  const columns: ColumnDef<MeetingData>[] = useMemo(
    () => [
      {
        key: "meetingDate",
        header: t("Date"),
        accessorFn: (row) => formatDate(row.meetingDate),
      },
      {
        key: "calendar",
        header: t("Calendar"),
        accessorFn: (row) => (row as any).calendarTitle ?? "—",
      },
      {
        key: "attendanceCount",
        header: t("Attendance"),
        accessorFn: (row) => {
          const total = row.clientsAttendance?.length ?? 0;
          const present = row.clientsAttendance?.filter(
            (a) => a.attendanceType?.id === 1,
          ).length ?? 0;
          return `${present}/${total}`;
        },
      },
      {
        key: "actions",
        header: t("Actions"),
        sortable: false,
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setDetailTarget(row); }}
            >
              <CalendarDays className="h-4 w-4" />
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
    [t],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("Create Meeting")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={list}
        loading={isLoading}
        emptyState={{ message: t("No meetings found.") }}
      />

      <MeetingFormDialog
        entityType={entityType}
        entityId={entityId}
        open={formOpen}
        onOpenChange={setFormOpen}
        meeting={editingMeeting}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title={t("Delete Meeting")}
        description={t("Are you sure you want to delete the meeting on {{date}}?", { date: deleteTarget?.meetingDate ? formatDate(deleteTarget.meetingDate) : t("this date") })}
        confirmLabel={t("Delete")}
        variant="destructive"
        loading={deleteMutation.isPending}
      />

      <Dialog open={!!detailTarget} onOpenChange={(o) => { if (!o) setDetailTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("Attendance")} — {detailTarget ? formatDate(detailTarget.meetingDate) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {detailTarget && (detailTarget.clientsAttendance ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">{t("No attendance records.")}</p>
            ) : (
              (detailTarget?.clientsAttendance ?? []).map((att: MeetingAttendanceData) => (
                <div key={att.id} className="flex justify-between items-center text-sm py-1">
                  <span>{att.clientName}</span>
                  <span className="font-medium">
                    {t(ATTENDANCE_LABELS[att.attendanceType?.id] ?? att.attendanceType?.value ?? "—")}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { MeetingList };
