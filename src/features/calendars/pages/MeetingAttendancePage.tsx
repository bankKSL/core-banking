import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMeeting, useUpdateMeetingAttendance } from "../hooks/useCalendars";

const ATTENDANCE_OPTIONS = [
  { id: 1, label: "Present" },
  { id: 2, label: "Absent" },
  { id: 3, label: "Approved" },
  { id: 4, label: "Leave" },
  { id: 5, label: "Late" },
];

const MeetingAttendancePage: React.FC = () => {
  const { entityType, entityId, meetingId } = useParams<{
    entityType: string;
    entityId: string;
    meetingId: string;
  }>();
  const navigate = useNavigate();

  const { data: meeting, isLoading, isError, refetch } = useMeeting(
    entityType ?? "",
    Number(entityId ?? 0),
    meetingId ? Number(meetingId) : undefined,
  );

  const updateMutation = useUpdateMeetingAttendance();
  const isSubmitting = updateMutation.isPending;

  const [attendanceMap, setAttendanceMap] = useState<Record<number, number>>({});

  useEffect(() => {
    if (meeting?.clientsAttendance) {
      const map: Record<number, number> = {};
      meeting.clientsAttendance.forEach((a) => {
        map[a.clientId] = a.attendanceType?.id ?? 1;
      });
      setAttendanceMap(map);
    }
  }, [meeting]);

  const handleSave = async () => {
    if (!meeting) return;
    const payload = {
      clientsAttendance: Object.entries(attendanceMap).map(([clientId, attendanceType]) => ({
        clientId: Number(clientId),
        attendanceType,
      })),
    };

    try {
      await updateMutation.mutateAsync({
        entityType: entityType ?? "",
        entityId: Number(entityId ?? 0),
        meetingId: Number(meetingId ?? 0),
        payload: payload as unknown as Record<string, unknown>,
      });
    } catch {
      /* error handled by react-query */
    }
  };

  const meetingDate = meeting?.meetingDate
    ? new Date(meeting.meetingDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Meeting Attendance" description="Loading..." />
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Meeting Attendance"
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          }
        />
        <ErrorState message="Failed to load meeting attendance." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meeting Attendance"
        description={meetingDate ? `Attendance for meeting on ${meetingDate}` : ""}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Client Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(!meeting?.clientsAttendance || meeting.clientsAttendance.length === 0) ? (
              <p className="text-sm text-gray-500">No attendance records found.</p>
            ) : (
              meeting.clientsAttendance.map((att) => (
                <div key={att.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                  <span className="text-sm font-medium flex-1">{att.clientName}</span>
                  <Select
                    value={String(attendanceMap[att.clientId] ?? att.attendanceType?.id ?? 1)}
                    onValueChange={(v) =>
                      setAttendanceMap((prev) => ({ ...prev, [att.clientId]: Number(v) }))
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ATTENDANCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.id} value={String(opt.id)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))
            )}

            {meeting?.clientsAttendance && meeting.clientsAttendance.length > 0 && (
              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Attendance
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingAttendancePage;
