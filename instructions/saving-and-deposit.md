# Savings & Deposits — React Implementation Guide

## 1. Overview

The Savings & Deposits module manages three product types (Savings, Fixed Deposit, Recurring Deposit) with a shared account lifecycle, transaction processing, charges, and interest calculation engine.

### Product Inheritance

```
SavingsProduct                    (deposit_type_enum=100, table: m_savings_product)
  └── FixedDepositProduct         (deposit_type_enum=200)
        └── RecurringDepositProduct (deposit_type_enum=300)
```

| Sub-Feature                | Base Path                                     | Description                                              |
| -------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| Savings Products           | `/v1/savingsproducts`                         | CRUD for basic savings product definitions               |
| Fixed Deposit Products     | `/v1/fixeddepositproducts`                    | CRUD for fixed deposit product definitions               |
| Recurring Deposit Products | `/v1/recurringdepositproducts`                | CRUD for recurring deposit product definitions           |
| Savings Accounts           | `/v1/savingsaccounts`                         | Full lifecycle (submit, approve, activate, close, block) |
| Savings Transactions       | `/v1/savingsaccounts/{id}/transactions`       | Deposit, withdrawal, hold, reverse, interest posting     |
| Savings Charges            | `/v1/savingsaccounts/{id}/charges`            | Fee/penalty charges on savings accounts                  |
| Fixed Deposit Accounts     | `/v1/fixeddepositaccounts`                    | Lifecycle + premature closure for FD                     |
| Recurring Deposit Accounts | `/v1/recurringdepositaccounts`                | Lifecycle + premature closure for RD                     |
| Interest Rate Charts       | `/v1/interestratecharts`                      | Interest rate slabs for deposit products                 |
| Rate Chart Slabs           | `/v1/interestratecharts/{chartId}/chartslabs` | Individual rate slabs within a chart                     |
| On-Hold Funds              | `/v1/savingsaccounts/{id}/onholdtransactions` | List held/lien funds on savings accounts                 |

---

## 2. Account Lifecycle

### Status Flow

```
SUBMITTED_AND_PENDING_APPROVAL (100)
  │── approve ──────────────────────────→ APPROVED (200)
  │── reject ───────────────────────────→ REJECTED (500)
  └── withdrawnByApplicant ─────────────→ WITHDRAWN_BY_APPLICANT (400)

APPROVED (200)
  │── undoapproval ─────────────────────→ SUBMITTED_AND_PENDING_APPROVAL (100)
  └── activate ─────────────────────────→ ACTIVE (300)

ACTIVE (300)
  │── close ────────────────────────────→ CLOSED (600)
  │── (FD/RD) prematureClose ───────────→ PRE_MATURE_CLOSURE (700) → CLOSED
  │── (FD/RD) maturity ─────────────────→ MATURED (800) → CLOSED
  │── block ────────────────────────────→ ACTIVE + subStatus=BLOCK
  │── blockCredit ──────────────────────→ ACTIVE + subStatus=BLOCK_CREDIT
  └── blockDebit ───────────────────────→ ACTIVE + subStatus=BLOCK_DEBIT
```

### Status Enum

| Value | Constant                         | Description                              |
| ----- | -------------------------------- | ---------------------------------------- |
| 100   | `SUBMITTED_AND_PENDING_APPROVAL` | Application submitted, awaiting approval |
| 200   | `APPROVED`                       | Approved, awaiting activation            |
| 300   | `ACTIVE`                         | Active (can transact)                    |
| 400   | `WITHDRAWN_BY_APPLICANT`         | Withdrawn by applicant                   |
| 500   | `REJECTED`                       | Rejected                                 |
| 600   | `CLOSED`                         | Closed                                   |
| 700   | `PRE_MATURE_CLOSURE`             | FD/RD prematurely closed                 |
| 800   | `MATURED`                        | FD/RD reached maturity date              |

### Sub-Status Enum (for Active accounts)

| Value | Constant       | Meaning                      |
| ----- | -------------- | ---------------------------- |
| 0     | `NONE`         | Normal                       |
| 100   | `INACTIVE`     | Dormancy: inactive           |
| 200   | `DORMANT`      | Dormancy: dormant            |
| 300   | `ESCHEAT`      | Escheat                      |
| 400   | `BLOCK`        | Full block (no credit/debit) |
| 500   | `BLOCK_CREDIT` | Credits blocked              |
| 600   | `BLOCK_DEBIT`  | Debits blocked               |

### Transaction Types

| Value | Type                 | Entry   | Description          |
| ----- | -------------------- | ------- | -------------------- |
| 1     | `DEPOSIT`            | CREDIT  | Cash deposit         |
| 2     | `WITHDRAWAL`         | DEBIT   | Cash withdrawal      |
| 3     | `INTEREST_POSTING`   | CREDIT  | Interest credited    |
| 4     | `WITHDRAWAL_FEE`     | DEBIT   | Withdrawal fee       |
| 5     | `ANNUAL_FEE`         | DEBIT   | Annual fee charge    |
| 6     | `WAIVE_CHARGES`      | —       | Waive charge         |
| 7     | `PAY_CHARGE`         | DEBIT   | Pay charge           |
| 8     | `DIVIDEND_PAYOUT`    | CREDIT  | Dividend             |
| 10    | `ACCRUAL`            | —       | Interest accrual     |
| 17    | `OVERDRAFT_INTEREST` | DEBIT   | Overdraft interest   |
| 18    | `WITHHOLD_TAX`       | DEBIT   | Withholding tax      |
| 20    | `AMOUNT_HOLD`        | DEBIT*  | Hold on funds (lien) |
| 21    | `AMOUNT_RELEASE`     | CREDIT* | Release hold         |

\* `AMOUNT_HOLD` and `AMOUNT_RELEASE` do NOT change the account balance — they track `onHoldFunds` separately.

### Deposit Account Types

| Value | Type                | Resource Name              |
| ----- | ------------------- | -------------------------- |
| 100   | `SAVINGS_DEPOSIT`   | `savingsaccounts`          |
| 200   | `FIXED_DEPOSIT`     | `fixeddepositaccounts`     |
| 300   | `RECURRING_DEPOSIT` | `recurringdepositaccounts` |

---

## 3. API Inventory

### 3.1 Savings Products — `/v1/savingsproducts`

| Method   | Path                           | Description                                                              | Permission               |
| -------- | ------------------------------ | ------------------------------------------------------------------------ | ------------------------ |
| `GET`    | `/v1/savingsproducts`          | List                                                                     | `READ_SAVINGS_PRODUCT`   |
| `GET`    | `/v1/savingsproducts/template` | Create form template (currencies, interest options, accounting, charges) | `READ_SAVINGS_PRODUCT`   |
| `GET`    | `/v1/savingsproducts/{id}`     | Detail (`?template=true` for option lists)                               | `READ_SAVINGS_PRODUCT`   |
| `POST`   | `/v1/savingsproducts`          | Create                                                                   | `CREATE_SAVINGS_PRODUCT` |
| `PUT`    | `/v1/savingsproducts/{id}`     | Update                                                                   | `UPDATE_SAVINGS_PRODUCT` |
| `DELETE` | `/v1/savingsproducts/{id}`     | Delete                                                                   | `DELETE_SAVINGS_PRODUCT` |

### 3.2 Fixed Deposit Products — `/v1/fixeddepositproducts`

| Method   | Path                                             | Description                                                      | Permission                     |
| -------- | ------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------ |
| `GET`    | `/v1/fixeddepositproducts`                       | List                                                             | `READ_FIXED_DEPOSIT_PRODUCT`   |
| `GET`    | `/v1/fixeddepositproducts/template`              | Template (adds: deposit terms, pre-closure, interest rate chart) | `READ_FIXED_DEPOSIT_PRODUCT`   |
| `GET`    | `/v1/fixeddepositproducts/{id}`                  | Detail                                                           | `READ_FIXED_DEPOSIT_PRODUCT`   |
| `POST`   | `/v1/fixeddepositproducts`                       | Create                                                           | `CREATE_FIXED_DEPOSIT_PRODUCT` |
| `PUT`    | `/v1/fixeddepositproducts/{id}`                  | Update                                                           | `UPDATE_FIXED_DEPOSIT_PRODUCT` |
| `DELETE` | `/v1/fixeddepositproducts/{id}`                  | Delete                                                           | `DELETE_FIXED_DEPOSIT_PRODUCT` |
| `GET`    | `/v1/fixeddepositaccounts/calculate-fd-interest` | Calculate FD interest from query params (no account needed)      |                                |

### 3.3 Recurring Deposit Products — `/v1/recurringdepositproducts`

| Method   | Path                                    | Description                                | Permission                         |
| -------- | --------------------------------------- | ------------------------------------------ | ---------------------------------- |
| `GET`    | `/v1/recurringdepositproducts`          | List                                       | `READ_RECURRING_DEPOSIT_PRODUCT`   |
| `GET`    | `/v1/recurringdepositproducts/template` | Template (adds: recurring details, charts) | `READ_RECURRING_DEPOSIT_PRODUCT`   |
| `GET`    | `/v1/recurringdepositproducts/{id}`     | Detail                                     | `READ_RECURRING_DEPOSIT_PRODUCT`   |
| `POST`   | `/v1/recurringdepositproducts`          | Create                                     | `CREATE_RECURRING_DEPOSIT_PRODUCT` |
| `PUT`    | `/v1/recurringdepositproducts/{id}`     | Update                                     | `UPDATE_RECURRING_DEPOSIT_PRODUCT` |
| `DELETE` | `/v1/recurringdepositproducts/{id}`     | Delete                                     | `DELETE_RECURRING_DEPOSIT_PRODUCT` |

### 3.4 Savings Accounts — `/v1/savingsaccounts`

| Method   | Path                                           | Description                                                | Permission               |
| -------- | ---------------------------------------------- | ---------------------------------------------------------- | ------------------------ |
| `GET`    | `/v1/savingsaccounts/template`                 | Create template (products, clients, officers)              | `READ_SAVINGS_ACCOUNT`   |
| `GET`    | `/v1/savingsaccounts`                          | List (paginated, filterable)                               | `READ_SAVINGS_ACCOUNT`   |
| `POST`   | `/v1/savingsaccounts`                          | Submit application                                         | `CREATE_SAVINGS_ACCOUNT` |
| `GET`    | `/v1/savingsaccounts/{id}`                     | Detail (supports `?associations=all,charges,transactions`) | `READ_SAVINGS_ACCOUNT`   |
| `GET`    | `/v1/savingsaccounts/external-id/{externalId}` | Detail by external ID                                      | `READ_SAVINGS_ACCOUNT`   |
| `PUT`    | `/v1/savingsaccounts/{id}`                     | Modify application (when SUBMITTED)                        | `UPDATE_SAVINGS_ACCOUNT` |
| `DELETE` | `/v1/savingsaccounts/{id}`                     | Delete application (when SUBMITTED)                        | `DELETE_SAVINGS_ACCOUNT` |
| `POST`   | `/v1/savingsaccounts/{id}`                     | **State commands** (see 3.4a)                              | varies                   |
| `POST`   | `/v1/savingsaccounts/external-id/{externalId}` | State commands by external ID                              | varies                   |
| `GET`    | `/v1/savingsaccounts/downloadtemplate`         | Bulk import template                                       |                          |
| `POST`   | `/v1/savingsaccounts/uploadtemplate`           | Upload bulk import                                         |                          |

#### 3.4a Account State Commands

`POST /v1/savingsaccounts/{id}?command={command}`

| Command                  | Request Body                                                         | Description                     |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------- |
| `approve`                | `{ approvedOnDate, dateFormat, locale }`                             | Approve application             |
| `undoapproval`           | —                                                                    | Undo approval                   |
| `reject`                 | `{ rejectedOnDate, dateFormat, locale }`                             | Reject application              |
| `withdrawnByApplicant`   | `{ withdrawnOnDate, dateFormat, locale }`                            | Withdraw application            |
| `activate`               | `{ activatedOnDate, dateFormat, locale }`                            | Activate account                |
| `close`                  | `{ closedOnDate, dateFormat, locale, paymentTypeId?, closureType? }` | Close account                   |
| `calculateInterest`      | —                                                                    | Calculate interest (no posting) |
| `postInterest`           | —                                                                    | Calculate and post interest     |
| `applyAnnualFees`        | —                                                                    | Manually trigger annual fee     |
| `assignSavingsOfficer`   | `{ savingsOfficerId }`                                               | Assign officer                  |
| `unassignSavingsOfficer` | `{ unassignDate, dateFormat, locale }`                               | Unassign officer                |
| `block`                  | `{ reasonForBlock }`                                                 | Full block account              |
| `unblock`                | `{ reasonForUnblock }`                                               | Unblock account                 |
| `blockCredit`            | `{ reasonForBlock }`                                                 | Block credits only              |
| `unblockCredit`          | `{ reasonForBlock }`                                                 | Unblock credits                 |
| `blockDebit`             | `{ reasonForBlock }`                                                 | Block debits only               |
| `unblockDebit`           | `{ reasonForBlock }`                                                 | Unblock debits                  |

### 3.5 Fixed Deposit Accounts — `/v1/fixeddepositaccounts`

| Method   | Path                                        | Description                                                                                                                                                           |
| -------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/v1/fixeddepositaccounts/template`         | Create template (includes deposit term defaults + interest rate chart)                                                                                                |
| `GET`    | `/v1/fixeddepositaccounts`                  | List                                                                                                                                                                  |
| `POST`   | `/v1/fixeddepositaccounts`                  | Submit application                                                                                                                                                    |
| `GET`    | `/v1/fixeddepositaccounts/{id}`             | Detail                                                                                                                                                                |
| `PUT`    | `/v1/fixeddepositaccounts/{id}`             | Modify application                                                                                                                                                    |
| `DELETE` | `/v1/fixeddepositaccounts/{id}`             | Delete application                                                                                                                                                    |
| `POST`   | `/v1/fixeddepositaccounts/{id}`             | **Commands:** approve, reject, withdrawnByApplicant, undoapproval, activate, calculateInterest, postInterest, close, **prematureClose**, **calculatePrematureAmount** |
| `GET`    | `/v1/fixeddepositaccounts/{id}/template`    | Account closure template                                                                                                                                              |
| `GET`    | `/v1/fixeddepositaccounts/downloadtemplate` | Bulk import download                                                                                                                                                  |
| `POST`   | `/v1/fixeddepositaccounts/uploadtemplate`   | Bulk import upload                                                                                                                                                    |

#### 3.5a FD-Specific Commands

| Command                    | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| `prematureClose`           | Prematurely close FD; applies pre-closure penalty       |
| `calculatePrematureAmount` | Preview premature closure amount without changing state |

### 3.6 Recurring Deposit Accounts — `/v1/recurringdepositaccounts`

| Method   | Path                                    | Description                                                                                                                                                                            |
| -------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/v1/recurringdepositaccounts/template` | Create template (includes recurring deposit defaults)                                                                                                                                  |
| `GET`    | `/v1/recurringdepositaccounts`          | List                                                                                                                                                                                   |
| `POST`   | `/v1/recurringdepositaccounts`          | Submit application                                                                                                                                                                     |
| `GET`    | `/v1/recurringdepositaccounts/{id}`     | Detail                                                                                                                                                                                 |
| `PUT`    | `/v1/recurringdepositaccounts/{id}`     | Modify application                                                                                                                                                                     |
| `DELETE` | `/v1/recurringdepositaccounts/{id}`     | Delete application                                                                                                                                                                     |
| `POST`   | `/v1/recurringdepositaccounts/{id}`     | **Commands:** approve, reject, withdrawnByApplicant, undoapproval, activate, calculateInterest, postInterest, close, prematureClose, calculatePrematureAmount, **updateDepositAmount** |

#### 3.6a RD-Specific Commands

| Command               | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| `updateDepositAmount` | Update the recommended deposit amount as of effective date |

### 3.7 Savings Transactions — `/v1/savingsaccounts/{id}/transactions`

| Method | Path                                 | Description                                                                               |
| ------ | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `GET`  | `.../transactions/template`          | Transaction form template                                                                 |
| `GET`  | `.../transactions/{txId}`            | Transaction detail                                                                        |
| `GET`  | `.../transactions/search`            | Search transactions (query params)                                                        |
| `POST` | `.../transactions?command={command}` | **Create:** `deposit`, `withdrawal`, `force-withdrawal`, `holdAmount`, `postInterestAsOn` |
| `POST` | `.../transactions/{txId}`            | **Adjust:** `undo`, `reverse`, `modify`, `releaseAmount`                                  |
| `POST` | `.../transactions/query`             | Advanced search                                                                           |

Transaction commands via `POST .../transactions?command=...`:

| Command            | Request Body                                                             |
| ------------------ | ------------------------------------------------------------------------ |
| `deposit`          | `{ transactionDate, transactionAmount, paymentTypeId?, note? }`          |
| `withdrawal`       | `{ transactionDate, transactionAmount, paymentTypeId?, note? }`          |
| `force-withdrawal` | `{ transactionDate, transactionAmount, note? }` (bypasses balance check) |
| `holdAmount`       | `{ transactionDate, transactionAmount, note? }`                          |
| `postInterestAsOn` | `{ transactionDate, isPostInterestAsOn }`                                |

Adjustment commands via `POST .../transactions/{txId}?command=...`:

| Command         | Description                            |
| --------------- | -------------------------------------- |
| `undo`          | Undo a transaction                     |
| `reverse`       | Reverse a transaction                  |
| `modify`        | Modify a transaction (new amount/date) |
| `releaseAmount` | Release a held amount                  |

### 3.8 Savings Charges — `/v1/savingsaccounts/{id}/charges`

| Method   | Path                     | Description                                 |
| -------- | ------------------------ | ------------------------------------------- |
| `GET`    | `.../charges/template`   | Available charges template                  |
| `GET`    | `.../charges`            | List charges                                |
| `GET`    | `.../charges/{chargeId}` | Charge detail                               |
| `POST`   | `.../charges`            | Add charge                                  |
| `PUT`    | `.../charges/{chargeId}` | Update charge                               |
| `POST`   | `.../charges/{chargeId}` | Command: `paycharge`, `waive`, `inactivate` |
| `DELETE` | `.../charges/{chargeId}` | Delete charge                               |

### 3.9 On-Hold Funds — `/v1/savingsaccounts/{id}/onholdtransactions`

| Method | Path                     | Description                                                                |
| ------ | ------------------------ | -------------------------------------------------------------------------- |
| `GET`  | `.../onholdtransactions` | List on-hold fund transactions (supports `guarantorFundingId`, pagination) |

### 3.10 Interest Rate Charts — `/v1/interestratecharts`

| Method   | Path                               | Description                                          |
| -------- | ---------------------------------- | ---------------------------------------------------- |
| `GET`    | `/v1/interestratecharts/template`  | Chart creation template                              |
| `GET`    | `/v1/interestratecharts`           | List (`?productId=1` to filter)                      |
| `GET`    | `/v1/interestratecharts/{chartId}` | Detail (`?associations=chartSlabs` to include slabs) |
| `POST`   | `/v1/interestratecharts`           | Create                                               |
| `PUT`    | `/v1/interestratecharts/{chartId}` | Update                                               |
| `DELETE` | `/v1/interestratecharts/{chartId}` | Delete                                               |

### 3.11 Interest Rate Chart Slabs — `/v1/interestratecharts/{chartId}/chartslabs`

| Method   | Path                      | Description            |
| -------- | ------------------------- | ---------------------- |
| `GET`    | `.../chartslabs/template` | Slab creation template |
| `GET`    | `.../chartslabs`          | List slabs             |
| `GET`    | `.../chartslabs/{slabId}` | Slab detail            |
| `POST`   | `.../chartslabs`          | Create slab            |
| `PUT`    | `.../chartslabs/{slabId}` | Update slab            |
| `DELETE` | `.../chartslabs/{slabId}` | Delete slab            |

---

## 4. CRUD

### 4.1 Savings Product Create

```json
POST /v1/savingsproducts
{
  "name": "Standard Savings",
  "shortName": "STD_SAV",
  "description": "Standard savings product",
  "currencyCode": "USD",
  "digitsAfterDecimal": 2,
  "inMultiplesOf": 0,
  "nominalAnnualInterestRate": 3.5,
  "interestCompoundingPeriodType": 4,
  "interestPostingPeriodType": 4,
  "interestCalculationType": 1,
  "interestCalculationDaysInYearType": 365,
  "minRequiredOpeningBalance": 100.00,
  "lockinPeriodFrequency": 6,
  "lockinPeriodFrequencyType": 2,
  "withdrawalFeeForTransfers": false,
  "allowOverdraft": false,
  "overdraftLimit": 0,
  "minBalanceForInterestCalculation": 0,
  "withHoldTax": false,
  "charges": [],
  "accountingRule": 1
}
```

### 4.2 Fixed Deposit Product Create

```json
POST /v1/fixeddepositproducts
{
  "name": "12-Month Fixed Deposit",
  "shortName": "12MFD",
  "description": "Fixed deposit for 12 months",
  "currencyCode": "USD",
  "digitsAfterDecimal": 2,
  "inMultiplesOf": 0,
  "nominalAnnualInterestRate": 5.0,
  "interestCompoundingPeriodType": 4,
  "interestPostingPeriodType": 4,
  "interestCalculationType": 1,
  "interestCalculationDaysInYearType": 365,
  "minDepositTerm": 12,
  "minDepositTermTypeId": 2,
  "maxDepositTerm": 60,
  "maxDepositTermTypeId": 2,
  "inMultiplesOfDepositTerm": 1,
  "inMultiplesOfDepositTermTypeId": 2,
  "preClosurePenalApplicable": true,
  "preClosurePenalInterest": 2.0,
  "preClosurePenalInterestOnTypeId": 1,
  "depositAmount": 5000.00,
  "accountingRule": 1,
  "charges": [],
  "charts": [
    {
      "name": "12-60 Month Rate Chart",
      "fromDate": "01 January 2024",
      "chartSlabs": [
        {
          "periodType": 2,
          "fromPeriod": 12,
          "toPeriod": 24,
          "annualInterestRate": 5.0,
          "description": "12-24 months"
        },
        {
          "periodType": 2,
          "fromPeriod": 24,
          "toPeriod": 60,
          "annualInterestRate": 6.0,
          "description": "24-60 months"
        }
      ]
    }
  ],
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.3 Recurring Deposit Product Create

```json
POST /v1/recurringdepositproducts
{
  "name": "Recurring Deposit 12 Month",
  "shortName": "RD12",
  "description": "Monthly recurring deposit for 12 months",
  "currencyCode": "USD",
  "digitsAfterDecimal": 2,
  "inMultiplesOf": 0,
  "nominalAnnualInterestRate": 5.5,
  "interestCompoundingPeriodType": 4,
  "interestPostingPeriodType": 4,
  "interestCalculationType": 1,
  "interestCalculationDaysInYearType": 365,
  "minDepositTerm": 12,
  "minDepositTermTypeId": 2,
  "maxDepositTerm": 60,
  "maxDepositTermTypeId": 2,
  "preClosurePenalApplicable": true,
  "preClosurePenalInterest": 1.0,
  "preClosurePenalInterestOnTypeId": 1,
  "depositAmount": 1000.00,
  "isMandatoryDeposit": true,
  "allowWithdrawal": false,
  "adjustAdvanceTowardsFuturePayments": true,
  "accountingRule": 1,
  "charges": [],
  "charts": [...],
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.4 Savings Account Create

```json
POST /v1/savingsaccounts
{
  "clientId": 1,
  "productId": 2,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy",
  "submittedOnDate": "01 July 2024",
  "externalId": "EXT-SAV-001",
  "fieldOfficerId": 1
}
```

### 4.5 Savings Account Approve

```json
POST /v1/savingsaccounts/1?command=approve
{
  "approvedOnDate": "01 July 2024",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.6 Savings Account Activate

```json
POST /v1/savingsaccounts/1?command=activate
{
  "activatedOnDate": "01 July 2024",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.7 Deposit Transaction

```json
POST /v1/savingsaccounts/1/transactions?command=deposit
{
  "transactionDate": "15 July 2024",
  "transactionAmount": 1000.00,
  "paymentTypeId": 1,
  "note": "Cash deposit",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.8 Withdrawal Transaction

```json
POST /v1/savingsaccounts/1/transactions?command=withdrawal
{
  "transactionDate": "20 August 2024",
  "transactionAmount": 500.00,
  "paymentTypeId": 1,
  "note": "ATM withdrawal",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.9 Hold Amount

```json
POST /v1/savingsaccounts/1/transactions?command=holdAmount
{
  "transactionDate": "20 August 2024",
  "transactionAmount": 200.00,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.10 Release Amount

```json
POST /v1/savingsaccounts/1/transactions/42?command=releaseAmount
{
  "transactionDate": "25 August 2024",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.11 Block Account

```json
POST /v1/savingsaccounts/1?command=block
{
  "reasonForBlock": "Suspicious activity",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.12 Close Account

```json
POST /v1/savingsaccounts/1?command=close
{
  "closedOnDate": "01 September 2024",
  "closureType": 100,
  "paymentTypeId": 1,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

Closure types: `100=Withdraw to savings`, `200=Withdraw cash`, `300=Transfer`.

### 4.13 FD Premature Close

```json
POST /v1/fixeddepositaccounts/1?command=prematureClose
{
  "closedOnDate": "01 September 2024",
  "closureType": 100,
  "paymentTypeId": 1,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.14 Calculate Premature Amount (preview)

```json
POST /v1/fixeddepositaccounts/1?command=calculatePrematureAmount
{
  "closedOnDate": "01 September 2024",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.15 RD Update Deposit Amount

```json
POST /v1/recurringdepositaccounts/1?command=updateDepositAmount
{
  "depositAmount": 2000.00,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.16 Add Savings Charge

```json
POST /v1/savingsaccounts/1/charges
{
  "chargeId": 5,
  "amount": 10.00,
  "dueDate": "01 January 2025",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### 4.17 Pay/Waive/Inactivate Charge

```json
POST /v1/savingsaccounts/1/charges/3?command=paycharge
{
  "transactionDate": "01 January 2025",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.18 Interest Rate Chart Create

```json
POST /v1/interestratecharts
{
  "name": "Tiered Rate Chart",
  "description": "Rates based on deposit period",
  "fromDate": "01 January 2024",
  "endDate": "31 December 2024",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### 4.19 Chart Slab Create

```json
POST /v1/interestratecharts/1/chartslabs
{
  "description": "12-24 months",
  "periodType": 2,
  "fromPeriod": 12,
  "toPeriod": 24,
  "annualInterestRate": 5.0,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

---

## 5. Savings Charge Time Types

| Value | Type                     | Required Fields                | Notes                                                                   |
| ----- | ------------------------ | ------------------------------ | ----------------------------------------------------------------------- |
| 2     | `SPECIFIED_DUE_DATE`     | `dueDate`                      | One-time charge                                                         |
| 3     | `SAVINGS_ACTIVATION`     | —                              | Applied on account activation                                           |
| 4     | `SAVINGS_CLOSURE`        | —                              | Applied on account closure                                              |
| 5     | `WITHDRAWAL_FEE`         | —                              | Per withdrawal; amount or percentage of transaction                     |
| 6     | `ANNUAL_FEE`             | `feeOnMonthDay`, `feeInterval` | Only one annual fee per account; applied by scheduler or manual command |
| 7     | `MONTHLY_FEE`            | `feeOnMonthDay`, `feeInterval` | Recurring monthly                                                       |
| 10    | `OVERDRAFT_FEE`          | —                              | Applied when overdraft occurs                                           |
| 11    | `WEEKLY_FEE`             | —                              | Recurring weekly                                                        |
| 16    | `SAVINGS_NOACTIVITY_FEE` | —                              | For dormant/inactive accounts                                           |

Calculation types: `1=FLAT`, `2=PERCENT_OF_AMOUNT`.

---

## 6. Interest Settings (Savings Products)

| Enum                                | Values                                                                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `interestCompoundingPeriodType`     | 1=Daily, 2=Weekly, 3=Monthly, 4=Quarterly, 5=Bi-Annually, 6=Annually, 7=Half-Yearly, 8=Daily (Average Daily Balance), 13=Unlimited |
| `interestPostingPeriodType`         | Same values (when interest is credited to balance)                                                                                 |
| `interestCalculationType`           | 1=Daily Balance, 2=Average Daily Balance, 3=Minimum Balance                                                                        |
| `interestCalculationDaysInYearType` | 360, 365                                                                                                                           |
| `lockinPeriodFrequencyType`         | 0=Days, 1=Weeks, 2=Months, 3=Years                                                                                                 |

---

## 7. Interest Rate Charts (FD/RD)

- Charts define **tiered interest rates** based on deposit period duration
- Each chart contains **slabs** with `periodType`, `fromPeriod`, `toPeriod`, `annualInterestRate`
- `periodType`: 0=Days, 1=Weeks, 2=Months, 3=Years
- On premature closure, the system:
  1. Looks up the actual elapsed period against the chart slabs
  2. Applies the **pre-closure penalty** (`preClosurePenalInterest` percentage deducted from the slab rate)
  3. Calculates interest earned only for elapsed period (not the full term)

---

## 8. Lookup API Table

| UI Field                             | Endpoint                                                                    | Label         | Value  | Required                 |
| ------------------------------------ | --------------------------------------------------------------------------- | ------------- | ------ | ------------------------ |
| Currency                             | `GET /v1/savingsproducts/template` → `currencyOptions`                      | `name`        | `code` | Yes (product)            |
| Interest Compounding Period          | template → `interestCompoundingPeriodTypeOptions`                           | `value`       | `id`   | Yes (product)            |
| Interest Posting Period              | template → `interestPostingPeriodTypeOptions`                               | `value`       | `id`   | Yes (savings/RD product) |
| Interest Calculation Type            | template → `interestCalculationTypeOptions`                                 | `value`       | `id`   | Yes (product)            |
| Days in Year                         | template → `interestCalculationDaysInYearTypeOptions`                       | `value`       | `id`   | Yes (product)            |
| Lock-in Period Type                  | template → `lockinPeriodFrequencyTypeOptions`                               | `value`       | `id`   | No                       |
| Withdrawal Fee Type                  | template → `withdrawalFeeTypeOptions`                                       | `value`       | `id`   | No                       |
| Deposit Term Type                    | `GET /v1/fixeddepositproducts/template` → `periodFrequencyTypeOptions`      | `value`       | `id`   | Yes (FD/RD)              |
| Pre-closure Penal On-type            | template → `preClosurePenalInterestOnTypeOptions`                           | `value`       | `id`   | No (FD/RD)               |
| Charge Options (Savings)             | `GET /v1/charges?isSavingsCharge=true`                                      | `name`        | `id`   | No                       |
| Payment Type                         | `GET /v1/paymenttypes`                                                      | `name`        | `id`   | No (transactions)        |
| Savings Officer                      | `GET /v1/savingsaccounts/template` → `fieldOfficerOptions`                  | `displayName` | `id`   | No                       |
| Interest Rate Chart Slab Period Type | `GET /v1/interestratecharts/{id}/chartslabs/template` → `periodTypeOptions` | `value`       | `id`   | Yes (slab)               |

---

## 9. Dependency Graph

### Savings Account Create Page

```
Page Load
  ↓
GET /v1/savingsaccounts/template?clientId=1
  ↓
Populate: productOptions, fieldOfficerOptions, chargeOptions
  ↓
User selects savings product
  ↓
No additional template fetch needed (product terms are self-contained)
  ↓
Fill: submittedOnDate, optional field officer, external ID
  ↓
POST /v1/savingsaccounts → resourceId
```

### Savings Account Lifecycle Flow

```
1. POST /v1/savingsaccounts → SUBMITTED (100)
2. POST /v1/savingsaccounts/{id}?command=approve → APPROVED (200)
3. POST /v1/savingsaccounts/{id}?command=activate → ACTIVE (300)
4. POST /v1/savingsaccounts/{id}/transactions?command=deposit → DEPOSIT
5. POST /v1/savingsaccounts/{id}/transactions?command=withdrawal → WITHDRAWAL
6. POST /v1/savingsaccounts/{id}?command=close → CLOSED (600)
```

### FD Account Create Flow

```
1. GET /v1/fixeddepositaccounts/template?clientId=1&productId=2
   → depositProductDetails (including rate chart with slabs, min/max term)
2. User selects term (must be within min/max)
3. POST /v1/fixeddepositaccounts → SUBMITTED
4. POST /v1/fixeddepositaccounts/{id}?command=approve
5. POST /v1/fixeddepositaccounts/{id}?command=activate → ACTIVE
6. POST /v1/fixeddepositaccounts/{id}?command=calculatePrematureAmount (preview)
7. POST /v1/fixeddepositaccounts/{id}?command=prematureClose (or close at maturity)
```

### RD Account Create Flow

```
1. GET /v1/recurringdepositaccounts/template?clientId=1&productId=2
   → product details + rate chart + recurring details (mandatory amount, frequency)
2. POST /v1/recurringdepositaccounts → SUBMITTED
3. POST /v1/recurringdepositaccounts/{id}?command=approve
4. POST /v1/recurringdepositaccounts/{id}?command=activate → ACTIVE
5. Recurring deposits auto-created by scheduler or manual
6. POST /v1/recurringdepositaccounts/{id}?command=close
```

---

## 10. Form Layout

### 10.1 Savings Product Create

**Basic Info:** `name`, `shortName`, `description`

**Currency:** `currencyCode`, `digitsAfterDecimal`, `inMultiplesOf`

**Interest:**

- `nominalAnnualInterestRate` (decimal, required)
- `interestCompoundingPeriodType` (select)
- `interestPostingPeriodType` (select)
- `interestCalculationType` (select)
- `interestCalculationDaysInYearType` (select: 360/365)

**Balance & Access:**

- `minRequiredOpeningBalance` (number, optional)
- `lockinPeriodFrequency` + `lockinPeriodFrequencyType`
- `minBalanceForInterestCalculation` (number, optional)
- `withdrawalFeeForTransfers` (checkbox)

**Overdraft (optional section):**

- `allowOverdraft` (checkbox)
- `overdraftLimit`, `nominalAnnualInterestRateOverdraft`
- `minOverdraftForInterestCalculation`, `enforceMinRequiredBalance`
- `minRequiredBalance`

**Lien:** `lienAllowed`, `maxAllowedLienLimit`

**Tax:** `withHoldTax`, `taxGroupId`

**Dormancy (optional):**

- `isDormancyTrackingActive`
- `daysToInactive`, `daysToDormancy`, `daysToEscheat`

**Charges:** Multi-select charge IDs

**Accounting:** `accountingRule` + GL mappings (conditional)

### 10.2 FD Product Create (additions to Savings)

**Deposit Terms:**

- `depositAmount`, `minDepositAmount`, `maxDepositAmount`
- `minDepositTerm` + `minDepositTermTypeId` (required)
- `maxDepositTerm` + `maxDepositTermTypeId`
- `inMultiplesOfDepositTerm` + `inMultiplesOfDepositTermTypeId`

**Pre-closure:**

- `preClosurePenalApplicable` (checkbox)
- `preClosurePenalInterest` (decimal, penalty %)
- `preClosurePenalInterestOnTypeId` (1=Principal, 2=Interest)

**Interest Rate Charts:**

- One or more chart entries with `name`, `fromDate`, `endDate`
- Each chart has slabs: `periodType`, `fromPeriod`, `toPeriod`, `annualInterestRate`, `description`

### 10.3 RD Product Create (additions to FD)

**Recurring Settings:**

- `depositAmount` (required)
- `isMandatoryDeposit` (checkbox)
- `allowWithdrawal` (checkbox)
- `adjustAdvanceTowardsFuturePayments` (checkbox)

### 10.4 Savings Account Form

**Client/Group:** `clientId` or `groupId`

**Product:** `productId` (loads product defaults)

**Dates:** `submittedOnDate`

**Optional:** `externalId`, `fieldOfficerId`

### 10.5 FD/RD Account Form

**Client:** `clientId`

**Product:** `productId` (loads product + rate chart + terms)

**Deposit:** `depositAmount`, `depositPeriod` + `depositPeriodType`

**Maturity Date:** auto-calculated from deposit period + activation date

**Interest Rate:** auto-selected from chart slab based on deposit period

**Pre-closure Preview:** `calculatePrematureAmount` button

---

## 11. API Call Sequence

### Savings Product List & Detail

```
1. GET /v1/savingsproducts?offset=0&limit=50
2. GET /v1/savingsproducts/{id}
```

### Deposit Product List (FD or RD)

```
1. GET /v1/fixeddepositproducts?offset=0&limit=50
2. GET /v1/fixeddepositproducts/{id}?template=true
   → product + term details + rate chart with slabs + charge options
```

### Create Savings Account

```
1. GET /v1/savingsaccounts/template?clientId=1
2. POST /v1/savingsaccounts → resourceId
3. POST /v1/savingsaccounts/{id}?command=approve
4. POST /v1/savingsaccounts/{id}?command=activate
```

### Savings Account Detail

```
1. GET /v1/savingsaccounts/{id}?associations=all
   → summary, transactions, charges, status, subStatus
2. GET /v1/savingsaccounts/{id}/transactions/search?dateFrom=...&dateTo=...
```

### Interest Posting

```
1. POST /v1/savingsaccounts/{id}?command=calculateInterest
   → preview (no state change)
2. POST /v1/savingsaccounts/{id}?command=postInterest
   → creates INTEREST_POSTING transaction
```

### Hold and Release Flow

```
1. POST /v1/savingsaccounts/{id}/transactions?command=holdAmount
   → AMOUNT_HOLD transaction created
2. GET /v1/savingsaccounts/{id}/onholdtransactions
   → list all holds
3. POST /v1/savingsaccounts/{id}/transactions/{holdTxId}?command=releaseAmount
   → AMOUNT_RELEASE transaction created
```

### Premature Closure Preview

```
1. POST /v1/fixeddepositaccounts/{id}?command=calculatePrematureAmount
   → returns premature maturity amount + interest earned (read-only)
2. (User reviews)
3. POST /v1/fixeddepositaccounts/{id}?command=prematureClose
   → actually closes with penalty applied
```

---

## 12. TypeScript Interfaces

```typescript
// ============================================================
// Status & Type Enums
// ============================================================
export interface SavingsAccountStatusEnumData {
  id: number;
  code: string;
  value: string;
  submittedAndPendingApproval: boolean;
  approved: boolean;
  active: boolean;
  withdrawnByApplicant: boolean;
  rejected: boolean;
  closed: boolean;
  matured: boolean;
  preMatureClosure: boolean;
}

export interface SavingsAccountSubStatusEnumData {
  id: number;
  code: string;
  value: string;
  none: boolean;
  inactive: boolean;
  dormant: boolean;
  escheat: boolean;
  block: boolean;
  blockCredit: boolean;
  blockDebit: boolean;
}

export interface SavingsAccountTransactionEnumData {
  id: number;
  code: string;
  value: string;
  deposit: boolean;
  withdrawal: boolean;
  interestPosting: boolean;
  withdrawalFee: boolean;
  annualFee: boolean;
  waiveCharges: boolean;
  payCharge: boolean;
  amountHold: boolean;
  amountRelease: boolean;
  overdraftInterest: boolean;
  withholdTax: boolean;
}

// ============================================================
// Savings Product
// ============================================================
export interface SavingsProductData {
  id: number;
  name: string;
  shortName: string;
  description: string;
  currency: CurrencyData;
  nominalAnnualInterestRate: number;
  interestCompoundingPeriodType: EnumOptionData;
  interestPostingPeriodType: EnumOptionData;
  interestCalculationType: EnumOptionData;
  interestCalculationDaysInYearType: EnumOptionData;
  minRequiredOpeningBalance: number;
  lockinPeriodFrequency: number;
  lockinPeriodFrequencyType: EnumOptionData;
  withdrawalFeeForTransfers: boolean;
  allowOverdraft: boolean;
  overdraftLimit: number;
  nominalAnnualInterestRateOverdraft: number;
  minRequiredBalance: number;
  enforceMinRequiredBalance: boolean;
  lienAllowed: boolean;
  maxAllowedLienLimit: number;
  minBalanceForInterestCalculation: number;
  withHoldTax: boolean;
  taxGroupId: number;
  charges: ChargeData[];
  accountingRule: EnumOptionData;

  // template
  currencyOptions?: CurrencyData[];
  interestCompoundingPeriodTypeOptions?: EnumOptionData[];
  interestPostingPeriodTypeOptions?: EnumOptionData[];
  interestCalculationTypeOptions?: EnumOptionData[];
  interestCalculationDaysInYearTypeOptions?: EnumOptionData[];
  lockinPeriodFrequencyTypeOptions?: EnumOptionData[];
  withdrawalFeeTypeOptions?: EnumOptionData[];
  chargeOptions?: ChargeData[];
  accountMappingOptions?: Record<string, unknown>;
}

// ============================================================
// Deposit Product (FD/RD base)
// ============================================================
export interface DepositProductData extends SavingsProductData {
  minDepositTerm: number;
  maxDepositTerm: number;
  minDepositTermType: EnumOptionData;
  maxDepositTermType: EnumOptionData;
  inMultiplesOfDepositTerm: number;
  inMultiplesOfDepositTermType: EnumOptionData;
  depositAmount: number;
  minDepositAmount: number;
  maxDepositAmount: number;
  preClosurePenalApplicable: boolean;
  preClosurePenalInterest: number;
  preClosurePenalInterestOnType: EnumOptionData;
  charts: InterestRateChartData[];
  chartTemplate?: InterestRateChartData;
}

export interface FixedDepositProductData extends DepositProductData {}

export interface RecurringDepositProductData extends DepositProductData {
  isMandatoryDeposit: boolean;
  allowWithdrawal: boolean;
  adjustAdvanceTowardsFuturePayments: boolean;
  recurringFrequencyType: EnumOptionData;
  recurringFrequency: number;
}

// ============================================================
// Interest Rate Chart
// ============================================================
export interface InterestRateChartData {
  id: number;
  name: string;
  description: string;
  fromDate: string;
  endDate: string;
  chartSlabs: InterestRateChartSlabData[];
  periodTypeOptions?: EnumOptionData[];
}

export interface InterestRateChartSlabData {
  id: number;
  description: string;
  periodType: EnumOptionData;
  fromPeriod: number;
  toPeriod: number;
  annualInterestRate: number;
  currency: CurrencyData;
}

// ============================================================
// Savings Account
// ============================================================
export interface SavingsAccountData {
  id: number;
  accountNo: string;
  externalId: string;
  status: SavingsAccountStatusEnumData;
  subStatus: SavingsAccountSubStatusEnumData;
  clientId: number;
  clientName: string;
  savingsProductId: number;
  savingsProductName: string;
  fieldOfficerId: number;
  currency: CurrencyData;
  nominalAnnualInterestRate: number;
  interestCompoundingPeriodType: EnumOptionData;
  interestPostingPeriodType: EnumOptionData;
  interestCalculationType: EnumOptionData;
  interestCalculationDaysInYearType: EnumOptionData;
  minRequiredOpeningBalance: number;
  lockinPeriodFrequency: number;
  lockinPeriodFrequencyType: EnumOptionData;
  withdrawalFeeForTransfers: boolean;
  allowOverdraft: boolean;
  overdraftLimit: number;
  minOverdraftForInterestCalculation: number;
  enforceMinRequiredBalance: boolean;
  minRequiredBalance: number;
  lienAllowed: boolean;
  maxAllowedLienLimit: number;
  minBalanceForInterestCalculation: number;
  summary: SavingsAccountSummaryData;
  transactions: SavingsAccountTransactionData[];
  charges: SavingsAccountChargeData[];
  timeline: SavingsAccountTimelineData;
  onHoldFunds: number;

  // template
  productOptions?: SavingsProductData[];
  fieldOfficerOptions?: StaffData[];
  chargeOptions?: ChargeData[];
}

export interface SavingsAccountSummaryData {
  currency: CurrencyData;
  totalDeposits: number;
  totalWithdrawals: number;
  totalInterestEarned: number;
  totalInterestPosted: number;
  totalWithdrawalFees: number;
  totalAnnualFees: number;
  totalFeesCharge: number;
  totalPenaltyCharge: number;
  totalOverdraftInterestDerived: number;
  accountBalance: number;
  availableBalance: number;
  withdrawableBalance: number;
  onHoldFunds: number;
}

export interface SavingsAccountTimelineData {
  submittedOnDate: string;
  submittedByUsername: string;
  approvedOnDate: string;
  approvedByUsername: string;
  activatedOnDate: string;
  activatedByUsername: string;
  closedOnDate: string;
  closedByUsername: string;
}

// ============================================================
// Savings Transaction
// ============================================================
export interface SavingsAccountTransactionData {
  id: number;
  accountId: number;
  type: SavingsAccountTransactionEnumData;
  date: string;
  currency: CurrencyData;
  amount: number;
  runningBalance: number;
  reversed: boolean;
  paymentDetailData: PaymentDetailData;
  note: string;
  outstandingLoanBalance: number;
  originalTransactionId: number;
  subCategoryId: number;
  reasonForBlock: string;
}

// ============================================================
// Savings Charge
// ============================================================
export interface SavingsAccountChargeData {
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
  isActive: boolean;
}

// ============================================================
// On-Hold Funds
// ============================================================
export interface DepositAccountOnHoldTransactionData {
  id: number;
  amount: number;
  transactionType: "HOLD" | "RELEASE";
  transactionDate: string;
  reversed: boolean;
  savingsId: number;
  savingsAccountNo: string;
  savingsClientName: string;
  loanId: number;
  loanAccountNo: string;
  loanClientName: string;
}

// ============================================================
// Fixed Deposit Account
// ============================================================
export interface FixedDepositAccountData extends SavingsAccountData {
  depositAmount: number;
  depositPeriod: number;
  depositPeriodType: EnumOptionData;
  maturityDate: string;
  maturityAmount: number;
  expectedFirstDepositOnDate: string;
  preClosurePenalApplicable: boolean;
  preClosurePenalInterest: number;
  preClosurePenalInterestOnType: EnumOptionData;
  charts: InterestRateChartData[];
  interestRateChartHasSlabs: boolean;
}

// ============================================================
// Recurring Deposit Account
// ============================================================
export interface RecurringDepositAccountData extends SavingsAccountData {
  depositAmount: number;
  depositPeriod: number;
  depositPeriodType: EnumOptionData;
  maturityDate: string;
  maturityAmount: number;
  isMandatoryDeposit: boolean;
  allowWithdrawal: boolean;
  adjustAdvanceTowardsFuturePayments: boolean;
  charts: InterestRateChartData[];
  recurringFrequencyType: EnumOptionData;
  recurringFrequency: number;
}

// ============================================================
// FD Premature Closure Result
// ============================================================
export interface PreMatureClosureData {
  maturityAmount: number;
  interestEarned: number;
  principal: number;
  preClosurePenalInterest: number;
  onClosureOptions: EnumOptionData[];
}

// ============================================================
// Create Requests
// ============================================================
export interface CreateSavingsAccountRequest {
  clientId: number;
  productId: number;
  submittedOnDate: string;
  dateFormat: string;
  locale: string;
  externalId?: string;
  fieldOfficerId?: number;
}

export interface CreateFixedDepositAccountRequest {
  clientId: number;
  productId: number;
  submittedOnDate: string;
  depositAmount: number;
  depositPeriod: number;
  depositPeriodTypeId: number;
  dateFormat: string;
  locale: string;
  externalId?: string;
}

export interface CreateRecurringDepositAccountRequest extends CreateFixedDepositAccountRequest {
  mandatoryRecommendedDepositAmount?: number;
}

export interface DepositTransactionRequest {
  transactionDate: string;
  transactionAmount: number;
  dateFormat: string;
  locale: string;
  paymentTypeId?: number;
  note?: string;
}

export interface WithdrawalTransactionRequest {
  transactionDate: string;
  transactionAmount: number;
  dateFormat: string;
  locale: string;
  paymentTypeId?: number;
  note?: string;
}

export interface HoldAmountRequest {
  transactionDate: string;
  transactionAmount: number;
  dateFormat: string;
  locale: string;
  note?: string;
}

export interface SavingsChargeRequest {
  chargeId: number;
  amount: number;
  dueDate: string;
  dateFormat: string;
  locale: string;
}

export interface ApproveSavingsRequest {
  approvedOnDate: string;
  dateFormat: string;
  locale: string;
}

export interface ActivateSavingsRequest {
  activatedOnDate: string;
  dateFormat: string;
  locale: string;
}

export interface CloseSavingsRequest {
  closedOnDate: string;
  closureType: number;
  dateFormat: string;
  locale: string;
  paymentTypeId?: number;
  note?: string;
}

export interface BlockRequest {
  reasonForBlock: string;
  locale: string;
  dateFormat: string;
}

export interface PrematureCloseRequest {
  closedOnDate: string;
  closureType: number;
  dateFormat: string;
  locale: string;
  paymentTypeId?: number;
}

// ============================================================
// Shared
// ============================================================
export interface EnumOptionData {
  id: number;
  code: string;
  value: string;
}

export interface CurrencyData {
  code: string;
  name: string;
  decimalPlaces: number;
  displaySymbol: string;
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
```

---

## 13. React Query Plan

### Query Key Factory

```typescript
export const savingsProductKeys = {
  all: ["savingsProducts"] as const,
  list: () => [...savingsProductKeys.all, "list"] as const,
  detail: (id: number) => [...savingsProductKeys.all, "detail", id] as const,
  template: () => [...savingsProductKeys.all, "template"] as const,
};

export const depositProductKeys = {
  all: ["depositProducts"] as const,
  fixed: {
    all: ["fixedDepositProducts"] as const,
    list: () => [...depositProductKeys.fixed.all, "list"] as const,
    detail: (id: number) => [...depositProductKeys.fixed.all, "detail", id] as const,
    template: () => [...depositProductKeys.fixed.all, "template"] as const,
  },
  recurring: {
    all: ["recurringDepositProducts"] as const,
    list: () => [...depositProductKeys.recurring.all, "list"] as const,
    detail: (id: number) => [...depositProductKeys.recurring.all, "detail", id] as const,
    template: () => [...depositProductKeys.recurring.all, "template"] as const,
  },
};

export const savingsAccountKeys = {
  all: ["savingsAccounts"] as const,
  list: (filters?: Record<string, unknown>) => [...savingsAccountKeys.all, "list", filters] as const,
  detail: (id: number) => [...savingsAccountKeys.all, "detail", id] as const,
  byExternalId: (externalId: string) => [...savingsAccountKeys.all, "externalId", externalId] as const,
  template: (params?: Record<string, unknown>) => [...savingsAccountKeys.all, "template", params] as const,
  transactions: (accountId: number) => [...savingsAccountKeys.all, "transactions", accountId] as const,
  transactionDetail: (accountId: number, txId: number) =>
    [...savingsAccountKeys.all, "transactions", accountId, "detail", txId] as const,
  charges: (accountId: number) => [...savingsAccountKeys.all, "charges", accountId] as const,
  onHoldFunds: (accountId: number) => [...savingsAccountKeys.all, "onHold", accountId] as const,
};

export const fixedDepositKeys = {
  all: ["fixedDepositAccounts"] as const,
  list: (filters?: Record<string, unknown>) => [...fixedDepositKeys.all, "list", filters] as const,
  detail: (id: number) => [...fixedDepositKeys.all, "detail", id] as const,
  template: (params?: Record<string, unknown>) => [...fixedDepositKeys.all, "template", params] as const,
};

export const recurringDepositKeys = {
  all: ["recurringDepositAccounts"] as const,
  list: (filters?: Record<string, unknown>) => [...recurringDepositKeys.all, "list", filters] as const,
  detail: (id: number) => [...recurringDepositKeys.all, "detail", id] as const,
  template: (params?: Record<string, unknown>) => [...recurringDepositKeys.all, "template", params] as const,
};

export const interestRateChartKeys = {
  all: ["interestRateCharts"] as const,
  list: (productId?: number) => [...interestRateChartKeys.all, "list", productId] as const,
  detail: (chartId: number) => [...interestRateChartKeys.all, "detail", chartId] as const,
  template: () => [...interestRateChartKeys.all, "template"] as const,
  slabs: (chartId: number) => [...interestRateChartKeys.all, "slabs", chartId] as const,
};
```

### Cache Invalidation

| Mutation                             | Invalidate                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Create/Update/Delete Savings Product | `savingsProductKeys.all`                                                                                     |
| Create/Update/Delete FD Product      | `depositProductKeys.fixed.all`                                                                               |
| Create/Update/Delete RD Product      | `depositProductKeys.recurring.all`                                                                           |
| Create/Update/Delete Savings Account | `savingsAccountKeys.all`                                                                                     |
| Approve/Activate/Reject/Withdraw     | `savingsAccountKeys.detail(id)`, `savingsAccountKeys.all`                                                    |
| Deposit/Withdrawal/Hold              | `savingsAccountKeys.detail(id)`, `savingsAccountKeys.transactions(id)`                                       |
| Undo/Reverse/Modify Transaction      | `savingsAccountKeys.detail(id)`, `savingsAccountKeys.transactions(id)`                                       |
| Release Amount                       | `savingsAccountKeys.detail(id)`, `savingsAccountKeys.transactions(id)`, `savingsAccountKeys.onHoldFunds(id)` |
| Block/Unblock Account                | `savingsAccountKeys.detail(id)`                                                                              |
| Post Interest                        | `savingsAccountKeys.detail(id)`, `savingsAccountKeys.transactions(id)`                                       |
| Add/Update/Delete Charge             | `savingsAccountKeys.charges(id)`, `savingsAccountKeys.detail(id)`                                            |
| Pay/Waive Charge                     | `savingsAccountKeys.charges(id)`, `savingsAccountKeys.detail(id)`, `savingsAccountKeys.transactions(id)`     |
| Create/Close Premature FD/RD         | `fixedDepositKeys.all` / `recurringDepositKeys.all`                                                          |
| Create/Update/Delete Chart           | `interestRateChartKeys.all`                                                                                  |
| Create/Update/Delete Chart Slab      | `interestRateChartKeys.slabs(chartId)`, `interestRateChartKeys.detail(chartId)`                              |

---

## 14. Implementation Checklist

### Savings Products

- [ ] Product List
- [ ] Product Detail (with optional template data)
- [ ] Product Create (required: name, shortName, currency, interest settings, accountingRule)
- [ ] Product Edit
- [ ] Product Delete
- [ ] Interest compounding/posting/calculation type configuration
- [ ] Overdraft configuration
- [ ] Lien configuration
- [ ] Dormancy tracking configuration
- [ ] Tax group assignment
- [ ] Accounting rule + GL mapping

### Fixed Deposit Products

- [ ] All savings product features (inherited)
- [ ] Deposit term configuration (min/max term, in-multiples-of)
- [ ] Deposit amount configuration (min/max amount)
- [ ] Pre-closure penalty configuration
- [ ] Interest rate chart assignment + slab management
- [ ] Chart slab CRUD (period type, from/to period, annual rate)

### Recurring Deposit Products

- [ ] All FD product features (inherited)
- [ ] Mandatory/voluntary deposit toggle
- [ ] Allow withdrawal toggle
- [ ] Advance payment adjustment toggle
- [ ] Recurring frequency configuration

### Savings Accounts

- [ ] Account List (paginated, filterable by clientId/status)
- [ ] Account Detail (with associations: transactions, charges, summary)
- [ ] Account Create (template-driven with product defaults)
- [ ] Account Edit (while SUBMITTED)
- [ ] Account Delete (while SUBMITTED)
- [ ] Approve
- [ ] Undo Approval
- [ ] Reject
- [ ] Withdraw Application
- [ ] Activate
- [ ] Close (with closure type selection)
- [ ] Status badge (Submitted/Approved/Active/Closed/Rejected)
- [ ] Sub-status indicators (Block/Blocked-Credit/Blocked-Debit/Inactive/Dormant)

### Savings Transactions

- [ ] Deposit
- [ ] Withdrawal
- [ ] Force Withdrawal
- [ ] Hold Amount
- [ ] Release Amount
- [ ] Undo/Reverse/Modify Transaction
- [ ] Transaction Search
- [ ] Running balance display
- [ ] Reversed transaction indicators

### Savings Charges

- [ ] Charge list
- [ ] Add charge (with due date for SPECIFIED_DUE_DATE type)
- [ ] Update charge
- [ ] Delete charge
- [ ] Pay charge
- [ ] Waive charge
- [ ] Inactivate charge
- [ ] Annual fee display / due date tracking

### Block/Unblock

- [ ] Block account (full)
- [ ] Unblock account
- [ ] Block credits only
- [ ] Unblock credits
- [ ] Block debits only
- [ ] Unblock debits
- [ ] Reason-for-block field required on block operations

### Interest & Fees

- [ ] Calculate Interest (preview)
- [ ] Post Interest
- [ ] Post Interest As On (specific date)
- [ ] Apply Annual Fees (manual trigger)
- [ ] On-Hold Funds list
- [ ] On-Hold funds linked to loan guarantees

### Savings Officer

- [ ] Assign Savings Officer
- [ ] Unassign Savings Officer

### Interest Rate Charts

- [ ] Chart list (filterable by product)
- [ ] Chart create (name, fromDate, endDate)
- [ ] Chart edit
- [ ] Chart delete
- [ ] Chart slab list per chart
- [ ] Chart slab create (periodType, fromPeriod, toPeriod, annualInterestRate)
- [ ] Chart slab edit
- [ ] Chart slab delete

### FD/RD Specific

- [ ] FD Account Create (with deposit period + rate chart selection)
- [ ] RD Account Create (with recurring deposit amount)
- [ ] FD/RD Approve
- [ ] FD/RD Activate
- [ ] FD/RD Close (maturity)
- [ ] FD/RD Premature Close
- [ ] FD/RD Calculate Premature Amount (preview)
- [ ] FD maturity date display
- [ ] FD maturity amount display
- [ ] RD update deposit amount
- [ ] RD recurring deposit schedule

### General

- [ ] All list pages support pagination + sorting
- [ ] All date fields use locale + dateFormat pattern
- [ ] Loading + empty + error states for all pages
- [ ] Permission-based UI (hide actions user cannot perform)
- [ ] External ID support
- [ ] Bulk import via Excel templates
- [ ] Account number display
