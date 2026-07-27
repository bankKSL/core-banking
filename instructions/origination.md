# Organization — React Implementation Guide

Source: Apache Fineract Organisation Feature Suite  
Trace Date: 2026-07-26  
Java Base: `org.apache.fineract.organisation`

---

## 1. Feature Overview

The **Organization** feature suite encompasses all administrative configuration and structural entities in Fineract — the organizational hierarchy, employees, calendars, currencies, and operational policies.

### Sub-Features

| Sub-Feature            | Package                     | API Base Path                                          | Description                                                  |
| ---------------------- | --------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| **Staff**              | `organisation/staff`        | `/v1/staff`                                            | Employees/staff members tied to offices                      |
| **Holidays**           | `organisation/holiday`      | `/v1/holidays`                                         | Holiday definitions that affect repayment scheduling         |
| **Currencies**         | `organisation/monetary`     | `/v1/currencies`                                       | Available and selected currencies for the organization       |
| **Funds**              | `portfolio/fund`            | `/v1/funds`                                            | Funding sources referenced by loans                          |
| **Payment Types**      | `portfolio/paymenttype`     | `/v1/paymenttypes`                                     | Payment method definitions (cash, transfer, cheque, etc.)    |
| **Tellers / Cashiers** | `organisation/teller`       | `/v1/tellers`                                          | Teller counters and cashier assignments with cash management |
| **Working Days**       | `organisation/workingdays`  | `/v1/workingdays`                                      | Business day configuration with repayment rescheduling rules |
| **Adhoc Queries**      | `adhocquery`                | `/v1/adhocquery`                                       | Saved SQL queries for custom reporting                       |
| **Provisioning**       | `organisation/provisioning` | `/v1/provisioningcategory`, `/v1/provisioningcriteria` | Loan loss provisioning categories and criteria               |

### Organizational Hierarchy

```
Office (Branch)
  ├── Staff (Employees)
  ├── Tellers (counters)
  │     └── Cashiers (staff assigned to teller)
  ├── Clients (registered under office)
  ├── Loans / Savings (under office)
  └── Holidays (applicable to specific offices)
```

---

## 2. API Inventory

### Staff (`/v1/staff`)

| Method | URL                          | Description                                                                       |
| ------ | ---------------------------- | --------------------------------------------------------------------------------- |
| GET    | `/v1/staff`                  | List staff (filter: `officeId`, `loanOfficersOnly`, `status=active/inactive/all`) |
| GET    | `/v1/staff/{staffId}`        | Single staff detail (optional `?template=true`)                                   |
| POST   | `/v1/staff`                  | Create staff member                                                               |
| PUT    | `/v1/staff/{staffId}`        | Update staff member                                                               |
| GET    | `/v1/staff/downloadtemplate` | Bulk import Excel template                                                        |

### Holidays (`/v1/holidays`)

| Method | URL                                         | Description                                              |
| ------ | ------------------------------------------- | -------------------------------------------------------- |
| GET    | `/v1/holidays`                              | List holidays (filter: `officeId`, `fromDate`, `toDate`) |
| GET    | `/v1/holidays/{holidayId}`                  | Single holiday detail                                    |
| GET    | `/v1/holidays/template`                     | Reschedule type options                                  |
| POST   | `/v1/holidays`                              | Create holiday                                           |
| PUT    | `/v1/holidays/{holidayId}`                  | Update holiday                                           |
| DELETE | `/v1/holidays/{holidayId}`                  | Soft-delete holiday                                      |
| POST   | `/v1/holidays/{holidayId}?command=activate` | Activate holiday                                         |

### Currencies (`/v1/currencies`)

| Method | URL              | Description                               |
| ------ | ---------------- | ----------------------------------------- |
| GET    | `/v1/currencies` | List selected + available currencies      |
| PUT    | `/v1/currencies` | Update selected currencies (full replace) |

### Funds (`/v1/funds`)

| Method | URL                  | Description |
| ------ | -------------------- | ----------- |
| GET    | `/v1/funds`          | List funds  |
| GET    | `/v1/funds/{fundId}` | Single fund |
| POST   | `/v1/funds`          | Create fund |
| PUT    | `/v1/funds/{fundId}` | Update fund |

### Payment Types (`/v1/paymenttypes`)

| Method | URL                                | Description                                                      |
| ------ | ---------------------------------- | ---------------------------------------------------------------- |
| GET    | `/v1/paymenttypes`                 | List payment types (`?onlyWithCode=true` filters system-defined) |
| GET    | `/v1/paymenttypes/{paymentTypeId}` | Single payment type                                              |
| POST   | `/v1/paymenttypes`                 | Create payment type                                              |
| PUT    | `/v1/paymenttypes/{paymentTypeId}` | Update payment type                                              |
| DELETE | `/v1/paymenttypes/{paymentTypeId}` | Delete payment type                                              |

### Tellers (`/v1/tellers`)

| Method | URL                                                                  | Description                                     |
| ------ | -------------------------------------------------------------------- | ----------------------------------------------- |
| GET    | `/v1/tellers`                                                        | List tellers (`?officeId=`)                     |
| GET    | `/v1/tellers/{tellerId}`                                             | Single teller                                   |
| POST   | `/v1/tellers`                                                        | Create teller                                   |
| PUT    | `/v1/tellers/{tellerId}`                                             | Update teller                                   |
| DELETE | `/v1/tellers/{tellerId}`                                             | Delete teller                                   |
| GET    | `/v1/tellers/{tellerId}/cashiers`                                    | List cashiers for teller (`?fromdate=&todate=`) |
| GET    | `/v1/tellers/{tellerId}/cashiers/template`                           | Cashier template                                |
| POST   | `/v1/tellers/{tellerId}/cashiers`                                    | Allocate cashier to teller                      |
| GET    | `/v1/tellers/{tellerId}/cashiers/{cashierId}`                        | Single cashier                                  |
| PUT    | `/v1/tellers/{tellerId}/cashiers/{cashierId}`                        | Update cashier allocation                       |
| DELETE | `/v1/tellers/{tellerId}/cashiers/{cashierId}`                        | Delete cashier allocation                       |
| POST   | `/v1/tellers/{tellerId}/cashiers/{cashierId}/allocate`               | Allocate cash to cashier                        |
| POST   | `/v1/tellers/{tellerId}/cashiers/{cashierId}/settle`                 | Settle cash from cashier                        |
| GET    | `/v1/tellers/{tellerId}/cashiers/{cashierId}/transactions`           | Cashier transactions (paginated)                |
| GET    | `/v1/tellers/{tellerId}/cashiers/{cashierId}/summaryandtransactions` | Transactions with summary                       |
| GET    | `/v1/tellers/{tellerId}/cashiers/{cashierId}/transactions/template`  | Transaction template                            |
| GET    | `/v1/tellers/{tellerId}/transactions`                                | Teller transactions                             |
| GET    | `/v1/tellers/{tellerId}/journals`                                    | Teller accounting journals                      |

### Cashiers (`/v1/cashiers`)

| Method | URL            | Description                                           |
| ------ | -------------- | ----------------------------------------------------- |
| GET    | `/v1/cashiers` | List cashiers (`?officeId=&tellerId=&staffId=&date=`) |

### Cashiers Journal (`/v1/cashiersjournal`)

| Method | URL                   | Description                                                          |
| ------ | --------------------- | -------------------------------------------------------------------- |
| GET    | `/v1/cashiersjournal` | List cashier journals (`?officeId=&tellerId=&cashierId=&dateRange=`) |

### Working Days (`/v1/workingdays`)

| Method | URL                        | Description                       |
| ------ | -------------------------- | --------------------------------- |
| GET    | `/v1/workingdays`          | List working days config          |
| GET    | `/v1/workingdays/template` | Repayment reschedule type options |
| PUT    | `/v1/workingdays`          | Update working days config        |

### Adhoc Queries (`/v1/adhocquery`)

| Method | URL                        | Description                          |
| ------ | -------------------------- | ------------------------------------ |
| GET    | `/v1/adhocquery`           | List all adhoc queries               |
| GET    | `/v1/adhocquery/template`  | Template with report run frequencies |
| GET    | `/v1/adhocquery/{adHocId}` | Single query                         |
| POST   | `/v1/adhocquery`           | Create query                         |
| PUT    | `/v1/adhocquery/{adHocId}` | Update query                         |
| DELETE | `/v1/adhocquery/{adHocId}` | Delete query                         |

### Provisioning Categories (`/v1/provisioningcategory`)

| Method | URL                                     | Description                  |
| ------ | --------------------------------------- | ---------------------------- |
| GET    | `/v1/provisioningcategory`              | List provisioning categories |
| GET    | `/v1/provisioningcategory/{categoryId}` | Single category              |

### Provisioning Criteria (`/v1/provisioningcriteria`)

| Method | URL                                     | Description     |
| ------ | --------------------------------------- | --------------- |
| GET    | `/v1/provisioningcriteria`              | List criteria   |
| GET    | `/v1/provisioningcriteria/{criteriaId}` | Single criteria |
| POST   | `/v1/provisioningcriteria`              | Create criteria |
| PUT    | `/v1/provisioningcriteria/{criteriaId}` | Update criteria |
| DELETE | `/v1/provisioningcriteria/{criteriaId}` | Delete criteria |

---

## 3. CRUD Analysis

### Staff

| Operation  | Endpoint             | Notes                                                       |
| ---------- | -------------------- | ----------------------------------------------------------- |
| **List**   | `GET /v1/staff`      | Filter by office, loanOfficer status, active/inactive/all   |
| **Detail** | `GET /v1/staff/{id}` | With optional template for allowed offices                  |
| **Create** | `POST /v1/staff`     | Requires officeId, firstname, lastname                      |
| **Update** | `PUT /v1/staff/{id}` | ForceStatus flag required if deactivating with associations |
| **Delete** | ❌                   | No delete endpoint                                          |

### Holidays

| Operation    | Endpoint                         | Notes                                          |
| ------------ | -------------------------------- | ---------------------------------------------- |
| **List**     | `GET /v1/holidays`               | Filter by officeId, date range                 |
| **Detail**   | `GET /v1/holidays/{id}`          |                                                |
| **Template** | `GET /v1/holidays/template`      | Reschedule type options                        |
| **Create**   | `POST /v1/holidays`              | Requires name, fromDate, toDate, offices       |
| **Update**   | `PUT /v1/holidays/{id}`          | Only name/description editable in ACTIVE state |
| **Delete**   | `DELETE /v1/holidays/{id}`       | Soft-delete (status=DELETED)                   |
| **Activate** | `POST .../{id}?command=activate` | Transitions from PENDING to ACTIVE             |

### Currencies

| Operation  | Endpoint             | Notes                                          |
| ---------- | -------------------- | ---------------------------------------------- |
| **List**   | `GET /v1/currencies` | Returns both selected and available currencies |
| **Update** | `PUT /v1/currencies` | Full-replace strategy; validates not in use    |

### Funds

| Operation  | Endpoint             | Notes              |
| ---------- | -------------------- | ------------------ |
| **List**   | `GET /v1/funds`      |                    |
| **Detail** | `GET /v1/funds/{id}` |                    |
| **Create** | `POST /v1/funds`     | Requires name      |
| **Update** | `PUT /v1/funds/{id}` |                    |
| **Delete** | ❌                   | No delete endpoint |

### Payment Types

| Operation  | Endpoint                       | Notes                                   |
| ---------- | ------------------------------ | --------------------------------------- |
| **List**   | `GET /v1/paymenttypes`         | `?onlyWithCode=true` for system-defined |
| **Detail** | `GET /v1/paymenttypes/{id}`    |                                         |
| **Create** | `POST /v1/paymenttypes`        | Requires name                           |
| **Update** | `PUT /v1/paymenttypes/{id}`    |                                         |
| **Delete** | `DELETE /v1/paymenttypes/{id}` | Fails if referenced by transactions     |

### Tellers

| Operation            | Endpoint                                               | Notes                                      |
| -------------------- | ------------------------------------------------------ | ------------------------------------------ |
| **List**             | `GET /v1/tellers`                                      | Filter by officeId                         |
| **Detail**           | `GET /v1/tellers/{id}`                                 |                                            |
| **Create**           | `POST /v1/tellers`                                     | Requires name, officeId, startDate, status |
| **Update**           | `PUT /v1/tellers/{id}`                                 |                                            |
| **Delete**           | `DELETE /v1/tellers/{id}`                              | Fails if has transactions or cashiers      |
| **List Cashiers**    | `GET .../{id}/cashiers`                                | Filter by date range                       |
| **Allocate Cashier** | `POST .../{id}/cashiers`                               | Staff + teller + date range                |
| **Cash In/Out**      | `POST .../{id}/cashiers/{cid}/allocate` / `.../settle` | Creates accounting journal entries         |

### Working Days

| Operation    | Endpoint                       | Notes                   |
| ------------ | ------------------------------ | ----------------------- |
| **List**     | `GET /v1/workingdays`          |                         |
| **Template** | `GET /v1/workingdays/template` | Reschedule type options |
| **Update**   | `PUT /v1/workingdays`          | Single row config       |

### Adhoc Queries

| Operation    | Endpoint                      | Notes                  |
| ------------ | ----------------------------- | ---------------------- |
| **List**     | `GET /v1/adhocquery`          |                        |
| **Detail**   | `GET /v1/adhocquery/{id}`     |                        |
| **Template** | `GET /v1/adhocquery/template` | Report run frequencies |
| **Create**   | `POST /v1/adhocquery`         | Requires name, query   |
| **Update**   | `PUT /v1/adhocquery/{id}`     |                        |
| **Delete**   | `DELETE /v1/adhocquery/{id}`  |                        |

---

## 4. Create Workflow (Highest Priority)

### Create Staff

| Field           | Required | Type        | Validation                     | Source         |
| --------------- | -------- | ----------- | ------------------------------ | -------------- |
| `officeId`      | ✅       | Long        | Must reference existing office | `GET /offices` |
| `firstname`     | ✅       | string(50)  | Not blank                      | User           |
| `lastname`      | ✅       | string(50)  | Not blank                      | User           |
| `isLoanOfficer` | ❌       | boolean     | Default false                  | Toggle         |
| `isActive`      | ❌       | boolean     | Default true                   | Toggle         |
| `joiningDate`   | ❌       | date        | Valid date                     | Date picker    |
| `externalId`    | ❌       | string(100) | Unique                         | User           |
| `mobileNo`      | ❌       | string      | Regex `^\+?[0-9]{7,15}$`       | User           |
| `emailAddress`  | ❌       | string(50)  | Unique                         | User           |

Display name auto-generated as `lastname + ", " + firstname`.

### Create Holiday

| Field                     | Required | Type        | Validation                                   | Source         |
| ------------------------- | -------- | ----------- | -------------------------------------------- | -------------- |
| `name`                    | ✅       | string(100) | Unique                                       | User           |
| `description`             | ❌       | string(100) |                                              | User           |
| `fromDate`                | ✅       | date        | Must be before toDate                        | Date picker    |
| `toDate`                  | ✅       | date        | Must be after fromDate                       | Date picker    |
| `repaymentsRescheduledTo` | ❌       | date        | Within 30 days of range; must be working day | Date picker    |
| `reschedulingType`        | ❌       | int         | 1=NextRepDate, 2=SpecificDate (default)      | Dropdown       |
| `offices`                 | ✅       | Long[]      | Must reference existing offices              | `GET /offices` |

### Create Teller

| Field             | Required | Type        | Validation                                        | Source            |
| ----------------- | -------- | ----------- | ------------------------------------------------- | ----------------- |
| `name`            | ✅       | string(100) | Not blank, unique                                 | User              |
| `officeId`        | ✅       | Long        | Must exist                                        | `GET /offices`    |
| `description`     | ❌       | string(500) |                                                   | User              |
| `startDate`       | ✅       | date        |                                                   | Date picker       |
| `endDate`         | ❌       | date        | After startDate                                   | Date picker       |
| `status`          | ✅       | int         | 100=PENDING, 300=ACTIVE, 400=INACTIVE, 600=CLOSED | Dropdown          |
| `debitAccountId`  | ❌       | Long        | GL account                                        | `GET /glaccounts` |
| `creditAccountId` | ❌       | Long        | GL account                                        | `GET /glaccounts` |

### Allocate Cashier to Teller

| Field         | Required | Type        | Validation                                | Source       |
| ------------- | -------- | ----------- | ----------------------------------------- | ------------ |
| `staffId`     | ✅       | Long        | Must exist, unique per teller             | `GET /staff` |
| `description` | ❌       | string(500) |                                           | User         |
| `startDate`   | ✅       | date        | Within teller date range                  | Date picker  |
| `endDate`     | ✅       | date        | Within teller date range, after startDate | Date picker  |
| `isFullDay`   | ❌       | boolean     | Default null                              | Toggle       |
| `startTime`   | ❌       | string(10)  | HH:MM format                              | Time picker  |
| `endTime`     | ❌       | string(10)  | HH:MM format                              | Time picker  |

### Create Fund

| Field        | Required | Type        | Validation        | Source |
| ------------ | -------- | ----------- | ----------------- | ------ |
| `name`       | ✅       | string(255) | Not blank, unique | User   |
| `externalId` | ❌       | string(100) | Unique            | User   |

### Create Payment Type

| Field             | Required | Type        | Validation                    | Source |
| ----------------- | -------- | ----------- | ----------------------------- | ------ |
| `name`            | ✅       | string(100) | Not blank                     | User   |
| `description`     | ❌       | string(500) |                               | User   |
| `isCashPayment`   | ❌       | boolean     | Default false                 | Toggle |
| `position`        | ❌       | int         | Display ordering, default 0   | User   |
| `codeName`        | ❌       | string(100) | System-defined reference code | User   |
| `isSystemDefined` | ❌       | boolean     | Default false                 | Toggle |

### Update Currencies

| Field        | Required | Type     | Validation                       | Source                                |
| ------------ | -------- | -------- | -------------------------------- | ------------------------------------- |
| `currencies` | ✅       | String[] | Must be valid ISO currency codes | `GET /currencies` → `currencyOptions` |

### Update Working Days

| Field                               | Required | Type    | Validation                                                                          | Source   |
| ----------------------------------- | -------- | ------- | ----------------------------------------------------------------------------------- | -------- |
| `recurrence`                        | ✅       | string  | Valid RRULE (e.g. `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`)                               | User     |
| `repaymentRescheduleType`           | ✅       | int     | 1-5 (SameDay, NextWorkingDay, NextMeetingDay, PrevWorkingDay, NextRepaymentMeeting) | Dropdown |
| `extendTermForDailyRepayments`      | ❌       | boolean | Default false                                                                       | Toggle   |
| `extendTermForRepaymentsOnHolidays` | ❌       | boolean | Default false                                                                       | Toggle   |

### Create Adhoc Query

| Field                | Required | Type         | Validation                                       | Source   |
| -------------------- | -------- | ------------ | ------------------------------------------------ | -------- |
| `name`               | ✅       | string(100)  | Not blank                                        | User     |
| `query`              | ✅       | string(2000) | SQL query                                        | User     |
| `tableName`          | ❌       | string(100)  |                                                  | User     |
| `tableFields`        | ❌       | string(1000) |                                                  | User     |
| `email`              | ❌       | string(500)  |                                                  | User     |
| `reportRunFrequency` | ❌       | int          | 1=Daily, 2=Weekly, 3=Monthly, 4=Yearly, 5=Custom | Dropdown |
| `reportRunEvery`     | ❌       | int          | Run interval                                     | User     |
| `isActive`           | ❌       | boolean      | Default false                                    | Toggle   |

---

## 5. Lookup APIs

| UI Field                  | Endpoint                                         | Display                | Value  | Required For             |
| ------------------------- | ------------------------------------------------ | ---------------------- | ------ | ------------------------ |
| Office                    | `GET /v1/offices`                                | `nameDecorated`        | `id`   | Staff, Tellers, Holidays |
| Staff                     | `GET /v1/staff?officeId=X`                       | `displayName`          | `id`   | Cashier Allocation       |
| GL Account (debit/credit) | `GET /v1/glaccounts`                             | Account name + GL code | `id`   | Tellers (optional)       |
| Currency                  | `GET /v1/currencies` → `currencyOptions`         | `name` + `code`        | `code` | Update Currencies        |
| Currency (selected)       | `GET /v1/currencies` → `selectedCurrencyOptions` | `displayLabel`         | `code` | Form display             |
| Reschedule Type           | `GET /v1/holidays/template`                      | Type name              | `id`   | Holidays                 |
| Reschedule Type           | `GET /v1/workingdays/template`                   | Type name              | `id`   | Working Days             |
| Report Run Frequency      | `GET /v1/adhocquery/template`                    | Frequency name         | `id`   | Adhoc Queries            |
| Tellers (for cashier)     | `GET /v1/tellers`                                | `name`                 | `id`   | Cashier template         |
| Provisioning Categories   | `GET /v1/provisioningcategory`                   | Category name          | `id`   | Provisioning Criteria    |

---

## 6. API Call Order

### Create Staff

```
1. GET /v1/offices                                          → load office dropdown
2. Fill form (officeId, firstname, lastname, optional fields)
3. POST /v1/staff                                           → create
```

### Create Holiday

```
1. GET /v1/holidays/template                                → reschedule type options
2. GET /v1/offices                                          → load office checkboxes
3. Fill form (name, fromDate, toDate, reschedule details, offices)
4. POST /v1/holidays                                        → create (status=PENDING)
5. (Later) POST /v1/holidays/{id}?command=activate          → activate
```

### Create Teller + Allocate Cashier

```
1. GET /v1/offices                                          → load office dropdown
2. GET /v1/glaccounts                                       → load debit/credit account options
3. POST /v1/tellers                                         → create teller
4. GET /v1/staff?officeId=X                                 → load staff for cashier dropdown
5. POST /v1/tellers/{id}/cashiers                           → allocate cashier
6. POST /v1/tellers/{id}/cashiers/{cid}/allocate            → allocate cash to cashier
```

### Update Currencies

```
1. GET /v1/currencies                                       → load selected + available currencies
2. Select/deselect currencies
3. PUT /v1/currencies                                       → full replace
```

### Update Working Days

```
1. GET /v1/workingdays                                      → current config
2. GET /v1/workingdays/template                             → reschedule type options
3. Fill form (recurrence RRULE, reschedule type, flags)
4. PUT /v1/workingdays                                      → update
```

---

## 7. Request Payload Analysis

### Create Staff (`POST /v1/staff`)

```json
{
  "officeId": 1,
  "firstname": "Jane",
  "lastname": "Doe",
  "isLoanOfficer": true,
  "isActive": true,
  "joiningDate": "01 January 2026",
  "mobileNo": "+254712345678",
  "emailAddress": "jane.doe@bank.com",
  "externalId": "EMP-001",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Update Staff (`PUT /v1/staff/{staffId}`)

```json
{
  "firstname": "Jane",
  "lastname": "Smith",
  "isActive": false,
  "forceStatus": true,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Create Holiday (`POST /v1/holidays`)

```json
{
  "name": "Christmas 2026",
  "description": "Christmas Day holiday",
  "fromDate": "25 December 2026",
  "toDate": "25 December 2026",
  "repaymentsRescheduledTo": "24 December 2026",
  "reschedulingType": 2,
  "offices": [1, 2, 3],
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### Create Teller (`POST /v1/tellers`)

```json
{
  "name": "Main Counter",
  "officeId": 1,
  "description": "Main branch teller counter",
  "startDate": "01 January 2026",
  "endDate": "31 December 2026",
  "status": 300,
  "debitAccountId": 10,
  "creditAccountId": 20,
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### Allocate Cashier (`POST /v1/tellers/{tellerId}/cashiers`)

```json
{
  "staffId": 5,
  "description": "Morning shift",
  "startDate": "01 January 2026",
  "endDate": "30 June 2026",
  "isFullDay": false,
  "startTime": "08:00",
  "endTime": "12:00",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### Allocate Cash to Cashier (`POST /v1/tellers/{tellerId}/cashiers/{cashierId}/allocate`)

```json
{
  "txnAmount": 50000.0,
  "txnNote": "Initial cash float",
  "currencyCode": "USD",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### Create Fund (`POST /v1/funds`)

```json
{
  "name": "World Bank Loan Facility",
  "externalId": "WB-2026-01"
}
```

### Create Payment Type (`POST /v1/paymenttypes`)

```json
{
  "name": "Mobile Money",
  "description": "M-PESA mobile payment",
  "isCashPayment": false,
  "position": 5,
  "codeName": "mobile_money",
  "isSystemDefined": false
}
```

### Update Currencies (`PUT /v1/currencies`)

```json
{
  "currencies": ["USD", "EUR", "KES", "GBP"]
}
```

### Update Working Days (`PUT /v1/workingdays`)

```json
{
  "recurrence": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  "repaymentRescheduleType": 2,
  "extendTermForDailyRepayments": false,
  "extendTermForRepaymentsOnHolidays": false
}
```

### Create Adhoc Query (`POST /v1/adhocquery`)

```json
{
  "name": "Active Loans by Officer",
  "query": "SELECT l.id, l.loan_no, c.display_name FROM m_loan l JOIN m_client c ON l.client_id = c.id WHERE l.loan_status = 200 AND l.loan_officer_id = ${loanOfficerId}",
  "tableName": "m_loan",
  "tableFields": "id, loan_no, display_name",
  "isActive": true,
  "reportRunFrequency": 2,
  "reportRunEvery": 1,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

---

## 8. Validation Rules

### Staff

| Rule                | Logic                                                      | Error                                   |
| ------------------- | ---------------------------------------------------------- | --------------------------------------- |
| Name required       | `firstname` + `lastname` not blank                         | Bean Validation                         |
| Office required     | `officeId` must reference existing office                  | `OfficeNotFoundException`               |
| Mobile format       | Regex `^\+?[0-9]{7,15}$`                                   | Bean Validation                         |
| Unique display name | `{lastname}, {firstname}` must be unique                   | `error.msg.staff.duplicate.displayName` |
| Unique external ID  | If provided                                                | `error.msg.staff.duplicate.externalId`  |
| Force status        | Deactivating with associations requires `forceStatus=true` | `StaffRoleException`                    |
| Org role hierarchy  | If role requires parent staff, parent must exist           | `StaffRoleException`                    |

### Holidays

| Rule               | Logic                                                  | Error                  |
| ------------------ | ------------------------------------------------------ | ---------------------- |
| Name required      | Not null, max 100                                      | Validation error       |
| Date order         | `toDate` >= `fromDate`                                 | `HolidayDateException` |
| Range restriction  | Rescheduled date within 30 days of holiday range       | `HolidayDateException` |
| Working day        | Rescheduled date must be working day                   | `HolidayDateException` |
| Active state guard | Cannot change fromDate/toDate/offices after activation | Entity validation      |
| Activation guard   | Must be in PENDING state to activate                   | Entity validation      |
| Delete guard       | Must not already be DELETED                            | Entity validation      |

### Tellers

| Rule               | Logic                                       | Error                                           |
| ------------------ | ------------------------------------------- | ----------------------------------------------- |
| Name unique        | Unique across all tellers                   | Data integrity                                  |
| Office required    | Must reference existing office              | Entity validation                               |
| Cashier date range | Must be within teller date range            | `CashierDateRangeOutOfTellerDateRangeException` |
| Cashier uniqueness | Staff can only be allocated once per teller | `CashierAlreadyAllocated`                       |
| Delete protection  | Cannot delete if has transactions/cashiers  | `CashierExistForTellerException`                |
| Cash allocation    | Sufficient cash for settlements             | `CashierInsufficientAmountException`            |

### Currencies

| Rule                  | Logic                                                    | Error                    |
| --------------------- | -------------------------------------------------------- | ------------------------ |
| At least one selected | `currencies` not empty                                   | Bean Validation          |
| Currency in use       | Cannot remove currency referenced by products or charges | `CurrencyInUseException` |

### Working Days

| Rule                  | Logic                                  | Error            |
| --------------------- | -------------------------------------- | ---------------- |
| Valid RRULE           | Recurrence must be parseable by iCal4j | `ParseException` |
| Valid reschedule type | Must be 1-5                            | Validation error |

### Payment Types

| Rule               | Logic                                       | Error             |
| ------------------ | ------------------------------------------- | ----------------- |
| Name required      | Not blank                                   | Bean Validation   |
| Description length | Max 500                                     | Bean Validation   |
| Delete protection  | Cannot delete if referenced by transactions | Data integrity    |
| Position           | Non-negative                                | `@PositiveOrZero` |

### Funds

| Rule          | Logic              | Error                           |
| ------------- | ------------------ | ------------------------------- |
| Name required | Not blank, max 255 | Validation error                |
| Unique name   |                    | `error.msg.fund.duplicate.name` |

---

## 9. Business Flow

### Create Staff

```
StaffApiResource.createStaff(request)
  ↓
StaffCreateCommandHandler
  ↓
StaffWriteServiceImpl.createStaff(request)
  ├── StaffCreateRequestMapper maps request to Staff entity
  ├── displayName = lastname + ", " + firstname
  ├── StaffRepository.save()
  └── Return StaffCreateResponse(resourceId)
```

### Deactivate Staff with Associations

```
StaffApiResource.updateStaff(staffId, request)
  ↓
StaffUpdateCommandHandler
  ↓
StaffWriteServiceImpl.updateStaff(request)
  ├── If isActive=false:
  │   ├── StaffReadService.hasAssociatedItems(staffId)
  │   ├── If associations exist AND forceStatus != true:
  │   │   └── throw StaffRoleException("Force status rule not satisfied")
  │   └── If forceStatus=true → proceed
  ├── Update fields
  ├── Handle image changes via StaffImageIdAdapter
  └── Return StaffUpdateResponse
```

### Create and Activate Holiday

```
HolidaysApiResource.createHoliday(command)
  ↓
HolidayDataValidator.validateForCreate()
  ↓
CreateHolidayCommandHandler
  ↓
HolidayWritePlatformServiceJpaRepositoryImpl.createHoliday(command)
  ├── validateInputDates(fromDate, toDate, rescheduledDate)
  ├── Build Holiday entity + set status = PENDING (100)
  ├── Set offices (ManyToMany)
  └── HolidayRepository.save()

Later:
POST /v1/holidays/{id}?command=activate
  ↓
ActivateHolidayCommandHandler
  ↓
Holiday.activate() → status = ACTIVE (300)
  ↓
HolidayRepository.save()
```

### Allocate Cashier to Teller

```
POST /v1/tellers/{tellerId}/cashiers
  ↓
AllocateCashierToTellerCommandHandler
  ↓
TellerWritePlatformServiceJpaImpl.allocateCashierToTeller(tellerId, command)
  ├── Validate teller exists
  ├── Validate date range within teller date range
  ├── Validate staff not already allocated
  ├── Build Cashier entity (staff + teller + date range)
  └── CashierRepository.save()
```

### Allocate Cash to Cashier

```
POST /v1/tellers/{tellerId}/cashiers/{cashierId}/allocate
  ↓
AllocateCashToCashierCommandHandler
  ↓
TellerWritePlatformServiceJpaImpl.allocateCashToCashier(cashierId, command)
  ├── Validate cashier exists
  ├── Create CashierTransaction (txnType=ALLOCATE=101)
  ├── Create accounting journal entries:
  │   ├── Debit: teller.debitAccount (CASH_AT_TELLER)
  │   └── Credit: teller.creditAccount (CASH_AT_MAINVAULT)
  └── Return result
```

### Settle Cash from Cashier

```
POST /v1/tellers/{tellerId}/cashiers/{cashierId}/settle
  ↓
SettleCashFromCashierCommandHandler
  ↓
TellerWritePlatformServiceJpaImpl.settleCashFromCashier(cashierId, command)
  ├── Validate cashier exists
  ├── Validate sufficient cash available (check sum of ALLOCATE - sum of SETTLE >= txnAmount)
  ├── Create CashierTransaction (txnType=SETTLE=102)
  ├── Create accounting journal entries:
  │   ├── Debit: teller.creditAccount (CASH_AT_MAINVAULT)
  │   └── Credit: teller.debitAccount (CASH_AT_TELLER)
  └── Return result
```

### Update Currencies

```
PUT /v1/currencies
  ↓
CurrencyUpdateCommandHandler
  ↓
CurrencyWritePlatformServiceJpaRepositoryImpl.updateAllowedCurrencies(request)
  ├── Clear all existing OrganisationCurrency entries
  ├── For each currency code in request:
  │   ├── Lookup ApplicationCurrency (m_currency)
  │   ├── Check if in use by LoanProduct, SavingsProduct, or Charge
  │   └── Create OrganisationCurrency entry
  ├── Cache eviction
  └── Return CurrencyUpdateResponse
```

### Working Days Integration

```
WorkingDaysUtil.isWorkingDay(date, workingDays)
  ├── Parse recurrence RRULE
  ├── Check if date matches pattern
  └── Return boolean

WorkingDaysUtil.getRepaymentRescheduleDate(repaymentDate, holidays, workingDays)
  ├── If date is not a working day:
  │   ├── MOVE_TO_NEXT_WORKING_DAY → find next date in recurrence
  │   ├── MOVE_TO_PREVIOUS_WORKING_DAY → find previous date in recurrence
  │   └── MOVE_TO_NEXT_REPAYMENT_MEETING_DAY → find next meeting date
  └── Return adjusted date
```

---

## 10. Related Operations

| Operation                               | Description                                                       | Sub-Feature  |
| --------------------------------------- | ----------------------------------------------------------------- | ------------ |
| Staff list by office                    | `GET /v1/staff?officeId=X`                                        | Staff        |
| Holiday check on loan repayment         | `HolidayUtil.isHoliday(date, holidays)`                           | Holidays     |
| Holiday-affected repayment rescheduling | `HolidayUtil.getRepaymentRescheduleDateToIfHoliday()`             | Holidays     |
| Working day check                       | `WorkingDaysUtil.isWorkingDay()`                                  | Working Days |
| Cashier journal entries                 | Auto-created GL entries on cash allocation/settlement             | Tellers      |
| Bulk staff import                       | `GET /v1/staff/downloadtemplate`, `POST /v1/staff/uploadtemplate` | Staff        |
| GL Accounts for tellers                 | `GET /v1/glaccounts` for debit/credit account selection           | Tellers      |
| Provisioning entries                    | Auto-calculated based on provisioning criteria                    | Provisioning |

---

## 11. Hidden Dependencies

| Dependency                                                           | Impact                                                                                 | Sub-Feature   |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------- |
| **Staff display_name generated as `lastname, firstname`**            | Auto-computed; must be unique                                                          | Staff         |
| **Staff mobile_no is NOT NULL in DB**                                | Field is required at DB level but optional in API — migration needed for existing data | Staff         |
| **Force status flag for deactivation**                               | Silently fails if deactivating staff with associations without `forceStatus=true`      | Staff         |
| **Holiday date range constraints**                                   | 30-day range limit on rescheduled date                                                 | Holidays      |
| **Holiday rescheduled date must be working day**                     | Requires WorkingDays configuration to exist                                            | Holidays      |
| **No holiday delete — only soft-delete**                             | UI must show deleted holidays differently                                              | Holidays      |
| **Currency update is full replace**                                  | All existing `m_organisation_currency` rows are deleted and recreated                  | Currencies    |
| **Currency in-use check across LoanProduct, SavingsProduct, Charge** | Removing a currency in use throws error                                                | Currencies    |
| **Teller debit/credit accounts linked to GL**                        | Cash allocation/settlement creates actual accounting entries                           | Tellers       |
| **Cashier date range must be within teller date range**              | Invalid dates rejected                                                                 | Tellers       |
| **Working Days is single-row config**                                | No create/delete — only read and update                                                | Working Days  |
| **RRULE validation**                                                 | Invalid recurrence pattern causes `ParseException`                                     | Working Days  |
| **Payment type codeName for system-defined types**                   | Used for internal reference (chargeback, refund)                                       | Payment Types |
| **Payment type position field**                                      | Controls display order in dropdowns                                                    | Payment Types |
| **Fund referenced by loan**                                          | Cannot delete fund (no endpoint), but loans reference `fund_id`                        | Funds         |
| **Adhoc query SQL execution**                                        | Queries use `${param}` placeholders similar to Reports                                 | Adhoc Queries |

---

## 12. Implementation Checklist

### Staff

- [ ] Staff list (`GET /v1/staff`) with filters (officeId, loanOfficersOnly, status)
- [ ] Staff detail (`GET /v1/staff/{id}`) with optional template
- [ ] Create staff (`POST /v1/staff`)
- [ ] Update staff (`PUT /v1/staff/{id}`)
- [ ] Force status confirmation dialog on deactivation with associations
- [ ] Office dropdown for staff form

### Holidays

- [ ] Holiday list (`GET /v1/holidays`) with date range and office filters
- [ ] Holiday detail (`GET /v1/holidays/{id}`)
- [ ] Holiday template (`GET /v1/holidays/template`)
- [ ] Create holiday (`POST /v1/holidays`)
- [ ] Update holiday (`PUT /v1/holidays/{id}`)
- [ ] Delete (soft) holiday (`DELETE /v1/holidays/{id}`)
- [ ] Activate holiday (`POST /v1/holidays/{id}?command=activate`)
- [ ] Status badge (Pending/Active/Deleted)
- [ ] Office multi-select in holiday form

### Currencies

- [ ] Currency configuration (`GET /v1/currencies`)
- [ ] Update currencies (`PUT /v1/currencies`)
- [ ] Dual list / checkbox UI for selected vs available currencies
- [ ] Handle currency in-use error on update

### Funds

- [ ] Fund list (`GET /v1/funds`)
- [ ] Fund detail (`GET /v1/funds/{id}`)
- [ ] Create fund (`POST /v1/funds`)
- [ ] Update fund (`PUT /v1/funds/{id}`)

### Payment Types

- [ ] Payment type list (`GET /v1/paymenttypes`)
- [ ] Payment type detail (`GET /v1/paymenttypes/{id}`)
- [ ] Create payment type (`POST /v1/paymenttypes`)
- [ ] Update payment type (`PUT /v1/paymenttypes/{id}`)
- [ ] Delete payment type (`DELETE /v1/paymenttypes/{id}`)
- [ ] Position field for display ordering
- [ ] System-defined badge for types with codeName

### Tellers

- [ ] Teller list (`GET /v1/tellers`) with office filter
- [ ] Teller detail (`GET /v1/tellers/{id}`)
- [ ] Create teller (`POST /v1/tellers`)
- [ ] Update teller (`PUT /v1/tellers/{id}`)
- [ ] Delete teller (`DELETE /v1/tellers/{id}`)
- [ ] Teller status badge (Pending/Active/Inactive/Closed)
- [ ] Cashier list per teller (`GET .../cashiers`) with date range
- [ ] Cashier template (`GET .../cashiers/template`)
- [ ] Allocate cashier (`POST .../cashiers`)
- [ ] Update cashier (`PUT .../{tellerId}/cashiers/{cashierId}`)
- [ ] Delete cashier (`DELETE .../{tellerId}/cashiers/{cashierId}`)
- [ ] Allocate cash (`POST .../{tellerId}/cashiers/{cashierId}/allocate`)
- [ ] Settle cash (`POST .../{tellerId}/cashiers/{cashierId}/settle`)
- [ ] Cashier transactions list (`GET .../transactions`)
- [ ] Cashier transactions with summary (`GET .../summaryandtransactions`)
- [ ] Teller transactions list (`GET .../transactions`)
- [ ] Teller journals list (`GET .../journals`)

### Cashiers

- [ ] Cashier list (`GET /v1/cashiers`) with office/teller/staff/date filters

### Working Days

- [ ] Working days config view (`GET /v1/workingdays`)
- [ ] Working days template (`GET /v1/workingdays/template`)
- [ ] Update working days (`PUT /v1/workingdays`)
- [ ] RRULE builder UI (multi-select weekdays)
- [ ] Repayment reschedule type dropdown

### Adhoc Queries

- [ ] Adhoc query list (`GET /v1/adhocquery`)
- [ ] Adhoc query detail (`GET /v1/adhocquery/{id}`)
- [ ] Adhoc query template (`GET /v1/adhocquery/template`)
- [ ] Create adhoc query (`POST /v1/adhocquery`)
- [ ] Update adhoc query (`PUT /v1/adhocquery/{id}`)
- [ ] Delete adhoc query (`DELETE /v1/adhocquery/{id}`)
- [ ] SQL editor field with parameter validation
- [ ] Schedule configuration (frequency + interval)

### Error Handling

- [ ] Staff force status guard on deactivation
- [ ] Holiday date range validation errors
- [ ] Currency in-use removal rejection
- [ ] Cashier date range vs teller date range validation
- [ ] Cashier insufficient amount on settlements
- [ ] Cashier duplicate allocation
- [ ] Payment type delete protection
- [ ] RRULE parse errors on working days update
