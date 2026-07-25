# Recurring Deposit — React Implementation Guide

Source: Apache Fineract Portfolio Recurring Deposit Feature  
Trace Date: 2026-07-25  
Java Base: `org.apache.fineract.portfolio.savings`

---

## 1. Overview

Recurring Deposit Accounts (`deposit_type_enum = 300`) are periodic deposit accounts. Clients make regular deposits (monthly/quarterly/etc.) of a fixed amount for a fixed term. Interest is calculated on the accumulating balance using an interest rate chart. Supports mandatory/voluntary deposits, withdrawal allowances, calendar-based or custom schedules, and pre-closure with penalty.

### Key Files

| Layer      | Key Classes                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Controller | `RecurringDepositAccountsApiResource`, `RecurringDepositAccountTransactionsApiResource`                                              |
| Service    | `DepositAccountReadPlatformServiceImpl`, `DepositAccountWritePlatformServiceJpaRepositoryImpl`                                       |
| Assembler  | `DepositAccountAssembler`                                                                                                            |
| Validator  | `DepositAccountDataValidator`, `DepositAccountTransactionDataValidator`                                                              |
| Entity     | `RecurringDepositAccount`, `DepositAccountRecurringDetail`, `RecurringDepositScheduleInstallment`, `DepositAccountTermAndPreClosure` |
| Repository | `RecurringDepositAccountRepository`                                                                                                  |

### Sub-resource APIs

| Resource                   | Base Path                                                               |
| -------------------------- | ----------------------------------------------------------------------- |
| Recurring Deposit Accounts | `/v1/recurringdepositaccounts`                                          |
| RD Transactions            | `/v1/recurringdepositaccounts/{recurringDepositAccountId}/transactions` |
| RD Products                | `/v1/recurringdepositproducts`                                          |

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
      ┌───────┴───────┐
      │               │
      ▼               ▼
  ┌──────────┐  ┌──────────────┐
  │  CLOSED  │  │  PREMATURE   │
  │  (600)   │  │  CLOSED      │
  └──────────┘  └──────────────┘
```

Recurring deposits track installments via `RecurringDepositScheduleInstallment` — one installment per expected deposit date. The schedule is generated on activation based on the deposit period + frequency (or inherited calendar).

---

## 3. API Inventory

### Recurring Deposit Accounts

| Method | URL                                                          | Description                        | Permission                     |
| ------ | ------------------------------------------------------------ | ---------------------------------- | ------------------------------ |
| GET    | `/v1/recurringdepositaccounts/template`                      | Retrieve RD template/form defaults | `recurringdepositaccount` READ |
| GET    | `/v1/recurringdepositaccounts`                               | List RD applications/accounts      | `recurringdepositaccount` READ |
| POST   | `/v1/recurringdepositaccounts`                               | Submit new RD application          | Command-level                  |
| GET    | `/v1/recurringdepositaccounts/{accountId}`                   | Retrieve RD account detail         | `recurringdepositaccount` READ |
| PUT    | `/v1/recurringdepositaccounts/{accountId}`                   | Modify RD application              | Command-level                  |
| POST   | `/v1/recurringdepositaccounts/{accountId}`                   | State commands (`?command=`)       | Command-level                  |
| DELETE | `/v1/recurringdepositaccounts/{accountId}`                   | Delete RD application              | Command-level                  |
| GET    | `/v1/recurringdepositaccounts/{accountId}/template`          | Account closure template           | `recurringdepositaccount` READ |
| GET    | `/v1/recurringdepositaccounts/downloadtemplate`              | Download bulk template             | —                              |
| POST   | `/v1/recurringdepositaccounts/uploadtemplate`                | Upload bulk import                 | —                              |
| GET    | `/v1/recurringdepositaccounts/transactions/downloadtemplate` | Download transaction template      | —                              |
| POST   | `/v1/recurringdepositaccounts/transactions/uploadtemplate`   | Upload transaction bulk            | —                              |

### Commands (POST `?command=`)

| Command                    | Description                     | Valid States |
| -------------------------- | ------------------------------- | ------------ |
| `reject`                   | Reject application              | SUBMITTED    |
| `withdrawnByApplicant`     | Withdraw application            | SUBMITTED    |
| `approve`                  | Approve application             | SUBMITTED    |
| `undoapproval`             | Undo approval                   | APPROVED     |
| `activate`                 | Activate account                | APPROVED     |
| `calculateInterest`        | Calculate interest              | ACTIVE       |
| `postInterest`             | Post calculated interest        | ACTIVE       |
| `close`                    | Close at maturity               | ACTIVE       |
| `prematureClose`           | Pre-mature closure              | ACTIVE       |
| `calculatePrematureAmount` | Preview pre-mature payout       | ACTIVE       |
| `updateDepositAmount`      | Update recurring deposit amount | ACTIVE       |

### Transactions

| Method | URL                                                                                     | Description                                           |
| ------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| GET    | `/v1/recurringdepositaccounts/{recurringDepositAccountId}/transactions/template`        | Transaction template (`?command=deposit\|withdrawal`) |
| GET    | `/v1/recurringdepositaccounts/{recurringDepositAccountId}/transactions/{transactionId}` | Get transaction                                       |
| POST   | `/v1/recurringdepositaccounts/{recurringDepositAccountId}/transactions`                 | Create (`?command=deposit\|withdrawal`)               |
| POST   | `/v1/recurringdepositaccounts/{recurringDepositAccountId}/transactions/{transactionId}` | Adjust/Undo                                           |

---

## 4. Create Workflow (Highest Priority)

### Pre-requisite Lookups

```
Load Offices
  ↓  GET /offices
Select Office
  ↓
Load Clients
  ↓  GET /clients?officeId={officeId}
Select Client
  ↓
Load Recurring Deposit Products
  ↓  GET /recurringdepositproducts
Select Product
  ↓
Load Product Template (pre-fills defaults + recurring details)
  ↓  GET /recurringdepositaccounts/template?clientId={clientId}&productId={productId}
Submit Create Recurring Deposit Application
  ↓  POST /recurringdepositaccounts
```

### Create Request Fields

| Field                                | Type    | Required             | Validation                                                    | Source                          |
| ------------------------------------ | ------- | -------------------- | ------------------------------------------------------------- | ------------------------------- |
| `clientId`                           | Long    | Conditional*         | > 0                                                           | `GET /clients`                  |
| `groupId`                            | Long    | Conditional*         | > 0                                                           | `GET /groups`                   |
| `productId`                          | Long    | **Yes**              | > 0                                                           | `GET /recurringdepositproducts` |
| `submittedOnDate`                    | Date    | **Yes**              | Not null; not future; >= client/group activation              | User                            |
| `accountNo`                          | String  | No                   | Max 20 chars; auto-gen if blank                               | User/auto                       |
| `externalId`                         | String  | No                   | Max 100 chars                                                 | User                            |
| `fieldOfficerId`                     | Long    | No                   | > 0                                                           | `GET /staff`                    |
| `mandatoryRecommendedDepositAmount`  | Decimal | **Yes**              | > 0                                                           | User                            |
| `depositAmount`                      | Decimal | **No**               | For RD, total is derived from recurring amount                | Product default                 |
| `depositPeriod`                      | Integer | Conditional          | > 0; if not fixed-deposit, only required if parameter present | User                            |
| `depositPeriodFrequencyId`           | Integer | If depositPeriod set | 0-3                                                           | Enum                            |
| `nominalAnnualInterestRate`          | Decimal | No                   | >= 0; falls back to product                                   | Product/chart                   |
| `interestCompoundingPeriodType`      | Integer | No                   | 1,4,5,6,7                                                     | Product default                 |
| `interestPostingPeriodType`          | Integer | No                   | 1,4,5,6,7,8,9,10,11                                           | Product default                 |
| `interestCalculationType`            | Integer | No                   | 1, 2                                                          | Product default                 |
| `interestCalculationDaysInYearType`  | Integer | No                   | 360, 365                                                      | Product default                 |
| `lockinPeriodFrequency`              | Integer | No                   | >= 0                                                          | Product default                 |
| `lockinPeriodFrequencyType`          | Integer | No                   | 0-3                                                           | Product default                 |
| `preClosurePenalApplicable`          | Boolean | No                   | If true, requires penal interest + type                       | Product default                 |
| `preClosurePenalInterest`            | Decimal | Conditional          | >= 0; required if penalApplicable=true                        | Product default                 |
| `preClosurePenalInterestOnTypeId`    | Integer | Conditional          | 1, 2                                                          | Product default                 |
| `minDepositTerm`                     | Integer | No                   | > 0                                                           | Product default                 |
| `maxDepositTerm`                     | Integer | No                   | > 0                                                           | Product default                 |
| `minDepositTermTypeId`               | Integer | No                   | 0-3                                                           | Product default                 |
| `maxDepositTermTypeId`               | Integer | No                   | 0-3                                                           | Product default                 |
| `inMultiplesOfDepositTerm`           | Integer | No                   | > 0                                                           | Product default                 |
| `inMultiplesOfDepositTermTypeId`     | Integer | Conditional          | 0-3                                                           | Product default                 |
| `isMandatoryDeposit`                 | Boolean | No                   | true=mandatory, false=voluntary                               | Product default                 |
| `allowWithdrawal`                    | Boolean | No                   | Can withdraw before maturity                                  | Product default                 |
| `adjustAdvanceTowardsFuturePayments` | Boolean | No                   | Excess payments applied to future                             | Product default                 |
| `isCalendarInherited`                | Boolean | **Yes**              | If true, use group calendar; if false, provide frequency      | User                            |
| `recurringFrequencyType`             | Integer | Conditional          | 0-3; required if `isCalendarInherited=false`                  | User                            |
| `recurringFrequency`                 | Integer | Conditional          | > 0; required if `isCalendarInherited=false`                  | User                            |
| `expectedFirstDepositOnDate`         | Date    | No                   | Valid date                                                    | User                            |
| `withHoldTax`                        | Boolean | No                   | Product must have tax group if true                           | Product default                 |
| `charges`                            | Array   | No                   | Each: `chargeId` > 0, `amount` > 0                            | `GET /charges`                  |
| `locale`                             | String  | **Yes**              | e.g. "en"                                                     | User                            |
| `dateFormat`                         | String  | **Yes**              | e.g. "dd MMMM yyyy"                                           | User                            |

*Either `clientId` or `groupId` is required (or both for JLG).

---

## 5. Lookup APIs

| UI Field                 | Endpoint                        | Display                          | Value               | Required              |
| ------------------------ | ------------------------------- | -------------------------------- | ------------------- | --------------------- |
| Office                   | `GET /offices`                  | `name`                           | `id`                | Yes                   |
| Client                   | `GET /clients?officeId={id}`    | `displayName`                    | `id`                | Conditional           |
| Group                    | `GET /groups?officeId={id}`     | `name`                           | `id`                | Conditional           |
| RD Product               | `GET /recurringdepositproducts` | `name`                           | `id`                | Yes                   |
| Field Officer            | `GET /staff?officeId={id}`      | `displayName`                    | `id`                | No                    |
| Recurring Frequency Type | —                               | Days/Weeks/Months/Years          | 0-3                 | Conditional           |
| Interest Compounding     | —                               | Enum map                         | 1,4,5,6,7           | No                    |
| Interest Posting         | —                               | Enum map                         | 1,4,5,6,7,8,9,10,11 | No                    |
| Interest Calculation     | —                               | Enum map                         | 1,2                 | No                    |
| Days In Year             | —                               | 360, 365                         | 360, 365            | No                    |
| Lock-in Period Type      | —                               | Enum map                         | 0,1,2,3             | No                    |
| Pre-closure Penal Type   | —                               | WHOLE_TERM(1), TILL_PREMATURE(2) | 1,2                 | Conditional           |
| Charge                   | `GET /charges`                  | `name`                           | `id`                | No                    |
| Payment Type             | `GET /paymenttypes`             | `name`                           | `id`                | For transactions      |
| Group Calendar           | `GET /groups/{id}/calendars`    | `title`                          | `id`                | If calendar inherited |

---

## 6. API Call Order (Create)

1. `GET /offices` — load offices
2. `GET /clients?officeId={officeId}` — load clients for selected office
3. `GET /recurringdepositproducts` — load RD products
4. `GET /recurringdepositaccounts/template?clientId={clientId}&productId={productId}` — load template
5. `POST /recurringdepositaccounts` — submit application
6. `POST /{accountId}?command=approve` — approve
7. `POST /{accountId}?command=activate` — activate (generates installment schedule)
8. `POST /{accountId}/transactions?command=deposit` — first installment deposit
9. `POST /{accountId}?command=postInterest` — periodic interest posting
10. At completion: `POST /{accountId}?command=close` or `POST /{accountId}?command=prematureClose`

---

## 7. Request Payload Analysis

### Create Recurring Deposit (`POST /v1/recurringdepositaccounts`)

```json
{
  "clientId": 1,
  "productId": 1,
  "submittedOnDate": "01 January 2026",
  "mandatoryRecommendedDepositAmount": 5000,
  "depositPeriod": 12,
  "depositPeriodFrequencyId": 2,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy",
  "isCalendarInherited": false,
  "recurringFrequencyType": 2,
  "recurringFrequency": 1,
  "isMandatoryDeposit": true,
  "allowWithdrawal": false,
  "adjusAdvanceTowardsFuturePayments": false,
  "nominalAnnualInterestRate": 5.0,
  "interestCompoundingPeriodType": 4,
  "interestPostingPeriodType": 4,
  "interestCalculationType": 1,
  "interestCalculationDaysInYearType": 365,
  "expectedFirstDepositOnDate": "15 January 2026"
}
```

### Update Deposit Amount (`POST /{accountId}?command=updateDepositAmount`)

```json
{
  "mandatoryRecommendedDepositAmount": 6000,
  "effectiveDate": "01 March 2026",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Deposit Installment (`POST /{id}/transactions?command=deposit`)

```json
{
  "transactionDate": "15 January 2026",
  "transactionAmount": 5000,
  "paymentTypeId": 1,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Close (`POST /{accountId}?command=close`)

```json
{
  "closedOnDate": "01 January 2027",
  "onAccountClosureId": 100,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

---

## 8. Validation Rules

### Account Validation (`DepositAccountDataValidator`)

**Shared with Fixed Deposit** for: clientId/groupId, productId, submittedOnDate, accountNo, externalId, interest settings, lock-in, pre-closure, withholding tax, charges.

**Recurring-specific (`validateRecurringDetailForSubmit`):**

| Field                                | Required    | Validation                                                                                |
| ------------------------------------ | ----------- | ----------------------------------------------------------------------------------------- |
| `mandatoryRecommendedDepositAmount`  | **Yes**     | > 0                                                                                       |
| `isMandatoryDeposit`                 | No          | Boolean                                                                                   |
| `allowWithdrawal`                    | No          | Boolean                                                                                   |
| `adjustAdvanceTowardsFuturePayments` | No          | Boolean                                                                                   |
| `isCalendarInherited`                | **Yes**     | Not blank; Boolean; if false → `recurringFrequencyType` and `recurringFrequency` required |
| `recurringFrequencyType`             | Conditional | Required if calendar not inherited; 0-3                                                   |
| `recurringFrequency`                 | Conditional | Required if calendar not inherited; > 0                                                   |

### Domain Rule Validation (`RecurringDepositAccount.validateDomainRules`)

| Rule                               | Logic                                     |
| ---------------------------------- | ----------------------------------------- |
| Min term <= Max term               | `minDepositTerm <= maxDepositTerm`        |
| Deposit period >= min term         | If max set, deposit period must be >= min |
| Deposit period <= max term         | If max set, must be <= max                |
| Deposit period in-multiples-of     | If configured, must be valid multiple     |
| Deposit period > lock-in period    | Lock-in period must be <= deposit period  |
| Expected first deposit date        | Must be >= submitted date                 |
| Interest posting/compounding valid | Must be consistent                        |

---

## 9. Business Flow

```
Controller (RecurringDepositAccountsApiResource)
  ↓
PortfolioCommandSourceWritePlatformService.logCommandSource()
  ↓
CommandHandler (e.g., RecurringDepositAccountApplicationSubmittalCommandHandler)
  ↓
Service (DepositAccountWritePlatformServiceJpaRepositoryImpl)
  ↓
Assembler (DepositAccountAssembler.assembleFrom)
  ↓  (depositAccountType = RECURRING_DEPOSIT)
  ├─ Load RecurringDepositProduct from repository
  ├─ Load Client/Group, validate active
  ├─ Assemble DepositAccountTermAndPreClosure
  ├─ Assemble DepositAccountRecurringDetail (recurring settings)
  ├─ Assemble DepositAccountInterestRateChart
  ├─ Construct RecurringDepositAccount entity
  ├─ validateDomainRules()
  └─ validateNewApplicationState()
  ↓
On activation:
  └─ Service generates RecurringDepositScheduleInstallment list
  ↓
Repository (RecurringDepositAccountRepository.save)
  ↓
Database
```

### Key Tables

| Table                                         | Purpose                                                             |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `m_savings_account`                           | Core account (deposit_type_enum = 300)                              |
| `m_deposit_account_recurring_detail`          | Recurring deposit configuration (mandatory, withdrawal, frequency)  |
| `m_deposit_account_term_and_preclosure`       | Term and pre-closure settings                                       |
| `m_recurring_deposit_schedule_installments`   | Individual installment records (expected date, amount, paid status) |
| `m_deposit_account_interest_rate_chart`       | Interest rate chart                                                 |
| `m_deposit_account_interest_rate_chart_slabs` | Chart slab entries                                                  |
| `m_savings_account_transaction`               | Transactions (deposits/withdrawals)                                 |

---

## 10. Related Operations

| Operation                   | Endpoint                                      | Description                |
| --------------------------- | --------------------------------------------- | -------------------------- |
| Update Deposit Amount       | `POST /{id}?command=updateDepositAmount`      | Change recurring amount    |
| Calculate Interest          | `POST /{id}?command=calculateInterest`        | Preview interest           |
| Post Interest               | `POST /{id}?command=postInterest`             | Post interest to balance   |
| Deposit (installment)       | `POST /{id}/transactions?command=deposit`     | Make periodic deposit      |
| Withdrawal                  | `POST /{id}/transactions?command=withdrawal`  | Withdraw funds             |
| Close                       | `POST /{id}?command=close`                    | Maturity closure           |
| Pre-mature Close            | `POST /{id}?command=prematureClose`           | Early closure with penalty |
| Calculate Pre-mature Amount | `POST /{id}?command=calculatePrematureAmount` | Preview pre-mature payout  |
| Adjust Transaction          | `POST /{id}/transactions/{txId}`              | Modify transaction         |
| Undo Transaction            | `POST /{id}/transactions/{txId}?command=undo` | Reverse transaction        |
| Bulk Import                 | download/upload template                      | Mass creation              |

---

## 11. Hidden Dependencies

| Dependency                                 | Impact                                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Recurring amount is mandatory**          | `mandatoryRecommendedDepositAmount` is required (not depositAmount)                                         |
| **Calendar inheritance**                   | If `isCalendarInherited=true`, a group calendar must exist and frequency is derived from it                 |
| **Installment schedule generation**        | Schedule is generated on activation based on deposit period + frequency                                     |
| **Deposit period**                         | Must be > lock-in period                                                                                    |
| **Frequency type consistency**             | If using calendar, the recurring frequency comes from the calendar, not the request                         |
| **Pre-mature close penalty**               | Like FD, pre-mature close applies penalty based on product configuration                                    |
| **Mandatory vs voluntary**                 | `isMandatoryDeposit` affects whether deposits are required or optional                                      |
| **Allow withdrawal**                       | If false, no withdrawals allowed before maturity                                                            |
| **Advance payment adjustment**             | If true, extra deposit amounts adjust future installments                                                   |
| **No linked account/maturity instruction** | RD does not have `maturityInstructionId` or `transferToSavingsId` (unlike FD)                               |
| **Deposit amount**                         | For RD, `depositPeriod` is not strictly required but `depositAmount` total is derived from recurring amount |
| **No overdraft**                           | Recurring deposits hardcode overdraft to false/zero                                                         |
| **No external ID endpoints**               | Unlike savings, RD has no `/external-id/` variants                                                          |

---

## 12. Implementation Checklist

- [ ] Office selector → `GET /offices`
- [ ] Client selector → `GET /clients?officeId={id}`
- [ ] RD product selector → `GET /recurringdepositproducts`
- [ ] Template loader → `GET /recurringdepositaccounts/template?clientId={id}&productId={id}`
- [ ] Create form with: recurring amount, deposit period, frequency type, calendar flag, mandatory/voluntary
- [ ] Calendar selector (if group calendar inherited) → `GET /groups/{id}/calendars`
- [ ] Frequency picker (if calendar not inherited) → recurringFrequencyType + recurringFrequency
- [ ] Submit → `POST /v1/recurringdepositaccounts`
- [ ] Approve → `POST /{id}?command=approve` with `approvedOnDate`
- [ ] Activate → `POST /{id}?command=activate` with `activatedOnDate`
- [ ] Update deposit amount → `POST /{id}?command=updateDepositAmount` with `effectiveDate`
- [ ] Interest preview → `POST /{id}?command=calculateInterest`
- [ ] Interest posting → `POST /{id}?command=postInterest`
- [ ] Installment deposit → `POST /{id}/transactions?command=deposit`
- [ ] Withdrawal → `POST /{id}/transactions?command=withdrawal`
- [ ] Close → `POST /{id}?command=close`
- [ ] Pre-mature close → `POST /{id}?command=prematureClose`
- [ ] Pre-mature amount preview → `POST /{id}?command=calculatePrematureAmount`
- [ ] Transaction adjust → `POST /{id}/transactions/{txId}`
- [ ] Account list → `GET /recurringdepositaccounts`
- [ ] Account detail → `GET /recurringdepositaccounts/{id}`
- [ ] Transaction list → `GET /{id}/transactions`
- [ ] Closure template → `GET /{id}/template?command=close`
- [ ] Charge CRUD → charges endpoints
- [ ] Installment schedule viewer (from account detail response)
- [ ] Bulk import → download/upload template
