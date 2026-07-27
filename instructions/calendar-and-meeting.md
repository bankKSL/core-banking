# Calendar & Meetings

## Overview

Calendars define recurring schedules (meeting dates) for entities (Clients, Groups, Centers, Loans, Savings). Meetings are actual occurrences tied to a Calendar, with per-client attendance tracking.

- **Calendar** — a recurring schedule (e.g., weekly every Monday) linked to an entity via `CalendarInstance`
- **Meeting** — a specific instance of a calendar date (unique per `calendar_instance_id` + `meeting_date`)
- **Attendance** — per-client attendance record for a meeting (Present/Absent/Approved/Leave/Late)

## Backend Structure

### Domain Layer (`fineract-core`)

| File                         | Description                                                                                                                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Calendar.java`              | JPA entity (`m_calendar`). Fields: title, description, location, startDate, endDate, duration, typeId (COLLECTION/TRAINING/AUDIT/GENERAL), repeating, recurrence (RRULE string), remindById, firstReminder, secondReminder, meetingTime, calendarHistory |
| `CalendarInstance.java`      | JPA entity (`m_calendar_instance`). Links a Calendar to an entity (entityId + entityTypeId)                                                                                                                                                              |
| `CalendarHistory.java`       | JPA entity for tracking recurrence changes over time                                                                                                                                                                                                     |
| `CalendarEntityType.java`    | Enum: CLIENTS(1), GROUPS(2), LOANS(3), CENTERS(4), SAVINGS(5), LOAN_RECALCULATION_REST_DETAIL(6), LOAN_RECALCULATION_COMPOUNDING_DETAIL(7)                                                                                                               |
| `CalendarType.java`          | Enum: COLLECTION(1), TRAINING(2), AUDIT(3), GENERAL(4)                                                                                                                                                                                                   |
| `CalendarFrequencyType.java` | Enum: DAILY(1), WEEKLY(2), MONTHLY(3), YEARLY(4)                                                                                                                                                                                                         |
| `CalendarWeekDaysType.java`  | Enum: MO(1)..SU(7)                                                                                                                                                                                                                                       |
| `CalendarRemindBy.java`      | Enum: SMS(1), EMAIL(2), SYSTEMALERT(3)                                                                                                                                                                                                                   |
| `CalendarData.java`          | DTO with all calendar fields + template options (entityTypeOptions, calendarTypeOptions, remindByOptions, frequencyOptions, repeatsOnDayOptions, frequencyNthDayTypeOptions)                                                                             |
| `CalendarRequest.java`       | Input DTO: repeatsOnDay, dateFormat, repeating, interval, typeId, locale, title, startDate, frequency                                                                                                                                                    |
| `CalendarConstants.java`     | `CalendarSupportedParameters` enum listing all JSON param names                                                                                                                                                                                          |

### API (`fineract-provider`)

**`CalendarsApiResource.java`** — `@Path("/v1/{entityType}/{entityId}/calendars")`

| Method | Path            | Operation                    | Description                                                                                              |
| ------ | --------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| GET    | `/{calendarId}` | `retrieveCalendar`           | Get single calendar with recurring dates + next 10 dates                                                 |
| GET    | (list)          | `retrieveCalendarsByEntity`  | List calendars for an entity, optional `?calendarType=` filter, optional `?associations=parentCalendars` |
| GET    | `/template`     | `retrieveNewCalendarDetails` | Return empty calendar with all dropdown options                                                          |
| POST   |                 | `createCalendar`             | Create a calendar (takes `CalendarRequest`)                                                              |
| PUT    | `/{calendarId}` | `updateCalendar`             | Update calendar fields                                                                                   |
| DELETE | `/{calendarId}` | `deleteCalendar`             | Delete calendar                                                                                          |

**Entity types supported:** `clients`, `groups`, `centers`, `loans`, `savings`

### Services

| Service                               | Key Methods                                                                                                                                                                                                                                                                                              |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CalendarReadPlatformService`         | `retrieveCalendar()`, `retrieveCalendarsByEntity()`, `retrieveParentCalendarsByEntity()`, `generateRecurringDates()`, `generateNextTenRecurringDates()`, `updateWithRecurringDates()`, `retrieveLoanCalendar()`, `retrieveCollctionCalendarByEntity()`, `generateNextEligibleMeetingDateForCollection()` |
| `CalendarWritePlatformService`        | `createCalendar()`, `updateCalendar()`, `deleteCalendar()`, `createCalendarInstance()`, `updateCalendarInstance()`                                                                                                                                                                                       |
| `CalendarDropdownReadPlatformService` | `retrieveCalendarEntityTypeOptions()`, `retrieveCalendarTypeOptions()`, `retrieveCalendarRemindByOptions()`, `retrieveCalendarFrequencyTypeOptions()`, `retrieveCalendarWeekDaysTypeOptions()`, `retrieveCalendarFrequencyNthDayTypeOptions()`                                                           |

---

## Meetings

### Domain Layer

| File                     | Description                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Meeting.java`           | JPA entity (`m_meeting`). Fields: calendarInstance (ManyToOne), meetingDate, clientsAttendance (OneToMany). Unique constraint: `(calendar_instance_id, meeting_date)` |
| `MeetingAttendance.java` | JPA entity (`m_client_attendance`). Fields: client (ManyToOne), meeting (ManyToOne), attendanceTypeId. Unique constraint: `(client_id, meeting_id)`                   |

### Data / DTOs

| Class                             | Key Fields                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MeetingData`                     | id, meetingDate, clientsAttendance (`Collection<MeetingAttendanceData>`), clients (`Collection<ClientData>`), calendarData, attendanceTypeOptions |
| `MeetingCreateRequest`            | calendarId, meetingDate, dateFormat, locale, clientsAttendance                                                                                    |
| `MeetingUpdateRequest`            | id, calendarId, meetingDate, dateFormat, locale, clientsAttendance                                                                                |
| `MeetingCreateResponse`           | entityId, groupId                                                                                                                                 |
| `MeetingUpdateResponse`           | entityId, groupId                                                                                                                                 |
| `MeetingDeleteRequest`            | id, entityId, entityType                                                                                                                          |
| `MeetingDeleteResponse`           | entityId                                                                                                                                          |
| `MeetingAttendanceData`           | id, clientId, clientName, attendanceType (`EnumOptionData`)                                                                                       |
| `MeetingAttendanceUpdateRequest`  | id, meetingAttendance (list), attendanceType                                                                                                      |
| `MeetingAttendanceUpdateResponse` | entityId, groupId, changes (map)                                                                                                                  |
| `MeetingAttendanceType`           | Enum: INVALID(0), PRESENT(1), ABSENT(2), APPROVED(3), LEAVE(4), LATE(5)                                                                           |

### API (`fineract-provider`)

**`MeetingsApiResource.java`** — `@Path("/v1/{entityType}/{entityId}/meetings")`

| Method | Path                    | Operation                 | Description                                                                                                         |
| ------ | ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| GET    | `/template`             | `retrieveTemplateMeeting` | Get meeting creation template with clients list + calendar data + attendance type options (only for groups/centers) |
| GET    | (list)                  | `retrieveMeetings`        | List meetings for an entity, optional `?limit=`                                                                     |
| GET    | `/{meetingId}`          | `retrieveOneMeeting`      | Get single meeting with attendance data                                                                             |
| POST   |                         | `createMeeting`           | Create a meeting (takes `MeetingCreateRequest`)                                                                     |
| PUT    | `/{meetingId}`          | `updateMeeting`           | Update meeting date / attendance                                                                                    |
| DELETE | `/{meetingId}`          | `deleteMeeting`           | Delete a meeting                                                                                                    |
| POST   | `/{meetingId}?command=` | `updateMeetingAttendance` | Update attendance for a meeting (takes `MeetingAttendanceUpdateRequest`)                                            |

**Entity types supported for meetings:** Only `groups` and `centers`

### Services

| Service                                | Key Methods                                                                |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `MeetingReadService`                   | `retrieveMeeting()`, `retrieveMeetingsByEntity()`, `retrieveLastMeeting()` |
| `MeetingWriteService`                  | `createMeeting()`, `updateMeeting()`, `deleteMeeting()`                    |
| `MeetingAttendanceReadService`         | `retrieveClientAttendanceByMeetingId()`                                    |
| `MeetingAttendanceWriteService`        | `updateMeetingAttendance()`                                                |
| `MeetingAttendanceDropdownReadService` | `retrieveAttendanceTypeOptions()`                                          |

---

## API Endpoints Summary

### Calendars

```
GET    /v1/{entityType}/{entityId}/calendars/template
GET    /v1/{entityType}/{entityId}/calendars
GET    /v1/{entityType}/{entityId}/calendars/{calendarId}
POST   /v1/{entityType}/{entityId}/calendars
PUT    /v1/{entityType}/{entityId}/calendars/{calendarId}
DELETE /v1/{entityType}/{entityId}/calendars/{calendarId}
```

### Meetings

```
GET    /v1/{entityType}/{entityId}/meetings/template?calendarId=
GET    /v1/{entityType}/{entityId}/meetings
GET    /v1/{entityType}/{entityId}/meetings/{meetingId}
POST   /v1/{entityType}/{entityId}/meetings
PUT    /v1/{entityType}/{entityId}/meetings/{meetingId}
DELETE /v1/{entityType}/{entityId}/meetings/{meetingId}
POST   /v1/{entityType}/{entityId}/meetings/{meetingId}?command=attendance
```

---

## Frontend Implementation Guide

### 1. Calendar List per Entity

- **Endpoint:** `GET /v1/{entityType}/{entityId}/calendars`
- **Response:** `List<CalendarData>` — each item includes `id`, `title`, `type`, `startDate`, `recurrence`, `humanReadable`, `recurringDates`, `nextTenRecurringDates`
- **Display:** Show calendars in a list/table; render `humanReadable` for recurrence summary; show next few recurring dates
- **Filter:** Optional `?calendarType=` param accepts comma-separated type IDs (e.g., `1,4` for Collection + General)

### 2. Create Calendar

- **Endpoint:** `POST /v1/{entityType}/{entityId}/calendars`
- **Template:** `GET /v1/{entityType}/{entityId}/calendars/template` returns dropdown options
- **Request body (`CalendarRequest`):**
  ```json
  {
    "title": "Weekly Collection Meeting",
    "typeId": 1,
    "startDate": "2025-01-01",
    "repeating": true,
    "frequency": 2,
    "interval": 1,
    "repeatsOnDay": 2,
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }
  ```
- **Frequency values:** DAILY=1, WEEKLY=2, MONTHLY=3, YEARLY=4
- **TypeId values:** COLLECTION=1, TRAINING=2, AUDIT=3, GENERAL=4
- **Week days:** MO=1, TU=2, WE=3, TH=4, FR=5, SA=6, SU=7
- **Collection calendars MUST be repeating** (validation enforced)

### 3. Edit Calendar

- **Endpoint:** `PUT /v1/{entityType}/{entityId}/calendars/{calendarId}`
- **Request body:** JSON with fields to update (same as create but partial)
- **Restrictions:**
  - `typeId` cannot be changed once set
  - If active entities (JLG loans, RD accounts) are synced, frequency and interval cannot be changed
  - `startDate` cannot be set in the past or before existing start date

### 4. Delete Calendar

- **Endpoint:** `DELETE /v1/{entityType}/{entityId}/calendars/{calendarId}`
- **Response:** `CommandProcessingResult`

### 5. Meeting List

- **Endpoint:** `GET /v1/{entityType}/{entityId}/meetings`
- **Response:** `Collection<MeetingData>` — each item includes `id`, `meetingDate`, `clientsAttendance`
- **Supports limit:** `?limit=10`
- **Only for GROUPS and CENTERS**

### 6. Create Meeting

- **Endpoint:** `POST /v1/{entityType}/{entityId}/meetings`
- **Template:** `GET /v1/{entityType}/{entityId}/meetings/template?calendarId=` returns clients list + calendar recurring dates + attendance type options
- **Request body (`MeetingCreateRequest`):**
  ```json
  {
    "calendarId": 1,
    "meetingDate": "2025-01-15",
    "dateFormat": "yyyy-MM-dd",
    "locale": "en",
    "clientsAttendance": [
      { "clientId": 1, "attendanceType": { "id": 1 } },
      { "clientId": 2, "attendanceType": { "id": 2 } }
    ]
  }
  ```
- **Response:** `{ "entityId": 123, "groupId": 45 }`
- **Validation:** Meeting date must be a valid recurring date per the calendar; unique constraint on `(calendar_instance_id, meeting_date)`

### 7. Attendance Tracking

- **Endpoint:** `POST /v1/{entityType}/{entityId}/meetings/{meetingId}?command=attendance`
- **Request body (`MeetingAttendanceUpdateRequest`):**
  ```json
  {
    "meetingAttendance": [
      { "clientId": 1, "attendanceType": { "id": 1 } },
      { "clientId": 3, "attendanceType": { "id": 5 } }
    ],
    "attendanceType": null
  }
  ```
- **Attendance type values:** PRESENT=1, ABSENT=2, APPROVED=3, LEAVE=4, LATE=5
- **Response:** `{ "entityId": 123, "groupId": 45, "changes": {} }`
- Attendance can also be provided at meeting creation time

### Data Relationships

```
Calendar (m_calendar)
  ↕ CalendarInstance (m_calendar_instance) — links calendar to entity
    ↕ Meeting (m_meeting) — one per calendar date
      ↕ MeetingAttendance (m_client_attendance) — one per client per meeting
```
