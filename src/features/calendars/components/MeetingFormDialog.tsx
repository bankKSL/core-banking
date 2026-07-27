import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCalendars,
  useMeetingTemplate,
  useCreateMeeting,
} from "../hooks/useCalendars";
import type { MeetingData } from "../api/calendars";

interface MeetingFormDialogProps {
  entityType: string;
  entityId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: MeetingData;
}

const ATTENDANCE_TYPE_LABELS: Record<number, string> = {
  1: "Present",
  2: "Absent",
  3: "Approved",
  4: "Leave",
  5: "Late",
};

const MeetingFormDialog: React.FC<MeetingFormDialogProps> = ({
  entityType,
  entityId,
  open,
  onOpenChange,
  meeting,
}) => {
  const isEdit = !!meeting;
  const { data: calendars, isLoading: calendarsLoading } = useCalendars(entityType, entityId);
  const createMutation = useCreateMeeting();
  const isSubmitting = createMutation.isPending;

  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<number, number>>({});

  const { data: template, isLoading: templateLoading } = useMeetingTemplate(
    entityType,
    entityId,
    selectedCalendarId ?? 0,
  );

  const calList = calendars ?? [];

  useEffect(() => {
    if (open) {
      if (calList.length === 1) {
        setSelectedCalendarId(calList[0].id);
      } else {
        setSelectedCalendarId(null);
      }
      setSelectedDate(null);
      setAttendance({});
    }
  }, [open, calList]);

  useEffect(() => {
    if (template?.clients) {
      const initial: Record<number, number> = {};
      template.clients.forEach((c) => {
        initial[c.id] = 1;
      });
      setAttendance(initial);
    }
  }, [template]);

  const handleSubmit = async () => {
    if (!selectedCalendarId || !selectedDate) return;

    const clientsAttendance = Object.entries(attendance).map(([clientId, attendanceType]) => ({
      clientId: Number(clientId),
      attendanceType,
    }));

    const payload = {
      calendarId: selectedCalendarId,
      meetingDate: selectedDate,
      clientsAttendance,
      dateFormat: "dd MMMM yyyy" as const,
      locale: "en" as const,
    };

    try {
      await createMutation.mutateAsync({ entityType, entityId, payload: payload as unknown as Record<string, unknown> });
      onOpenChange(false);
    } catch {
      /* error handled by react-query */
    }
  };

  const canSubmit = !!selectedCalendarId && !!selectedDate;
  const selectedCal = calList.find((c) => c.id === selectedCalendarId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Meeting" : "Create Meeting"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Calendar *</Label>
            <Select
              value={selectedCalendarId ? String(selectedCalendarId) : ""}
              onValueChange={(v) => {
                setSelectedCalendarId(Number(v));
                setSelectedDate(null);
              }}
              disabled={calendarsLoading || calList.length === 1}
            >
              <SelectTrigger>
                <SelectValue placeholder={calendarsLoading ? "Loading..." : "Select calendar"} />
              </SelectTrigger>
              <SelectContent>
                {calList.map((cal) => (
                  <SelectItem key={cal.id} value={String(cal.id)}>
                    {cal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCalendarId && (
            <div>
              <Label>Meeting Date *</Label>
              <Select value={selectedDate ?? ""} onValueChange={setSelectedDate} disabled={templateLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={templateLoading ? "Loading dates..." : "Select date"} />
                </SelectTrigger>
                <SelectContent>
                  {(template?.recurringDates ?? selectedCal?.nextTenRecurringDates ?? []).map((d) => (
                    <SelectItem key={d} value={d}>
                      {new Date(d).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedDate && template?.clients && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Client Attendance</Label>
              {template.clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between gap-4">
                  <span className="text-sm flex-1">{client.displayName}</span>
                  <Select
                    value={String(attendance[client.id] ?? 1)}
                    onValueChange={(v) =>
                      setAttendance((prev) => ({ ...prev, [client.id]: Number(v) }))
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(template.attendanceTypeOptions ?? []).map((opt) => (
                        <SelectItem key={opt.id} value={String(opt.id)}>
                          {ATTENDANCE_TYPE_LABELS[opt.id] ?? opt.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {selectedDate && !template?.clients && !templateLoading && (
            <p className="text-sm text-gray-500">No clients found for this entity.</p>
          )}

          {templateLoading && selectedCalendarId && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Create Meeting"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { MeetingFormDialog };
