import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCalendars,
  fetchCalendar,
  fetchCalendarTemplate,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  fetchMeetings,
  fetchMeeting,
  fetchMeetingTemplate,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  updateMeetingAttendance,
} from "../api/calendars";

// ─── Query Keys ─────────────────────────────────────────────

export const calendarKeys = {
  all: ["calendars"] as const,
  list: (entityType: string, entityId: number) =>
    [...calendarKeys.all, "list", entityType, entityId] as const,
  detail: (entityType: string, entityId: number, calendarId: number) =>
    [...calendarKeys.all, "detail", entityType, entityId, calendarId] as const,
  template: (entityType: string, entityId: number) =>
    [...calendarKeys.all, "template", entityType, entityId] as const,
};

export const meetingKeys = {
  all: ["meetings"] as const,
  list: (entityType: string, entityId: number) =>
    [...meetingKeys.all, "list", entityType, entityId] as const,
  detail: (entityType: string, entityId: number, meetingId: number) =>
    [...meetingKeys.all, "detail", entityType, entityId, meetingId] as const,
  template: (entityType: string, entityId: number, calendarId: number) =>
    [...meetingKeys.all, "template", entityType, entityId, calendarId] as const,
};

// ─── Calendar Hooks ─────────────────────────────────────────

export function useCalendars(entityType: string, entityId: number) {
  return useQuery({
    queryKey: calendarKeys.list(entityType, entityId),
    queryFn: () => fetchCalendars(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useCalendar(entityType: string, entityId: number, calendarId: number | undefined) {
  return useQuery({
    queryKey: calendarKeys.detail(entityType, entityId, calendarId!),
    queryFn: () => fetchCalendar(entityType, entityId, calendarId!),
    enabled: !!entityType && !!entityId && !!calendarId,
  });
}

export function useCalendarTemplate(entityType: string, entityId: number) {
  return useQuery({
    queryKey: calendarKeys.template(entityType, entityId),
    queryFn: () => fetchCalendarTemplate(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useCreateCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      payload,
    }: {
      entityType: string;
      entityId: number;
      payload: Parameters<typeof createCalendar>[2];
    }) => createCalendar(entityType, entityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

export function useUpdateCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      calendarId,
      payload,
    }: {
      entityType: string;
      entityId: number;
      calendarId: number;
      payload: Record<string, unknown>;
    }) => updateCalendar(entityType, entityId, calendarId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

export function useDeleteCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      calendarId,
    }: {
      entityType: string;
      entityId: number;
      calendarId: number;
    }) => deleteCalendar(entityType, entityId, calendarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

// ─── Meeting Hooks ──────────────────────────────────────────

export function useMeetings(entityType: string, entityId: number) {
  return useQuery({
    queryKey: meetingKeys.list(entityType, entityId),
    queryFn: () => fetchMeetings(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useMeeting(entityType: string, entityId: number, meetingId: number | undefined) {
  return useQuery({
    queryKey: meetingKeys.detail(entityType, entityId, meetingId!),
    queryFn: () => fetchMeeting(entityType, entityId, meetingId!),
    enabled: !!entityType && !!entityId && !!meetingId,
  });
}

export function useMeetingTemplate(entityType: string, entityId: number, calendarId: number) {
  return useQuery({
    queryKey: meetingKeys.template(entityType, entityId, calendarId),
    queryFn: () => fetchMeetingTemplate(entityType, entityId, calendarId),
    enabled: !!entityType && !!entityId && !!calendarId,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      payload,
    }: {
      entityType: string;
      entityId: number;
      payload: Record<string, unknown>;
    }) => createMeeting(entityType, entityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      meetingId,
      payload,
    }: {
      entityType: string;
      entityId: number;
      meetingId: number;
      payload: Record<string, unknown>;
    }) => updateMeeting(entityType, entityId, meetingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      meetingId,
    }: {
      entityType: string;
      entityId: number;
      meetingId: number;
    }) => deleteMeeting(entityType, entityId, meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });
}

export function useUpdateMeetingAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      meetingId,
      payload,
    }: {
      entityType: string;
      entityId: number;
      meetingId: number;
      payload: Record<string, unknown>;
    }) => updateMeetingAttendance(entityType, entityId, meetingId, payload),
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.list(entityType, entityId) });
    },
  });
}
