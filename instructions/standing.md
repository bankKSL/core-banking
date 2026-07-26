# Standing Instructions — React Implementation Guide

Source: Apache Fineract Portfolio Account Feature  
Trace Date: 2026-07-26  
Java Base: `org.apache.fineract.portfolio.account`

---

## 1. Feature Overview

Standing Instructions automate recurring transfers between accounts. A scheduled batch job executes eligible instructions daily.

### Transfer Directions

| Direction         | transferType         | fromAccountType | toAccountType | Description                           |
| ----------------- | -------------------- | --------------- | ------------- | ------------------------------------- |
| Savings → Savings | 1 (ACCOUNT_TRANSFER) | 1               | 1             | Regular account-to-account transfer   |
| Savings → Loan    | 2 (LOAN_REPAYMENT)   | 1               | 2             | Automatic loan repayment from savings |
| Loan → Savings    | 2 (LOAN_REPAYMENT)   | 2               | 1             | Sweep loan proceeds to savings        |

### Instruction Types

| Type      | Value | Behavior                                                             |
| --------- | ----- | -------------------------------------------------------------------- |
| **FIXED** | 1     | Transfers a fixed `amount` each time                                 |
| **DUES**  | 2     | Transfers outstanding loan dues (calculated from repayment schedule) |

### Recurrence Types

| Type            | Value | Behavior                                          |
| --------------- | ----- | ------------------------------------------------- |
| **PERIODIC**    | 1     | Fires on a schedule (daily/weekly/monthly/yearly) |
| **AS_PER_DUES** | 2     | Fires whenever loan has outstanding dues          |

### Statuses

| Status   | Value | Meaning                                           |
| -------- | ----- | ------------------------------------------------- |
| ACTIVE   | 1     | Eligible for execution                            |
| DISABLED | 2     | Paused, not executed                              |
| DELETED  | 3     | Soft-deleted (name suffixed with `_deleted_{id}`) |

### Priority Levels

| Priority | Value |
| -------- | ----- |
| URGENT   | 1     |
| HIGH     | 2     |
| MEDIUM   | 3     |
| LOW      | 4     |

### Entity Relationship

```
AccountTransferStandingInstruction (m_account_transfer_standing_instructions)
  ├── name (unique)
  ├── priority (1-4)
  ├── instructionType (FIXED/DUES)
  ├── status (ACTIVE/DISABLED/DELETED)
  ├── amount (null for DUES)
  ├── validFrom, validTill
  ├── recurrenceType (PERIODIC/AS_PER_DUES)
  ├── recurrenceFrequency (Days/Weeks/Months/Years)
  ├── recurrenceInterval, recurrenceOnDay, recurrenceOnMonth
  ├── lastRunDate
  └── @ManyToOne → AccountTransferDetails (m_account_transfer_details)
                        ├── fromOffice → Office
                        ├── fromClient → Client
                        ├── fromSavingsAccount / fromLoanAccount
                        ├── toOffice → Office
                        ├── toClient → Client
                        ├── toSavingsAccount / toLoanAccount
                        └── transferType

m_account_transfer_standing_instructions_history
  ├── standing_instruction_id (FK)
  ├── status (success/failed)
  ├── amount
  ├── execution_time
  └── error_log
```

---

## 2. API Inventory

### Standing Instructions (`/v1/standinginstructions`)

| Method | URL                                            | Description                                         | Permission                 |
| ------ | ---------------------------------------------- | --------------------------------------------------- | -------------------------- |
| GET    | `/v1/standinginstructions/template`            | Template with all dropdown options                  | READ_STANDINGINSTRUCTION   |
| GET    | `/v1/standinginstructions`                     | List (paginated, filterable)                        | READ_STANDINGINSTRUCTION   |
| GET    | `/v1/standinginstructions/{id}`                | Single instruction detail (+ optional associations) | READ_STANDINGINSTRUCTION   |
| POST   | `/v1/standinginstructions`                     | Create standing instruction                         | CREATE_STANDINGINSTRUCTION |
| PUT    | `/v1/standinginstructions/{id}?command=update` | Update instruction                                  | UPDATE_STANDINGINSTRUCTION |
| PUT    | `/v1/standinginstructions/{id}?command=delete` | Soft-delete instruction                             | DELETE_STANDINGINSTRUCTION |

### Query Parameters for List

| Param             | Type    | Description                                       |
| ----------------- | ------- | ------------------------------------------------- |
| `clientId`        | Long    | Filter by source client                           |
| `clientName`      | String  | Filter by source client name                      |
| `fromAccountId`   | Long    | Filter by source account                          |
| `fromAccountType` | Integer | Filter by source account type (1=Savings, 2=Loan) |
| `transferType`    | Integer | Filter by transfer type                           |
| `externalId`      | String  | Filter by external ID                             |
| `offset`          | Integer | Pagination offset                                 |
| `limit`           | Integer | Pagination limit                                  |
| `orderBy`         | String  | Sort field                                        |
| `sortOrder`       | String  | ASC / DESC                                        |

### Associations for Detail

| Association                  | Description                              |
| ---------------------------- | ---------------------------------------- |
| `?associations=transactions` | Include linked transfer transactions     |
| `?associations=template`     | Include template dropdown options inline |
| `?associations=all`          | Both                                     |

### Standing Instructions History (`/v1/standinginstructionrunhistory`)

| Method | URL                                 | Description                     | Permission               |
| ------ | ----------------------------------- | ------------------------------- | ------------------------ |
| GET    | `/v1/standinginstructionrunhistory` | Paginated execution history log | READ_STANDINGINSTRUCTION |

### History Query Parameters

| Param              | Type    | Description                   |
| ------------------ | ------- | ----------------------------- |
| `clientId`         | Long    | Filter by source client       |
| `fromAccountId`    | Long    | Filter by source account      |
| `fromAccountType`  | Integer | Filter by source account type |
| `transferType`     | Integer | Filter by transfer type       |
| `fromDate`         | String  | Start of execution date range |
| `toDate`           | String  | End of execution date range   |
| `offset` / `limit` | Integer | Pagination                    |

---

## 3. CRUD Analysis

| Operation    | Endpoint                                           | Notes                                                                         |
| ------------ | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Template** | `GET /v1/standinginstructions/template`            | Returns all dropdown options; supports progressive filtering via query params |
| **List**     | `GET /v1/standinginstructions`                     | Paginated with multi-field filter                                             |
| **Detail**   | `GET /v1/standinginstructions/{id}`                | With optional `associations=transactions\|template\|all`                      |
| **Create**   | `POST /v1/standinginstructions`                    | Validates account types, transfer rules, recurrence                           |
| **Update**   | `PUT /v1/standinginstructions/{id}?command=update` | Cannot change from/to accounts or transfer type; rejected if DELETED          |
| **Delete**   | `PUT /v1/standinginstructions/{id}?command=delete` | Soft-delete: status=3, name renamed                                           |
| **History**  | `GET /v1/standinginstructionrunhistory`            | Read-only execution audit log                                                 |

No missing operations.

---

## 4. Create Workflow (Highest Priority)

### Progressive Form Dependencies

```
Load Template (all enums + initial office lists)
  ↓
Select From Office
  ↓  GET .../template?fromOfficeId=X
Select From Client
  ↓  GET .../template?fromOfficeId=X&fromClientId=Y
Select From Account Type (Savings/Loan)
  ↓  GET .../template?...&fromAccountType=Z
Select From Account
  ↓  GET .../template?...&fromAccountId=A
Select To Office
  ↓  GET .../template?...&toOfficeId=B
Select To Client
  ↓  GET .../template?...&toClientId=C
Select To Account Type (Savings/Loan)
  ↓  GET .../template?...&toAccountType=D
Select To Account
  ↓
Fill remaining fields (name, amount, dates, recurrence, priority, etc.)
  ↓
POST /v1/standinginstructions
```

### Create Field Table

| Field                  | Type       | Required                    | Validation                                             | Source                                    |
| ---------------------- | ---------- | --------------------------- | ------------------------------------------------------ | ----------------------------------------- |
| `name`                 | String     | **Yes**                     | Not blank; unique across all instructions              | User                                      |
| `fromOfficeId`         | Long       | **Yes**                     | Must reference existing Office                         | `GET .../template` → `fromOfficeOptions`  |
| `fromClientId`         | Long       | **Yes**                     | Must reference existing Client under fromOffice        | `GET .../template` → `fromClientOptions`  |
| `fromAccountType`      | Integer    | **Yes**                     | 1=SAVINGS, 2=LOAN                                      | Dropdown                                  |
| `fromAccountId`        | Long       | **Yes**                     | Must reference existing account belonging to client    | `GET .../template` → `fromAccountOptions` |
| `toOfficeId`           | Long       | **Yes**                     | Must reference existing Office                         | `GET .../template` → `toOfficeOptions`    |
| `toClientId`           | Long       | **Yes**                     | Must reference existing Client under toOffice          | `GET .../template` → `toClientOptions`    |
| `toAccountType`        | Integer    | **Yes**                     | 1=SAVINGS, 2=LOAN                                      | Dropdown                                  |
| `toAccountId`          | Long       | **Yes**                     | Must reference existing account belonging to client    | `GET .../template` → `toAccountOptions`   |
| `transferType`         | Integer    | **Yes**                     | 1=ACCOUNT_TRANSFER, 2=LOAN_REPAYMENT, 3=CHARGE_PAYMENT | Dropdown                                  |
| `instructionType`      | Integer    | **Yes**                     | 1=FIXED, 2=DUES                                        | Dropdown                                  |
| `priority`             | Integer    | **Yes**                     | 1=URGENT, 2=HIGH, 3=MEDIUM, 4=LOW                      | Dropdown                                  |
| `status`               | Integer    | **Yes**                     | 1=ACTIVE, 2=DISABLED                                   | Dropdown                                  |
| `validFrom`            | Date       | **Yes**                     | Valid date (not in past enforced server-side)          | Date picker                               |
| `validTill`            | Date       | No                          | Must be after validFrom                                | Date picker                               |
| `amount`               | BigDecimal | **Yes** (if FIXED)          | Positive; must be null for DUES                        | User                                      |
| `recurrenceType`       | Integer    | **Yes**                     | 1=PERIODIC, 2=AS_PER_DUES                              | Dropdown                                  |
| `recurrenceFrequency`  | Integer    | **Yes** (if PERIODIC)       | 0=DAYS, 1=WEEKS, 2=MONTHS, 3=YEARS                     | Dropdown                                  |
| `recurrenceInterval`   | Integer    | **Yes** (if PERIODIC)       | Every N periods                                        | User                                      |
| `recurrenceOnMonthDay` | String     | **Yes** (if MONTHLY/YEARLY) | Format: `MM-dd`                                        | Date picker                               |
| `dateFormat`           | String     | **Yes**                     | e.g. `dd MMMM yyyy`                                    | Config                                    |
| `locale`               | String     | **Yes**                     | e.g. `en`                                              | Config                                    |
| `monthDayFormat`       | String     | No                          | e.g. `dd MMMM`                                         | Config                                    |

### Business Rules on Create

| Rule                     | Logic                                                          |
| ------------------------ | -------------------------------------------------------------- |
| Transfer direction       | Account Transfer (type 1) cannot involve a loan on either side |
| Loan Repayment direction | Must be Savings → Loan (fromLoan=null, toLoan!=null)           |
| Savings-to-Savings       | Must use instructionType=FIXED and recurrenceType=PERIODIC     |
| Fixed amount             | `amount` required when instructionType=FIXED                   |
| Dues amount              | `amount` must be null when instructionType=DUES                |

---

## 5. Lookup APIs

| UI Field             | Endpoint                                                                                      | Display                                            | Value         | Required |
| -------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------- | -------- |
| From Office          | `GET .../standinginstructions/template` → `fromOfficeOptions`                                 | `name`                                             | `id`          | Yes      |
| From Client          | `GET .../standinginstructions/template?fromOfficeId=` → `fromClientOptions`                   | `displayName`                                      | `id`          | Yes      |
| From Account Type    | Dropdown (static)                                                                             | Savings / Loan                                     | 1 / 2         | Yes      |
| From Account         | `GET .../standinginstructions/template?fromClientId=&fromAccountType=` → `fromAccountOptions` | `accountNo + productName`                          | `id`          | Yes      |
| To Office            | `GET .../standinginstructions/template` → `toOfficeOptions`                                   | `name`                                             | `id`          | Yes      |
| To Client            | `GET .../standinginstructions/template?toOfficeId=` → `toClientOptions`                       | `displayName`                                      | `id`          | Yes      |
| To Account Type      | Dropdown (static)                                                                             | Savings / Loan                                     | 1 / 2         | Yes      |
| To Account           | `GET .../standinginstructions/template?toClientId=&toAccountType=` → `toAccountOptions`       | `accountNo + productName`                          | `id`          | Yes      |
| Transfer Type        | `GET .../template` → `transferTypeOptions`                                                    | Account Transfer / Loan Repayment / Charge Payment | 1 / 2 / 3     | Yes      |
| Instruction Type     | `GET .../template` → `instructionTypeOptions`                                                 | Fixed / Dues                                       | 1 / 2         | Yes      |
| Priority             | `GET .../template` → `priorityOptions`                                                        | Urgent / High / Medium / Low                       | 1 / 2 / 3 / 4 | Yes      |
| Recurrence Type      | `GET .../template` → `recurrenceTypeOptions`                                                  | Periodic / As Per Dues                             | 1 / 2         | Yes      |
| Recurrence Frequency | `GET .../template` → `recurrenceFrequencyOptions`                                             | Days / Weeks / Months / Years                      | 0 / 1 / 2 / 3 | Yes      |
| Status               | `GET .../template` → `statusOptions`                                                          | Active / Disabled                                  | 1 / 2         | Yes      |

---

## 6. API Call Order

### Create Standing Instruction

```
1. GET .../standinginstructions/template
   └── Load offices, transfer types, instruction types, priorities, recurrence options, statuses

2. GET .../standinginstructions/template?fromOfficeId=X
   └── Load fromClientOptions filtered by office

3. GET .../standinginstructions/template?fromOfficeId=X&fromClientId=Y
   └── Load fromAccountOptions filtered by client
   └── Load toOfficeOptions

4. GET .../standinginstructions/template?fromOfficeId=X&fromClientId=Y&fromAccountType=Z&fromAccountId=A&toOfficeId=B
   └── Load toClientOptions filtered by to office

5. GET .../standinginstructions/template?...&toClientId=C
   └── Load toAccountOptions filtered by to client

6. Fill remaining form fields

7. POST /v1/standinginstructions
   └── Create instruction
```

### View Execution History

```
1. GET /v1/standinginstructionrunhistory?fromDate=&toDate=&clientId=&limit=50
   └── Paginated execution log
```

---

## 7. Request Payload Analysis

### Create Standing Instruction (`POST /v1/standinginstructions`)

```json
{
  "name": "Monthly Rent Collection",
  "fromOfficeId": 1,
  "fromClientId": 42,
  "fromAccountType": 1,
  "fromAccountId": 105,
  "toOfficeId": 1,
  "toClientId": 99,
  "toAccountType": 2,
  "toAccountId": 201,
  "transferType": 2,
  "instructionType": 1,
  "priority": 3,
  "status": 1,
  "validFrom": "01 January 2026",
  "validTill": "31 December 2026",
  "amount": 1500.0,
  "recurrenceType": 1,
  "recurrenceFrequency": 2,
  "recurrenceInterval": 1,
  "recurrenceOnMonthDay": "01",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en",
  "monthDayFormat": "dd"
}
```

### Update Standing Instruction (`PUT /v1/standinginstructions/{id}?command=update`)

```json
{
  "amount": 1750.0,
  "validTill": "30 June 2027",
  "priority": 2,
  "status": 1,
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### Delete Standing Instruction (`PUT /v1/standinginstructions/{id}?command=delete`)

No body required. Soft-deletes by setting status=3 and appending `_deleted_{id}` to name.

---

## 8. Validation Rules

### Create Validation (`StandingInstructionDataValidator.validateForCreate`)

| Field                  | Rule                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `name`                 | Not null                                                    |
| `status`               | Must be 1 (Active) or 2 (Disabled)                          |
| `validFrom`            | Required                                                    |
| `validTill`            | If provided, must be after validFrom                        |
| `amount`               | Required for FIXED; must be positive; must be null for DUES |
| `transferType`         | Must be 1, 2, or 3                                          |
| `priority`             | Must be 1, 2, 3, or 4                                       |
| `instructionType`      | Must be 1 (FIXED) or 2 (DUES)                               |
| `recurrenceType`       | Must be 1 (PERIODIC) or 2 (AS_PER_DUES)                     |
| `recurrenceFrequency`  | If provided, must be 0, 1, 2, or 3                          |
| `recurrenceOnMonthDay` | Required if Monthly/Yearly recurrence                       |

#### Business Rules

| Rule                     | Logic                                                                     | Error                                          |
| ------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------- |
| Transfer direction       | Account Transfer cannot involve loans                                     | Validation error                               |
| Loan Repayment direction | Must be Savings→Loan                                                      | Validation error                               |
| S2S constraint           | Savings-to-Savings requires FIXED + PERIODIC                              | Validation error                               |
| Unique name              | Name must not already exist in `m_account_transfer_standing_instructions` | `error.msg.standinginstruction.duplicate.name` |

### Update Validation (`StandingInstructionDataValidator.validateForUpdate`)

Same field-level rules, but only checks parameters that were supplied. `fromOfficeId`, `fromClientId`, `fromAccountType`, `fromAccountId`, `toOfficeId`, `toClientId`, `toAccountType`, `toAccountId`, and `transferType` cannot be changed.

### Entity Validation (`AccountTransferStandingInstruction.validateDependencies`)

| Rule                | Logic                                                          |
| ------------------- | -------------------------------------------------------------- |
| Date order          | validTill must be after validFrom                              |
| Periodic recurrence | Requires `recurrenceFrequency` + `recurrenceInterval`          |
| Monthly recurrence  | Requires `recurrenceOnDay` (1-31)                              |
| Yearly recurrence   | Requires `recurrenceOnDay` (1-31) + `recurrenceOnMonth` (1-12) |
| S2S                 | instructionType=1 and recurrenceType=1                         |
| Fixed amount        | amount must not be null                                        |

### Execution Validation (Batch Job)

| Rule               | Logic                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Eligibility        | status=1, today >= validFrom, (validTill IS NULL OR today < validTill), lastRunDate != today     |
| Periodic due check | `DefaultScheduledDateGenerator.isDateFallsInSchedule()` checks frequency + interval + start date |
| Dues due check     | Loan has at least one repayment due on or before today                                           |
| Sufficient balance | Source savings account must have enough balance for transfer                                     |

---

## 9. Business Flow

### Create Standing Instruction

```
StandingInstructionApiResource.createStandingInstruction()
  ↓
StandingInstructionDataValidator.validateForCreate(json)
  ↓
CreateStandingInstructionCommandHandler
  ↓
StandingInstructionWritePlatformServiceImpl.create(json)
  ↓
Determine route:
  ├── Savings→Savings → StandingInstructionAssembler.assembleSavingsToSavingsTransfer()
  ├── Savings→Loan    → StandingInstructionAssembler.assembleSavingsToLoanTransfer()
  └── Loan→Savings    → StandingInstructionAssembler.assembleLoanToSavingsTransfer()
  ↓
AccountTransferDetailAssembler assembles from/to AccountTransferDetails
  ↓
StandingInstructionAssembler.assembleStandingInstruction()
  └── build AccountTransferStandingInstruction entity
  ↓
AccountTransferDetailRepository.saveAndFlush(details)
StandingInstructionRepository.save(instruction)
  ↓
Return PostStandingInstructionsResponse(resourceId)
```

### Scheduled Execution (Spring Batch `EXECUTE_STANDING_INSTRUCTIONS`)

```
ExecuteStandingInstructionsTasklet.execute()
  ↓
Query active instructions:
  status=1 AND
  today >= valid_from AND
  (valid_till IS NULL OR today < valid_till) AND
  (last_run_date IS NULL OR last_run_date != today)
  ↓
Order by priority DESC (URGENT first)
  ↓
For each instruction:
  │
  ├── Check if due:
  │   ├── PERIODIC → DefaultScheduledDateGenerator.isDateFallsInSchedule(
  │   │               frequency, interval, startDate, today)
  │   └── AS_PER_DUES → Check loan for overdue installment
  │
  ├── If due:
  │   ├── For DUES: load StandingInstructionDuesData (total outstanding)
  │   ├── AccountTransfersWritePlatformService.transferFunds(dto)
  │   ├── Update last_run_date = today
  │   └── Write to m_account_transfer_standing_instructions_history:
  │       ├── Success: status="success", amount, execution_time
  │       └── Failure: status="failed", amount, execution_time, error_log
  │
  └── If not due: skip
```

### Auto-Creation at Loan Disbursement

```
LoanWritePlatformServiceJpaRepositoryImpl.disburse()
  └── If loan has create_standing_instruction_at_disbursement=true
      AND loan has linked savings account:
      └── Auto-create:
          name = "To loan {loanNo} from savings {savingsNo}"
          instructionType = DUES
          recurrenceType = AS_PER_DUES
          priority = MEDIUM (3)
          status = ACTIVE (1)
          validFrom = today
          amount = null
```

---

## 10. Related Operations

| Operation                   | Endpoint / Trigger                                     | Description                                                                      |
| --------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Execution History           | `GET /v1/standinginstructionrunhistory`                | View logs of past executions                                                     |
| Template (filtered)         | `GET .../template?fromOfficeId=&fromClientId=...`      | Progressively filtered dropdowns                                                 |
| Auto-create at disbursement | Loan disbursement flow                                 | Creates DUES instruction when `create_standing_instruction_at_disbursement=true` |
| Transfer execution          | `AccountTransfersWritePlatformService.transferFunds()` | Underlying fund transfer when instruction executes                               |
| Soft delete                 | `PUT ...?command=delete`                               | Sets status=DELETED, renames name                                                |

---

## 11. Hidden Dependencies

| Dependency                                                        | Impact                                                          | Phase     |
| ----------------------------------------------------------------- | --------------------------------------------------------------- | --------- |
| **Source/destination accounts must exist**                        | Create fails with validation error                              | Create    |
| **Source account must have sufficient balance at execution**      | Transfer fails; recorded in history with `status=failed`        | Execution |
| **DUES type requires valid loan repayment schedule**              | Outstanding amount = 0; nothing executed                        | Execution |
| **EXECUTE_STANDING_INSTRUCTIONS batch job must be configured**    | Standing instructions never execute if job is not scheduled     | Runtime   |
| **DefaultScheduledDateGenerator must handle all frequency types** | Periodic instructions may misfire                               | Execution |
| **Name uniqueness including deleted records**                     | Create fails even if name conflicts with soft-deleted record    | Create    |
| **From/To account type determines assembler route**               | Wrong route = wrong instruction type or mapping failure         | Create    |
| **validTill not set → instruction runs indefinitely**             | Instruction never expires unless explicitly disabled/deleted    | Execution |
| **dateFormat + locale required for date parsing**                 | Create fails with deserialization error                         | Create    |
| **AccountTransferDetails is the underlying FK**                   | StandingInstruction cannot exist without AccountTransferDetails | Create    |
| **No manual trigger endpoint for execution**                      | Cannot force-execute an instruction outside the batch schedule  | Runtime   |

---

## 12. Implementation Checklist

### Standing Instruction CRUD

- [ ] Template with all dropdowns (`GET /v1/standinginstructions/template`)
- [ ] Template progressive filtering (pass fromOfficeId, fromClientId, etc. as query params)
- [ ] List with pagination and filters (`GET /v1/standinginstructions`)
- [ ] Detail with associations (`GET /v1/standinginstructions/{id}`)
- [ ] Create (`POST /v1/standinginstructions`)
- [ ] Update (`PUT /v1/standinginstructions/{id}?command=update`)
- [ ] Delete (`PUT /v1/standinginstructions/{id}?command=delete`)

### Execution History

- [ ] History list with date range and filters (`GET /v1/standinginstructionrunhistory`)

### UI — Progressive Dropdowns

- [ ] Load offices from template on mount
- [ ] After selecting fromOfficeId → reload template to filter fromClientOptions
- [ ] After selecting fromClientId → reload template to filter fromAccountOptions + toOfficeOptions
- [ ] After selecting toOfficeId → reload template to filter toClientOptions
- [ ] After selecting toClientId → reload template to filter toAccountOptions

### UI — Conditional Fields

- [ ] Show `amount` field only when instructionType=FIXED; hide when DUES
- [ ] Show `recurrenceFrequency` + `recurrenceInterval` only when recurrenceType=PERIODIC
- [ ] Show `recurrenceOnMonthDay` only when recurrenceFrequency=MONTHLY or YEARLY
- [ ] Disable toAccountType=LOAN when transferType=ACCOUNT_TRANSFER
- [ ] Force fromAccountType=SAVINGS when transferType=LOAN_REPAYMENT

### UI — Form Validation

- [ ] Name required + unique check (validate against existing names)
- [ ] Amount required when FIXED; positive decimal
- [ ] validTill must be after validFrom
- [ ] Recurrence fields required when PERIODIC
- [ ] Date format consistent with `dateFormat` and `locale`

### UI — List View

- [ ] Sortable columns (name, priority, status, validFrom, validTill, lastRunDate)
- [ ] Filter by client name, account, transfer type
- [ ] Status badge (Active/Disabled/Deleted)
- [ ] Priority badge (Urgent/High/Medium/Low)

### UI — Detail View

- [ ] Show all fields grouped by section (From, To, Schedule, Configuration)
- [ ] Show linked transactions when `?associations=transactions`
- [ ] Edit button → update flow
- [ ] Delete button → soft-delete with confirmation
- [ ] View history → navigate to history tab

### Error Handling

- [ ] Handle duplicate name error
- [ ] Handle invalid account/client/office references
- [ ] Handle date format parsing failures
- [ ] Handle validation errors inline on form fields
- [ ] Handle execution failures in history view (show error_log)
