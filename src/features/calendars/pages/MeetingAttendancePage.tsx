import { type FC, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
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

type AttendanceFormValues = Record<string, number>;

const MeetingAttendancePage: FC = () => {
  const { t } = useTranslation();
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

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<AttendanceFormValues>({ defaultValues: {} });

  useEffect(() => {
    if (meeting?.clientsAttendance) {
      const map: Record<string, number> = {};
      meeting.clientsAttendance.forEach((a) => {
        map[String(a.clientId)] = a.attendanceType?.id ?? 1;
      });
      reset(map);
    }
  }, [meeting, reset]);

  const onSubmit = async (values: AttendanceFormValues) => {
    if (!meeting) return;
    const payload = {
      clientsAttendance: Object.entries(values).map(([clientId, attendanceType]) => ({
        clientId: Number(clientId),
        attendanceType,
      })),
    };

    await updateMutation.mutateAsync({
      entityType: entityType ?? "",
      entityId: Number(entityId ?? 0),
      meetingId: Number(meetingId ?? 0),
      payload: payload as unknown as Record<string, unknown>,
    });
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
        <PageHeader title={t("Meeting Attendance")} description={t("Loading...")} />
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
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
          title={t("Meeting Attendance")}
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
          }
        />
        <ErrorState title={t("Failed to load meeting")} message={t("Failed to load meeting attendance.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Meeting Attendance")}
        description={meetingDate ? t("Attendance for meeting on {{date}}", { date: meetingDate }) : ""}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      {updateMutation.isError && (
        <ErrorState
          title={t("Failed to save attendance")}
          message={
            updateMutation.error instanceof Error ? updateMutation.error.message : t("An unexpected error occurred.")
          }
          onRetry={() => updateMutation.reset()}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("Client Attendance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3">
              {(!meeting?.clientsAttendance || meeting.clientsAttendance.length === 0) ? (
                <p className="text-sm text-gray-500">{t("No attendance records found.")}</p>
              ) : (
                meeting.clientsAttendance.map((att) => (
                  <div key={att.id} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                    <span className="text-sm font-medium flex-1">{att.clientName}</span>
                    <Controller
                      control={control}
                      name={String(att.clientId)}
                      render={({ field }) => (
                        <Select
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(Number(v))}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ATTENDANCE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.id} value={String(opt.id)}>
                                {t(opt.label)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                ))
              )}

              {meeting?.clientsAttendance && meeting.clientsAttendance.length > 0 && (
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Saving…")}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> {t("Save Attendance")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingAttendancePage;
