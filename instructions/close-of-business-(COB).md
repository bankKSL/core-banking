# Close of Business (COB) — React Implementation Guide

Source: Apache Fineract Close of Business Feature  
Trace Date: 2026-07-25  
Java Base: `org.apache.fineract.cob`

---

## 1. Feature Overview

The Close of Business (COB) feature is a batch processing system that executes daily end-of-day operations on loan accounts. It uses **Spring Batch** with remote partitioning to process loans in parallel, applying configurable business steps such as checking due installments, applying overdue charges, posting accrual entries, updating arrears aging, and recalculating interest.

### Key Concepts

| Concept               | Description                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| **COB Business Step** | A single unit of work executed on each loan during COB (e.g., check due installments, apply charges) |
| **COB Job**           | The Spring Batch job that orchestrates COB processing. Job name: `LOAN_COB`                          |
| **Inline COB**        | On-demand/synchronous COB execution for specific loans (not batch)                                   |
| **COB Catch-Up**      | Process that runs COB for all past business dates to bring loans up to date                          |
| **Account Lock**      | Pessimistic lock preventing concurrent modifications to a loan during COB                            |
| **Partition**         | A range of loan IDs assigned to a worker for parallel processing                                     |
| **Business Date**     | The current date used for COB processing (not necessarily the system date)                           |

### Lock Owner Types

| Lock Owner                   | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `LOAN_COB_CHUNK_PROCESSING`  | Lock held during batch COB chunk processing        |
| `LOAN_INLINE_COB_PROCESSING` | Lock held during inline/synchronous COB processing |

### COB Job Flow (Batch Mode)

```
Resolve Custom Job Parameters
  ↓  ResolveLoanCOBCustomJobParametersTasklet
Loan COB Partition Step
  ↓  LoanCOBPartitioner divides loans into partitions
  For each partition (worker):
    ├── Apply Lock (ApplyLoanLockTasklet)
    ├── Initialize Context (InitialisationTasklet)
    ├── Process Loans (Reader → Processor → Writer)
    │     ├── [Lock each loan before read]
    │     ├── [Execute all configured business steps]
    │     └── [Unlock after write]
    └── Reset Context (ResetContextTasklet)
Stayed Locked Loans Step
  ↓  StayedLockedLoansTasklet — handles loans that stayed locked
Unlock Processed Loans Step
  ↓  UnlockProcessedLoansTasklet — releases locks
```

### Business Step Category

| Category | Business Step Interface | Entity Type |
| -------- | ----------------------- | ----------- |
| `LOAN`   | `LoanCOBBusinessStep`   | `Loan`      |

---

### Available Loan COB Business Steps

| Step Name (Enum)                  | Human Readable                  | Class                                       | Description                                                          |
| --------------------------------- | ------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `CHECK_DUE_INSTALLMENTS`          | Check Due Installments          | `CheckDueInstallmentsBusinessStep`          | Posts custom snapshot business event for loans with due installments |
| `CHECK_LOAN_REPAYMENT_DUE`        | Check Loan Repayment Due        | `CheckLoanRepaymentDueBusinessStep`         | Marks installments as due                                            |
| `CHECK_LOAN_REPAYMENT_OVERDUE`    | Check Loan Repayment Overdue    | `CheckLoanRepaymentOverdueBusinessStep`     | Marks overdue installments                                           |
| `APPLY_CHARGE_TO_OVERDUE_LOANS`   | Apply Charge To Overdue Loans   | `ApplyChargeToOverdueLoansBusinessStep`     | Applies penalty charges to overdue loans                             |
| `ADD_PERIODIC_ACCRUAL_ENTRIES`    | Add Periodic Accrual Entries    | `AddPeriodicAccrualEntriesBusinessStep`     | Posts periodic accrual journal entries                               |
| `ACCRUAL_ACTIVITY_POSTING`        | Accrual Activity Posting        | `AccrualActivityPostingBusinessStep`        | Posts accrual activities                                             |
| `UPDATE_LOAN_ARREARS_AGING`       | Update Loan Arrears Aging       | `UpdateLoanArrearsAgingBusinessStep`        | Updates arrears aging data                                           |
| `SET_LOAN_DELINQUENCY_TAGS`       | Set Loan Delinquency Tags       | `SetLoanDelinquencyTagsBusinessStep`        | Sets delinquency classification tags                                 |
| `LOAN_INTEREST_RECALCULATION`     | Loan Interest Recalculation     | `LoanInterestRecalculationCOBBusinessStep`  | Recalculates interest for loans with interest recalculation enabled  |
| `BUY_DOWN_FEE_AMORTIZATION`       | Buy Down Fee Amortization       | `BuyDownFeeAmortizationBusinessStep`        | Processes buy-down fee amortization                                  |
| `CAPITALIZED_INCOME_AMORTIZATION` | Capitalized Income Amortization | `CapitalizedIncomeAmortizationBusinessStep` | Processes capitalized income amortization                            |

### Entity Relationships

```
LoanAccountLock (m_loan_account_locks)
  ├── loan_id (PK)
  ├── version (optimistic locking)
  ├── lock_owner (LOAN_COB_CHUNK_PROCESSING | LOAN_INLINE_COB_PROCESSING)
  ├── lock_placed_on (timestamp)
  ├── lock_placed_on_cob_business_date
  ├── error (error message if processing failed)
  └── stacktrace (full stack trace if processing failed)

BatchBusinessStep (batch_businessstep)
  ├── id (PK)
  ├── job_name
  ├── step_name
  └── step_order

BusinessDate (m_business_date) — used by COB
  ├── type (BUSINESS_DATE, COB_DATE)
  └── date
```

### Key Tables

| Table                  | Purpose                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| `m_loan_account_locks` | Pessimistic locks on loan accounts during COB                          |
| `batch_businessstep`   | Configuration of business steps per job, with execution order          |
| `m_business_date`      | Business date tracking (used for COB date)                             |
| `m_loan`               | Loan accounts (has `last_closed_business_date` field for COB tracking) |

---

## 2. API Inventory

### Business Step Configuration (`/v1/jobs`)

| Method | URL                                  | Description                                                              | Permission    |
| ------ | ------------------------------------ | ------------------------------------------------------------------------ | ------------- |
| GET    | `/v1/jobs/names`                     | List configured business jobs (returns `{ businessJobs: ["LOAN_COB"] }`) | `READ`        |
| GET    | `/v1/jobs/{jobName}/steps`           | List currently configured steps with their execution order               | `READ`        |
| PUT    | `/v1/jobs/{jobName}/steps`           | Replace the entire step configuration (order list) for a job             | Command-level |
| GET    | `/v1/jobs/{jobName}/available-steps` | List all possible steps that can be assigned to this job                 | `READ`        |

### Loan COB Catch-Up (`/v1/loans`)

| Method | URL                             | Description                            | Permission    |
| ------ | ------------------------------- | -------------------------------------- | ------------- |
| GET    | `/v1/loans/oldest-cob-closed`   | Get the oldest COB processed loan info | `READ`        |
| POST   | `/v1/loans/catch-up`            | Execute Loan COB catch-up              | Command-level |
| GET    | `/v1/loans/is-catch-up-running` | Check if catch-up is currently running | `READ`        |

### Loan Account Locks (`/v1/loans`)

| Method | URL                | Description                           | Permission |
| ------ | ------------------ | ------------------------------------- | ---------- |
| GET    | `/v1/loans/locked` | List locked loan accounts (paginated) | `READ`     |

### Internal COB (`/v1/internal/cob`) — TEST ONLY

| Method | URL                                                       | Description                                  | Permission |
| ------ | --------------------------------------------------------- | -------------------------------------------- | ---------- |
| GET    | `/v1/internal/cob/partitions/{partitionSize}`             | Get COB partitions (test only)               | Internal   |
| POST   | `/v1/internal/cob/fast-forward-cob-date-of-loan/{loanId}` | Fast-forward COB date for a loan (test only) | Internal   |
| POST   | `/v1/internal/cob/loan-reprocess/{loanId}`                | Reprocess a loan schedule (test only)        | Internal   |

### Working Capital Loan COB (separate module)

| Method | URL                                                     | Description                                      |
| ------ | ------------------------------------------------------- | ------------------------------------------------ |
| GET    | `/v1/internal/working-capital-loan/oldest-cob-closed`   | Oldest COB processed working capital loan (test) |
| POST   | `/v1/internal/working-capital-loan/catch-up`            | Working capital loan COB catch-up (test)         |
| GET    | `/v1/internal/working-capital-loan/is-catch-up-running` | Check working capital catch-up status (test)     |
| POST   | `/v1/internal/working-capital-loan/account-lock`        | Place a lock on a working capital loan (test)    |
| DELETE | `/v1/internal/working-capital-loan/account-lock`        | Release a lock on a working capital loan (test)  |

---

## 3. CRUD Analysis

### Business Step Configuration

| Operation                   | Endpoint                                 | Notes                                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **List Jobs**               | `GET /v1/jobs/names`                     | Returns `{ businessJobs: ["LOAN_COB"] }` — the field is **`businessJobs`** (not `jobs` or `jobNames`)                                                                                                                                                                                                                                           |
| **List Steps (configured)** | `GET /v1/jobs/{jobName}/steps`           | Returns `{ jobName: "LOAN_COB", businessSteps: [{ stepName, order }, ...] }`. Field is **`businessSteps`**, each item has `stepName` (enum name like `CHECK_DUE_INSTALLMENTS`) and `order` (execution sequence 1, 2, 3...)                                                                                                                      |
| **Update Steps**            | `PUT /v1/jobs/{jobName}/steps`           | **Replaces the entire config.** Send `{ businessSteps: [{ stepName, order }, ...] }`. Must include ALL desired steps — any step not in the list is removed. At least 1 step required.                                                                                                                                                           |
| **Available Steps**         | `GET /v1/jobs/{jobName}/available-steps` | Returns `{ jobName: "LOAN_COB", availableBusinessSteps: [{ stepName, stepDescription }, ...] }`. Field is **`availableBusinessSteps`** (not `businessSteps`). Each item has `stepName` (enum name) and `stepDescription` (human-readable name like "Check Due Installments"). No `order` field — these are unordered options you can pick from. |

### Loan COB Catch-Up

| Operation         | Endpoint                            | Notes                                                                  |
| ----------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| **Get Oldest**    | `GET /v1/loans/oldest-cob-closed`   | Returns `loanIds`, `cobProcessedDate`, `cobBusinessDate`               |
| **Execute**       | `POST /v1/loans/catch-up`           | Triggers COB for all dates from oldest to current; returns 200/202/400 |
| **Check Running** | `GET /v1/loans/is-catch-up-running` | Returns `isCatchUpRunning` (boolean) and `processingDate`              |

### Loan Account Locks

| Operation       | Endpoint                               | Notes                                          |
| --------------- | -------------------------------------- | ---------------------------------------------- |
| **List Locked** | `GET /v1/loans/locked?page=0&limit=50` | Returns paginated list of locked loan accounts |

### Missing Operations

- No `POST/PUT/DELETE` for individual business steps (only batch reorder)
- No manual lock/unlock endpoints (locks are managed internally by COB jobs)
- No COB execution status API (only catch-up status)
- No way to trigger batch COB manually via API (it's scheduled)

---

## 4. Create Workflow (Highest Priority)

COB is not a "create" feature in the traditional CRUD sense. The primary actionable workflows are:

### Update Business Step Configuration

```
GET /v1/jobs/names
  ↓  Returns { businessJobs: ["LOAN_COB"] }
  ↓  Note: field name is "businessJobs", a list of strings
GET /v1/jobs/{jobName}/available-steps
  ↓  Returns { jobName: "LOAN_COB", availableBusinessSteps: [...] }
  ↓  Note: field name is "availableBusinessSteps"
  ↓  Each item: { stepName: "CHECK_DUE_INSTALLMENTS", stepDescription: "Check Due Installments" }
GET /v1/jobs/{jobName}/steps
  ↓  Returns { jobName: "LOAN_COB", businessSteps: [{ stepName, order }, ...] }
  ↓  Field name is "businessSteps" (same as request body, different from available-steps)
PUT /v1/jobs/{jobName}/steps
  ↓  Body: { "businessSteps": [ { "stepName": "CHECK_DUE_INSTALLMENTS", "order": 1 }, ... ] }
  ↓  IMPORTANT: This REPLACES the entire configuration. Send all desired steps.
  ↓  Use "stepName" values from available-steps response, assign "order" for execution sequence.
204 No Content
```

### Execute Loan COB Catch-Up

```
GET /v1/loans/oldest-cob-closed             → check if any loans are behind
  ↓
GET /v1/loans/is-catch-up-running           → verify catch-up not already running
  ↓
POST /v1/loans/catch-up                     → trigger catch-up
  ↓  200: all caught up | 202: started | 400: already running
GET /v1/loans/is-catch-up-running           → poll for completion
```

### View Locked Loans

```
GET /v1/loans/locked?page=0&limit=50        → view locked loans
  ↓  Returns: { page, limit, content: [LoanAccountLock...] }
```

---

## 5. Lookup APIs

| UI Field                   | Endpoint                                 | Response Field Path                   | Display                                                                     | Value                                                                  | Required         |
| -------------------------- | ---------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------- |
| Job Names                  | `GET /v1/jobs/names`                     | `businessJobs`                        | `businessJobs[i]` (string)                                                  | Job name (e.g. `"LOAN_COB"`)                                           | For step config  |
| Available Steps            | `GET /v1/jobs/{jobName}/available-steps` | `availableBusinessSteps`              | `availableBusinessSteps[i].stepDescription` (e.g. "Check Due Installments") | `availableBusinessSteps[i].stepName` (e.g. `"CHECK_DUE_INSTALLMENTS"`) | For step config  |
| Current Steps (configured) | `GET /v1/jobs/{jobName}/steps`           | `businessSteps`                       | `businessSteps[i].stepName`                                                 | `businessSteps[i].stepName` + `businessSteps[i].order`                 | For step reorder |
| Oldest COB Loan            | `GET /v1/loans/oldest-cob-closed`        | `cobBusinessDate`, `cobProcessedDate` | Loan IDs + dates                                                            | For catch-up status                                                    |
| Catch-Up Running           | `GET /v1/loans/is-catch-up-running`      | `isCatchUpRunning`, `processingDate`  | Status                                                                      | Before triggering                                                      |
| Locked Loans               | `GET /v1/loans/locked`                   | Locked loan details                   | Lock entries                                                                | For admin monitoring                                                   |

---

## 6. API Call Order

### View & Update Business Step Configuration

1. `GET /v1/jobs/names` — get configured job names (e.g., `LOAN_COB`)
2. `GET /v1/jobs/LOAN_COB/available-steps` — get all available business steps
3. `GET /v1/jobs/LOAN_COB/steps` — view current step configuration
4. `PUT /v1/jobs/LOAN_COB/steps` — update step order

### Execute Catch-Up

1. `GET /v1/loans/oldest-cob-closed` — check oldest unprocessed loan
2. `GET /v1/loans/is-catch-up-running` — ensure not already running
3. `POST /v1/loans/catch-up` — start catch-up
4. `GET /v1/loans/is-catch-up-running` — poll until false

### Monitor Locked Loans

1. `GET /v1/loans/locked?page=0&limit=50` — view first page of locked loans
2. `GET /v1/loans/locked?page=1&limit=50` — view next page

---

## 7. Request Payload Analysis

### Update Business Step Config (`PUT /v1/jobs/{jobName}/steps`)

This API **replaces the entire step configuration**. Send all steps you want configured.

Request field: **`businessSteps`** (array of objects, each with `stepName` + `order`).

```json
{
  "businessSteps": [
    { "stepName": "CHECK_DUE_INSTALLMENTS", "order": 1 },
    { "stepName": "CHECK_LOAN_REPAYMENT_DUE", "order": 2 },
    { "stepName": "CHECK_LOAN_REPAYMENT_OVERDUE", "order": 3 },
    { "stepName": "APPLY_CHARGE_TO_OVERDUE_LOANS", "order": 4 },
    { "stepName": "ADD_PERIODIC_ACCRUAL_ENTRIES", "order": 5 },
    { "stepName": "ACCRUAL_ACTIVITY_POSTING", "order": 6 },
    { "stepName": "UPDATE_LOAN_ARREARS_AGING", "order": 7 },
    { "stepName": "SET_LOAN_DELINQUENCY_TAGS", "order": 8 }
  ]
}
```

Response: `204 No Content`

**IMPORTANT:** The `stepName` values must match exactly the values from `GET /v1/jobs/{jobName}/available-steps` → `availableBusinessSteps[i].stepName`. Invalid step names will result in a `BusinessStepException`.

### Get Oldest COB Processed Loan Response

```json
{
  "loanIds": [1, 2, 3],
  "cobProcessedDate": "2026-07-20",
  "cobBusinessDate": "2026-07-25"
}
```

### Is Catch-Up Running Response

```json
{
  "isCatchUpRunning": false,
  "processingDate": null
}
```

### List Locked Loans Response

```json
{
  "page": 0,
  "limit": 50,
  "content": [
    {
      "loanId": 123,
      "version": 1,
      "lockOwner": "LOAN_COB_CHUNK_PROCESSING",
      "lockPlacedOn": "2026-07-25T10:00:00.000Z",
      "lockPlacedOnCobBusinessDate": "2026-07-25",
      "error": null,
      "stacktrace": null
    }
  ]
}
```

### Get Job Names Response

Field: **`businessJobs`** — list of strings.

```json
{
  "businessJobs": ["LOAN_COB"]
}
```

### Get Available Steps Response

Field: **`availableBusinessSteps`** — each has `stepName` (enum name) and `stepDescription` (human-readable). No `order` field.

```json
{
  "jobName": "LOAN_COB",
  "availableBusinessSteps": [
    { "stepName": "CHECK_DUE_INSTALLMENTS", "stepDescription": "Check Due Installments" },
    { "stepName": "APPLY_CHARGE_TO_OVERDUE_LOANS", "stepDescription": "Apply Charge To Overdue Loans" },
    { "stepName": "CHECK_LOAN_REPAYMENT_DUE", "stepDescription": "Check Loan Repayment Due" },
    { "stepName": "CHECK_LOAN_REPAYMENT_OVERDUE", "stepDescription": "Check Loan Repayment Overdue" },
    { "stepName": "ADD_PERIODIC_ACCRUAL_ENTRIES", "stepDescription": "Add Periodic Accrual Entries" },
    { "stepName": "ACCRUAL_ACTIVITY_POSTING", "stepDescription": "Accrual Activity Posting" },
    { "stepName": "UPDATE_LOAN_ARREARS_AGING", "stepDescription": "Update Loan Arrears Aging" },
    { "stepName": "SET_LOAN_DELINQUENCY_TAGS", "stepDescription": "Set Loan Delinquency Tags" },
    { "stepName": "LOAN_INTEREST_RECALCULATION", "stepDescription": "Loan Interest Recalculation" },
    { "stepName": "BUY_DOWN_FEE_AMORTIZATION", "stepDescription": "Buy Down Fee Amortization" },
    { "stepName": "CAPITALIZED_INCOME_AMORTIZATION", "stepDescription": "Capitalized Income Amortization" }
  ]
}
```

### Get Step Config Response (currently configured steps)

Field: **`businessSteps`** — each has `stepName` and `order` (execution sequence).

```json
{
  "jobName": "LOAN_COB",
  "businessSteps": [
    { "stepName": "CHECK_DUE_INSTALLMENTS", "order": 1 },
    { "stepName": "CHECK_LOAN_REPAYMENT_DUE", "order": 2 },
    { "stepName": "CHECK_LOAN_REPAYMENT_OVERDUE", "order": 3 },
    { "stepName": "APPLY_CHARGE_TO_OVERDUE_LOANS", "order": 4 },
    { "stepName": "ADD_PERIODIC_ACCRUAL_ENTRIES", "order": 5 },
    { "stepName": "ACCRUAL_ACTIVITY_POSTING", "order": 6 },
    { "stepName": "UPDATE_LOAN_ARREARS_AGING", "order": 7 },
    { "stepName": "SET_LOAN_DELINQUENCY_TAGS", "order": 8 }
  ]
}
```

### Fast-Forward COB Date (Internal Test Only)

```json
"{\"lastClosedBusinessDate\": \"26 July 2026\"}"
```

---

## 8. Validation Rules

### Business Step Configuration

| Field                      | Required | Validation                                     |
| -------------------------- | -------- | ---------------------------------------------- |
| `businessSteps`            | **Yes**  | Non-empty array                                |
| `businessSteps[].stepName` | **Yes**  | Must match an existing business step enum name |
| `businessSteps[].order`    | **Yes**  | Positive integer; must be unique               |

### Business Step Update Validation

| Rule             | Logic                                          | Error                                  |
| ---------------- | ---------------------------------------------- | -------------------------------------- |
| Step exists      | Check step belongs to the specified job        | `BusinessStepNotBelongsToJobException` |
| Job exists       | Job must be configured in `batch_businessstep` | —                                      |
| Order uniqueness | No duplicate order values                      | Validation error                       |

### COB Processing Rules (Internal)

| Rule                     | Logic                                                            | Error                                    |
| ------------------------ | ---------------------------------------------------------------- | ---------------------------------------- |
| Loan exists              | Loan must exist in database                                      | `LoanNotFoundException`                  |
| Lock available           | No existing lock for the loan                                    | `LockCannotBeAppliedException`           |
| Lock owner valid         | Only `LOAN_COB_CHUNK_PROCESSING` or `LOAN_INLINE_COB_PROCESSING` | —                                        |
| Business step execution  | Each step can throw `BusinessStepException` on failure           | Error + stacktrace stored in lock record |
| Catch-up already running | Check `isCatchUpRunning` flag                                    | 400 Bad Request                          |
| Loan already processed   | Check `lastClosedBusinessDate` >= COB date                       | Skipped (not an error)                   |

---

## 9. Business Flow

### Batch COB Job Flow

```
Spring Batch Job: LOAN_COB
  ↓
[Step 1] ResolveCustomJobParametersTasklet
  ↓  resolves custom job parameter IDs
[Step 2] LoanCOBPartitioner.partition(gridSize)
  ↓  retrieves non-closed loan IDs via RetrieveIdService
  ↓  splits into partitions based on partitionSize config
  ↓  for each partition:
  ↓    [
  ↓      [Worker Step] for each loan in partition:
  ↓        CobWorkerStepListener:
  ↓          1. InitialisationTasklet — set up execution context
  ↓          2. ApplyLoanLockTasklet — lock loan in DB
  ↓          3. Chunk-based processing:
  ↓              LoanItemReader — reads loan from DB
  ↓              LoanItemProcessor — executes all business steps
  ↓                ├─ COBBusinessStepService.getCOBBusinessSteps()
  ↓                ├─ For each step (ordered TreeMap):
  ↓                │   └─ step.execute(loan) → modified loan
  ↓                └─ Return processed loan
  ↓              LoanItemWriter — saves loan, releases lock
  ↓          4. ResetContextTasklet — clean up context
  ↓    ]
[Step 3] StayedLockedLoansTasklet
  ↓  finds loans that remained locked after COB
  ↓  fires LoanAccountsStayedLockedBusinessEvent
[Step 4] UnlockProcessedLoansTasklet
  ↓  releases all locks held for this COB batch
```

### Inline COB Flow

```
Spring Batch Job: INLINE_LOAN_COB
  ↓
[Step 1] InlineLoanCOBBuildExecutionContextTasklet
  ↓  builds execution context with business steps
[Step 2] Inline Loan COB Step
  ↓  for each specified loan:
  ↓    InlineCOBLoanItemReader — reads loan
  ↓    InlineCOBLoanItemProcessor — executes business steps
  ↓    InlineCOBLoanItemWriter — saves loan, releases lock
[Step 3] ResetContextTasklet
  ↓  clean up
```

### Catch-Up Flow

```
LoanCOBCatchUpServiceImpl/LoanCOBCatchUpService
  ↓
CommonCOBCatchUpService.executeCatchUp()
  ↓
For each business date from oldest to current:
  ├─ Update business date
  ├─ Execute LOAN_COB job for that date
  └─ Process all loans behind
  ↓
Return 200 (all caught up) or 202 (started)
```

### Lock Application Flow

```
ApplyLoanLockTasklet.execute()
  ↓
For each loan in partition:
  ↓
loanLockingService.lockLoan(loanId, lockOwner)
  ↓
  INSERT INTO m_loan_account_locks (loan_id, lock_owner, ...)
  ↓  (uses INSERT ... ON DUPLICATE KEY pattern)
  ↓  If already locked → LockCannotBeAppliedException
  ↓  If lock placed by LOAN_COB_CHUNK_PROCESSING and attempted
  ↓  by LOAN_INLINE_COB_PROCESSING → AccountLockCannotBeOverruledException
```

```
UnlockProcessedLoansTasklet.execute()
  ↓
accountLockService.deleteByLoanId(loanId)
  ↓
DELETE FROM m_loan_account_locks WHERE loan_id = ?
```

---

## 10. Related Operations

| Operation             | Endpoint                                                       | Description                       |
| --------------------- | -------------------------------------------------------------- | --------------------------------- |
| List Jobs             | `GET /v1/jobs/names`                                           | Get configured COB job names      |
| List Steps            | `GET /v1/jobs/{jobName}/steps`                                 | Get current step configuration    |
| Update Steps          | `PUT /v1/jobs/{jobName}/steps`                                 | Reorder business steps            |
| Available Steps       | `GET /v1/jobs/{jobName}/available-steps`                       | Get all available steps for a job |
| Oldest COB Loan       | `GET /v1/loans/oldest-cob-closed`                              | Get oldest unprocessed loan info  |
| Execute Catch-Up      | `POST /v1/loans/catch-up`                                      | Start COB catch-up                |
| Catch-Up Status       | `GET /v1/loans/is-catch-up-running`                            | Check if catch-up is running      |
| List Locked Loans     | `GET /v1/loans/locked`                                         | View locked loan accounts         |
| Fast-Forward COB Date | `POST /v1/internal/cob/fast-forward-cob-date-of-loan/{loanId}` | Test only — advance COB date      |
| Loan Reprocess        | `POST /v1/internal/cob/loan-reprocess/{loanId}`                | Test only — regenerate schedule   |

---

## 11. Hidden Dependencies

| Dependency                           | Impact                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Spring Batch required**            | COB is built on Spring Batch with remote partitioning; requires proper Batch infrastructure       |
| **Database-level locks**             | Locks are stored in `m_loan_account_locks` table with optimistic locking (`version` column)       |
| **Lock cannot be overruled**         | `LOAN_COB_CHUNK_PROCESSING` lock prevents inline COB; `AccountLockCannotBeOverruledException`     |
| **Business date required**           | COB relies on `m_business_date` table for the current business date (type `BUSINESS_DATE`)        |
| **Batch manager/worker roles**       | Application runs as either Batch Manager or Batch Worker (Spring profiles/conditions)             |
| **Property configuration**           | Partition size, chunk size, retry limit, thread pool, queue capacity all configurable per job     |
| **ContextAwareTaskDecorator**        | Required for thread-safe context propagation in multi-threaded COB execution                      |
| **Step execution context**           | Business steps are passed via `ExecutionContext` between steps; requires promotion listener       |
| **`lastClosedBusinessDate` on Loan** | Each loan tracks `last_closed_business_date` to determine if COB is needed                        |
| **Catch-up sequential processing**   | Catch-up processes one business date at a time; can be slow if many dates behind                  |
| **Stayed locked detection**          | Loans that remain locked after COB trigger `LoanAccountsStayedLockedBusinessEvent`                |
| **Business event integration**       | COB fires business events (`LoanAccountsStayedLockedBusinessEvent`, custom snapshots)             |
| **Error tracking**                   | Errors during business step execution are stored in the lock record (error message + stacktrace)  |
| **Retry and skip**                   | Configurable retry limit and skip limit; exceptions during processing are retried or skipped      |
| **Working capital loans**            | Separate COB configuration for working capital loans (`WorkingCapitalLoanCOBConstant`)            |
| **Savings COB**                      | Separate COB interface `SavingsCOBBusinessStep` for savings accounts (less implemented)           |
| **Custom job parameters**            | `COB_CUSTOM_JOB_PARAMETER_KEY` allows passing custom parameters to COB jobs                       |
| **Inline COB**                       | Requires `LoanCOBEnabledCondition` to be satisfied (`fineract.module.loan-cob.enabled`)           |
| **Listener pattern**                 | `FineractCOBBeforeJobListener` and `FineractCOBAfterJobListener` allow custom pre/post processing |

---

## 12. Implementation Checklist

### Business Step Configuration

- [ ] List Jobs (`GET /v1/jobs/names`)
- [ ] List Configured Steps (`GET /v1/jobs/{jobName}/steps`)
- [ ] List Available Steps (`GET /v1/jobs/{jobName}/available-steps`)
- [ ] Update Step Order (`PUT /v1/jobs/{jobName}/steps`)

### Loan COB Catch-Up

- [ ] Get Oldest COB Processed Loan (`GET /v1/loans/oldest-cob-closed`)
- [ ] Execute Catch-Up (`POST /v1/loans/catch-up`)
- [ ] Check Catch-Up Running (`GET /v1/loans/is-catch-up-running`)

### Loan Account Locks

- [ ] List Locked Loans (`GET /v1/loans/locked`)

### Loan COB Business Steps (configurable via API)

- [ ] Check Due Installments
- [ ] Check Loan Repayment Due
- [ ] Check Loan Repayment Overdue
- [ ] Apply Charge to Overdue Loans
- [ ] Add Periodic Accrual Entries
- [ ] Accrual Activity Posting
- [ ] Update Loan Arrears Aging
- [ ] Set Loan Delinquency Tags
- [ ] Loan Interest Recalculation
- [ ] Buy Down Fee Amortization
- [ ] Capitalized Income Amortization

### Configuration & Setup

- [ ] Enable loan COB: `fineract.module.loan-cob.enabled=true`
- [ ] Configure partition size, chunk size, thread pool for `LOAN_COB` job
- [ ] Ensure `m_business_date` table has `BUSINESS_DATE` and `COB_DATE` records
- [ ] Set up Spring Batch job repository tables
- [ ] Configure Batch Manager and Batch Worker profiles
- [ ] Seed `batch_businessstep` with initial business step order
- [ ] Ensure non-cash payment type exists for interop transfer tracking
