# Loan — React Implementation Guide

## 1. Overview

The Loan module manages the full loan lifecycle from application through closure. It supports individual, group, and JLG (Joint Liability Group) loans with configurable products, interest types, repayment schedules, charges, collateral, and guarantees.

| Sub-Feature        | Base Path                                                  | Description                                                 |
| ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------- |
| Loan Accounts      | `/v1/loans`                                                | Full CRUD + state commands (approve, disburse, repay, etc.) |
| Loan Products      | `/v1/loanproducts`                                         | Product definitions (terms, interest, accounting)           |
| Loan Transactions  | `/v1/loans/{loanId}/transactions`                          | Repayments, waivers, write-offs, adjustments                |
| Loan Charges       | `/v1/loans/{loanId}/charges`                               | Fees and penalties applied to loans                         |
| Loan Collateral    | `/v1/loans/{loanId}/collateral`                            | Collateral items linked to loans                            |
| Loan Guarantors    | `/v1/loans/{loanId}/guarantors`                            | Guarantor management                                        |
| Loan Rescheduling  | `/v1/rescheduleloans`                                      | Reschedule loan repayment schedules                         |
| Loan Schedule      | `/v1/loans/{loanId}/schedule`                              | Repayment schedule operations                               |
| Product Mix        | `/v1/loanproducts/{productId}/productmix`                  | Define mutually exclusive loan product restrictions         |
| Loan Adjustment    | `/v1/loans/{loanId}/charges/{chargeId}?command=adjustment` | Adjust loan charges                                         |
| Adjust Transaction | `/v1/loans/{loanId}/transactions/{transactionId}`          | Reverse/modify existing loan transactions                   |
| Point-in-Time View | `/v1/loans/at-date/{loanId}`                               | View loan state at a specific historical date               |
| Interest Pause     | `/v1/loans/{loanId}/interest-pauses`                       | Pause interest accrual during a date range                  |
| Bulk Reassignment  | `/v1/loans/loanreassignment`                               | Bulk reassign loans between loan officers                   |
| Buydown Fees       | `/v1/loans/{loanId}/buydown-fees`                          | Third-party fee to buy down interest rate                   |
| Capitalized Income | `/v1/loans/{loanId}/capitalized-incomes`                   | Deferred income amortized over loan life                    |
| Post-Dated Checks  | `/v1/loans/{loanId}/postdatedchecks`                       | Manage post-dated check payments                            |
| Loan Documents     | `/v1/loans/{loanId}/documents`                             | Upload/download/delete loan documents                       |
| Loan Notes         | `/v1/loans/{loanId}/notes`                                 | Add/view/edit/delete notes on loans                         |

---

## 2. Lifecycle

### Loan Account Status Flow

```
                         ┌──────────────────────────────┐
                         │  SUBMITTED_AND_PENDING_APPROVAL  │ (100)
                         └──────────────┬───────────────┘
                            ┌───────────┴───────────┐
                            ↓                       ↓
                    ┌───────────────┐      ┌─────────────────┐
                    │   APPROVED    │      │  WITHDRAWN_BY    │ (400)
                    │     (200)     │      │   CLIENT         │
                    └───────┬───────┘      └─────────────────┘
                            ↓                       ↑
                    ┌───────────────┐      ┌─────────────────┐
                    │    ACTIVE     │      │    REJECTED     │ (500)
                    │     (300)     │      └─────────────────┘
                    └───────┬───────┘
                            ↓
               ┌───────────┴───────────┐
               ↓                       ↓
    ┌────────────────────┐   ┌─────────────────────────┐
    │ CLOSED_OBLIGATIONS │   │   CLOSED_WRITTEN_OFF    │ (601)
    │       MET (600)    │   └─────────────────────────┘
    └────────────────────┘   ┌─────────────────────────────────┐
                            │ CLOSED_RESCHEDULE_OUTSTANDING   │ (602)
                            │         AMOUNT                  │
                            └─────────────────────────────────┘
                            ┌─────────────────┐
                            │    OVERPAID     │ (700)
                            └─────────────────┘
```

**Sub-status values:**

- `NONE` (0)
- `FRAUD` (1) — written off as fraud
- `CHARGE_OFF` (2) — charged off
- `CHARGE_OFF_FRAUD` (3) — charged off as fraud
- `ACTIVE_IN_ARREARS` (4) — active but in arrears
- `ACTIVE_IN_ARREARS_FRAUD` (5)
- `ACTIVE_IN_ARREARS_CHARGE_OFF` (6)

### Transaction Types

| Type ID | Name                                 | Direction |
| ------- | ------------------------------------ | --------- |
| 1       | Repayment                            | Credit    |
| 2       | Disbursement                         | Debit     |
| 3       | Waive Interest                       | —         |
| 4       | Repayment (reversal)                 | —         |
| 5       | Write Off                            | —         |
| 6       | Marked for Reschedule                | —         |
| 7       | Recovery Repayment                   | Credit    |
| 8       | Waive Charges                        | —         |
| 9       | Accrual                              | —         |
| 10      | Initiate Transfer                    | —         |
| 11      | Approve Transfer                     | —         |
| 12      | Withdraw Transfer                    | —         |
| 13      | Reject Transfer                      | —         |
| 14      | Refund                               | Credit    |
| 15      | Charge Payment                       | Debit     |
| 16      | Refund (transfer)                    | Credit    |
| 17      | Charge Off                           | —         |
| 18      | Down Payment                         | Debit     |
| 19      | Interest Refund                      | Credit    |
| 20      | Goodwill Credit                      | Credit    |
| 21      | Merchant Issued Refund               | Credit    |
| 22      | Payout Refund                        | Credit    |
| 23      | Capitalized Income                   | —         |
| 24      | Credit Balance Refund                | Credit    |
| 25      | Accrual Activity                     | —         |
| 35      | Capitalized Income Entry             | Debit     |
| 36      | Capitalized Income Amortization      | —         |
| 37      | Capitalized Income Adjustment        | —         |
| 39      | Capitalized Income Amortization Adj. | —         |
| 40      | Buy Down Fee                         | Debit     |
| 41      | Buy Down Fee Adjustment              | —         |
| 42      | Buy Down Fee Amortization            | —         |
| 43      | Buy Down Fee Amortization Adjustment | —         |

---

## 3. API Inventory

### 3.1 Loan Accounts — `/v1/loans`

| Method   | Path                                      | Description                                                                                                                   |
| -------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/v1/loans/template`                      | Create form template (products, officers, funds, purposes, interest options)                                                  |
| `POST`   | `/v1/loans?command=calculateLoanSchedule` | Calculate repayment schedule without submitting                                                                               |
| `POST`   | `/v1/loans`                               | Submit a new loan application                                                                                                 |
| `GET`    | `/v1/loans`                               | List with pagination: `offset`, `limit`, `orderBy`, `sortOrder`, `clientId`, `status`, `externalId`                           |
| `GET`    | `/v1/loans/{loanId}`                      | Detail with `?associations=all`, `?associations=repaymentSchedule,transactions`, `?exclude=guarantors`                        |
| `GET`    | `/v1/loans/external-id/{externalId}`      | Detail by external ID                                                                                                         |
| `PUT`    | `/v1/loans/{loanId}`                      | Modify loan application (only when in Submitted state)                                                                        |
| `POST`   | `/v1/loans/{loanId}`                      | State commands: `approve`, `undoapproval`, `reject`, `withdrawnByApplicant`, `disburse`, `disburseToSavings`, `undodisbursal` |
| `DELETE` | `/v1/loans/{loanId}`                      | Delete application (only when in Submitted state)                                                                             |
| `GET`    | `/v1/loans/{loanId}/template`             | Approval template                                                                                                             |
| `GET`    | `/v1/loans/{loanId}/delinquencytags`      | Delinquency tag history                                                                                                       |
| `GET`    | `/v1/loans/downloadtemplate`              | Download Excel bulk import                                                                                                    |
| `POST`   | `/v1/loans/uploadtemplate`                | Upload Excel bulk import                                                                                                      |
| `POST`   | `/v1/loans/glimAccount/{glimId}`          | GLIM state commands                                                                                                           |
| `GET`    | `/v1/loans/glimAccount/{glimId}`          | GLIM repayment template                                                                                                       |
| `GET`    | `/v1/loans/repayments/downloadtemplate`   | Download repayment bulk import                                                                                                |
| `POST`   | `/v1/loans/repayments/uploadtemplate`     | Upload repayment bulk import                                                                                                  |

### 3.2 Loan Products — `/v1/loanproducts`

| Method   | Path                           | Description                                                   |
| -------- | ------------------------------ | ------------------------------------------------------------- |
| `GET`    | `/v1/loanproducts/template`    | Create form template (currency, interest, accounting options) |
| `GET`    | `/v1/loanproducts`             | List                                                          |
| `GET`    | `/v1/loanproducts/{productId}` | Detail (supports `?template=true`)                            |
| `POST`   | `/v1/loanproducts`             | Create                                                        |
| `PUT`    | `/v1/loanproducts/{productId}` | Update                                                        |
| `DELETE` | `/v1/loanproducts/{productId}` | Delete                                                        |

### 3.3 Loan Transactions — `/v1/loans/{loanId}/transactions`

| Method | Path                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `.../transactions/template`        | Transaction template (command-specific: repayment, disburse, writeoff, waiver, etc.)                                                                                                                                                                                                                                                                                                                                                               |
| `GET`  | `.../transactions/{transactionId}` | Transaction detail                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `POST` | `.../transactions`                 | Create transaction: `repayment`, `waiveinterest`, `writeoff`, `close-rescheduled`, `close`, `disburse`, `disburseToSavings`, `recoverypayment`, `prepayLoan`, `refundbycash`, `refundbytransfer`, `foreclosure`, `goodwillCredit`, `payoutRefund`, `merchantIssuedRefund`, `creditBalanceRefund`, `charge-off`, `undo-charge-off`, `downPayment`, `interest-refund`, `interestPaymentWaiver`, `reAge`, `reAmortize`, `undoReAge`, `undoReAmortize` |
| `POST` | `.../transactions/{transactionId}` | Adjust transaction: `undo`, `modify`, `chargeAdjustment`                                                                                                                                                                                                                                                                                                                                                                                           |
| `POST` | `.../transactions/query`           | Advanced query                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### 3.4 Loan Charges — `/v1/loans/{loanId}/charges`

| Method   | Path                     | Description                                                |
| -------- | ------------------------ | ---------------------------------------------------------- |
| `GET`    | `.../charges/template`   | Charge template (available charges for this loan)          |
| `GET`    | `.../charges`            | List charges                                               |
| `GET`    | `.../charges/{chargeId}` | Charge detail                                              |
| `POST`   | `.../charges`            | Add charge (mandatory: chargeId, amount)                   |
| `PUT`    | `.../charges/{chargeId}` | Update charge (when not yet approved)                      |
| `POST`   | `.../charges/{chargeId}` | Command: `pay`, `waive`, `adjustment`, `deactivateOverdue` |
| `DELETE` | `.../charges/{chargeId}` | Delete charge                                              |

### 3.5 Loan Collateral — `/v1/loans/{loanId}/collateral`

| Method   | Path                            | Description |
| -------- | ------------------------------- | ----------- |
| `GET`    | `.../collateral`                | List        |
| `GET`    | `.../collateral/{collateralId}` | Detail      |
| `POST`   | `.../collateral`                | Create      |
| `PUT`    | `.../collateral/{collateralId}` | Update      |
| `DELETE` | `.../collateral/{collateralId}` | Delete      |

### 3.6 Loan Guarantors — `/v1/loans/{loanId}/guarantors`

| Method   | Path                           | Description |
| -------- | ------------------------------ | ----------- |
| `GET`    | `.../guarantors`               | List        |
| `GET`    | `.../guarantors/{guarantorId}` | Detail      |
| `POST`   | `.../guarantors`               | Create      |
| `PUT`    | `.../guarantors/{guarantorId}` | Update      |
| `DELETE` | `.../guarantors/{guarantorId}` | Delete      |

### 3.7 Loan Rescheduling — `/v1/rescheduleloans`

| Method | Path                               | Description                  |
| ------ | ---------------------------------- | ---------------------------- |
| `GET`  | `/v1/rescheduleloans/template`     | Reschedule reasons template  |
| `GET`  | `/v1/rescheduleloans`              | List requests                |
| `GET`  | `/v1/rescheduleloans/{scheduleId}` | Detail                       |
| `POST` | `/v1/rescheduleloans`              | Create reschedule request    |
| `POST` | `/v1/rescheduleloans/{scheduleId}` | Command: `approve`, `reject` |

### 3.8 Product Mix — `/v1/loanproducts/{productId}/productmix`

| Method   | Path                                      | Description                            |
| -------- | ----------------------------------------- | -------------------------------------- |
| `GET`    | `/v1/loanproducts/{productId}/productmix` | Details + `?template=true` for options |
| `POST`   | `/v1/loanproducts/{productId}/productmix` | Create product mix restrictions        |
| `PUT`    | `/v1/loanproducts/{productId}/productmix` | Update restrictions                    |
| `DELETE` | `/v1/loanproducts/{productId}/productmix` | Delete all restrictions                |

Restriction defines products that **cannot co-exist** as active loans with the same client/group. Enforced during loan application validation.

### 3.9 Point-in-Time View — `/v1/loans/at-date`

| Method | Path                                                            | Description                                 |
| ------ | --------------------------------------------------------------- | ------------------------------------------- |
| `GET`  | `/v1/loans/at-date/{loanId}?date=...&dateFormat=...&locale=...` | Snapshot of loan state at a specific date   |
| `GET`  | `/v1/loans/at-date/external-id/{loanExternalId}?date=...`       | By external loan ID                         |
| `POST` | `/v1/loans/at-date/search`                                      | Bulk retrieve by loan IDs `{loanIds, date}` |
| `POST` | `/v1/loans/at-date/search/external-id`                          | Bulk retrieve by external IDs               |

All computation is in-memory and **not persisted** (transaction is rolled back). Returns principal, interest, fee, penalty, total breakdowns plus arrears data.

### 3.10 Interest Pause — `/v1/loans/{loanId}/interest-pauses`

| Method   | Path                                | Description                       |
| -------- | ----------------------------------- | --------------------------------- |
| `GET`    | `.../interest-pauses`               | List pauses                       |
| `POST`   | `.../interest-pauses`               | Create pause (startDate, endDate) |
| `PUT`    | `.../interest-pauses/{variationId}` | Update pause                      |
| `DELETE` | `.../interest-pauses/{variationId}` | Delete pause                      |

Only supported for **progressive** loans with **interest recalculation enabled** on **active** loans. Regenerates schedule after create/update/delete.

### 3.11 Bulk Reassignment — `/v1/loans/loanreassignment`

| Method | Path                                  | Description                                 |
| ------ | ------------------------------------- | ------------------------------------------- |
| `GET`  | `/v1/loans/loanreassignment/template` | Template with office + loan officer options |
| `POST` | `/v1/loans/loanreassignment`          | Execute bulk reassignment                   |

Also supports single-loan commands via `POST /v1/loans/{loanId}?command=assignloanofficer` and `?command=unassignloanofficer`.

### 3.12 Buydown Fees — `/v1/loans/{loanId}/buydown-fees`

| Method | Path               | Description                           |
| ------ | ------------------ | ------------------------------------- |
| `GET`  | `.../buydown-fees` | List buydown fee amortization details |

Buydown fees are added via loan transactions (type 40, `BUY_DOWN_FEE`). The feature is enabled at the **loan product** level via `enableBuyDownFee`.

### 3.13 Capitalized Income — `/v1/loans/{loanId}/capitalized-incomes`

| Method | Path                             | Description                                    |
| ------ | -------------------------------- | ---------------------------------------------- |
| `GET`  | `.../capitalized-incomes`        | List capitalized income details (amortization) |
| `GET`  | `.../capitalized-incomes/{txId}` | Allocation data per transaction                |

Capitalized income is added via loan transactions (type 35, `CAPITALIZED_INCOME`). Enabled at the **loan product** level via `enableIncomeCapitalization`.

### 3.14 Post-Dated Checks — `/v1/loans/{loanId}/postdatedchecks`

| Method   | Path                                           | Description               |
| -------- | ---------------------------------------------- | ------------------------- |
| `GET`    | `.../postdatedchecks`                          | List PDCs                 |
| `GET`    | `.../postdatedchecks/{installmentId}`          | Single PDC by installment |
| `PUT`    | `.../postdatedchecks/{pdcId}?editType=update`  | Update PDC details        |
| `PUT`    | `.../postdatedchecks/{pdcId}?editType=bounced` | Mark PDC as bounced       |
| `DELETE` | `.../postdatedchecks/{pdcId}`                  | Delete PDC                |

Statuses: `0=PENDING`, `1=BOUNCED`, `2=PAID`. PDCs can also be passed at loan disbursement via a `postDatedChecks` JSON array.

### 3.15 Loan Documents — `/v1/loans/{loanId}/documents`

| Method   | Path                                    | Description                                   |
| -------- | --------------------------------------- | --------------------------------------------- |
| `GET`    | `.../documents`                         | List documents                                |
| `GET`    | `.../documents/{documentId}`            | Document metadata                             |
| `GET`    | `.../documents/{documentId}/attachment` | Download binary file                          |
| `POST`   | `.../documents`                         | Upload (multipart: file + name + description) |
| `PUT`    | `.../documents/{documentId}`            | Update (multipart)                            |
| `DELETE` | `.../documents/{documentId}`            | Delete                                        |

Uses generic document infrastructure (`{entityType}/{entityId}/documents`). Files stored on filesystem or S3 depending on configuration.

### 3.16 Loan Notes — `/v1/loans/{loanId}/notes`

| Method   | Path                 | Description                             |
| -------- | -------------------- | --------------------------------------- |
| `GET`    | `.../notes`          | List notes (descending by created date) |
| `GET`    | `.../notes/{noteId}` | Single note                             |
| `POST`   | `.../notes`          | Create note `{note: "..."}`             |
| `PUT`    | `.../notes/{noteId}` | Update note                             |
| `DELETE` | `.../notes/{noteId}` | Delete note                             |

Notes can also be retrieved inline with loan detail via `GET /v1/loans/{id}?associations=notes`. Two note types: `LOAN (200)` — general, `LOAN_TRANSACTION (300)` — attached to specific transactions.

---

## 4. CRUD

### 4.1 Loan Account

#### Template (for Create page)

```
GET /v1/loans/template?templateType=individual&clientId=1
GET /v1/loans/template?templateType=individual&clientId=1&productId=2
GET /v1/loans/template?templateType=group&groupId=1&productId=2
GET /v1/loans/template?templateType=jlg&clientId=1&groupId=1&productId=2
GET /v1/loans/template?templateType=jlgbulk&groupId=1&productId=2
```

#### Create Application

```json
POST /v1/loans
{
  "clientId": 1,
  "productId": 2,
  "loanType": "individual",
  "principal": 10000.00,
  "loanTermFrequency": 12,
  "loanTermFrequencyType": 2,
  "numberOfRepayments": 12,
  "repaymentEvery": 1,
  "repaymentFrequencyType": 2,
  "interestRatePerPeriod": 12.0,
  "interestRateFrequencyType": 3,
  "amortizationType": 1,
  "interestType": 0,
  "interestCalculationPeriodType": 1,
  "transactionProcessingStrategyCode": "mifos-standard-strategy",
  "expectedDisbursementDate": "15 July 2024",
  "submittedOnDate": "01 July 2024",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en",
  "expectedFirstRepaymentOnDate": "15 August 2024",
  "graceOnPrincipalPayment": 0,
  "graceOnInterestPayment": 0,
  "graceOnInterestCharged": 0,
  "linkAccountId": 42,
  "externalId": "EXT-LOAN-001"
}
```

#### Calculate Schedule (before submit)

```json
POST /v1/loans?command=calculateLoanSchedule
{
  "clientId": 1,
  "productId": 2,
  "principal": 10000.00,
  "loanTermFrequency": 12,
  "loanTermFrequencyType": 2,
  "numberOfRepayments": 12,
  "repaymentEvery": 1,
  "repaymentFrequencyType": 2,
  "interestRatePerPeriod": 12.0,
  "interestRateFrequencyType": 3,
  "amortizationType": 1,
  "interestType": 0,
  "interestCalculationPeriodType": 1,
  "expectedDisbursementDate": "15 July 2024",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

#### Approve

```json
POST /v1/loans/1?command=approve
{
  "approvedOnDate": "01 July 2024",
  "approvedLoanAmount": 10000.00,
  "expectedDisbursementDate": "15 July 2024",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

#### Disburse

```json
POST /v1/loans/1?command=disburse
{
  "actualDisbursementDate": "15 July 2024",
  "transactionAmount": 10000.00,
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

#### List loans

```
GET /v1/loans?offset=0&limit=50&orderBy=id&sortOrder=DESC
GET /v1/loans?clientId=1
GET /v1/loans?status=active
```

#### Detail

```
GET /v1/loans/1?associations=all
GET /v1/loans/1?associations=repaymentSchedule,transactions
```

#### Update (while in Submitted)

```
PUT /v1/loans/1
{ "principal": 15000.00 }
```

#### Delete (while in Submitted)

```
DELETE /v1/loans/1
```

### 4.2 Loan Repayment

```json
POST /v1/loans/1/transactions?command=repayment
{
  "transactionDate": "15 August 2024",
  "transactionAmount": 1000.00,
  "dateFormat": "dd MMMM yyyy",
  "locale": "en",
  "paymentTypeId": 1,
  "note": "First installment"
}
```

### 4.3 Loan Write-Off

```json
POST /v1/loans/1/transactions?command=writeoff
{
  "transactionDate": "15 December 2024",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en",
  "note": "Unable to recover"
}
```

### 4.4 Loan Charge-Off

```json
POST /v1/loans/1/transactions?command=charge-off
{
  "transactionDate": "15 December 2024",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en",
  "externalId": "CO-001"
}
```

### 4.5 Loan Reschedule Request

```json
POST /v1/rescheduleloans
{
  "loanId": 1,
  "rescheduleFromDate": "15 October 2024",
  "rescheduleReasonId": 1,
  "submittedOnDate": "01 October 2024",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en",
  "adjustedDueDate": "15 November 2024",
  "graceOnPrincipal": 1,
  "graceOnInterest": 0,
  "newInterestRate": 12.0,
  "extraTerms": 3
}
```

### 4.6 Loan Product Create (core fields)

```json
POST /v1/loanproducts
{
  "name": "Standard Loan",
  "shortName": "STD",
  "description": "Standard individual loan product",
  "currencyCode": "USD",
  "digitsAfterDecimal": 2,
  "inMultiplesOf": 0,
  "principal": 10000.00,
  "minPrincipal": 1000.00,
  "maxPrincipal": 100000.00,
  "numberOfRepayments": 12,
  "minNumberOfRepayments": 1,
  "maxNumberOfRepayments": 60,
  "repaymentEvery": 1,
  "repaymentFrequencyType": 2,
  "interestRatePerPeriod": 12.0,
  "minInterestRatePerPeriod": 5.0,
  "maxInterestRatePerPeriod": 30.0,
  "interestRateFrequencyType": 3,
  "amortizationType": 1,
  "interestType": 0,
  "interestCalculationPeriodType": 1,
  "transactionProcessingStrategyCode": "mifos-standard-strategy",
  "accountingRule": 1,
  "daysInYearType": 365,
  "daysInMonthType": 30,
  "isInterestRecalculationEnabled": false,
  "multiDisburseLoan": false
}
```

---

## 5. Lookup API Table

| UI Component                    | Endpoint                                                                   | Label Field   | Value Field | Required      | Notes                                   |
| ------------------------------- | -------------------------------------------------------------------------- | ------------- | ----------- | ------------- | --------------------------------------- |
| Client                          | `GET /v1/clients/{id}`                                                     | `displayName` | `id`        | Yes\*         | \*If individual/JLG loan                |
| Group                           | `GET /v1/groups/{id}`                                                      | `name`        | `id`        | Yes\*         | \*If group/JLG loan                     |
| Loan Product                    | `GET /v1/loanproducts`                                                     | `name`        | `id`        | Yes           |                                         |
| Loan Officer                    | `GET /v1/loans/template` → `loanOfficerOptions`                            | `displayName` | `id`        | No            | Filtered by office                      |
| Fund                            | `GET /v1/loans/template` → `fundOptions`                                   | `name`        | `id`        | No            |                                         |
| Loan Purpose                    | `GET /v1/loans/template` → `loanPurposeOptions`                            | `name`        | `id`        | No            | Code: `LoanPurpose`                     |
| Collateral Type                 | `GET /v1/loans/template?templateType=collateral` → `loanCollateralOptions` | `name`        | `id`        | No            | Code: `LoanCollateral`                  |
| Term Frequency Type             | `GET /v1/loanproducts/template` → `termFrequencyTypeOptions`               | `value`       | `id`        | Yes           | 0=Days, 1=Weeks, 2=Months, 3=Years      |
| Repayment Frequency Type        | template → `repaymentFrequencyTypeOptions`                                 | `value`       | `id`        | Yes           | 0=Days, 1=Weeks, 2=Months               |
| Interest Rate Frequency         | template → `interestRateFrequencyTypeOptions`                              | `value`       | `id`        | Yes           | 2=Per month, 3=Per year                 |
| Amortization Type               | template → `amortizationTypeOptions`                                       | `value`       | `id`        | Yes           | 0=Equal principal, 1=Equal installments |
| Interest Type                   | template → `interestTypeOptions`                                           | `value`       | `id`        | Yes           | 0=Declining balance, 1=Flat             |
| Interest Calculation Period     | template → `interestCalculationPeriodTypeOptions`                          | `value`       | `id`        | Yes           | 0=Daily, 1=Same as repayment period     |
| Transaction Processing Strategy | template → `transactionProcessingStrategyOptions`                          | `name`        | `code`      | Yes           |                                         |
| Charges                         | `GET /v1/charges?isLoanCharge=true`                                        | `name`        | `id`        | No            |                                         |
| Payment Type                    | `GET /v1/paymenttypes`                                                     | `name`        | `id`        | No            | For transactions                        |
| Linked Savings Account          | `GET /v1/loans/template` → `accountLinkingOptions`                         | `accountNo`   | `id`        | No            | Active savings accounts                 |
| Currency                        | `GET /v1/currencies`                                                       | `name`        | `code`      | Yes (product) |                                         |
| Reschedule Reason               | `GET /v1/rescheduleloans/template`                                         | `name`        | `id`        | Yes           | Code: `RescheduleLoansReason`           |
| Days in Year Type               | template → `daysInYearTypeOptions`                                         | `value`       | `id`        | Yes (product) | 360, 365                                |
| Days in Month Type              | template → `daysInMonthTypeOptions`                                        | `value`       | `id`        | Yes (product) | 30, actual                              |
| From Loan Officer (reassign)    | `GET /v1/loans/loanreassignment/template?officeId=X`                       | `displayName` | `id`        | Yes           | Filtered by office                      |
| Buydown Income Type             | `GET /v1/loanproducts/template` → `buyDownFeeIncomeTypeOptions`            | `value`       | `id`        | Yes (product) | FEE / INTEREST                          |
| Buydown Calculation Type        | `GET /v1/loanproducts/template` → `buyDownFeeCalculationTypeOptions`       | `value`       | `id`        | Yes (product) | FLAT                                    |
| Capitalized Income Type         | `GET /v1/loanproducts/template` → `capitalizedIncomeTypeOptions`           | `value`       | `id`        | Yes (product) | FEE / INTEREST                          |
| Product Mix (restricted)        | `GET /v1/loanproducts/{id}/productmix` → `restrictedProducts`              | `name`        | `id`        | No            | Products that cannot co-exist           |
| Product Mix (options)           | `GET /v1/loanproducts/{id}/productmix?template=true` → `productOptions`    | `name`        | `id`        | No            | Products not in any mix                 |

---

## 6. Dependency Graph

### Loan Application Create Page

```
Page Load (templateType=individual, clientId=1)
  ↓
GET /v1/loans/template?templateType=individual&clientId=1
  ↓
Populate: productOptions, loanOfficerOptions, fundOptions, loanPurposeOptions,
  interestTypeOptions, amortizationTypeOptions, repaymentFrequencyTypeOptions,
  transactionProcessingStrategyOptions, chargeOptions, accountLinkingOptions
  ↓
User selects Loan Product
  ↓
GET /v1/loans/template?templateType=individual&clientId=1&productId=2
  ↓
Populate: product-specific defaults (interest rates, min/max principal, terms, charges)
  ↓
User fills principal, term, repayment schedule, interest rate
  ↓ (optional)
User clicks "Calculate" → POST /v1/loans?command=calculateLoanSchedule
  → Preview repayment schedule
  ↓
User adds charges (optional)
  ↓
POST /v1/loans → resourceId (submitted state)
```

### Loan Approval Flow

```
1. GET /v1/loans/{loanId} (check status=100, review details)
2. GET /v1/loans/{loanId}/template (approval template with current data)
3. POST /v1/loans/{loanId}?command=approve
   { approvedOnDate, approvedLoanAmount?, expectedDisbursementDate? }
4. POST /v1/loans/{loanId}?command=disburse (or disburseToSavings)
   { actualDisbursementDate, transactionAmount? }
```

### Loan Transaction Flow

```
1. GET /v1/loans/{loanId}/transactions/template?command=repayment
   → payment type options, current outstanding balance info
2. POST /v1/loans/{loanId}/transactions?command=repayment
   { transactionDate, transactionAmount, paymentTypeId }
3. GET /v1/loans/{loanId}?associations=transactions (refresh)
```

---

## 7. Form Layout

### 7.1 Loan Application Create Form

**Client Selection** (varies by loanType)

- `clientId` (select/auto, required for individual/jlg)
- `groupId` (select/auto, required for group/jlg)

**Product & Principal**

- `productId` (select, required) — populates all term defaults
- `principal` (number, required)
- `loanTermFrequency` (number, required) + `loanTermFrequencyType` (select)
- `numberOfRepayments` (number, required)
- `repaymentEvery` (number, required) + `repaymentFrequencyType` (select)

**Interest**

- `interestRatePerPeriod` (number, required) + `interestRateFrequencyType` (select)
- `interestType` (select, required) — Declining Balance or Flat
- `amortizationType` (select, required) — Equal Principal or Equal Installments
- `interestCalculationPeriodType` (select, required)
- `allowPartialPeriodInterestCalculation` (checkbox)
- `inArrearsTolerance` (number, optional)

**Dates**

- `submittedOnDate` (date, required)
- `expectedDisbursementDate` (date, required)
- `expectedFirstRepaymentOnDate` (date, optional)

**Grace Settings**

- `graceOnPrincipalPayment` (number, optional)
- `graceOnInterestPayment` (number, optional)
- `graceOnInterestCharged` (number, optional)
- `graceOnArrearsAgeing` (number, optional)

**Strategy**

- `transactionProcessingStrategyCode` (select, required)

**Additional**

- `externalId` (text, optional)
- `fundId` (select, optional)
- `loanOfficerId` (select, optional)
- `loanPurposeId` (select, optional)
- `linkAccountId` (select, optional) — linked savings account
- `createStandingInstructionAtDisbursement` (checkbox)

**Schedule Preview** (calculated on demand)

- `POST /v1/loans?command=calculateLoanSchedule` → display amortization table

**Charges** (added after product selection)

- Table of charges inherited from product + manually added

**Collateral** (optional section)

- Collateral type + value

### 7.2 Loan Product Create Form

**Basic Information**

- `name`, `shortName`, `description`

**Currency**

- `currencyCode`, `digitsAfterDecimal`, `inMultiplesOf`

**Principal Range**

- `principal`, `minPrincipal`, `maxPrincipal`

**Repayment Terms**

- `numberOfRepayments`, `minNumberOfRepayments`, `maxNumberOfRepayments`
- `repaymentEvery`, `repaymentFrequencyType`

**Interest**

- `interestRatePerPeriod`, `minInterestRatePerPeriod`, `maxInterestRatePerPeriod`
- `interestRateFrequencyType`, `amortizationType`, `interestType`
- `interestCalculationPeriodType`, `allowPartialPeriodInterestCalculation`
- `daysInYearType`, `daysInMonthType`

**Grace**

- `graceOnPrincipalPayment`, `graceOnInterestPayment`, `graceOnInterestCharged`
- `graceOnArrearsAgeing`

**Strategy**

- `transactionProcessingStrategyCode`

**Multi-disburse**

- `multiDisburseLoan`, `maxTrancheCount`, `outstandingLoanBalance`
- `canDefineInstallmentAmount`, `installmentAmountInMultiplesOf`

**Recalculation** (if enabled)

- `isInterestRecalculationEnabled`, `interestRecalculationCompoundingMethod`
- `rescheduleStrategyMethod`, `recalculationRestFrequencyType`
- `preClosureInterestCalculationStrategy`

**Down Payment**

- `enableDownPayment`, `disbursedAmountPercentageDownPayment`
- `enableAutoRepaymentForDownPayment`, `repaymentStartDateType`

**Buydown Fee** (progressive loan only, 3rd-party interest rate buydown)

- `enableBuyDownFee`, `merchantBuyDownFee` (boolean)
- `buyDownFeeCalculationType` (enum: `FLAT`)
- `buyDownFeeStrategy` (enum: `EQUAL_AMORTIZATION`)
- `buyDownFeeIncomeType` (enum: `FEE` / `INTEREST`)
- GL accounts: `buyDownExpenseAccountId`, `incomeFromBuyDownAccountId`

**Income Capitalization** (progressive loan only, deferred income recognition)

- `enableIncomeCapitalization` (boolean)
- `capitalizedIncomeCalculationType` (enum: `FLAT`)
- `capitalizedIncomeStrategy` (enum: `EQUAL_AMORTIZATION`)
- `capitalizedIncomeType` (enum: `FEE` / `INTEREST`)
- GL accounts: `deferredIncomeLiabilityAccountId`, `incomeFromCapitalizationAccountId`
- Optional: per-classification mappings `capitalizedIncomeClassificationToIncomeAccountMappings`

**Product Mix Restrictions**

- Managed via separate API at `/v1/loanproducts/{productId}/productmix`
- `restrictedProducts` — list of product IDs that cannot co-exist with this product for the same client/group

**Charges** (multi-select)

- Fee charges and penalty charges

**Accounting**

- `accountingRule` — None, Cash, Accrual Periodic, Accrual Upfront
- GL account mappings (conditional on accounting rule)

---

## 8. API Call Sequence

### Loan List Page

```
1. GET /v1/loans?offset=0&limit=50&orderBy=id&sortOrder=DESC
   → Page<LoanAccountData>
2. GET /v1/loans?clientId=1 (filter by client)
3. GET /v1/loans?status=active (filter by status)
```

### Loan Detail Page

```
1. GET /v1/loans/{id}?associations=all
   → LoanAccountData with summary, repaymentSchedule, transactions, charges, collateral, guarantors
2. GET /v1/loans/{id}/delinquencytags (delinquency history)
```

### Loan Application Create

```
1. GET /v1/loans/template?templateType=individual&clientId=1
2. (User selects product) → GET /v1/loans/template?templateType=individual&clientId=1&productId=2
3. (User clicks preview schedule) → POST /v1/loans?command=calculateLoanSchedule
4. POST /v1/loans → resourceId
```

### Approve → Disburse → Repayment

```
1. POST /v1/loans/{id}?command=approve
2. POST /v1/loans/{id}?command=disburse (or disburseToSavings)
3. POST /v1/loans/{id}/transactions?command=repayment
4. GET /v1/loans/{id}?associations=transactions (check updated balance)
```

### Write Off

```
1. POST /v1/loans/{id}/transactions?command=writeoff
```

### Reschedule Loan

```
1. GET /v1/rescheduleloans/template (reschedule reasons)
2. POST /v1/rescheduleloans (create request)
3. POST /v1/rescheduleloans/{scheduleId}?command=approve
```

---

## 9. TypeScript Interfaces

```typescript
// ============================================================
// Loan Account
// ============================================================
export interface LoanAccountData {
  id: number;
  accountNo: string;
  externalId: string;
  status: LoanStatusEnumData;
  subStatus: EnumOptionData;
  clientId: number;
  clientName: string;
  group: GroupGeneralData | null;
  loanProductId: number;
  loanProductName: string;
  fundId: number | null;
  fundName: string | null;
  loanPurposeId: number | null;
  loanPurposeName: string | null;
  loanOfficerId: number | null;
  loanOfficerName: string | null;
  loanType: EnumOptionData;
  currency: CurrencyData;
  principal: number;
  approvedPrincipal: number;
  proposedPrincipal: number;
  netDisbursalAmount: number;
  termFrequency: number;
  termPeriodFrequencyType: EnumOptionData;
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: EnumOptionData;
  interestRatePerPeriod: number;
  interestRateFrequencyType: EnumOptionData;
  annualInterestRate: number;
  amortizationType: EnumOptionData;
  interestType: EnumOptionData;
  interestCalculationPeriodType: EnumOptionData;
  allowPartialPeriodInterestCalculation: boolean;
  inArrearsTolerance: number;
  transactionProcessingStrategyCode: string;
  transactionProcessingStrategyName: string;
  graceOnPrincipalPayment: number;
  graceOnInterestPayment: number;
  graceOnInterestCharged: number;
  graceOnArrearsAgeing: number;
  interestChargedFromDate: string | null;
  expectedFirstRepaymentOnDate: string | null;
  timeline: LoanApplicationTimelineData;
  summary: LoanSummaryData;
  repaymentSchedule: LoanScheduleData;
  transactions: LoanTransactionData[];
  charges: LoanChargeData[];
  collateral: LoanCollateralManagementData[];
  guarantors: GuarantorData[];
  delinquent: CollectionData;
  delinquencyRange: DelinquencyRangeData;
  fraud: boolean;
  chargedOff: boolean;
  inArrears: boolean;
  isNPA: boolean;

  // template
  productOptions?: LoanProductData[];
  loanOfficerOptions?: StaffData[];
  loanPurposeOptions?: CodeValueData[];
  fundOptions?: FundData[];
  chargeOptions?: ChargeData[];
  loanCollateralOptions?: CodeValueData[];
  transactionProcessingStrategyOptions?: TransactionProcessingStrategyData[];
  accountLinkingOptions?: PortfolioAccountData[];

  // template options
  termFrequencyTypeOptions?: EnumOptionData[];
  repaymentFrequencyTypeOptions?: EnumOptionData[];
  interestRateFrequencyTypeOptions?: EnumOptionData[];
  amortizationTypeOptions?: EnumOptionData[];
  interestTypeOptions?: EnumOptionData[];
  interestCalculationPeriodTypeOptions?: EnumOptionData[];
}

export interface LoanStatusEnumData {
  id: number;
  code: string;
  value: string;
  submittedAndPendingApproval: boolean;
  approved: boolean;
  active: boolean;
  withdrawnByClient: boolean;
  rejected: boolean;
  closedObligationsMet: boolean;
  closedWrittenOff: boolean;
  closedRescheduleOutstandingAmount: boolean;
  overpaid: boolean;
  pendingApproval: boolean;
  waitingForDisbursal: boolean;
}

export interface LoanApplicationTimelineData {
  submittedOnDate: string;
  submittedByUsername: string;
  approvedOnDate: string | null;
  approvedByUsername: string | null;
  expectedDisbursementDate: string;
  actualDisbursementDate: string | null;
  disbursedByUsername: string | null;
  closedOnDate: string | null;
  expectedMaturityDate: string;
}

export interface LoanSummaryData {
  currency: CurrencyData;
  principalDisbursed: number;
  principalPaid: number;
  principalWrittenOff: number;
  principalOutstanding: number;
  interestCharged: number;
  interestPaid: number;
  interestWaived: number;
  interestWrittenOff: number;
  interestOutstanding: number;
  feeChargesCharged: number;
  feeChargesDueAtDisbursement: number;
  feeChargesPaid: number;
  feeChargesWaived: number;
  feeChargesWrittenOff: number;
  feeChargesOutstanding: number;
  penaltyChargesCharged: number;
  penaltyChargesPaid: number;
  penaltyChargesWaived: number;
  penaltyChargesWrittenOff: number;
  penaltyChargesOutstanding: number;
  totalExpectedRepayment: number;
  totalRepayment: number;
  totalExpectedCostOfLoan: number;
  totalCostOfLoan: number;
  totalWaived: number;
  totalWrittenOff: number;
  totalOutstanding: number;
  overpaid: number;
}

export interface CreateLoanApplicationRequest {
  clientId?: number;
  groupId?: number;
  productId: number;
  loanType: "individual" | "group" | "jlg";
  principal: number;
  loanTermFrequency: number;
  loanTermFrequencyType: number;
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: number;
  interestRatePerPeriod: number;
  interestRateFrequencyType: number;
  amortizationType: number;
  interestType: number;
  interestCalculationPeriodType: number;
  transactionProcessingStrategyCode: string;
  expectedDisbursementDate: string;
  submittedOnDate: string;
  dateFormat: string;
  locale: string;
  externalId?: string;
  fundId?: number;
  loanOfficerId?: number;
  loanPurposeId?: number;
  graceOnPrincipalPayment?: number;
  graceOnInterestPayment?: number;
  graceOnInterestCharged?: number;
  graceOnArrearsAgeing?: number;
  interestChargedFromDate?: string;
  expectedFirstRepaymentOnDate?: string;
  linkAccountId?: number;
  createStandingInstructionAtDisbursement?: boolean;
  fixedEmiAmount?: number;
  maxOutstandingLoanBalance?: number;
  allowPartialPeriodInterestCalculation?: boolean;
  inArrearsTolerance?: number;
}

export interface ApproveLoanRequest {
  approvedOnDate: string;
  dateFormat: string;
  locale: string;
  approvedLoanAmount?: number;
  expectedDisbursementDate?: string;
  note?: string;
}

export interface DisburseLoanRequest {
  actualDisbursementDate: string;
  dateFormat: string;
  locale: string;
  transactionAmount?: number;
  fixedEmiAmount?: number;
  note?: string;
}

// ============================================================
// Loan Transaction
// ============================================================
export interface LoanTransactionData {
  id: number;
  loanId: number;
  officeId: number;
  type: LoanTransactionEnumData;
  date: string;
  currency: CurrencyData;
  paymentDetailData: PaymentDetailData | null;
  amount: number;
  netDisbursalAmount: number | null;
  principalPortion: number;
  interestPortion: number;
  feeChargesPortion: number;
  penaltyChargesPortion: number;
  overpaymentPortion: number;
  unrecognizedIncomePortion: number;
  externalId: string;
  outstandingLoanBalance: number;
  submittedOnDate: string;
  manuallyReversed: boolean;
  loanChargePaidByList: LoanChargePaidByData[];
  paymentTypeOptions?: PaymentTypeData[];
}

export interface LoanTransactionEnumData {
  id: number;
  code: string;
  value: string;
  repayment: boolean;
  disbursement: boolean;
  waiver: boolean;
  writeOff: boolean;
  recoveryRepayment: boolean;
  chargePayment: boolean;
  chargeOff: boolean;
  refund: boolean;
  creditBalanceRefund: boolean;
  goodwillCredit: boolean;
  downPayment: boolean;
  interestRefund: boolean;
}

export interface CreateLoanTransactionRequest {
  transactionDate: string;
  transactionAmount: number;
  dateFormat: string;
  locale: string;
  paymentTypeId?: number;
  note?: string;
  externalId?: string;
  numberOfRepayments?: number;
  chargeOffReasonId?: number;
}

// ============================================================
// Loan Charge
// ============================================================
export interface LoanChargeData {
  id: number;
  chargeId: number;
  name: string;
  chargeTimeType: EnumOptionData;
  dueDate: string;
  chargeCalculationType: EnumOptionData;
  percentage: number;
  amountPercentageAppliedTo: number;
  currency: CurrencyData;
  amount: number;
  amountPaid: number;
  amountWaived: number;
  amountWrittenOff: number;
  amountOutstanding: number;
  amountOrPercentage: number;
  penalty: boolean;
  paid: boolean;
  waived: boolean;
  chargePayable: boolean;
  installmentChargeData: LoanInstallmentChargeData[];
  chargeOptions?: ChargeData[];
}

export interface CreateLoanChargeRequest {
  chargeId: number;
  amount: number;
  dueDate?: string;
  dateFormat?: string;
  locale?: string;
}

// ============================================================
// Loan Product
// ============================================================
export interface LoanProductData {
  id: number;
  name: string;
  shortName: string;
  description: string;
  currency: CurrencyData;
  principal: number;
  minPrincipal: number;
  maxPrincipal: number;
  numberOfRepayments: number;
  minNumberOfRepayments: number;
  maxNumberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: EnumOptionData;
  interestRatePerPeriod: number;
  minInterestRatePerPeriod: number;
  maxInterestRatePerPeriod: number;
  interestRateFrequencyType: EnumOptionData;
  annualInterestRate: number;
  amortizationType: EnumOptionData;
  interestType: EnumOptionData;
  interestCalculationPeriodType: EnumOptionData;
  transactionProcessingStrategyCode: string;
  transactionProcessingStrategyName: string;
  accountingRule: EnumOptionData;
  accountingMappings: Record<string, object> | null;
  charges: ChargeData[];

  // template
  currencyOptions?: CurrencyData[];
  repaymentFrequencyTypeOptions?: EnumOptionData[];
  interestRateFrequencyTypeOptions?: EnumOptionData[];
  amortizationTypeOptions?: EnumOptionData[];
  interestTypeOptions?: EnumOptionData[];
  interestCalculationPeriodTypeOptions?: EnumOptionData[];
  transactionProcessingStrategyOptions?: TransactionProcessingStrategyData[];
  chargeOptions?: ChargeData[];
  fundOptions?: FundData[];
  accountingRuleOptions?: EnumOptionData[];
}

// ============================================================
// Loan Schedule
// ============================================================
export interface LoanScheduleData {
  calendarType: EnumOptionData;
  loanTermInDays: number;
  totalPrincipalDisbursed: number;
  totalPrincipalExpected: number;
  totalPrincipalPaid: number;
  totalInterestCharged: number;
  totalFeeChargesCharged: number;
  totalPenaltyChargesCharged: number;
  totalWaived: number;
  totalWrittenOff: number;
  totalRepaymentExpected: number;
  totalRepayment: number;
  totalOutstanding: number;
  periods: LoanSchedulePeriodData[];
}

export interface LoanSchedulePeriodData {
  period: number;
  dueDate: string;
  obligationsMetOnDate: string | null;
  completed: boolean;
  daysInPeriod: number;
  principalOriginalDue: number;
  principalDue: number;
  principalPaid: number;
  principalWrittenOff: number;
  principalLoanBalanceOutstanding: number;
  interestOriginalDue: number;
  interestDue: number;
  interestPaid: number;
  interestWaived: number;
  interestWrittenOff: number;
  feeChargesDue: number;
  feeChargesPaid: number;
  feeChargesWaived: number;
  feeChargesWrittenOff: number;
  penaltyChargesDue: number;
  penaltyChargesPaid: number;
  penaltyChargesWaived: number;
  penaltyChargesWrittenOff: number;
  totalDueForPeriod: number;
  totalPaidForPeriod: number;
  totalPaidInAdvanceForPeriod: number;
  totalPaidLateForPeriod: number;
  totalWaivedForPeriod: number;
  totalWrittenOffForPeriod: number;
  totalOutstandingForPeriod: number;
  totalActualCostOfLoanForPeriod: number;
  fromDate: string;
  repaid: boolean;
  late: boolean;
}

// ============================================================
// Shared
// ============================================================
export interface EnumOptionData {
  id: number;
  code: string;
  value: string;
}

export interface OfficeData {
  id: number;
  name: string;
  nameDecorated: string;
  officeType: EnumOptionData;
}

export interface CurrencyData {
  code: string;
  name: string;
  decimalPlaces: number;
  displaySymbol: string;
  nameCode: string;
  displayLabel: string;
}

export interface StaffData {
  id: number;
  displayName: string;
  officeId: number;
  isLoanOfficer: boolean;
}

export interface ChargeData {
  id: number;
  name: string;
  active: boolean;
  penalty: boolean;
  currency: CurrencyData;
  amount: number;
  chargeTimeType: EnumOptionData;
  chargeCalculationType: EnumOptionData;
  chargePaymentMode: EnumOptionData;
}

export interface CodeValueData {
  id: number;
  name: string;
  position?: number;
}

export interface PaymentDetailData {
  paymentTypeId: number;
  paymentTypeName: string;
  accountNumber: string;
  checkNumber: string;
  routingCode: string;
  receiptNumber: string;
  bankNumber: string;
}

export interface FundData {
  id: number;
  name: string;
}

export interface GroupGeneralData {
  id: number;
  name: string;
  clientMembers?: ClientData[];
}

export interface ClientData {
  id: number;
  displayName: string;
  officeId: number;
}

export interface PortfolioAccountData {
  id: number;
  accountNo: string;
  accountType: EnumOptionData;
}

export interface PaymentTypeData {
  id: number;
  name: string;
}

export interface GuarantorData {
  id: number;
  clientId: number;
  clientName: string;
  guarantorType: EnumOptionData;
  amount: number;
}

export interface LoanCollateralManagementData {
  id: number;
  type: CodeValueData;
  value: number;
  description: string;
}

export interface CollectionData {
  delinquentDays: number;
  delinquentAmount: number;
}

export interface DelinquencyRangeData {
  id: number;
  classification: string;
  minAge: number;
  maxAge: number;
}

export interface TransactionProcessingStrategyData {
  code: string;
  name: string;
}

export interface LoanRescheduleRequestData {
  id: number;
  loanId: number;
  status: EnumOptionData;
  rescheduleFromDate: string;
  submittedOnDate: string;
  rescheduleReasonId: number;
  rescheduleReasonName: string;
  adjustedDueDate: string;
  graceOnPrincipal: number;
  graceOnInterest: number;
  newInterestRate: number;
  extraTerms: number;
}

// ============================================================
// Product Mix
// ============================================================
export interface ProductMixData {
  productId: number;
  productName: string;
  restrictedProducts: LoanProductData[];
  allowedProducts: LoanProductData[];
  productOptions?: LoanProductData[];
}

export interface ProductMixRequest {
  restrictedProducts: number[];
}

// ============================================================
// Interest Pause
// ============================================================
export interface InterestPauseRequest {
  startDate: string;
  endDate: string;
  dateFormat: string;
  locale: string;
}

export interface InterestPauseResponse {
  id: number;
  startDate: string;
  endDate: string;
}

// ============================================================
// Point-in-Time
// ============================================================
export interface LoanPointInTimeData {
  id: number;
  accountNo: string;
  status: LoanStatusEnumData;
  currency: CurrencyData;
  principal: LoanPrincipalData;
  interest: LoanInterestData;
  fee: LoanFeeData;
  penalty: LoanPenaltyData;
  total: LoanTotalAmountData;
  clientId: number;
  clientDisplayName: string;
  loanProductId: number;
  loanProductName: string;
  arrears: LoanArrearsData;
}

export interface LoanPrincipalData {
  principalDisbursed: number;
  principalAdjustments: number;
  principalPaid: number;
  principalWrittenOff: number;
  principalOutstanding: number;
}

export interface LoanInterestData {
  interestCharged: number;
  interestPaid: number;
  interestWaived: number;
  interestWrittenOff: number;
  interestOutstanding: number;
}

export interface LoanFeeData {
  feeChargesCharged: number;
  feeAdjustments: number;
  feeChargesDueAtDisbursementCharged: number;
  feeChargesPaid: number;
  feeChargesWaived: number;
  feeChargesWrittenOff: number;
  feeChargesOutstanding: number;
}

export interface LoanPenaltyData {
  penaltyChargesCharged: number;
  penaltyAdjustments: number;
  penaltyChargesPaid: number;
  penaltyChargesWaived: number;
  penaltyChargesWrittenOff: number;
  penaltyChargesOutstanding: number;
}

export interface LoanTotalAmountData {
  totalExpectedRepayment: number;
  totalRepayment: number;
  totalExpectedCostOfLoan: number;
  totalCostOfLoan: number;
  totalWaived: number;
  totalWrittenOff: number;
  totalOutstanding: number;
}

export interface LoanArrearsData {
  principalOverdue: number;
  interestOverdue: number;
  feeOverdue: number;
  penaltyOverdue: number;
  totalOverdue: number;
  overdueSinceDate: string;
  isOverdue: boolean;
}

// ============================================================
// Buydown Fee & Capitalized Income
// ============================================================
export interface BuydownFeeDetails {
  id: number;
  amount: number;
  amortizedAmount: number;
  unrecognizedAmount: number;
  amountAdjustment: number;
  chargedOffAmount: number;
}

export interface CapitalizedIncomeDetails {
  amount: number;
  amortizedAmount: number;
  unrecognizedAmount: number;
  amountAdjustment: number;
  chargedOffAmount: number;
}

// ============================================================
// Post-Dated Checks
// ============================================================
export interface PostDatedCheckData {
  id: number;
  installmentId: number;
  name: string;
  accountNo: string;
  amount: number;
  installmentDate: string;
  checkNo: string;
  status: "PENDING" | "BOUNCED" | "PAID";
}

// ============================================================
// Loan Documents
// ============================================================
export interface LoanDocumentData {
  id: number;
  parentEntityType: string;
  parentEntityId: number;
  name: string;
  fileName: string;
  size: number;
  type: string;
  description: string;
  location: string;
  storageType: number;
}

// ============================================================
// Loan Notes
// ============================================================
export interface LoanNoteData {
  id: number;
  loanId: number;
  noteType: EnumOptionData;
  note: string;
  createdById: number;
  createdByUsername: string;
  createdOn: string;
  updatedById: number | null;
  updatedOn: string | null;
}

// ============================================================
// Bulk Reassignment
// ============================================================
export interface BulkReassignmentRequest {
  fromLoanOfficerId: number;
  toLoanOfficerId: number;
  assignmentDate: string;
  loans: number[];
  locale: string;
  dateFormat: string;
}

export interface BulkTransferData {
  officeOptions: OfficeData[];
  loanOfficerOptions: StaffData[];
  accountSummaryCollection: StaffAccountSummaryData[];
}

export interface StaffAccountSummaryData {
  staffId: number;
  staffName: string;
  clients: ClientLoanSummaryData[];
  groups: GroupLoanSummaryData[];
}

export interface ClientLoanSummaryData {
  clientId: number;
  clientName: string;
  loans: LoanSummaryItemData[];
}

export interface GroupLoanSummaryData {
  groupId: number;
  groupName: string;
  loans: LoanSummaryItemData[];
}

export interface LoanSummaryItemData {
  loanId: number;
  accountNo: string;
  principal: number;
  outstanding: number;
  status: LoanStatusEnumData;
}

export interface CommandProcessingResult {
  resourceId: number;
  clientId?: number;
  loanId?: number;
  officeId?: number;
  changes?: Record<string, unknown>;
}

export interface Page<T> {
  totalFilteredRecords: number;
  pageItems: T[];
}
```

---

## 10. React Query Plan

### Query Key Factory

```typescript
export const loanKeys = {
  all: ["loans"] as const,
  list: (filters?: Record<string, unknown>) => [...loanKeys.all, "list", filters] as const,
  detail: (id: number) => [...loanKeys.all, "detail", id] as const,
  byExternalId: (externalId: string) => [...loanKeys.all, "externalId", externalId] as const,
  template: (params?: Record<string, unknown>) => [...loanKeys.all, "template", params] as const,
  approvalTemplate: (id: number) => [...loanKeys.all, "approvalTemplate", id] as const,
  transactions: (loanId: number) => [...loanKeys.all, "transactions", loanId] as const,
  transactionDetail: (loanId: number, txId: number) =>
    [...loanKeys.all, "transactions", loanId, "detail", txId] as const,
  charges: (loanId: number) => [...loanKeys.all, "charges", loanId] as const,
  collateral: (loanId: number) => [...loanKeys.all, "collateral", loanId] as const,
  guarantors: (loanId: number) => [...loanKeys.all, "guarantors", loanId] as const,
  schedule: (loanId: number) => [...loanKeys.all, "schedule", loanId] as const,
  delinquencyTags: (loanId: number) => [...loanKeys.all, "delinquency", loanId] as const,
  pointInTime: (loanId: number, date: string) => [...loanKeys.all, "pointInTime", loanId, date] as const,
  interestPauses: (loanId: number) => [...loanKeys.all, "interestPauses", loanId] as const,
  buydownFees: (loanId: number) => [...loanKeys.all, "buydownFees", loanId] as const,
  capitalizedIncomes: (loanId: number) => [...loanKeys.all, "capitalizedIncomes", loanId] as const,
  postDatedChecks: (loanId: number) => [...loanKeys.all, "postDatedChecks", loanId] as const,
  documents: (loanId: number) => [...loanKeys.all, "documents", loanId] as const,
  notes: (loanId: number) => [...loanKeys.all, "notes", loanId] as const,
};

export const loanProductKeys = {
  all: ["loanProducts"] as const,
  list: () => [...loanProductKeys.all, "list"] as const,
  detail: (id: number) => [...loanProductKeys.all, "detail", id] as const,
  template: () => [...loanProductKeys.all, "template"] as const,
  productMix: (id: number) => [...loanProductKeys.all, "productMix", id] as const,
};

export const rescheduleLoanKeys = {
  all: ["rescheduleLoans"] as const,
  list: () => [...rescheduleLoanKeys.all, "list"] as const,
  detail: (id: number) => [...rescheduleLoanKeys.all, "detail", id] as const,
  template: () => [...rescheduleLoanKeys.all, "template"] as const,
};

export const loanReassignmentKeys = {
  all: ["loanReassignment"] as const,
  template: (officeId?: number, fromLoanOfficerId?: number) =>
    [...loanReassignmentKeys.all, "template", officeId, fromLoanOfficerId] as const,
};
```

### Cache Invalidation

| Mutation                             | Invalidate                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Create/Update/Delete Loan            | `loanKeys.all`                                                                                   |
| Approve/Reject/Withdraw              | `loanKeys.detail(id)`, `loanKeys.all`                                                            |
| Disburse/Undo Disbursal              | `loanKeys.detail(id)`, `loanKeys.transactions(id)`, `loanKeys.schedule(id)`                      |
| Create Transaction (repayment, etc.) | `loanKeys.detail(id)`, `loanKeys.transactions(id)`, `loanKeys.schedule(id)`                      |
| Adjust/Undo Transaction              | `loanKeys.detail(id)`, `loanKeys.transactions(id)`, `loanKeys.schedule(id)`                      |
| Write Off / Charge Off               | `loanKeys.detail(id)`, `loanKeys.transactions(id)`                                               |
| Add/Update/Delete Charge             | `loanKeys.charges(id)`, `loanKeys.detail(id)`                                                    |
| Pay/Waive Charge                     | `loanKeys.charges(id)`, `loanKeys.detail(id)`, `loanKeys.transactions(id)`                       |
| Create Reschedule Request            | `rescheduleLoanKeys.all`                                                                         |
| Approve/Reject Reschedule            | `rescheduleLoanKeys.all`, `loanKeys.detail(loanId)`                                              |
| Create/Update/Delete Product Mix     | `loanProductKeys.productMix(productId)`, `loanProductKeys.all`                                   |
| Create/Update/Delete Interest Pause  | `loanKeys.detail(loanId)`, `loanKeys.interestPauses(loanId)`, `loanKeys.schedule(loanId)`        |
| Add Buydown Fee / Capitalized Income | `loanKeys.detail(loanId)`, `loanKeys.buydownFees(loanId)`, `loanKeys.capitalizedIncomes(loanId)` |
| Bulk Reassign Loan Officers          | `loanKeys.all`                                                                                   |
| Create/Update/Delete PDC             | `loanKeys.postDatedChecks(loanId)`, `loanKeys.detail(loanId)`                                    |
| Upload/Update/Delete Document        | `loanKeys.documents(loanId)`                                                                     |
| Create/Update/Delete Note            | `loanKeys.notes(loanId)`                                                                         |

### Example Hooks

```typescript
function useLoanTemplate(params: { templateType: string; clientId?: number; groupId?: number; productId?: number }) {
  return useQuery({
    queryKey: loanKeys.template(params),
    queryFn: () => loanService.getTemplate(params),
    enabled: !!params.templateType,
  });
}
```

---

## 12. Zod Validation

```typescript
import { z } from "zod";

// ============================================================
// Loan Application
// ============================================================
export const createLoanApplicationSchema = z
  .object({
    clientId: z.number().int().positive().optional(),
    groupId: z.number().int().positive().optional(),
    productId: z.number({ required_error: "Product is required" }).int().positive(),
    loanType: z.enum(["individual", "group", "jlg"]),
    principal: z.number({ required_error: "Principal is required" }).positive(),
    loanTermFrequency: z.number({ required_error: "Loan term is required" }).int().positive(),
    loanTermFrequencyType: z.number({ required_error: "Term frequency type is required" }).int(),
    numberOfRepayments: z.number({ required_error: "Number of repayments is required" }).int().positive(),
    repaymentEvery: z.number({ required_error: "Repayment every is required" }).int().positive(),
    repaymentFrequencyType: z.number({ required_error: "Repayment frequency is required" }).int(),
    interestRatePerPeriod: z.number({ required_error: "Interest rate is required" }).min(0),
    interestRateFrequencyType: z.number({ required_error: "Interest rate frequency is required" }).int(),
    amortizationType: z.number({ required_error: "Amortization type is required" }).int(),
    interestType: z.number({ required_error: "Interest type is required" }).int(),
    interestCalculationPeriodType: z.number({ required_error: "Interest calc period is required" }).int(),
    transactionProcessingStrategyCode: z.string({ required_error: "Processing strategy is required" }).min(1),
    expectedDisbursementDate: z.string({ required_error: "Expected disbursement date is required" }).min(1),
    submittedOnDate: z.string({ required_error: "Submitted date is required" }).min(1),
    dateFormat: z.string().default("dd MMMM yyyy"),
    locale: z.string().default("en"),
    externalId: z.string().optional(),
    fundId: z.number().int().positive().optional(),
    loanOfficerId: z.number().int().positive().optional(),
    loanPurposeId: z.number().int().positive().optional(),
    graceOnPrincipalPayment: z.number().int().min(0).optional(),
    graceOnInterestPayment: z.number().int().min(0).optional(),
    graceOnInterestCharged: z.number().int().min(0).optional(),
    graceOnArrearsAgeing: z.number().int().min(0).optional(),
    linkAccountId: z.number().int().positive().optional(),
    fixedEmiAmount: z.number().positive().optional(),
    inArrearsTolerance: z.number().min(0).optional(),
  })
  .refine((data) => data.clientId || data.groupId, {
    message: "Either clientId or groupId is required",
    path: ["clientId"],
  });

// ============================================================
// Loan Approval
// ============================================================
export const approveLoanSchema = z.object({
  approvedOnDate: z.string({ required_error: "Approved date is required" }).min(1),
  dateFormat: z.string().default("dd MMMM yyyy"),
  locale: z.string().default("en"),
  approvedLoanAmount: z.number().positive().optional(),
  expectedDisbursementDate: z.string().optional(),
  note: z.string().optional(),
});

// ============================================================
// Disburse Loan
// ============================================================
export const disburseLoanSchema = z.object({
  actualDisbursementDate: z.string({ required_error: "Disbursement date is required" }).min(1),
  dateFormat: z.string().default("dd MMMM yyyy"),
  locale: z.string().default("en"),
  transactionAmount: z.number().positive().optional(),
  fixedEmiAmount: z.number().positive().optional(),
  note: z.string().optional(),
});

// ============================================================
// Loan Transaction
// ============================================================
export const createLoanTransactionSchema = z.object({
  transactionDate: z.string({ required_error: "Transaction date is required" }).min(1),
  transactionAmount: z.number({ required_error: "Amount is required" }).positive(),
  dateFormat: z.string().default("dd MMMM yyyy"),
  locale: z.string().default("en"),
  paymentTypeId: z.number().int().positive().optional(),
  note: z.string().optional(),
  externalId: z.string().optional(),
});

// ============================================================
// Loan Charge
// ============================================================
export const createLoanChargeSchema = z.object({
  chargeId: z.number({ required_error: "Charge is required" }).int().positive(),
  amount: z.number({ required_error: "Amount is required" }).positive(),
  dueDate: z.string().optional(),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
```

---

## 13. Error Handling

| HTTP Status | Meaning               | Common Causes                                         |
| ----------- | --------------------- | ----------------------------------------------------- |
| `400`       | Bad Request           | Validation error — missing/invalid fields             |
| `401`       | Unauthorized          | No valid authentication token                         |
| `403`       | Forbidden             | User lacks permission (e.g. `LOAN`, `LOAN_PRODUCT`)   |
| `404`       | Not Found             | Loan/product does not exist                           |
| `409`       | Conflict              | Duplicate external ID, invalid state transition       |
| `422`       | Unprocessable         | Business rule violation — invalid schedule parameters |
| `500`       | Internal Server Error | Unexpected server error                               |

### Common Error Responses

```json
{
  "httpStatusCode": 400,
  "developerMessage": "Validation errors exist.",
  "errors": [
    {
      "userMessageGlobalisationCode": "validation.msg.loan.principal.is.less.than.min",
      "parameterName": "principal",
      "defaultUserMessage": "Principal must be greater than minimum principal",
      "args": []
    }
  ]
}
```

### Permission Names

| Permission            | Operation                 |
| --------------------- | ------------------------- |
| `READ_LOAN`           | View loans                |
| `CREATE_LOAN`         | Create loan applications  |
| `UPDATE_LOAN`         | Modify loan applications  |
| `DELETE_LOAN`         | Delete loan applications  |
| `APPROVE_LOAN`        | Approve loan applications |
| `DISBURSE_LOAN`       | Disburse loans            |
| `REPAY_LOAN`          | Make loan repayments      |
| `READ_LOAN_PRODUCT`   | View loan products        |
| `CREATE_LOAN_PRODUCT` | Create loan products      |
| `UPDATE_LOAN_PRODUCT` | Update loan products      |
| `DELETE_LOAN_PRODUCT` | Delete loan products      |

---

### Constants

```typescript
export const LOAN_STATUS = {
  SUBMITTED_AND_PENDING_APPROVAL: 100,
  APPROVED: 200,
  ACTIVE: 300,
  TRANSFER_IN_PROGRESS: 303,
  TRANSFER_ON_HOLD: 304,
  WITHDRAWN_BY_CLIENT: 400,
  REJECTED: 500,
  CLOSED_OBLIGATIONS_MET: 600,
  CLOSED_WRITTEN_OFF: 601,
  CLOSED_RESCHEDULE_OUTSTANDING_AMOUNT: 602,
  OVERPAID: 700,
} as const;

export const LOAN_TYPE = {
  INDIVIDUAL: "individual",
  GROUP: "group",
  JLG: "jlg",
} as const;

export const REPAYMENT_FREQUENCY_TYPE = {
  DAYS: 0,
  WEEKS: 1,
  MONTHS: 2,
} as const;

export const INTEREST_TYPE = {
  DECLINING_BALANCE: 0,
  FLAT: 1,
} as const;

export const AMORTIZATION_TYPE = {
  EQUAL_PRINCIPAL: 0,
  EQUAL_INSTALLMENTS: 1,
} as const;

export const TRANSACTION_TYPE = {
  REPAYMENT: 1,
  DISBURSEMENT: 2,
  WAIVE_INTEREST: 3,
  WRITE_OFF: 5,
  RECOVERY_REPAYMENT: 7,
  WAIVE_CHARGES: 8,
  CHARGE_PAYMENT: 15,
  CHARGE_OFF: 17,
  DOWN_PAYMENT: 18,
  INTEREST_REFUND: 19,
  CAPITALIZED_INCOME: 35,
  CAPITALIZED_INCOME_AMORTIZATION: 36,
  CAPITALIZED_INCOME_ADJUSTMENT: 37,
  CAPITALIZED_INCOME_AMORTIZATION_ADJUSTMENT: 39,
  BUY_DOWN_FEE: 40,
  BUY_DOWN_FEE_ADJUSTMENT: 41,
  BUY_DOWN_FEE_AMORTIZATION: 42,
  BUY_DOWN_FEE_AMORTIZATION_ADJUSTMENT: 43,
} as const;

export const LOAN_COMMANDS = {
  APPROVE: "approve",
  UNDO_APPROVAL: "undoapproval",
  REJECT: "reject",
  WITHDRAWN_BY_APPLICANT: "withdrawnByApplicant",
  DISBURSE: "disburse",
  DISBURSE_TO_SAVINGS: "disburseToSavings",
  UNDO_DISBURSAL: "undodisbursal",
  REPAYMENT: "repayment",
  WAIVE_INTEREST: "waiveinterest",
  WRITE_OFF: "writeoff",
  CLOSE: "close",
  CLOSE_RESCHEDULED: "close-rescheduled",
  RECOVERY_REPAYMENT: "recoverypayment",
  PREPAY_LOAN: "prepayLoan",
  FORECLOSURE: "foreclosure",
  GOODWILL_CREDIT: "goodwillCredit",
  CHARGE_OFF: "charge-off",
  UNDO_CHARGE_OFF: "undo-charge-off",
  DOWN_PAYMENT: "downPayment",
  INTEREST_REFUND: "interest-refund",
  RE_AGE: "reAge",
  RE_AMORTIZE: "reAmortize",
  CREDIT_BALANCE_REFUND: "creditBalanceRefund",
  ASSIGN_LOAN_OFFICER: "assignloanofficer",
  UNASSIGN_LOAN_OFFICER: "unassignloanofficer",
} as const;
```

---

## 15. Implementation Checklist

### Loan Application

- [ ] Loan List (paginated, filterable by clientId, status, externalId)
- [ ] Loan Detail (with associations: repayment schedule, transactions, charges, collateral, guarantors)
- [ ] Loan Detail by External ID
- [ ] Loan Create (template-driven with product defaults)
- [ ] Loan Edit (while in Submitted state)
- [ ] Loan Delete (while in Submitted state)
- [ ] Calculate Repayment Schedule (preview before submit)
- [ ] Loan Type selection (individual, group, JLG, JLG bulk)
- [ ] Client/Group selection (dependent on loan type)
- [ ] Linked savings account selection
- [ ] Dynamic form fields based on selected product

### Loan State Commands

- [ ] Approve (with optional approved amount override)
- [ ] Undo Approval
- [ ] Reject
- [ ] Withdraw by Applicant
- [ ] Disburse (cash)
- [ ] Disburse to Savings
- [ ] Undo Disbursal

### Loan Transactions

- [ ] Repayment (with payment type)
- [ ] Waive Interest
- [ ] Waive Interest (payment waiver)
- [ ] Write Off
- [ ] Recovery Repayment
- [ ] Prepay Loan (full prepayment)
- [ ] Foreclosure
- [ ] Refund by Cash
- [ ] Refund by Transfer
- [ ] Credit Balance Refund
- [ ] Goodwill Credit
- [ ] Payout Refund
- [ ] Merchant Issued Refund
- [ ] Charge Off / Undo Charge Off
- [ ] Down Payment
- [ ] Interest Refund
- [ ] Re-Age / Undo Re-Age
- [ ] Re-Amortize / Undo Re-Amortize
- [ ] Capitalized Income (add to loan)
- [ ] Capitalized Income Adjustment
- [ ] Buy Down Fee (add to loan)
- [ ] Buy Down Fee Adjustment
- [ ] Adjust/Undo/Reverse Transaction (with optional new amount + date)
- [ ] Transaction chargeback

### Loan Charges

- [ ] Charge list
- [ ] Add charge (with due date)
- [ ] Update charge (when not yet approved)
- [ ] Delete charge (when not yet approved)
- [ ] Pay charge
- [ ] Waive charge
- [ ] Charge adjustment
- [ ] Deactivate overdue charge

### Loan Schedule

- [ ] Repayment schedule table (installment periods with amounts)
- [ ] Paid/unpaid status per installment
- [ ] Overdue indicators

### Loan Collateral

- [ ] Collateral list per loan
- [ ] Create/Update/Delete collateral

### Loan Guarantors

- [ ] Guarantor list per loan
- [ ] Create/Update/Delete guarantor

### Loan Products

- [ ] Product List
- [ ] Product Detail (with template flag support)
- [ ] Product Create (with all terms, interest, accounting settings)
- [ ] Product Edit
- [ ] Product Delete
- [ ] Interest recalculation configuration
- [ ] Multi-disburse configuration
- [ ] Down payment configuration
- [ ] Accounting rule + GL mapping configuration
- [ ] Buydown fee configuration (`enableBuyDownFee`, merchant flag, income type)
- [ ] Income capitalization configuration (`enableIncomeCapitalization`, income type, GL accounts)
- [ ] Product mix restrictions (`GET/PUT/POST/DELETE /v1/loanproducts/{id}/productmix`)
- [ ] Product mix enforcement during loan application (restricted product check)

### Point-in-Time View

- [ ] Single loan snapshot (`GET /v1/loans/at-date/{id}?date=...`)
- [ ] Bulk snapshot search (`POST /v1/loans/at-date/search`)

### Interest Pause

- [ ] Create pause (`POST /v1/loans/{id}/interest-pauses`)
- [ ] List pauses (`GET /v1/loans/{id}/interest-pauses`)
- [ ] Update pause (`PUT /v1/loans/{id}/interest-pauses/{vid}`)
- [ ] Delete pause (`DELETE /v1/loans/{id}/interest-pauses/{vid}`)
- [ ] Validation: progressive loan only, active status, no overlap, date bounds
- [ ] Schedule regeneration after pause change

### Bulk Loan Reassignment

- [ ] Reassignment template (`GET /v1/loans/loanreassignment/template`)
- [ ] Execute bulk reassignment (`POST /v1/loans/loanreassignment`)
- [ ] Single loan officer assign/unassign commands

### Buydown Fees

- [ ] View buydown fee amortization details (`GET /v1/loans/{id}/buydown-fees`)

### Capitalized Income

- [ ] View capitalized income details & allocation (`GET /v1/loans/{id}/capitalized-incomes`)

### Post-Dated Checks

- [ ] List PDCs (`GET /v1/loans/{id}/postdatedchecks`)
- [ ] Update PDC details (`PUT ...?editType=update`)
- [ ] Mark PDC bounced (`PUT ...?editType=bounced`)
- [ ] Delete PDC (`DELETE ...`)
- [ ] Pass PDCs during disbursement (`postDatedChecks` JSON array)
- [ ] Display PDC status (Pending / Bounced / Paid)

### Loan Documents

- [ ] Document list (`GET /v1/loans/{id}/documents`)
- [ ] Document upload (multipart: file + name + description)
- [ ] Document download (binary attachment)
- [ ] Document update (replace file + metadata)
- [ ] Document delete

### Loan Notes

- [ ] Notes list (inline via `?associations=notes` or dedicated endpoint)
- [ ] Create note (`POST /v1/loans/{id}/notes`)
- [ ] Edit note (`PUT /v1/loans/{id}/notes/{noteId}`)
- [ ] Delete note (`DELETE /v1/loans/{id}/notes/{noteId}`)
- [ ] Separate loan-level vs loan-transaction-level notes

### Loan Rescheduling

- [ ] Reschedule reason template
- [ ] Create reschedule request
- [ ] Approve / Reject reschedule request
- [ ] Reschedule request list

### Delinquency

- [ ] Delinquency tag history (per loan)
- [ ] Delinquency range display
- [ ] NPA/In-Arrears indicators

### General

- [ ] All list pages support pagination, sorting
- [ ] All date fields use locale + dateFormat
- [ ] All create/update pages validate with Zod before API call
- [ ] All API errors parsed and displayed as user-friendly messages
- [ ] Loading states for all queries and mutations
- [ ] Empty states for all list pages
- [ ] Permission-based UI (hide actions user cannot perform)
- [ ] External ID support
- [ ] Bulk import via Excel templates
