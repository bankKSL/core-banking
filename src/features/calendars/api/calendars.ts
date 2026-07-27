import client from "@/api/client";
import { currentDate } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────

export interface CalendarData {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string | null;
  duration: number | null;
  typeId: number;
  type: { id: number; code: string; value: string };
  repeating: boolean;
  recurrence: string;
  humanReadable: string;
  recurringDates: string[];
  nextTenRecurringDates: string[];
  remindById: number | null;
  firstReminder: number | null;
  secondReminder: number | null;
  meetingTime: string | null;
  calendarTime: string | null;
  createdBy: { id: number; username: string };
  createdDate: string;
  lastModifiedBy: { id: number; username: string };
  lastModifiedDate: string;
}

export interface CalendarTemplate {
  entityTypeOptions: Array<{ id: number; value: string }>;
  calendarTypeOptions: Array<{ id: number; value: string }>;
  remindByOptions: Array<{ id: number; value: string }>;
  frequencyOptions: Array<{ id: number; value: string }>;
  repeatsOnDayOptions: Array<{ id: number; value: string }>;
  frequencyNthDayTypeOptions: Array<{ id: number; value: string }>;
}

export interface CalendarCreateRequest {
  title: string;
  typeId: number;
  startDate: string;
  repeating: boolean;
  frequency?: number;
  interval?: number;
  repeatsOnDay?: number;
  description?: string;
  location?: string;
  endDate?: string;
  duration?: number;
  remindById?: number;
  firstReminder?: number;
  secondReminder?: number;
  meetingTime?: string;
  dateFormat: string;
  locale: string;
}

// ─── Meetings Types ─────────────────────────────────────────

export interface MeetingData {
  id: number;
  meetingDate: string;
  clientsAttendance: MeetingAttendanceData[];
  clients: Array<{ id: number; displayName: string }>;
  attendanceTypeOptions: Array<{ id: number; value: string }>;
}

export interface MeetingAttendanceData {
  id: number;
  clientId: number;
  clientName: string;
  attendanceType: { id: number; code: string; value: string };
}

export interface MeetingTemplate {
  calendarData: CalendarData;
  clients: Array<{ id: number; displayName: string }>;
  attendanceTypeOptions: Array<{ id: number; value: string }>;
  recurringDates: string[];
}

// ─── Calendar API ───────────────────────────────────────────

export async function fetchCalendars(entityType: string, entityId: number, calendarType?: number): Promise<CalendarData[]> {
  const params: Record<string, string | number> = {};
  if (calendarType) params.calendarType = calendarType;
  const { data } = await client.get<CalendarData[]>(`/${entityType}/${entityId}/calendars`, { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchCalendar(entityType: string, entityId: number, calendarId: number): Promise<CalendarData> {
  const { data } = await client.get<CalendarData>(`/${entityType}/${entityId}/calendars/${calendarId}`);
  return data;
}

export async function fetchCalendarTemplate(entityType: string, entityId: number): Promise<CalendarTemplate> {
  const { data } = await client.get<CalendarTemplate>(`/${entityType}/${entityId}/calendars/template`);
  return data;
}

export async function createCalendar(entityType: string, entityId: number, payload: CalendarCreateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>(`/${entityType}/${entityId}/calendars`, payload);
  return data;
}

export async function updateCalendar(entityType: string, entityId: number, calendarId: number, payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/${entityType}/${entityId}/calendars/${calendarId}`, payload);
  return data;
}

export async function deleteCalendar(entityType: string, entityId: number, calendarId: number): Promise<void> {
  await client.delete(`/${entityType}/${entityId}/calendars/${calendarId}`);
}

// ─── Meeting API ────────────────────────────────────────────

export async function fetchMeetings(entityType: string, entityId: number, limit?: number): Promise<MeetingData[]> {
  const params: Record<string, number> = {};
  if (limit) params.limit = limit;
  const { data } = await client.get<MeetingData[]>(`/${entityType}/${entityId}/meetings`, { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchMeeting(entityType: string, entityId: number, meetingId: number): Promise<MeetingData> {
  const { data } = await client.get<MeetingData>(`/${entityType}/${entityId}/meetings/${meetingId}`);
  return data;
}

export async function fetchMeetingTemplate(entityType: string, entityId: number, calendarId: number): Promise<MeetingTemplate> {
  const { data } = await client.get<MeetingTemplate>(`/${entityType}/${entityId}/meetings/template`, { params: { calendarId } });
  return data;
}

export async function createMeeting(entityType: string, entityId: number, payload: Record<string, unknown>): Promise<{ entityId: number; groupId: number }> {
  const { data } = await client.post<{ entityId: number; groupId: number }>(`/${entityType}/${entityId}/meetings`, payload);
  return data;
}

export async function updateMeeting(entityType: string, entityId: number, meetingId: number, payload: Record<string, unknown>): Promise<{ entityId: number; groupId: number }> {
  const { data } = await client.put<{ entityId: number; groupId: number }>(`/${entityType}/${entityId}/meetings/${meetingId}`, payload);
  return data;
}

export async function deleteMeeting(entityType: string, entityId: number, meetingId: number): Promise<void> {
  await client.delete(`/${entityType}/${entityId}/meetings/${meetingId}`);
}

export async function updateMeetingAttendance(entityType: string, entityId: number, meetingId: number, payload: Record<string, unknown>): Promise<void> {
  await client.post(`/${entityType}/${entityId}/meetings/${meetingId}?command=attendance`, payload);
}
