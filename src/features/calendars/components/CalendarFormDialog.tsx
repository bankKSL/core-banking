import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalendarTemplate, useCreateCalendar, useUpdateCalendar } from "../hooks/useCalendars";
import { calendarFormSchema } from "../schemas/calendars.schema";
import type { CalendarData } from "../api/calendars";

interface CalendarFormDialogProps {
  entityType: string;
  entityId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendar?: CalendarData;
}

const weekDayOptions = [
  { id: 1, value: "Monday" }, { id: 2, value: "Tuesday" }, { id: 3, value: "Wednesday" },
  { id: 4, value: "Thursday" }, { id: 5, value: "Friday" }, { id: 6, value: "Saturday" }, { id: 7, value: "Sunday" },
];

const CalendarFormDialog: React.FC<CalendarFormDialogProps> = ({ entityType, entityId, open, onOpenChange, calendar }) => {
  const isEdit = !!calendar;
  const { data: template } = useCalendarTemplate(entityType, entityId);
  const createMutation = useCreateCalendar();
  const updateMutation = useUpdateCalendar();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(calendarFormSchema) as any,
    defaultValues: { title: "", typeId: 0, description: "", location: "", startDate: "", endDate: "", repeating: false, frequency: null, interval: null, repeatsOnDay: null, remindById: null, firstReminder: null, secondReminder: null, meetingTime: "" },
  });

  const repeating = watch("repeating");
  const watchTypeId = watch("typeId");

  useEffect(() => {
    if (open) {
      if (calendar) {
        reset({
          title: calendar.title,
          typeId: calendar.typeId,
          description: calendar.description || "",
          location: calendar.location || "",
          startDate: calendar.startDate,
          endDate: calendar.endDate || "",
          repeating: calendar.repeating ?? false,
          frequency: calendar.recurrence ? 2 : null,
          interval: 1,
          repeatsOnDay: null,
          remindById: calendar.remindById,
          firstReminder: calendar.firstReminder,
          secondReminder: calendar.secondReminder,
          meetingTime: calendar.meetingTime || "",
        } as any);
      } else {
        reset({ title: "", typeId: 0, description: "", location: "", startDate: "", endDate: "", repeating: false, frequency: null, interval: null, repeatsOnDay: null, remindById: null, firstReminder: null, secondReminder: null, meetingTime: "" });
      }
    }
  }, [open, calendar, reset]);

  const onSubmit = async (values: Record<string, unknown>) => {
    const payload = { ...values, dateFormat: "dd MMMM yyyy", locale: "en" } as any;
    if (isEdit && calendar) {
      await updateMutation.mutateAsync({ entityType, entityId, calendarId: calendar.id, payload });
    } else {
      await createMutation.mutateAsync({ entityType, entityId, payload });
    }
    onOpenChange(false);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const calendarTypeOptions = template?.calendarTypeOptions ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Calendar" : "New Calendar"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input {...register("title")} placeholder="e.g. Weekly Collection" error={errors.title?.message as string} />
          </div>
          <div>
            <Label>Type *</Label>
            <Select value={watchTypeId ? String(watchTypeId) : ""} onValueChange={(v) => setValue("typeId", Number(v))}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {calendarTypeOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Input {...register("description")} placeholder="Optional" />
          </div>
          <div>
            <Label>Location</Label>
            <Input {...register("location")} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input type="date" {...register("startDate")} error={errors.startDate?.message as string} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" {...register("endDate")} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={repeating} onCheckedChange={(c) => setValue("repeating", c === true)} />
            <Label className="mb-0">Repeating</Label>
          </div>
          {repeating && (
            <div className="grid grid-cols-3 gap-4 pl-6">
              <div>
                <Label>Frequency</Label>
                  <Select value={String(watch("frequency") ?? "")} onValueChange={(v) => setValue("frequency", Number(v) as any)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(template?.frequencyOptions ?? []).map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Interval</Label>
                <Input type="number" min="1" {...register("interval", { valueAsNumber: true })} placeholder="1" />
              </div>
              <div>
                <Label>Repeats On</Label>
                <Select value={String(watch("repeatsOnDay") ?? "")} onValueChange={(v) => setValue("repeatsOnDay", Number(v) as any)}>
                  <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                  <SelectContent>
                    {weekDayOptions.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarFormDialog;
