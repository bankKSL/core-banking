export type {
  CalendarData,
  CalendarTemplate,
  CalendarCreateRequest,
  MeetingData,
  MeetingAttendanceData,
  MeetingTemplate,
} from "./api/calendars";

export {
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
} from "./api/calendars";

export {
  calendarKeys,
  meetingKeys,
  useCalendars,
  useCalendar,
  useCalendarTemplate,
  useCreateCalendar,
  useUpdateCalendar,
  useDeleteCalendar,
  useMeetings,
  useMeeting,
  useMeetingTemplate,
  useCreateMeeting,
  useUpdateMeeting,
  useDeleteMeeting,
  useUpdateMeetingAttendance,
} from "./hooks/useCalendars";
