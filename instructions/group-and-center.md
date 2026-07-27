# Groups & Centers

## Overview

Groups and Centers are administrative units in Fineract used to organize clients for lending (e.g., Grameen model, Joint-Liability Groups, Self-Help Groups). Centers are a higher-level grouping that contain Groups, which in turn contain Clients.

**Key concept:** Both Groups and Centers use the same `Group` JPA entity (`m_group` table), differentiated by the `GroupLevel.levelName` ("Center" vs "Group"). This is configured in `m_group_level`.

### Hierarchy

```
Office
  └── Center (GroupLevel = "Center", superParent=true)
        ├── Group (GroupLevel = "Group", canHaveClients=true)
        │     └── Client (via m_group_client join table)
        ├── Group
        │     └── Client
        └── ...
```

## Backend Structure

### Domain Layer (`fineract-core`)

| File                            | Description                                                                                                                                                                                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Group.java`                    | JPA entity (`m_group`). Single entity for both Group and Center. Fields: externalId, status, activationDate, office, staff, parent (Group), groupLevel, name, hierarchy, groupMembers (child Groups), clientMembers (Clients), closureReason, closureDate, submittedOnDate, staffHistory, accountNumber, groupRole |
| `GroupLevel.java`               | JPA entity (`m_group_level`). Defines hierarchy levels. Fields: parentId, superParent, levelName, recursable, canHaveClients. Methods: `isCenter()`, `isGroup()` based on levelName                                                                                                                                |
| `GroupRole.java`                | JPA entity for roles assigned to group members (e.g., Group Leader)                                                                                                                                                                                                                                                |
| `StaffAssignmentHistory.java`   | JPA entity tracking staff assignment history for centers                                                                                                                                                                                                                                                           |
| `GroupingTypeStatus.java`       | Enum: INVALID(0), PENDING(100), ACTIVE(300), TRANSFER_IN_PROGRESS(303), TRANSFER_ON_HOLD(304), CLOSED(600)                                                                                                                                                                                                         |
| `GroupingTypeEnumerations.java` | Converts status values to `EnumOptionData`                                                                                                                                                                                                                                                                         |

### Data / DTOs

| File                     | Key Fields                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GroupGeneralData.java`  | id, accountNo, name, externalId, status, active, activationDate, officeId, officeName, centerId, centerName, staffId, staffName, hierarchy, groupLevel. Associations: clientMembers, activeClientMembers, groupRoles, calendarsData, collectionMeetingCalendar. Template: centerOptions, officeOptions, staffOptions, clientOptions, availableRoles, selectedRole, closureReasons, timeline |
| `CenterData.java`        | id, accountNo, name, externalId, officeId, officeName, staffId, staffName, hierarchy, status, active, activationDate, timeline. Associations: groupMembers (child Groups), collectionMeetingCalendar. Template: groupMembersOptions, closureReasons, officeOptions, staffOptions. Financial: totalCollected, totalOverdue, totaldue, installmentDue                                         |
| `GroupRoleData.java`     | id, clientId, clientName, role (CodeValueData)                                                                                                                                                                                                                                                                                                                                              |
| `GroupTimelineData.java` | submittedOnDate, submittedByUsername, activatedOnDate, activatedByUsername, closedOnDate, closedByUsername                                                                                                                                                                                                                                                                                  |
| `GroupLevelData.java`    | id, levelName, parentId, superParent, recursable, canHaveClients                                                                                                                                                                                                                                                                                                                            |
| `StaffCenterData.java`   | staffId, staffName, meetingFallCenters, totalCollected, totalOverdue, totaldue, installmentDue                                                                                                                                                                                                                                                                                              |

### API Layer (`fineract-provider`)

#### Groups — `GroupsApiResource.java` (`@Path("/v1/groups")`)

| Method | Path                                | Operation                           | Description                                                                                                                                                                                    |
| ------ | ----------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/template`                         | `retrieveTemplate`                  | Get group creation template. Supports `?officeId=`, `?centerId=`, `?command=close` (for closure reasons), `?staffInSelectedOfficeOnly=true`                                                    |
| GET    | (list)                              | `retrieveAll`                       | List groups with pagination/sorting. Query params: officeId, staffId, externalId, name, underHierarchy, orphansOnly, paged, offset, limit, orderBy, sortOrder                                  |
| GET    | `/{groupId}`                        | `retrieveOne`                       | Get group detail. Supports `?associations=clientMembers,activeClientMembers,groupRoles,parentCalendars,collectionMeetingCalendar`, `?roleId=`, `?template=true`, `?staffInSelectedOfficeOnly=` |
| POST   |                                     | `create`                            | Create group. Mandatory: name, officeId, active, activationDate (if active). Optional: externalId, staffId, clientMembers                                                                      |
| PUT    | `/{groupId}`                        | `update`                            | Update group fields                                                                                                                                                                            |
| DELETE | `/{groupId}`                        | `delete`                            | Delete group (only if PENDING status and no associations)                                                                                                                                      |
| POST   | `/{groupId}`                        | `activateOrGenerateCollectionSheet` | Command-based operations (see below)                                                                                                                                                           |
| POST   | `/{groupId}/command/unassign_staff` | `unassignLoanOfficer`               | Unassign staff (deprecated path)                                                                                                                                                               |
| GET    | `/{groupId}/accounts`               | `retrieveAccounts`                  | Get loan + savings account overview                                                                                                                                                            |
| GET    | `/{groupId}/glimaccounts`           | `retrieveglimAccounts`              | GLIM accounts for group                                                                                                                                                                        |
| GET    | `/{groupId}/gsimaccounts`           | `retrieveGsimAccounts`              | GSIM accounts for group                                                                                                                                                                        |
| GET    | `/downloadtemplate`                 | `getGroupsTemplate`                 | Bulk import template download                                                                                                                                                                  |
| POST   | `/uploadtemplate`                   | `postGroupTemplate`                 | Bulk import template upload                                                                                                                                                                    |

**Group command operations** (via `POST /v1/groups/{groupId}?command=`):

| Command                   | Description                       | Mandatory Fields                                    |
| ------------------------- | --------------------------------- | --------------------------------------------------- |
| `activate`                | Activate a pending group          | activationDate                                      |
| `associateClients`        | Add clients to group              | clientMembers                                       |
| `disassociateClients`     | Remove clients from group         | clientMembers                                       |
| `transferClients`         | Transfer clients to another group | destinationGroupId, clients                         |
| `assignStaff`             | Assign staff to group             | staffId                                             |
| `unassignStaff`           | Unassign staff from group         | staffId                                             |
| `assignRole`              | Assign role to group member       | clientId, role                                      |
| `unassignRole`            | Unassign role from group member   | (via `roleId` query param)                          |
| `updateRole`              | Update member role                | (via `roleId` query param)                          |
| `close`                   | Close a group                     | closureDate, closureReasonId                        |
| `generateCollectionSheet` | Generate repayment details        | calendarId, transactionDate                         |
| `saveCollectionSheet`     | Perform bulk repayments           | calendarId, transactionDate, actualDisbursementDate |

#### Centers — `CentersApiResource.java` (`@Path("/v1/centers")`)

| Method | Path                   | Operation              | Description                                                                                                                                                             |
| ------ | ---------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/template`            | `retrieveTemplate`     | Get center creation template. Supports `?officeId=`, `?command=close`, `?staffInSelectedOfficeOnly=`                                                                    |
| GET    | (list)                 | `retrieveAll`          | List centers with pagination/sorting. Supports same params as groups. Also supports `?meetingDate=&officeId=&dateFormat=&locale=` to list staff centers by meeting date |
| GET    | `/{centerId}`          | `retrieveOne`          | Get center detail. Supports `?associations=groupMembers,collectionMeetingCalendar`, `?template=true`                                                                    |
| POST   |                        | `create`               | Create center. Mandatory: name, officeId, active, activationDate (if active). Optional: externalId, staffId, groupMembers                                               |
| PUT    | `/{centerId}`          | `update`               | Update center fields                                                                                                                                                    |
| DELETE | `/{centerId}`          | `delete`               | Delete center (only if PENDING and no associations)                                                                                                                     |
| POST   | `/{centerId}`          | `activate`             | Command-based operations (see below)                                                                                                                                    |
| GET    | `/{centerId}/accounts` | `retrieveGroupAccount` | Account summary overview                                                                                                                                                |
| GET    | `/downloadtemplate`    | `getCentersTemplate`   | Bulk import template download                                                                                                                                           |
| POST   | `/uploadtemplate`      | `postCentersTemplate`  | Bulk import template upload                                                                                                                                             |

**Center command operations** (via `POST /v1/centers/{centerId}?command=`):

| Command                   | Description                               |
| ------------------------- | ----------------------------------------- |
| `activate`                | Activate a pending center                 |
| `close`                   | Close a center (no active groups/savings) |
| `associateGroups`         | Link existing groups to center            |
| `disassociateGroups`      | Unlink groups from center                 |
| `generateCollectionSheet` | Generate JLG loan repayment sheet         |
| `saveCollectionSheet`     | Perform bulk JLG repayments               |

### Services

| Service                             | Key Methods                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GroupReadPlatformService`          | `retrieveAll()`, `retrievePagedAll()`, `retrieveOne()`, `retrieveTemplate()`, `retrieveGroupWithClosureReasons()`                                                                                                                                                                                                                                                                         |
| `CenterReadPlatformService`         | `retrieveAll()`, `retrievePagedAll()`, `retrieveOne()`, `retrieveTemplate()`, `retrieveAssociatedGroups()`, `retrieveCenterGroupTemplate()`, `retrieveCenterWithClosureReasons()`, `retriveAllCentersByMeetingDate()`                                                                                                                                                                     |
| `GroupingTypesWritePlatformService` | Single write service for both groups and centers: `createGroup()`, `updateGroup()`, `deleteGroup()`, `createCenter()`, `updateCenter()`, `deleteCenter()`, `activate()`, `close()`, `associateClients()`, `disassociateClients()`, `associateGroups()`, `disassociateGroups()`, `assignStaff()`, `unassignStaff()`, `assignRole()`, `unassignRole()`, `updateRole()`, `transferClients()` |
| `GroupRolesReadPlatformService`     | `retrieveGroupRoles()`, `retrieveGroupRole()`                                                                                                                                                                                                                                                                                                                                             |
| `GroupRolesWritePlatformService`    | `createRole()`, `updateRole()`, `deleteRole()`                                                                                                                                                                                                                                                                                                                                            |
| `GroupLevelReadPlatformService`     | `retrieveAllLevels()`, `retrieveLevel()`                                                                                                                                                                                                                                                                                                                                                  |

### Command Handlers

22 separate command handlers exist, including: CreateGroupCommandHandler, UpdateGroupCommandHandler, DeleteGroupCommandHandler, ActivateGroupCommandHandler, CloseGroupCommandHandler, AssociateClientsToGroupCommandHandler, DisassociateClientsFromGroupCommandHandler, AssignGroupStaffCommandHandler, UnassignGroupStaffCommandHandler, AssignRoleCommandHandler, UnassignRoleCommandHandler, UpdateGroupRoleCommandHandler, and corresponding center handlers.

---

## API Endpoints Summary

### Groups

```
GET    /v1/groups/template
GET    /v1/groups
GET    /v1/groups/{groupId}
POST   /v1/groups
PUT    /v1/groups/{groupId}
DELETE /v1/groups/{groupId}
POST   /v1/groups/{groupId}?command=activate|associateClients|disassociateClients|transferClients|assignStaff|unassignStaff|assignRole|unassignRole|updateRole|close|generateCollectionSheet|saveCollectionSheet
POST   /v1/groups/{groupId}/command/unassign_staff
GET    /v1/groups/{groupId}/accounts
GET    /v1/groups/{groupId}/glimaccounts
GET    /v1/groups/{groupId}/gsimaccounts
GET    /v1/groups/downloadtemplate
POST   /v1/groups/uploadtemplate
```

### Centers

```
GET    /v1/centers/template
GET    /v1/centers
GET    /v1/centers/{centerId}
POST   /v1/centers
PUT    /v1/centers/{centerId}
DELETE /v1/centers/{centerId}
POST   /v1/centers/{centerId}?command=activate|close|associateGroups|disassociateGroups|generateCollectionSheet|saveCollectionSheet
GET    /v1/centers/{centerId}/accounts
GET    /v1/centers/downloadtemplate
POST   /v1/centers/uploadtemplate
```

### Group Levels

```
GET    /v1/grouplevels
GET    /v1/grouplevels/{levelId}
```

---

## Frontend Implementation Guide

### 1. Group List

- **Endpoint:** `GET /v1/groups`
- **Response:** `Collection<GroupGeneralData>` or `Page<GroupGeneralData>` (if `paged=true`)
- **Key fields:** id, name, accountNo, officeName, staffName, status, activationDate, hierarchy
- **Query params:** officeId, staffId, externalId, name, underHierarchy, orphansOnly, paged, offset, limit, orderBy, sortOrder
- **Display:** Show groups in a table with name, office, staff, status (Pending/Active/Closed), activation date
- **Filtering:** By office, staff, name, hierarchy path

### 2. Group Detail

- **Endpoint:** `GET /v1/groups/{groupId}`
- **Response:** `GroupGeneralData` with full detail
- **Associations** (via `?associations=` comma-separated):
  - `clientMembers` — all clients in group
  - `activeClientMembers` — only active clients
  - `groupRoles` — role assignments
  - `parentCalendars` — calendars inherited from parent
  - `collectionMeetingCalendar` — collection meeting schedule with recurring dates + next eligible meeting
- **Display sections:** Basic info, client members list, roles, calendar/meetings, accounts (via `/groups/{groupId}/accounts`)

### 3. Create Group

- **Endpoint:** `POST /v1/groups`
- **Template:** `GET /v1/groups/template?officeId=&centerId=&staffInSelectedOfficeOnly=`
- **Template response includes:** officeOptions, staffOptions, clientOptions (available clients), centerOptions, availableRoles
- **Request body:**
  ```json
  {
    "name": "My Group",
    "officeId": 1,
    "staffId": 1,
    "active": true,
    "activationDate": "2025-01-15",
    "externalId": "EXT-001",
    "clientMembers": [1, 2, 3],
    "dateFormat": "yyyy-MM-dd",
    "locale": "en",
    "submittedOnDate": "2025-01-10"
  }
  ```
- **If `active=false`**, group is created in **PENDING** status
- **Validation:** name required, officeId required, activationDate required if active=true

### 4. Edit Group

- **Endpoint:** `PUT /v1/groups/{groupId}`
- **Request body:** JSON with fields to update (partial update)
- **Updatable fields:** name, externalId, officeId, staffId, activationDate, submittedOnDate, status, accountNo
- **Note:** Changing `officeId` may require re-validation of associated clients

### 5. Activate Group

- **Endpoint:** `POST /v1/groups/{groupId}?command=activate`
- **Request body:**
  ```json
  { "activationDate": "2025-01-15", "dateFormat": "yyyy-MM-dd", "locale": "en" }
  ```
- **Status transition:** PENDING → ACTIVE
- **Error:** If already active
- **For centers:** staff assignment history is captured upon activation

### 6. Close Group

- **Endpoint:** `POST /v1/groups/{groupId}?command=close`
- **Template:** `GET /v1/groups/template?command=close` returns closureReasons
- **Request body:**
  ```json
  {
    "closureDate": "2025-06-30",
    "closureReasonId": 1,
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }
  ```
- **Validation:** Group must not have active clients/loans/savings. Closure date must be on or after activation date
- **Status transition:** ACTIVE → CLOSED
- **Center close:** Center must not have active groups or savings accounts

### 7. Assign Staff to Group

- **Endpoint:** `POST /v1/groups/{groupId}?command=assignStaff`
- **Request body:**
  ```json
  {
    "staffId": 2,
    "inheritStaffForClientAccounts": true
  }
  ```
- **Validation:** Staff must belong to same office (or higher in hierarchy)
- `inheritStaffForClientAccounts` — optional boolean, if true all members' loans/savings inherit the staff
- **For centers:** staff assignment history is tracked

### 8. Unassign Staff from Group

- **Endpoint:** `POST /v1/groups/{groupId}?command=unassignStaff`
- **Request body:**
  ```json
  { "staffId": 2 }
  ```
- Staff assignment history end date is set to current date

### 9. Group Roles

Roles are defined as code values under the system code `GROUPROLE` (e.g., "Group Leader").

**Create/Assign Role:**

- **Endpoint:** `POST /v1/groups/{groupId}?command=assignRole`
- **Request body:**
  ```json
  { "clientId": 1, "role": 1 }
  ```
- `role` is the `id` of the CodeValue from the `GROUPROLE` code group

**List Roles:**

- **Endpoint:** `GET /v1/groups/{groupId}?associations=groupRoles` (as part of group detail)

**Update Role:**

- **Endpoint:** `POST /v1/groups/{groupId}?command=updateRole&roleId={roleId}`
- **Request body:** `{ "role": 2 }`

**Unassign Role:**

- **Endpoint:** `POST /v1/groups/{groupId}?command=unassignRole&roleId={roleId}`

### 10. Group Members (Add/Remove)

**Add Clients:**

- **Endpoint:** `POST /v1/groups/{groupId}?command=associateClients`
- **Request body:**
  ```json
  { "clientMembers": [1, 2, 3] }
  ```
- **Error:** If any client is already in the group

**Remove Clients:**

- **Endpoint:** `POST /v1/groups/{groupId}?command=disassociateClients`
- **Request body:**
  ```json
  { "clientMembers": [2, 3] }
  ```
- **Error:** If client has active joint-liability group loans

**Transfer Clients:**

- **Endpoint:** `POST /v1/groups/{groupId}?command=transferClients`
- **Request body:**
  ```json
  {
    "destinationGroupId": 5,
    "clients": [1, 2],
    "inheritDestinationGroupLoanOfficer": true,
    "transferActiveLoans": true
  }
  ```

### 11. Center List

- **Endpoint:** `GET /v1/centers`
- **Response:** `Collection<CenterData>` or `Page<CenterData>` (if `paged=true`)
- **Key fields:** id, name, accountNo, officeName, staffName, status, activationDate, hierarchy
- **Special query:** `?meetingDate=&officeId=&dateFormat=&locale=` returns `StaffCenterData` (staff+centers with meeting schedules)

### 12. Center Detail

- **Endpoint:** `GET /v1/centers/{centerId}`
- **Response:** `CenterData`
- **Associations:**
  - `groupMembers` — list of child groups
  - `collectionMeetingCalendar` — collection meeting schedule with recurring dates
- **Template:** `?template=true` adds officeOptions, staffOptions, groupMembersOptions

### 13. Create Center

- **Endpoint:** `POST /v1/centers`
- **Template:** `GET /v1/centers/template?officeId=`
- **Request body:**
  ```json
  {
    "name": "My Center",
    "officeId": 1,
    "staffId": 1,
    "active": true,
    "activationDate": "2025-01-15",
    "externalId": "C-001",
    "groupMembers": [1, 2, 3],
    "dateFormat": "yyyy-MM-dd",
    "locale": "en",
    "submittedOnDate": "2025-01-10"
  }
  ```
- If `active=true`, staff assignment history is captured during creation for centers

### 14. Edit Center

- **Endpoint:** `PUT /v1/centers/{centerId}`
- **Request body:** partial JSON with fields to update

### 15. Activate Center

- **Endpoint:** `POST /v1/centers/{centerId}?command=activate`
- **Request body:**
  ```json
  { "activationDate": "2025-01-15", "dateFormat": "yyyy-MM-dd", "locale": "en" }
  ```
- On activation, if center has staff assigned, staff assignment history is recorded

### 16. Close Center

- **Endpoint:** `POST /v1/centers/{centerId}?command=close`
- **Template:** `GET /v1/centers/template?command=close` returns closureReasons
- **Request body:**
  ```json
  {
    "closureDate": "2025-06-30",
    "closureReasonId": 1,
    "dateFormat": "yyyy-MM-dd",
    "locale": "en"
  }
  ```
- **Validation:** Center must not have active groups (non-closed) or active savings accounts
- Associates groups to/from center:
  - `associateGroups` — via `POST /v1/centers/{centerId}?command=associateGroups`
  - `disassociateGroups` — via `POST /v1/centers/{centerId}?command=disassociateGroups`

### Status Lifecycle

```
PENDING (100) ──activate──→ ACTIVE (300) ──close──→ CLOSED (600)
                  ↑              │
                  └──transfer──→ TRANSFER_IN_PROGRESS (303)
                                 │
                                 └──→ TRANSFER_ON_HOLD (304)
```

- **Delete** only allowed in PENDING state with no associations
- **Close** only allowed in ACTIVE state with no active children

### Data Relationships

```
m_group_level (e.g., "Center"=superParent, "Group"=canHaveClients)
  ↓
m_group (id, parent_id → m_group, level_id → m_group_level)
  ├── m_group_client (group_id, client_id) — client members for Groups
  ├── m_group (parent_id) — child groups for Centers
  ├── m_staff_assignment_history — staff tracking for Centers
  └── m_group_role — role assignments per client
```
