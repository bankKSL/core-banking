# Fixed Deposit — React Implementation Guide

Source: Apache Fineract Portfolio Fixed Deposit Feature  
Trace Date: 2026-07-25  
Java Base: `org.apache.fineract.portfolio.savings`

---

## 1. Overview

Fixed Deposit Accounts (`deposit_type_enum = 200`) are term deposit accounts. Clients deposit a fixed amount for a fixed term (period + frequency) and earn interest at a rate determined by an interest rate chart. Pre-closure is allowed with a penalty. At maturity, funds can be withdrawn, transferred to savings, or reinvested.

### Key Files

| Layer      | Key Classes                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Controller | `FixedDepositAccountsApiResource`, `FixedDepositAccountTransactionsApiResource`                                                                     |
| Service    | `DepositAccountReadPlatformServiceImpl`, `DepositAccountWritePlatformServiceJpaRepositoryImpl`, `FixedDepositAccountInterestCalculationServiceImpl` |
| Assembler  | `DepositAccountAssembler`                                                                                                                           |
| Validator  | `DepositAccountDataValidator`, `DepositAccountTransactionDataValidator`                                                                             |
| Entity     | `FixedDepositAccount`, `DepositAccountTermAndPreClosure`, `DepositAccountInterestRateChart`                                                         |
| Repository | `FixedDepositAccountRepository`                                                                                                                     |

### Sub-resource APIs

| Resource               | Base Path                                                       |
| ---------------------- | --------------------------------------------------------------- |
| Fixed Deposit Accounts | `/v1/fixeddepositaccounts`                                      |
| FD Transactions        | `/v1/fixeddepositaccounts/{fixedDepositAccountId}/transactions` |
| FD Products            | `/v1/fixeddepositproducts`                                      |

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

At maturity, the account can also auto-rollover based on `maturityInstructionId`:

- `100` — WITHDRAW_DEPOSIT
- `200` — TRANSFER_TO_SAVINGS
- `300` — REINVEST_PRINCIPAL_AND_INTEREST
- `400` — REINVEST_PRINCIPAL_ONLY

---

## 3. API Inventory

### Fixed Deposit Accounts

| Method | URL                                                     | Description                        | Permission                 |
| ------ | ------------------------------------------------------- | ---------------------------------- | -------------------------- |
| GET    | `/v1/fixeddepositaccounts/template`                     | Retrieve FD template/form defaults | `fixeddepositaccount` READ |
| GET    | `/v1/fixeddepositaccounts`                              | List FD applications/accounts      | `fixeddepositaccount` READ |
| POST   | `/v1/fixeddepositaccounts`                              | Submit new FD application          | Command-level              |
| GET    | `/v1/fixeddepositaccounts/{accountId}`                  | Retrieve FD account detail         | `fixeddepositaccount` READ |
| GET    | `/v1/fixeddepositaccounts/calculate-fd-interest`        | Calculate FD interest              | —                          |
| PUT    | `/v1/fixeddepositaccounts/{accountId}`                  | Modify FD application              | Command-level              |
| POST   | `/v1/fixeddepositaccounts/{accountId}`                  | State commands (`?command=`)       | Command-level              |
| DELETE | `/v1/fixeddepositaccounts/{accountId}`                  | Delete FD application              | Command-level              |
| GET    | `/v1/fixeddepositaccounts/{accountId}/template`         | Account closure template           | `fixeddepositaccount` READ |
| GET    | `/v1/fixeddepositaccounts/downloadtemplate`             | Download bulk template             | —                          |
| POST   | `/v1/fixeddepositaccounts/uploadtemplate`               | Upload bulk import                 | —                          |
| GET    | `/v1/fixeddepositaccounts/transaction/downloadtemplate` | Download transaction template      | —                          |
| POST   | `/v1/fixeddepositaccounts/transaction/uploadtemplate`   | Upload transaction bulk            | —                          |

### Commands (POST `?command=`)

| Command                    | Description                                   | Valid States |
| -------------------------- | --------------------------------------------- | ------------ |
| `reject`                   | Reject application                            | SUBMITTED    |
| `withdrawnByApplicant`     | Withdraw application                          | SUBMITTED    |
| `approve`                  | Approve application                           | SUBMITTED    |
| `undoapproval`             | Undo approval                                 | APPROVED     |
| `activate`                 | Activate account                              | APPROVED     |
| `calculateInterest`        | Calculate interest                            | ACTIVE       |
| `postInterest`             | Post calculated interest                      | ACTIVE       |
| `close`                    | Close at maturity                             | ACTIVE       |
| `prematureClose`           | Pre-mature closure                            | ACTIVE       |
| `calculatePrematureAmount` | Calculate pre-mature amount (no state change) | ACTIVE       |

### Transactions

| Method | URL                                                                             | Description                             |
| ------ | ------------------------------------------------------------------------------- | --------------------------------------- |
| GET    | `/v1/fixeddepositaccounts/{fixedDepositAccountId}/transactions/template`        | Transaction template                    |
| GET    | `/v1/fixeddepositaccounts/{fixedDepositAccountId}/transactions`                 | List transactions                       |
| GET    | `/v1/fixeddepositaccounts/{fixedDepositAccountId}/transactions/{transactionId}` | Get transaction                         |
| POST   | `/v1/fixeddepositaccounts/{fixedDepositAccountId}/transactions`                 | Create (`?command=deposit\|withdrawal`) |
| POST   | `/v1/fixeddepositaccounts/{fixedDepositAccountId}/transactions/{transactionId}` | Adjust transaction                      |

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
Load Fixed Deposit Products
  ↓  GET /fixeddepositproducts
Select Product
  ↓
Load Product Template (pre-fills defaults + interest rate chart)
  ↓  GET /fixeddepositaccounts/template?clientId={clientId}&productId={productId}
Submit Create Fixed Deposit Application
  ↓  POST /fixeddepositaccounts
```

### Create Request Fields

| Field                               | Type    | Required     | Validation                                       | Source                      |
| ----------------------------------- | ------- | ------------ | ------------------------------------------------ | --------------------------- |
| `clientId`                          | Long    | Conditional* | > 0                                              | `GET /clients`              |
| `groupId`                           | Long    | Conditional* | > 0                                              | `GET /groups`               |
| `productId`                         | Long    | **Yes**      | > 0                                              | `GET /fixeddepositproducts` |
| `submittedOnDate`                   | Date    | **Yes**      | Not null; not future; >= client/group activation | User                        |
| `accountNo`                         | String  | No           | Max 20 chars; auto-gen if blank                  | User/auto                   |
| `externalId`                        | String  | No           | Max 100 chars                                    | User                        |
| `fieldOfficerId`                    | Long    | No           | > 0                                              | `GET /staff`                |
| `depositAmount`                     | Decimal | **Yes**      | > 0                                              | User                        |
| `depositPeriod`                     | Integer | **Yes**      | > 0                                              | User                        |
| `depositPeriodFrequencyId`          | Integer | **Yes**      | 0 (Days), 1 (Weeks), 2 (Months), 3 (Years)       | Enum                        |
| `nominalAnnualInterestRate`         | Decimal | No           | >= 0; falls back to product                      | Product/chart               |
| `interestCompoundingPeriodType`     | Integer | No           | 1,4,5,6,7                                        | Product default             |
| `interestPostingPeriodType`         | Integer | No           | 1,4,5,6,7,8,9,10,11                              | Product default             |
| `interestCalculationType`           | Integer | No           | 1 (DAILY_BALANCE), 2 (AVG_DAILY_BALANCE)         | Product default             |
| `interestCalculationDaysInYearType` | Integer | No           | 360, 365                                         | Product default             |
| `lockinPeriodFrequency`             | Integer | No           | >= 0                                             | Product default             |
| `lockinPeriodFrequencyType`         | Integer | No           | 0-3                                              | Product default             |
| `preClosurePenalApplicable`         | Boolean | No           | If true, requires penal interest + type          | Product default             |
| `preClosurePenalInterest`           | Decimal | Conditional  | >= 0; required if penalApplicable=true           | Product default             |
| `preClosurePenalInterestOnTypeId`   | Integer | Conditional  | 1 (WHOLE_TERM), 2 (TILL_PREMATURE_WITHDRAWAL)    | Product default             |
| `minDepositTerm`                    | Integer | No           | > 0                                              | Product default             |
| `maxDepositTerm`                    | Integer | No           | > 0                                              | Product default             |
| `minDepositTermTypeId`              | Integer | No           | 0-3                                              | Product default             |
| `maxDepositTermTypeId`              | Integer | No           | 0-3                                              | Product default             |
| `inMultiplesOfDepositTerm`          | Integer | No           | > 0                                              | Product default             |
| `inMultiplesOfDepositTermTypeId`    | Integer | Conditional  | 0-3; required if inMultiplesOfDepositTerm set    | Product default             |
| `transferInterestToSavings`         | Boolean | No           | If true, `linkedAccount` becomes required        | User                        |
| `linkedAccount`                     | Long    | Conditional  | > 0; must be active and same client              | `GET /savingsaccounts`      |
| `maturityInstructionId`             | Integer | No           | 100/200/300/400 (see lifecycle)                  | User                        |
| `transferToSavingsId`               | Long    | Conditional  | > 0; required if maturityInstructionId=200       | `GET /savingsaccounts`      |
| `withHoldTax`                       | Boolean | No           | Product must have tax group if true              | Product default             |
| `expectedFirstDepositOnDate`        | Date    | No           | Valid date                                       | User                        |
| `charges`                           | Array   | No           | Each: `chargeId` > 0, `amount` > 0               | `GET /charges`              |
| `locale`                            | String  | **Yes**      | e.g. "en"                                        | User                        |
| `dateFormat`                        | String  | **Yes**      | e.g. "dd MMMM yyyy"                              | User                        |

*Either `clientId` or `groupId` is required (or both for JLG).

---

## 5. Lookup APIs

| UI Field             | Endpoint                              | Display                                                         | Value               | Required         |
| -------------------- | ------------------------------------- | --------------------------------------------------------------- | ------------------- | ---------------- |
| Office               | `GET /offices`                        | `name`                                                          | `id`                | Yes              |
| Client               | `GET /clients?officeId={id}`          | `displayName`                                                   | `id`                | Conditional      |
| Group                | `GET /groups?officeId={id}`           | `name`                                                          | `id`                | Conditional      |
| FD Product           | `GET /fixeddepositproducts`           | `name`                                                          | `id`                | Yes              |
| Field Officer        | `GET /staff?officeId={id}`            | `displayName`                                                   | `id`                | No               |
| Deposit Period Freq  | —                                     | Days/Weeks/Months/Years                                         | 0/1/2/3             | Yes              |
| Interest Compounding | —                                     | Enum map                                                        | 1,4,5,6,7           | No               |
| Interest Posting     | —                                     | Enum map                                                        | 1,4,5,6,7,8,9,10,11 | No               |
| Interest Calculation | —                                     | Enum map                                                        | 1,2                 | No               |
| Days In Year         | —                                     | Enum map                                                        | 360, 365            | No               |
| Lock-in Period Type  | —                                     | Enum map                                                        | 0,1,2,3             | No               |
| Pre-closure Penal On | —                                     | WHOLE_TERM(1), TILL_PREMATURE(2)                                | 1,2                 | Conditional      |
| Maturity Instruction | —                                     | WITHDRAW(100), TRANSFER(200), REINVEST_PI(300), REINVEST_P(400) | 100-400             | No               |
| Linked Savings Acct  | `GET /clients/{id}/accounts`          | `accountNo`                                                     | `id`                | Conditional      |
| Charge               | `GET /charges?chargeResourceType=...` | `name`                                                          | `id`                | No               |
| Payment Type         | `GET /paymenttypes`                   | `name`                                                          | `id`                | For transactions |
| Interest Rate Chart  | Included in template response         | Slabs table                                                     | —                   | —                |

---

## 6. API Call Order (Create)

1. `GET /offices` — load offices
2. `GET /clients?officeId={officeId}` — load clients
3. `GET /fixeddepositproducts` — load FD products
4. `GET /fixeddepositaccounts/template?clientId={clientId}&productId={productId}` — load template (includes interest rate chart slabs)
5. `POST /fixeddepositaccounts` — submit application
6. `POST /{accountId}?command=approve` — approve
7. `POST /{accountId}?command=activate` — activate
8. `POST /{accountId}/transactions?command=deposit` — initial deposit (if needed)
9. At maturity: `POST /{accountId}?command=close` or `POST /{accountId}?command=prematureClose`

---

## 7. Request Payload Analysis

### Create Fixed Deposit (`POST /v1/fixeddepositaccounts`)

```json
{
  "clientId": 1,
  "productId": 1,
  "submittedOnDate": "01 January 2026",
  "depositAmount": 100000,
  "depositPeriod": 12,
  "depositPeriodFrequencyId": 2,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy",
  "nominalAnnualInterestRate": 6.5,
  "interestCompoundingPeriodType": 4,
  "interestPostingPeriodType": 4,
  "interestCalculationType": 1,
  "interestCalculationDaysInYearType": 365,
  "maturityInstructionId": 100,
  "preClosurePenalApplicable": true,
  "preClosurePenalInterest": 1.0,
  "preClosurePenalInterestOnTypeId": 1,
  "charges": []
}
```

### Calculate FD Interest (`GET /v1/fixeddepositaccounts/calculate-fd-interest`)

Query params:

```
?principalAmount=100000
&annualInterestRate=6.5
&tenureInMonths=12
&interestCompoundingPeriodInMonths=1
&interestPostingPeriodInMonths=1
```

### Approve (`POST /{accountId}?command=approve`)

```json
{
  "approvedOnDate": "01 January 2026",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Pre-mature Close (`POST /{accountId}?command=prematureClose`)

```json
{
  "closedOnDate": "30 June 2026",
  "onAccountClosureId": 200,
  "toSavingsAccountId": 5,
  "note": "Pre-mature closure due to emergency",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Close at Maturity (`POST /{accountId}?command=close`)

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

| Field                             | Required     | Validation                                               |
| --------------------------------- | ------------ | -------------------------------------------------------- |
| `clientId` / `groupId`            | At least one | Must be > 0; client must be active; group must be active |
| `productId`                       | **Yes**      | Must exist and be active                                 |
| `submittedOnDate`                 | **Yes**      | Not null; not future; >= client/group activation         |
| `depositAmount`                   | **Yes**      | Must be > 0                                              |
| `depositPeriod`                   | **Yes**      | Must be > 0                                              |
| `depositPeriodFrequencyId`        | **Yes**      | Must be 0-3                                              |
| `transferInterestToSavings`       | No           | If true, `linkedAccount` is required                     |
| `linkedAccount`                   | Conditional  | Must be > 0; must be active and belong to same client    |
| `maturityInstructionId`           | No           | Must be 100, 200, 300, or 400                            |
| `transferToSavingsId`             | Conditional  | Required if maturityInstructionId = 200                  |
| `preClosurePenalApplicable`       | No           | If true, requires penal interest + type                  |
| `preClosurePenalInterest`         | Conditional  | >= 0; required if penalApplicable                        |
| `preClosurePenalInterestOnTypeId` | Conditional  | 1 or 2; required if penalApplicable                      |
| `charges`                         | No           | Each chargeId > 0, amount > 0                            |
| `accountNo`                       | No           | Max 20 chars                                             |
| `externalId`                      | No           | Max 100 chars                                            |

### Domain Rule Validation (`FixedDepositAccount.validateDomainRules`)

| Rule                           | Logic                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| Min term <= Max term           | `minDepositTerm <= maxDepositTerm`                                                           |
| Deposit period >= min term     | `depositPeriod >= minDepositTerm`                                                            |
| Deposit period <= max term     | `depositPeriod <= maxDepositTerm`                                                            |
| Deposit period in-multiples-of | If configured, `depositPeriod % inMultiplesOfDepositTerm == 0`                               |
| Interest rate chart valid      | Chart date range must contain submitted/activation date                                      |
| Interest rate > 0              | From chart slab matching deposit amount and period; or nominalAnnualInterestRate if no chart |
| Interest posting period valid  | Must be consistent with compounding period                                                   |

---

## 9. Business Flow

```
Controller (FixedDepositAccountsApiResource)
  ↓
PortfolioCommandSourceWritePlatformService.logCommandSource()
  ↓
CommandHandler (e.g., FixedDepositAccountApplicationSubmittalCommandHandler)
  ↓
Service (DepositAccountWritePlatformServiceJpaRepositoryImpl)
  ↓
Assembler (DepositAccountAssembler.assembleFrom)
  ↓  (depositAccountType = FIXED_DEPOSIT)
  ├─ Load FixedDepositProduct from repository
  ├─ Load Client/Group, validate active
  ├─ Assemble DepositAccountTermAndPreClosure (deposit amount, period, penalties)
  ├─ Assemble DepositAccountInterestRateChart from product chart or provided chartId
  ├─ Construct FixedDepositAccount entity
  ├─ validateDomainRules()
  └─ validateNewApplicationState()
  ↓
Repository (FixedDepositAccountRepository.save)
  ↓
Database
```

### Key Tables

| Table                                         | Purpose                                   |
| --------------------------------------------- | ----------------------------------------- |
| `m_savings_account`                           | Core account (deposit_type_enum = 200)    |
| `m_deposit_account_term_and_preclosure`       | Term, pre-closure settings                |
| `m_deposit_account_interest_rate_chart`       | Interest rate chart for this account      |
| `m_deposit_account_interest_rate_chart_slabs` | Chart slab entries (amount ranges, rates) |
| `m_deposit_account_interest_incentives`       | Interest rate incentives                  |
| `m_deposit_preclosure_detail`                 | Pre-closure penalty config                |
| `m_deposit_term_detail`                       | Min/max term config                       |
| `m_savings_account_transaction`               | Transactions                              |

---

## 10. Related Operations

| Operation                   | Endpoint                                      | Description                 |
| --------------------------- | --------------------------------------------- | --------------------------- |
| Calculate Interest          | `POST /{id}?command=calculateInterest`        | Preview interest            |
| Post Interest               | `POST /{id}?command=postInterest`             | Post interest to balance    |
| Close                       | `POST /{id}?command=close`                    | Maturity closure            |
| Pre-mature Close            | `POST /{id}?command=prematureClose`           | Early closure with penalty  |
| Calculate Pre-mature Amount | `POST /{id}?command=calculatePrematureAmount` | Preview pre-mature payout   |
| Deposit (transaction)       | `POST /{id}/transactions?command=deposit`     | Add deposit                 |
| Withdrawal (transaction)    | `POST /{id}/transactions?command=withdrawal`  | Remove funds                |
| Adjust Transaction          | `POST /{id}/transactions/{txId}`              | Modify existing transaction |
| Add Charge                  | `POST /{id}/charges`                          | Apply charge                |
| Download/Upload Template    | Bulk import                                   | Mass creation               |

---

## 11. Hidden Dependencies

| Dependency                                 | Impact                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| **Interest rate chart must be configured** | FD product must have at least one active interest rate chart with slabs            |
| **Chart date range**                       | Chart must be active on the submitted/activation date                              |
| **Chart slabs + amount**                   | Deposit amount must fall within a slab range to determine applicable interest rate |
| **Min/max deposit term**                   | Product defines term bounds; API request must respect them                         |
| **Linked savings account**                 | Must be active and belong to the same client as the FD                             |
| **Pre-closure penalty**                    | If enabled, interest rate and type are mandatory                                   |
| **Maturity instruction**                   | If 200 (transfer to savings), `transferToSavingsId` is mandatory                   |
| **Reinvest on pre-mature close**           | REINVEST options (300/400) NOT allowed for pre-mature close                        |
| **Tax group**                              | Required if `withHoldTax=true`                                                     |
| **Deposit period frequency id**            | Uses `SavingsPeriodFrequencyType` enum: 0=DAYS, 1=WEEKS, 2=MONTHS, 3=YEARS         |
| **No GSIM**                                | Fixed deposits do NOT support GSIM                                                 |
| **No overdraft**                           | Fixed deposits hardcode overdraft to false/zero                                    |
| **No external ID endpoints**               | Unlike savings, FD has no `/external-id/` variants                                 |

---

## 12. Implementation Checklist

- [ ] Office selector → `GET /offices`
- [ ] Client selector → `GET /clients?officeId={id}`
- [ ] FD product selector → `GET /fixeddepositproducts`
- [ ] Template loader → `GET /fixeddepositaccounts/template?clientId={id}&productId={id}`
- [ ] Create form with: deposit amount, period, frequency, maturity instruction, pre-closure settings
- [ ] Submit → `POST /v1/fixeddepositaccounts`
- [ ] Approve → `POST /{id}?command=approve` with `approvedOnDate`
- [ ] Activate → `POST /{id}?command=activate` with `activatedOnDate`
- [ ] Interest preview → `POST /{id}?command=calculateInterest`
- [ ] Interest posting → `POST /{id}?command=postInterest`
- [ ] Close at maturity → `POST /{id}?command=close`
- [ ] Pre-mature close → `POST /{id}?command=prematureClose`
- [ ] Pre-mature amount preview → `POST /{id}?command=calculatePrematureAmount`
- [ ] Transaction deposit → `POST /{id}/transactions?command=deposit`
- [ ] Transaction withdrawal → `POST /{id}/transactions?command=withdrawal`
- [ ] Transaction adjust → `POST /{id}/transactions/{txId}`
- [ ] Account list → `GET /fixeddepositaccounts`
- [ ] Account detail → `GET /fixeddepositaccounts/{id}` with associations
- [ ] Transaction list → `GET /{id}/transactions`
- [ ] Closure template → `GET /{id}/template?command=close`
- [ ] Interest calculator → `GET /calculate-fd-interest`
- [ ] Charge CRUD → charges endpoints
- [ ] Bulk import → download/upload template
