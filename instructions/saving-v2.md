# Savings Deposit — React Implementation Guide

Source: Apache Fineract Portfolio Savings Feature  
Trace Date: 2026-07-25  
Java Base: `org.apache.fineract.portfolio.savings`

---

## 1. Overview

Savings Accounts (`deposit_type_enum = 100`) are the core deposit product in Fineract. They support deposits, withdrawals, interest calculation/posting, charges, overdrafts, liens, and account blocking.

### Key Files

| Layer      | Key Classes                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Controller | `SavingsAccountsApiResource`, `SavingsAccountTransactionsApiResource`, `SavingsAccountChargesApiResource`                                                        |
| Service    | `SavingsAccountReadPlatformServiceImpl`, `SavingsAccountWritePlatformServiceJpaRepositoryImpl`, `SavingsApplicationProcessWritePlatformServiceJpaRepositoryImpl` |
| Assembler  | `SavingsAccountAssembler`                                                                                                                                        |
| Validator  | `SavingsAccountTransactionDataValidator`                                                                                                                         |
| Entity     | `SavingsAccount`, `SavingsAccountTransaction`, `SavingsAccountCharge`                                                                                            |
| Repository | `SavingsAccountRepository`, `SavingsAccountTransactionRepository`, `SavingsAccountChargeRepository`                                                              |

### Sub-resource APIs

| Resource             | Base Path                                            |
| -------------------- | ---------------------------------------------------- |
| Savings Accounts     | `/v1/savingsaccounts`                                |
| Savings Transactions | `/v1/savingsaccounts/{savingsId}/transactions`       |
| Savings Charges      | `/v1/savingsaccounts/{savingsAccountId}/charges`     |
| On-Hold Funds        | `/v1/savingsaccounts/{savingsId}/onholdtransactions` |
| Savings Products     | `/v1/savingsproducts`                                |
| Internal             | `/v1/internal/savingsaccounts`                       |

---

## 2. Lifecycle

```
                     ┌──────────────────────────────────┐
                     │  SUBMITTED_AND_PENDING_APPROVAL   │  (100)
                     └──────────────┬───────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌───────────────┐    ┌───────────────┐    ┌──────────────────┐
      │   APPROVED    │    │   REJECTED    │    │  WITHDRAWN_BY    │
      │    (200)      │    │    (500)      │    │   APPLICANT      │
      └───────┬───────┘    └───────────────┘    │    (400)         │
              │                                 └──────────────────┘
              ▼
      ┌───────────────┐
      │   ACTIVE      │
      │    (300)      │
      └───────┬───────┘
              │
              ▼
      ┌───────────────┐
      │   CLOSED      │
      │    (600)      │
      └───────────────┘
```

Sub-statuses (while Active):

- `BLOCK` / `BLOCK_CREDIT` / `BLOCK_DEBIT` — account blocked from transactions
- `DORMANT` / `INACTIVE` / `ESCHEAT` — dormancy tracking states

---

## 3. API Inventory

### Savings Accounts

| Method | URL                                                  | Description                                       | Permission            |
| ------ | ---------------------------------------------------- | ------------------------------------------------- | --------------------- |
| GET    | `/v1/savingsaccounts/template`                       | Retrieve template/form defaults                   | `savingsaccount` READ |
| GET    | `/v1/savingsaccounts`                                | List savings accounts                             | `savingsaccount` READ |
| POST   | `/v1/savingsaccounts`                                | Submit new savings application                    | Command-level         |
| POST   | `/v1/savingsaccounts/gsim`                           | Submit GSIM application                           | Command-level         |
| GET    | `/v1/savingsaccounts/{accountId}`                    | Retrieve account detail                           | `savingsaccount` READ |
| GET    | `/v1/savingsaccounts/external-id/{externalId}`       | Retrieve by external ID                           | `savingsaccount` READ |
| PUT    | `/v1/savingsaccounts/{accountId}`                    | Modify application (`?command=updateWithHoldTax`) | Command-level         |
| PUT    | `/v1/savingsaccounts/external-id/{externalId}`       | Modify by external ID                             | Command-level         |
| PUT    | `/v1/savingsaccounts/gsim/{parentAccountId}`         | Update GSIM account                               | Command-level         |
| POST   | `/v1/savingsaccounts/gsimcommands/{parentAccountId}` | GSIM commands                                     | Command-level         |
| POST   | `/v1/savingsaccounts/{accountId}`                    | State commands (`?command=`)                      | Command-level         |
| POST   | `/v1/savingsaccounts/external-id/{externalId}`       | State commands by external ID                     | Command-level         |
| DELETE | `/v1/savingsaccounts/{accountId}`                    | Delete application                                | Command-level         |
| DELETE | `/v1/savingsaccounts/external-id/{externalId}`       | Delete by external ID                             | Command-level         |
| GET    | `/v1/savingsaccounts/downloadtemplate`               | Download bulk import template                     | —                     |
| POST   | `/v1/savingsaccounts/uploadtemplate`                 | Upload bulk import                                | —                     |
| GET    | `/v1/savingsaccounts/transactions/downloadtemplate`  | Download transaction template                     | —                     |
| POST   | `/v1/savingsaccounts/transactions/uploadtemplate`    | Upload transaction bulk                           | —                     |

### Commands (POST `?command=`)

| Command                  | Description              | Valid States |
| ------------------------ | ------------------------ | ------------ |
| `reject`                 | Reject application       | SUBMITTED    |
| `withdrawnByApplicant`   | Withdraw application     | SUBMITTED    |
| `approve`                | Approve application      | SUBMITTED    |
| `undoapproval`           | Undo approval            | APPROVED     |
| `activate`               | Activate account         | APPROVED     |
| `calculateInterest`      | Calculate interest       | ACTIVE       |
| `postInterest`           | Post calculated interest | ACTIVE       |
| `applyAnnualFees`        | Apply annual fees        | ACTIVE       |
| `close`                  | Close account            | ACTIVE       |
| `assignSavingsOfficer`   | Assign savings officer   | —            |
| `unassignSavingsOfficer` | Unassign savings officer | —            |
| `block`                  | Block all transactions   | ACTIVE       |
| `unblock`                | Unblock account          | ACTIVE       |
| `blockCredit`            | Block credits            | ACTIVE       |
| `unblockCredit`          | Unblock credits          | ACTIVE       |
| `blockDebit`             | Block debits             | ACTIVE       |
| `unblockDebit`           | Unblock debits           | ACTIVE       |

### Transactions

| Method | URL                                                                                | Description                                                                                          |
| ------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| GET    | `/v1/savingsaccounts/{savingsId}/transactions/template`                            | Transaction template                                                                                 |
| GET    | `/v1/savingsaccounts/{savingsId}/transactions/{transactionId}`                     | Get transaction                                                                                      |
| GET    | `/v1/savingsaccounts/{savingsId}/transactions/external-id/{transactionExternalId}` | Get by external ID                                                                                   |
| GET    | `/v1/savingsaccounts/{savingsId}/transactions/search`                              | Search transactions                                                                                  |
| POST   | `/v1/savingsaccounts/{savingsId}/transactions/query`                               | Advanced query                                                                                       |
| POST   | `/v1/savingsaccounts/{savingsId}/transactions`                                     | Create (`?command=deposit\|withdrawal\|gsimDeposit\|force-withdrawal\|postInterestAsOn\|holdAmount`) |
| POST   | `/v1/savingsaccounts/{savingsId}/transactions/{transactionId}`                     | Adjust/Undo/Reverse/Release                                                                          |

### Charges

| Method | URL                                                         | Description          |
| ------ | ----------------------------------------------------------- | -------------------- |
| GET    | `/v1/savingsaccounts/{savingsAccountId}/charges`            | List charges         |
| GET    | `/v1/savingsaccounts/{savingsAccountId}/charges/template`   | Charges template     |
| GET    | `/v1/savingsaccounts/{savingsAccountId}/charges/{chargeId}` | Get charge           |
| POST   | `/v1/savingsaccounts/{savingsAccountId}/charges`            | Add charge           |
| PUT    | `/v1/savingsaccounts/{savingsAccountId}/charges/{chargeId}` | Update charge        |
| POST   | `/v1/savingsaccounts/{savingsAccountId}/charges/{chargeId}` | Pay/Waive/Inactivate |
| DELETE | `/v1/savingsaccounts/{savingsAccountId}/charges/{chargeId}` | Delete charge        |

### On-Hold Transactions

| Method | URL                                                  | Description        |
| ------ | ---------------------------------------------------- | ------------------ |
| GET    | `/v1/savingsaccounts/{savingsId}/onholdtransactions` | List on-hold funds |

---

## 4. Create Workflow (Highest Priority)

### Pre-requisite Lookups

```
Load Offices
  ↓  GET /offices
Select Office
  ↓
Load Clients (filtered by office)
  ↓  GET /clients?officeId={officeId}
Select Client
  ↓
Load Savings Products
  ↓  GET /savingsproducts
Select Product
  ↓
Load Product Template (pre-fills defaults)
  ↓  GET /savingsaccounts/template?clientId={clientId}&productId={productId}
Submit Create Savings Account
  ↓  POST /savingsaccounts
```

### Create Request Fields

| Field                                | Type    | Required     | Validation                                       | Source                 |
| ------------------------------------ | ------- | ------------ | ------------------------------------------------ | ---------------------- |
| `clientId`                           | Long    | Conditional* | > 0                                              | `GET /clients`         |
| `groupId`                            | Long    | Conditional* | > 0                                              | `GET /groups`          |
| `productId`                          | Long    | **Yes**      | > 0                                              | `GET /savingsproducts` |
| `submittedOnDate`                    | Date    | **Yes**      | Not null; not future; >= client/group activation | User input             |
| `accountNo`                          | String  | No           | Max 20 chars; auto-gen if blank                  | User/auto              |
| `externalId`                         | String  | No           | Max 100 chars                                    | User                   |
| `fieldOfficerId`                     | Long    | No           | > 0                                              | `GET /staff`           |
| `nominalAnnualInterestRate`          | Decimal | No           | >= 0; falls back to product                      | Product default        |
| `interestCompoundingPeriodType`      | Integer | No           | 1,4,5,6,7                                        | Product default        |
| `interestPostingPeriodType`          | Integer | No           | 1,4,5,6,7,8,9,10,11                              | Product default        |
| `interestCalculationType`            | Integer | No           | 1 (DAILY_BALANCE), 2 (AVG_DAILY_BALANCE)         | Product default        |
| `interestCalculationDaysInYearType`  | Integer | No           | 360, 365                                         | Product default        |
| `minRequiredOpeningBalance`          | Decimal | No           | >= 0                                             | Product default        |
| `lockinPeriodFrequency`              | Integer | No           | >= 0                                             | Product default        |
| `lockinPeriodFrequencyType`          | Integer | No           | 0-3 (Days/Weeks/Months/Years)                    | Product default        |
| `withdrawalFeeForTransfers`          | Boolean | No           | true/false                                       | Default false          |
| `allowOverdraft`                     | Boolean | No           | true/false                                       | Product default        |
| `overdraftLimit`                     | Decimal | No           | >= 0                                             | Product default        |
| `nominalAnnualInterestRateOverdraft` | Decimal | No           | >= 0                                             | Product default        |
| `minOverdraftForInterestCalculation` | Decimal | No           | >= 0                                             | Product default        |
| `enforceMinRequiredBalance`          | Boolean | No           | true/false                                       | Product default        |
| `minRequiredBalance`                 | Decimal | No           | >= 0                                             | Product default        |
| `lienAllowed`                        | Boolean | No           | true/false                                       | Product default        |
| `maxAllowedLienLimit`                | Decimal | No           | >= 0                                             | Product default        |
| `withHoldTax`                        | Boolean | No           | Product must have tax group if true              | Product default        |
| `charges`                            | Array   | No           | Each: `chargeId` > 0, `amount` > 0               | `GET /charges`         |
| `locale`                             | String  | **Yes**      | e.g. "en"                                        | User                   |
| `dateFormat`                         | String  | **Yes**      | e.g. "dd MMMM yyyy"                              | User                   |

*Either `clientId` or `groupId` is required (or both for JLG).

### Validation Summary

- At least one of clientId/groupId required
- clientId must refer to an active client
- groupId must refer to an active group
- If both provided, client must be a member of the group
- submittedOnDate must not be in the future and must be >= client/group activation date
- If withHoldTax=true, product must have a TaxGroup configured
- Overdraft limits must be set if allowOverdraft=true
- Lock-in period frequency/type must be consistent

---

## 5. Lookup APIs

| UI Field             | Endpoint                              | Display       | Value               | Required         |
| -------------------- | ------------------------------------- | ------------- | ------------------- | ---------------- |
| Office               | `GET /offices`                        | `name`        | `id`                | Yes              |
| Client               | `GET /clients?officeId={id}`          | `displayName` | `id`                | Conditional      |
| Group                | `GET /groups?officeId={id}`           | `name`        | `id`                | Conditional      |
| Product              | `GET /savingsproducts`                | `name`        | `id`                | Yes              |
| Field Officer        | `GET /staff?officeId={id}`            | `displayName` | `id`                | No               |
| Interest Compounding | —                                     | Enum map      | 1,4,5,6,7           | No               |
| Interest Posting     | —                                     | Enum map      | 1,4,5,6,7,8,9,10,11 | No               |
| Interest Calculation | —                                     | Enum map      | 1,2                 | No               |
| Days In Year         | —                                     | Enum map      | 360, 365            | No               |
| Lock-in Period Type  | —                                     | Enum map      | 0,1,2,3             | No               |
| Charge               | `GET /charges?chargeResourceType=...` | `name`        | `id`                | No               |
| Payment Type         | `GET /paymenttypes`                   | `name`        | `id`                | For transactions |

---

## 6. API Call Order (Create)

1. `GET /offices` — load offices
2. `GET /clients?officeId={officeId}` — load clients for selected office
3. `GET /savingsproducts` — load savings products
4. `GET /savingsaccounts/template?clientId={clientId}&productId={productId}` — load template with defaults
5. `POST /savingsaccounts` — submit the application
6. `POST /savingsaccounts/{accountId}?command=approve` — approve
7. `POST /savingsaccounts/{accountId}?command=activate` — activate

---

## 7. Request Payload Analysis

### Create Savings Account (`POST /v1/savingsaccounts`)

```json
{
  "clientId": 1,
  "productId": 1,
  "submittedOnDate": "01 January 2026",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy",
  "nominalAnnualInterestRate": 4.5,
  "interestCompoundingPeriodType": 4,
  "interestPostingPeriodType": 4,
  "interestCalculationType": 1,
  "interestCalculationDaysInYearType": 365,
  "minRequiredOpeningBalance": 1000,
  "lockinPeriodFrequency": 6,
  "lockinPeriodFrequencyType": 2,
  "withdrawalFeeForTransfers": false,
  "allowOverdraft": false,
  "charges": [{ "chargeId": 1, "amount": 50 }]
}
```

### Approve (`POST /v1/savingsaccounts/{accountId}?command=approve`)

```json
{
  "approvedOnDate": "01 January 2026",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Activate (`POST /v1/savingsaccounts/{accountId}?command=activate`)

```json
{
  "activatedOnDate": "01 January 2026",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Deposit Transaction (`POST /v1/savingsaccounts/{savingsId}/transactions?command=deposit`)

```json
{
  "transactionDate": "15 January 2026",
  "transactionAmount": 5000,
  "paymentTypeId": 1,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Withdrawal Transaction (`POST /v1/savingsaccounts/{savingsId}/transactions?command=withdrawal`)

```json
{
  "transactionDate": "20 January 2026",
  "transactionAmount": 2000,
  "paymentTypeId": 1,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Close Account (`POST /v1/savingsaccounts/{accountId}?command=close`)

```json
{
  "closedOnDate": "31 December 2026",
  "withdrawBalance": true,
  "paymentTypeId": 1,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Hold Amount (`POST /v1/savingsaccounts/{savingsId}/transactions?command=holdAmount`)

```json
{
  "transactionDate": "15 January 2026",
  "transactionAmount": 1000,
  "reasonForBlock": "Court order hold",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

---

## 8. Validation Rules

### Account Validation (`SavingsAccount` domain entity)

| Rule                                      | Logic                                                                   | Error                         |
| ----------------------------------------- | ----------------------------------------------------------------------- | ----------------------------- |
| Submitted date not future                 | `!submittedOnDate.isAfter(DateUtils.getLocalDateOfTenant())`            | Invalid submitted on date     |
| Submitted date >= client/group activation | `submittedOnDate.isAfter(client.activationDate)`                        | Cannot be before activation   |
| Lock-in consistency                       | If lockinPeriodFrequency provided, lockinPeriodFrequencyType must exist | Invalid lock-in configuration |

### Transaction Validation (`SavingsAccountTransactionDataValidator`)

| Field                      | Rule                                                              |
| -------------------------- | ----------------------------------------------------------------- |
| `transactionDate`          | Required, not null                                                |
| `transactionAmount`        | Required, > 0                                                     |
| `paymentTypeId`            | Required                                                          |
| `externalId`               | Optional, max 100 chars                                           |
| `transactionAccountNumber` | Optional, max 50 chars                                            |
| `checkNumber`              | Optional, max 50 chars                                            |
| `routingCode`              | Optional, max 50 chars                                            |
| `receiptNumber`            | Optional, max 50 chars                                            |
| `bankNumber`               | Optional, max 50 chars                                            |
| Pivot date                 | Cannot be before last interest posting date (minus relaxing days) |

### Hold Amount Validation

| Check              | Rule                                                         |
| ------------------ | ------------------------------------------------------------ |
| `reasonForBlock`   | Required, max 100 chars, not blank                           |
| Account active     | Must be ACTIVE                                               |
| Balance (non-lien) | Must have sufficient withdrawable balance                    |
| Lien               | If lienAllowed, check limits; if not, error                  |
| Date sequence      | Cannot be before last transaction date                       |
| Overdraft          | If overdraft, amount <= withdrawableBalance + overdraftLimit |

### Charge Validation

| Rule            | Detail            |
| --------------- | ----------------- |
| `chargeId`      | Must exist        |
| `amount`        | Required, > 0     |
| `feeOnMonthDay` | Optional          |
| `feeInterval`   | If provided, 1-12 |

---

## 9. Business Flow

```
Controller (SavingsAccountsApiResource)
  ↓
PortfolioCommandSourceWritePlatformService.logCommandSource()
  ↓  (creates CommandWrapper, processes via CommandHandler)
Command Handler (e.g., SavingsAccountApplicationSubmittalCommandHandler)
  ↓
Service (SavingsAccountWritePlatformServiceJpaRepositoryImpl)
  ↓
Assembler (SavingsAccountAssembler.assembleFrom)
  ↓  (builds SavingsAccount entity with all fields/defaults)
Validator (PlatformApiDataValidationException on failure)
  ↓  (validateNewApplicationState + validateAccountValuesWithProduct)
Domain Entity (SavingsAccount)
  ↓
Repository (SavingsAccountRepository.save)
  ↓
Database (m_savings_account table)
```

### Key Tables

| Table                                   | Purpose                                      |
| --------------------------------------- | -------------------------------------------- |
| `m_savings_account`                     | Core savings account record                  |
| `m_savings_account_transaction`         | All deposit/withdrawal/interest transactions |
| `m_savings_account_charge`              | Charges applied to the account               |
| `m_savings_account_charge_paid_by`      | Links charges to transactions that paid them |
| `m_deposit_account_on_hold_transaction` | Held/frozen amounts                          |
| `m_savings_officer_assignment_history`  | Officer assignment tracking                  |

---

## 10. Related Operations

| Operation           | Endpoint                                        | Description              |
| ------------------- | ----------------------------------------------- | ------------------------ |
| Deposit             | `POST /transactions?command=deposit`            | Add funds to account     |
| Withdrawal          | `POST /transactions?command=withdrawal`         | Remove funds             |
| Hold                | `POST /transactions?command=holdAmount`         | Freeze amount            |
| Release Hold        | `POST /transactions/{id}?command=releaseAmount` | Unfreeze                 |
| Force Withdrawal    | `POST /transactions?command=force-withdrawal`   | Force withdrawal         |
| Post Interest       | `POST /{accountId}?command=postInterest`        | Post accrued interest    |
| Calculate Interest  | `POST /{accountId}?command=calculateInterest`   | Run interest calc        |
| Apply Annual Fees   | `POST /{accountId}?command=applyAnnualFees`     | Apply annual fee charges |
| Block               | `POST /{accountId}?command=block`               | Freeze account           |
| Block Debits        | `POST /{accountId}?command=blockDebit`          | Prevent withdrawals      |
| Block Credits       | `POST /{accountId}?command=blockCredit`         | Prevent deposits         |
| Add Charge          | `POST /charges`                                 | Apply fee/penalty        |
| Waive Charge        | `POST /charges/{id}?command=waive`              | Waive fee                |
| Pay Charge          | `POST /charges/{id}?command=paycharge`          | Pay fee from balance     |
| Inactivate Charge   | `POST /charges/{id}?command=inactivate`         | Remove charge            |
| Adjust Transaction  | `POST /transactions/{id}?command=modify`        | Modify transaction       |
| Undo Transaction    | `POST /transactions/{id}?command=undo`          | Reverse transaction      |
| Search Transactions | `GET /transactions/search`                      | Advanced search          |

---

## 11. Hidden Dependencies

| Dependency                        | Impact                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| **Office must exist**             | Client lookup fails without office                                                    |
| **Client must be active**         | Account cannot be created for non-active client                                       |
| **Product must exist**            | All default values come from product                                                  |
| **Template endpoint**             | Should be called to get interest type enums and product defaults                      |
| **Tax Group configuration**       | If `withHoldTax=true`, product must have tax group set up                             |
| **Back-dated transaction config** | Global config affects whether transactions before a pivot date are allowed            |
| **Dormancy tracking**             | If enabled, accounts auto-transition through INACTIVE → DORMANT → ESCHEAT             |
| **Force withdrawal config**       | Global config `allow-force-withdrawal-on-savings-account` must be enabled             |
| **External events**               | Business events are published but disabled by default; enable via Liquibase if needed |
| **GSIM flag**                     | `isGSIM=true` switches to Group Savings Individual Member mode                        |
| **External ID uniqueness**        | External IDs must be unique; duplicate causes constraint violation                    |

---

## 12. Implementation Checklist

- [ ] Office selector → `GET /offices`
- [ ] Client selector → `GET /clients?officeId={id}`
- [ ] Product selector → `GET /savingsproducts`
- [ ] Template loader → `GET /savingsaccounts/template?clientId={id}&productId={id}`
- [ ] Create form with all fields (see Section 4)
- [ ] Submit → `POST /v1/savingsaccounts`
- [ ] Approve → `POST /{id}?command=approve` with `approvedOnDate`
- [ ] Activate → `POST /{id}?command=activate` with `activatedOnDate`
- [ ] Deposit → `POST /{id}/transactions?command=deposit`
- [ ] Withdrawal → `POST /{id}/transactions?command=withdrawal`
- [ ] Hold amount → `POST /{id}/transactions?command=holdAmount`
- [ ] Release hold → `POST /{id}/transactions/{txId}?command=releaseAmount`
- [ ] Interest posting → `POST /{id}?command=postInterest`
- [ ] Close → `POST /{id}?command=close` with `closedOnDate`
- [ ] Block/unblock → `POST /{id}?command=block` / `unblock`
- [ ] Charge CRUD → charges endpoints
- [ ] Charge waive/pay → `POST /charges/{id}?command=waive`/`paycharge`
- [ ] Transaction adjust/undo → `POST /transactions/{id}`
- [ ] Account list → `GET /savingsaccounts`
- [ ] Account detail → `GET /savingsaccounts/{id}` with associations
- [ ] Transaction list → `GET /{id}/transactions`
- [ ] On-hold fund list → `GET /{id}/onholdtransactions`
- [ ] Bulk import → download/upload template
