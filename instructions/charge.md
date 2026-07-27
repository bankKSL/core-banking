# Charges — React Implementation Guide

Source: Apache Fineract Portfolio Charge Feature  
Trace Date: 2026-07-26  
Java Base: `org.apache.fineract.portfolio.charge`

---

## 1. Feature Overview

Charges define fees and penalties that can be applied to loans, savings accounts, client accounts, and share accounts. They control the timing, calculation method, collection mode, and accounting treatment of each fee.

### Key Concepts

| Concept                     | Description                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| **Charge Applies To**       | What entity the charge targets: Loan, Savings, Client, Shares, or Working Capital Loan            |
| **Charge Time Type**        | When the charge is triggered (e.g., at disbursement, on overdue, monthly, annually)               |
| **Charge Calculation Type** | How the amount is calculated (flat amount, percentage of principal, percentage of interest, etc.) |
| **Charge Payment Mode**     | How the charge is collected (regular repayment or account transfer)                               |
| **Penalty**                 | Flag indicating the charge is a penalty (e.g., late fee) — overdue charges MUST be penalties      |
| **Fee Frequency**           | For recurring charges, how often they apply (daily/weekly/monthly/yearly)                         |

### Main Java Classes

| Layer         | Classes                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Entity        | `Charge`                                                                                                                                     |
| API           | `ChargesApiResource`                                                                                                                         |
| Read Service  | `ChargeReadPlatformService` / `ChargeReadPlatformServiceImpl`, `ChargeDropdownReadPlatformService` / `ChargeDropdownReadPlatformServiceImpl` |
| Write Service | `ChargeWritePlatformService` / `ChargeWritePlatformServiceJpaRepositoryImpl`                                                                 |
| Validation    | `ChargeDefinitionCommandFromApiJsonDeserializer`                                                                                             |
| Repository    | `ChargeRepository`, `ChargeRepositoryWrapper`                                                                                                |

---

## 2. API Inventory

### Charges (`/v1/charges`)

| Method | URL                      | Description                                                                   | Permission      |
| ------ | ------------------------ | ----------------------------------------------------------------------------- | --------------- |
| GET    | `/v1/charges`            | List all active (non-deleted) charges                                         | `READ_CHARGE`   |
| GET    | `/v1/charges/template`   | Template with dropdown options (types, calculations, currencies, GL accounts) | `READ_CHARGE`   |
| GET    | `/v1/charges/{chargeId}` | Single charge detail (supports `?template=true`)                              | `READ_CHARGE`   |
| POST   | `/v1/charges`            | Create charge definition                                                      | `CREATE_CHARGE` |
| PUT    | `/v1/charges/{chargeId}` | Update charge definition                                                      | `UPDATE_CHARGE` |
| DELETE | `/v1/charges/{chargeId}` | Soft-delete charge                                                            | `DELETE_CHARGE` |

---

## 3. CRUD Analysis

| Operation    | Endpoint                   | Notes                                                                            |
| ------------ | -------------------------- | -------------------------------------------------------------------------------- |
| **List**     | `GET /v1/charges`          | All charges where `is_deleted=false`                                             |
| **Detail**   | `GET /v1/charges/{id}`     | With optional `?template=true` for allowed options                               |
| **Template** | `GET /v1/charges/template` | Calculation type options, time type options, currencies, GL accounts, tax groups |
| **Create**   | `POST /v1/charges`         |                                                                                  |
| **Update**   | `PUT /v1/charges/{id}`     | `chargeAppliesTo` cannot change after creation                                   |
| **Delete**   | `DELETE /v1/charges/{id}`  | Soft-delete; fails if associated with any product or account                     |

---

## 4. Create Workflow (Highest Priority)

### Charge Enums Reference

**ChargeAppliesTo:**

| Value | Name                 | Description               |
| ----- | -------------------- | ------------------------- |
| 1     | LOAN                 | Loan fees/penalties       |
| 2     | SAVINGS              | Savings account fees      |
| 3     | CLIENT               | Client-level fees         |
| 4     | SHARES               | Share account fees        |
| 5     | WORKING_CAPITAL_LOAN | Working capital loan fees |

**ChargeTimeType (Loan):**

| Value | Name                 | Notes                                   |
| ----- | -------------------- | --------------------------------------- |
| 1     | DISBURSEMENT         | At loan disbursement; cannot be penalty |
| 2     | SPECIFIED_DUE_DATE   | On a specific date                      |
| 8     | INSTALMENT_FEE       | Per installment                         |
| 9     | OVERDUE_INSTALLMENT  | On overdue; MUST be penalty             |
| 12    | TRANCHE_DISBURSEMENT | Per tranche disbursement                |

**ChargeTimeType (Savings):**

| Value | Name                   | Notes                                              |
| ----- | ---------------------- | -------------------------------------------------- |
| 2     | SPECIFIED_DUE_DATE     | On a specific date                                 |
| 3     | SAVINGS_ACTIVATION     | On account activation                              |
| 4     | SAVINGS_CLOSURE        | On account closure                                 |
| 5     | WITHDRAWAL_FEE         | Per withdrawal                                     |
| 6     | ANNUAL_FEE             | Annual fee (requires feeOnMonthDay)                |
| 7     | MONTHLY_FEE            | Monthly fee (requires feeOnMonthDay + feeInterval) |
| 10    | OVERDRAFT_FEE          | On overdraft                                       |
| 11    | WEEKLY_FEE             | Weekly fee                                         |
| 16    | SAVINGS_NOACTIVITY_FEE | Dormant account fee                                |

**ChargeCalculationType:**

| Value | Name                           | Valid For             |
| ----- | ------------------------------ | --------------------- |
| 1     | FLAT                           | All                   |
| 2     | PERCENT_OF_AMOUNT              | Loan, Savings, Shares |
| 3     | PERCENT_OF_AMOUNT_AND_INTEREST | Loan only             |
| 4     | PERCENT_OF_INTEREST            | Loan only             |
| 5     | PERCENT_OF_DISBURSEMENT_AMOUNT | Loan (tranche)        |

**ChargePaymentMode:**

| Value | Name             |
| ----- | ---------------- |
| 0     | REGULAR          |
| 1     | ACCOUNT_TRANSFER |

### Create Charge Fields

| Field                   | Required     | Type          | Validation                                  | Source                  |
| ----------------------- | ------------ | ------------- | ------------------------------------------- | ----------------------- |
| `name`                  | ✅           | string(100)   | Not blank, unique                           | User                    |
| `chargeAppliesTo`       | ✅           | int(1-5)      | Must be valid                               | Dropdown                |
| `currencyCode`          | ✅           | string(3)     | Must be valid currency                      | `GET /currencies`       |
| `chargeTimeType`        | ✅           | int           | Must be valid for appliesTo                 | `GET /charges/template` |
| `chargeCalculationType` | ✅           | int           | Must be valid for appliesTo                 | `GET /charges/template` |
| `amount`                | ✅           | decimal       | Positive                                    | User                    |
| `chargePaymentMode`     | ✅ (if Loan) | int(0/1)      | Required for loan charges                   | Dropdown                |
| `penalty`               | ❌           | boolean       | Default false; overdue charges must be true | Toggle                  |
| `active`                | ❌           | boolean       | Default false                               | Toggle                  |
| `feeOnMonthDay`         | ❌*          | string(MM-dd) | Required for monthly/annual/weeekly fees    | Date picker             |
| `feeInterval`           | ❌*          | int           | Required for monthly fee (1-12)             | User                    |
| `feeFrequency`          | ❌           | int           | 0=Days, 1=Weeks, 2=Months, 3=Years          | Dropdown                |
| `minCap`                | ❌           | decimal       | For percentage charges                      | User                    |
| `maxCap`                | ❌           | decimal       | For percentage charges                      | User                    |
| `incomeAccountId`       | ❌           | Long          | GL income/liability account                 | `GET /glaccounts`       |
| `taxGroupId`            | ❌           | Long          | Tax group                                   | `GET /taxgroups`        |
| `paymentTypeId`         | ❌           | Long          | Restrict to payment type                    | `GET /paymenttypes`     |
| `enablePaymentType`     | ❌           | boolean       | Enable payment type filter                  | Toggle                  |
| `monthDayFormat`        | ❌           | string        | e.g. "dd MMMM"                              | Config                  |
| `locale`                | ✅           | string        | e.g. "en"                                   | Config                  |

\* Conditionally required based on chargeTimeType.

---

## 5. Lookup APIs

| UI Field                | Endpoint                                                       | Display                       | Value      | Required  |
| ----------------------- | -------------------------------------------------------------- | ----------------------------- | ---------- | --------- |
| Currency                | `GET /v1/charges/template` → `currencyOptions`                 | `name` + `code`               | `code`     | ✅        |
| Charge Applies To       | `GET /v1/charges/template` → `chargeAppliesToOptions`          | Enum name                     | `id` (1-5) | ✅        |
| Charge Time Type        | `GET /v1/charges/template` → `*chargeTimeTypeOptions`          | Enum name                     | `id`       | ✅        |
| Charge Calculation Type | `GET /v1/charges/template` → `*chargeCalculationTypeOptions`   | Enum name                     | `id`       | ✅        |
| Charge Payment Mode     | `GET /v1/charges/template` → `chargePaymetModeOptions`         | Regular / Account Transfer    | 0 / 1      | ✅ (loan) |
| Fee Frequency           | `GET /v1/charges/template` → `feeFrequencyOptions`             | Days / Weeks / Months / Years | 0-3        | ❌        |
| GL Account              | `GET /v1/charges/template` → `incomeOrLiabilityAccountOptions` | Account name + GL code        | `id`       | ❌        |
| Tax Group               | `GET /v1/charges/template` → `taxGroupOptions`                 | Tax group name                | `id`       | ❌        |
| Payment Type            | `GET /v1/paymenttypes`                                         | Type name                     | `id`       | ❌        |

Template returns type-specific options keyed by appliesTo (e.g., `loanChargeTimeTypeOptions`, `savingsChargeTimeTypeOptions`, `clientChargeTimeTypeOptions`).

---

## 6. API Call Order

### Create Charge

```
1. GET /v1/charges/template                                       → load all dropdown options
2. Select chargeAppliesTo → filters available chargeTimeType + chargeCalculationType options
3. Select chargeTimeType → may reveal additional fields (feeOnMonthDay, feeInterval, etc.)
4. Fill remaining fields (name, amount, currency, GL account, etc.)
5. POST /v1/charges                                                → create
```

### Use Charge on Loan Product

```
1. GET /v1/charges                                                 → list available charges
2. POST /v1/loanproducts (with chargeIds array)                   → link charges to product
```

### Apply Charge to a Loan

```
1. POST /v1/loans (with charges array)                             → applied during loan creation
2. POST /v1/loans/{loanId}/charges                                 → add charge to existing loan
```

---

## 7. Request Payload Analysis

### Create Loan Charge (`POST /v1/charges`)

```json
{
  "name": "Processing Fee",
  "chargeAppliesTo": 1,
  "currencyCode": "USD",
  "chargeTimeType": 1,
  "chargeCalculationType": 2,
  "amount": 2.5,
  "chargePaymentMode": 0,
  "penalty": false,
  "active": true,
  "minCap": 10.0,
  "maxCap": 500.0,
  "incomeAccountId": 15,
  "taxGroupId": 2,
  "locale": "en"
}
```

### Create Overdue Penalty Charge (`POST /v1/charges`)

```json
{
  "name": "Late Payment Penalty",
  "chargeAppliesTo": 1,
  "currencyCode": "USD",
  "chargeTimeType": 9,
  "chargeCalculationType": 1,
  "amount": 25.0,
  "chargePaymentMode": 0,
  "penalty": true,
  "active": true,
  "locale": "en"
}
```

### Create Savings Monthly Fee (`POST /v1/charges`)

```json
{
  "name": "Account Maintenance Fee",
  "chargeAppliesTo": 2,
  "currencyCode": "USD",
  "chargeTimeType": 7,
  "chargeCalculationType": 1,
  "amount": 5.0,
  "active": true,
  "feeOnMonthDay": "01",
  "feeInterval": 1,
  "feeFrequency": 2,
  "incomeAccountId": 20,
  "locale": "en",
  "monthDayFormat": "dd"
}
```

### Create Savings Withdrawal Fee (`POST /v1/charges`)

```json
{
  "name": "ATM Withdrawal Fee",
  "chargeAppliesTo": 2,
  "currencyCode": "USD",
  "chargeTimeType": 5,
  "chargeCalculationType": 1,
  "amount": 0.5,
  "active": true,
  "enableFreeWithdrawalCharge": true,
  "freeWithdrawalFrequency": 5,
  "restartCountFrequency": 1,
  "countFrequencyType": 2,
  "paymentTypeId": 3,
  "enablePaymentType": true,
  "locale": "en"
}
```

### Update Charge (`PUT /v1/charges/{chargeId}`)

```json
{
  "amount": 3.0,
  "maxCap": 750.0,
  "locale": "en"
}
```

---

## 8. Validation Rules

### JSON Validation (`ChargeDefinitionCommandFromApiJsonDeserializer`)

| Rule                             | Condition                  | Error                       |
| -------------------------------- | -------------------------- | --------------------------- |
| `chargeAppliesTo` required       | Create                     | Must be 1-5                 |
| `name` required                  | Create                     | Not blank, max 100          |
| `currencyCode` required          | Create                     | Max 3 chars                 |
| `amount` required                | Create                     | Positive                    |
| `chargeTimeType` required        | Create                     | Must be valid for appliesTo |
| `chargeCalculationType` required | Create                     | Must be valid for appliesTo |
| `chargePaymentMode` required     | Create (if Loan)           | 0 or 1                      |
| `feeOnMonthDay` required         | Savings monthly/annual fee | Valid date                  |
| `feeInterval` required           | Savings monthly fee        | 1-12                        |

### Entity Validation (`Charge.java`)

| Rule                    | Logic                                    | Error                                             |
| ----------------------- | ---------------------------------------- | ------------------------------------------------- |
| Disbursement penalty    | DISBURSEMENT time + penalty=true         | `ChargeDueAtDisbursementCannotBePenaltyException` |
| Overdue must be penalty | OVERDUE_INSTALLMENT time + penalty=false | `ChargeMustBePenaltyException`                    |
| AppliesTo immutable     | Cannot change after creation             | `ChargeParameterUpdateNotSupportedException`      |

### Write Service Validation

| Rule                   | Logic                                                               | Error                             |
| ---------------------- | ------------------------------------------------------------------- | --------------------------------- |
| Duplicate name         | Unique constraint on `name`                                         | `error.msg.charge.duplicate.name` |
| Deactivation guard     | Setting active=false fails if charge is in use by products/accounts | `ChargeCannotBeUpdatedException`  |
| Delete guard           | Cannot delete charge if in use                                      | `ChargeCannotBeDeletedException`  |
| Frequency change guard | Cannot change feeFrequency/feeInterval if loan products use charge  | `ChargeCannotBeUpdatedException`  |

---

## 9. Business Flow

### Create Charge Definition

```
ChargesApiResource.createCharge(command)
  ↓
ChargeDefinitionCommandFromApiJsonDeserializer.validateForCreate(json)
  ↓
CreateChargeDefinitionCommandHandler
  ↓
ChargeWritePlatformServiceJpaRepositoryImpl.createCharge(command)
  ├── Build Charge entity (all fields mapped from JSON)
  ├── Validate entity rules (penalty, calculation type combos)
  ├── ChargeRepository.save()
  ├── Cache evict ("charges")
  └── Return created charge ID
```

### Update Charge

```
ChargesApiResource.updateCharge(chargeId, command)
  ↓
ChargeDefinitionCommandFromApiJsonDeserializer.validateForUpdate(json)
  ↓
UpdateChargeDefinitionCommandHandler
  ↓
ChargeWritePlatformServiceJpaRepositoryImpl.updateCharge(chargeId, command)
  ├── Load existing charge
  ├── If deactivating (active=false):
  │   ├── Check no loan products reference this charge
  │   ├── Check no loans use this charge
  │   └── Check no savings accounts use this charge
  ├── If changing fee config:
  │   ├── Check no loan products use this charge
  │   └── If used → throw ChargeCannotBeUpdatedException
  ├── Apply updates
  ├── ChargeRepository.save()
  ├── Cache evict
  └── Return result
```

### Soft-Delete Charge

```
ChargesApiResource.deleteCharge(chargeId)
  ↓
DeleteChargeDefinitionCommandHandler
  ↓
ChargeWritePlatformServiceJpaRepositoryImpl.deleteCharge(chargeId)
  ├── Load charge
  ├── Check charge is not in use (loan products, loans, savings, work capital loans)
  ├── Set deleted=true
  ├── Rename name to "{id}_{name}" (free unique constraint)
  └── ChargeRepository.save()
```

### Apply Overdue Charges (COB Job)

```
ApplyChargeToOverdueLoansBusinessStep (runs during COB)
  ↓
For each loan with overdue installments:
  ↓
LoanChargeWritePlatformService.applyOverdueChargesForLoan(loanId)
  ├── Find overdue installment periods
  ├── For each applicable overdue penalty charge:
  │   ├── Calculate amount based on charge calculation type
  │   ├── Create LoanCharge entity
  │   └── Apply to loan
  ├── Fire LoanApplyOverdueChargeBusinessEvent
  └── Update loan schedule
```

---

## 10. Related Operations

| Operation               | Endpoint                                                           | Description                         |
| ----------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| Loan Product Charges    | `GET /v1/loanproducts/{id}`                                        | Charges linked to loan product      |
| Add Loan Charge         | `POST /v1/loans/{loanId}/charges`                                  | Apply charge to a loan              |
| Waive Loan Charge       | `POST /v1/loans/{loanId}/charges/{chargeId}?command=waive`         | Waive a charge                      |
| Pay Loan Charge         | `POST /v1/loans/{loanId}/charges/{chargeId}?command=chargepayment` | Pay charge separately               |
| Savings Product Charges | `GET /v1/savingsproducts/{id}`                                     | Charges on savings product          |
| Savings Account Charges | `GET /v1/savingsaccounts/{id}`                                     | Charges applied to account          |
| Client Charges          | `GET /v1/clients/{clientId}/charges`                               | Client-level charges                |
| GL Account mapping      | `GET /v1/glaccounts`                                               | Income/liability account for charge |

---

## 11. Hidden Dependencies

| Dependency                                                  | Impact                                                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **`chargeAppliesTo` is immutable after creation**           | UI must show this as read-only on edit                                             |
| **Overdue charges MUST be penalties**                       | UI must auto-set penalty=true when timeType=OVERDUE                                |
| **Disbursement charges CANNOT be penalties**                | UI must disable penalty toggle when timeType=DISBURSEMENT                          |
| **Deactivation requires no active references**              | UI must warn if charge is linked to products/accounts                              |
| **Soft-delete renames the charge**                          | Name becomes `{id}_{name}` — UI should not display deleted charges                 |
| **Percentage charges have min/max caps**                    | `minCap` and `maxCap` only apply to percentage calculations                        |
| **Fee frequency applies only to installment/periodic fees** | FeeFrequency only relevant for INSTALMENT_FEE, MONTHLY_FEE, ANNUAL_FEE, WEEKLY_FEE |
| **Savings free withdrawal config**                          | `enableFreeWithdrawalCharge` + frequency + restart fields are savings-specific     |
| **Savings payment type filter**                             | `enablePaymentType` + `paymentTypeId` are savings-specific                         |
| **Template returns type-filtered options**                  | UI must switch to the correct option set when `chargeAppliesTo` changes            |

---

## 12. Implementation Checklist

- [ ] Charge list (`GET /v1/charges`)
- [ ] Charge detail (`GET /v1/charges/{id}`)
- [ ] Charge template (`GET /v1/charges/template`)
- [ ] Create charge (`POST /v1/charges`)
- [ ] Update charge (`PUT /v1/charges/{id}`)
- [ ] Delete charge (`DELETE /v1/charges/{id}`)

### UI — Charge Form

- [ ] Charge applies-to selector (Loan / Savings / Client / Shares)
- [ ] Conditional charge time type options based on applies-to
- [ ] Conditional charge calculation type options based on applies-to
- [ ] Amount field for flat; percentage fields for calculation types
- [ ] Min/max cap fields (visible only for percentage calculations)
- [ ] Fee frequency + interval fields (visible only for installment/periodic time types)
- [ ] Month-day picker (visible for monthly/annual fees)
- [ ] Penalty toggle (auto-set for overdue; disabled for disbursement)
- [ ] Currency selector
- [ ] GL income/liability account selector
- [ ] Tax group selector (optional)
- [ ] Payment type filter (savings-specific)
- [ ] Free withdrawal config (savings-specific)

### UI — Validation Rules

- [ ] Penalty required for overdue time type
- [ ] Penalty forbidden for disbursement time type
- [ ] `feeOnMonthDay` required for monthly/annual/weekly time types
- [ ] `feeInterval` required for monthly time type
- [ ] `chargePaymentMode` required for loan charges
- [ ] Applies-to cannot change on edit

### UI — Display

- [ ] Charge type badge (Penalty / Fee)
- [ ] Applies-to badge (Loan / Savings / Client / Shares)
- [ ] Active/inactive indicator
- [ ] Amount display with currency
- [ ] Calculation type display (Flat, % Amount, % Interest, etc.)

### Error Handling

- [ ] Duplicate charge name on create
- [ ] Deactivation with active references (warn which products/loans use it)
- [ ] Delete with active references
- [ ] Invalid charge time/calculation combinations
- [ ] Immutable field change rejection (chargeAppliesTo)
