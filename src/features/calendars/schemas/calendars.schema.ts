import { z } from "zod";
import i18n from "@/i18n";

export const calendarFormSchema = z.object({
  title: z.string().min(1, i18n.t("Title is required")),
  typeId: z.number({ message: i18n.t("Type is required") }).int().positive(),
  description: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  startDate: z.string().min(1, i18n.t("Start date is required")),
  endDate: z.string().optional().or(z.literal("")),
  repeating: z.boolean(),
  frequency: z.number().int().optional().nullable(),
  interval: z.number().int().positive().optional().nullable(),
  repeatsOnDay: z.number().int().min(1).max(7).optional().nullable(),
  remindById: z.number().int().optional().nullable(),
  firstReminder: z.number().int().optional().nullable(),
  secondReminder: z.number().int().optional().nullable(),
  meetingTime: z.string().optional().or(z.literal("")),
});

export type CalendarFormValues = z.infer<typeof calendarFormSchema>;
