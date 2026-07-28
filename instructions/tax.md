# Fineract Tax Feature Implementation Guide

## 1. Feature Overview

### Business Purpose

The Tax feature in Apache Fineract allows microfinance institutions to define tax rates (Tax Components), group them into Tax Groups, and apply them to:

- **Charges** (loan charges can reference a Tax Group)
- **Savings products/accounts** (withholding tax on interest earnings)

Tax is calculated as a percentage of a monetary amount, with full effective-dating support (tax rates can change over time, with history tracking).

### Feature Lifecycle

1. Create Tax Components (define tax rates with GL account mappings)
2. Group Tax Components into Tax Groups
3. Assign Tax Groups to Charges, Savings Products, or Savings Accounts
4. System automatically applies tax calculations during:
   - Loan charge assessment
   - Savings interest posting (withholding tax)

### Main Java Classes

| Module          | Key Classes                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `fineract-tax`  | `TaxComponent`, `TaxGroup`, `TaxGroupMappings`, `TaxComponentHistory`                                   |
| `fineract-tax`  | `TaxComponentApiResource`, `TaxGroupApiResource`                                                        |
| `fineract-tax`  | `TaxReadPlatformService`, `TaxWritePlatformService`                                                     |
| `fineract-tax`  | `ChargeTaxApplicationService`, `TaxUtils`                                                               |
| `fineract-tax`  | `TaxValidator`, `TaxAssembler`                                                                          |
| `fineract-tax`  | `TaxComponentMapper`, `TaxGroupMapper`, `TaxGroupMappingsMapper`                                        |
| `fineract-core` | `TaxComponentData`, `TaxGroupData`, `TaxGroupMappingsData`, `TaxComponentHistoryData`, `TaxDetailsData` |
| `fineract-core` | `TaxComponentRequest`, `TaxGroupRequest`, `TaxGroupComponent`                                           |

### Related Modules

- `fineract-charge` — charges reference `tax_group_id`
- `fineract-loan` — `LoanChargeTaxDetails` stores per-charge tax breakdown
- `fineract-savings` — savings accounts/products have `withHoldTax` + `taxGroup`; `WITHHOLD_TAX` transaction type
- `fineract-provider` — service implementations, accounting integration (`TaxPaymentDTO`, `ChargeTaxPaymentDTO`)

---

## 2. API Inventory

### Tax Components

| Method | URL                                    | Description                                          | Permission            | Path Params      | Query Params |
| ------ | -------------------------------------- | ---------------------------------------------------- | --------------------- | ---------------- | ------------ |
| GET    | `/v1/taxes/component`                  | List all tax components                              | `TAXCOMPONENT` READ   | —                | —            |
| GET    | `/v1/taxes/component/template`         | Retrieve tax component template (GL account options) | `TAXCOMPONENT` READ   | —                | —            |
| GET    | `/v1/taxes/component/{taxComponentId}` | Retrieve a single tax component                      | `TAXCOMPONENT` READ   | `taxComponentId` | —            |
| POST   | `/v1/taxes/component`                  | Create a new tax component                           | `TAXCOMPONENT` CREATE | —                | —            |
| PUT    | `/v1/taxes/component/{taxComponentId}` | Update a tax component                               | `TAXCOMPONENT` UPDATE | `taxComponentId` | —            |

### Tax Groups

| Method | URL                            | Description                                            | Permission        | Path Params  | Query Params     |
| ------ | ------------------------------ | ------------------------------------------------------ | ----------------- | ------------ | ---------------- |
| GET    | `/v1/taxes/group`              | List all tax groups                                    | `TAXGROUP` READ   | —            | —                |
| GET    | `/v1/taxes/group/template`     | Retrieve tax group template (available tax components) | `TAXGROUP` READ   | —            | —                |
| GET    | `/v1/taxes/group/{taxGroupId}` | Retrieve a single tax group                            | `TAXGROUP` READ   | `taxGroupId` | `?template=true` |
| POST   | `/v1/taxes/group`              | Create a new tax group                                 | `TAXGROUP` CREATE | —            | —                |
| PUT    | `/v1/taxes/group/{taxGroupId}` | Update a tax group                                     | `TAXGROUP` UPDATE | `taxGroupId` | —                |

---

## 3. CRUD Analysis

### Tax Components

| Operation | Endpoint                           | Notes                                                                                          |
| --------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| List      | `GET /v1/taxes/component`          | Returns all tax components                                                                     |
| Detail    | `GET /v1/taxes/component/{id}`     | Single component with history                                                                  |
| Template  | `GET /v1/taxes/component/template` | GL account type options + GL account options                                                   |
| Create    | `POST /v1/taxes/component`         | Name + percentage required                                                                     |
| Update    | `PUT /v1/taxes/component/{id}`     | Name, percentage, startDate updatable. Debit/credit accounts cannot be modified after creation |
| Delete    | Not supported                      | No delete endpoint exists                                                                      |

### Tax Groups

| Operation | Endpoint                       | Notes                                                                                                           |
| --------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| List      | `GET /v1/taxes/group`          | Returns all tax groups                                                                                          |
| Detail    | `GET /v1/taxes/group/{id}`     | With or without template (`?template=true`)                                                                     |
| Template  | `GET /v1/taxes/group/template` | Available tax components for lookup                                                                             |
| Create    | `POST /v1/taxes/group`         | Name + at least one taxComponent                                                                                |
| Update    | `PUT /v1/taxes/group/{id}`     | Can add new components, set endDate on existing. Cannot modify existing component's startDate or taxComponentId |
| Delete    | Not supported                  | No delete endpoint exists                                                                                       |

---

## 4. Create Workflow

### Create Tax Component

For every field determine:

| Field               | Required | Optional | Validation                                                                                                             | Source Endpoint                                     |
| ------------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `name`              | Yes      | —        | Not blank, max 100 chars                                                                                               | User input                                          |
| `percentage`        | Yes      | —        | 0 < percentage ≤ 100, positive amount                                                                                  | User input                                          |
| `startDate`         | —        | Yes      | If provided, must be a valid date (defaults to current date)                                                           | User input                                          |
| `debitAccountType`  | —        | Yes      | Must be one of: ASSET(1), LIABILITY(2), EQUITY(3), INCOME(4), EXPENSE(5). If debitAccountId provided, this is required | `GET /v1/accounting/enumeration?type=glAccountType` |
| `debitAccountId`    | —        | Yes      | Must be a valid GL account ID, long greater than zero. If debitAccountType provided, this is required                  | `GET /v1/glaccounts`                                |
| `creditAccountType` | —        | Yes      | Same enum as debitAccountType                                                                                          | `GET /v1/accounting/enumeration?type=glAccountType` |
| `creditAccountId`   | —        | Yes      | Same as debitAccountId                                                                                                 | `GET /v1/glaccounts`                                |
| `locale`            | —        | Yes      | e.g. "en"                                                                                                              | User input                                          |
| `dateFormat`        | —        | Yes      | e.g. "dd MMMM yyyy"                                                                                                    | User input                                          |

### Create Tax Group

| Field                            | Required | Optional | Validation                                 | Source Endpoint           |
| -------------------------------- | -------- | -------- | ------------------------------------------ | ------------------------- |
| `name`                           | Yes      | —        | Not blank                                  | User input                |
| `taxComponents`                  | Yes      | —        | Non-empty array                            | —                         |
| `taxComponents[].taxComponentId` | Yes      | —        | Must be a valid Tax Component ID, long > 0 | `GET /v1/taxes/component` |
| `taxComponents[].startDate`      | —        | Yes      | Valid date                                 | User input                |
| `locale`                         | —        | Yes      | e.g. "en"                                  | User input                |
| `dateFormat`                     | —        | Yes      | e.g. "dd MMMM yyyy"                        | User input                |

---

## 5. Lookup APIs

| UI Field            | Endpoint                                            | Display           | Value | Required                                 |
| ------------------- | --------------------------------------------------- | ----------------- | ----- | ---------------------------------------- |
| Tax Component       | `GET /v1/taxes/component`                           | `name`            | `id`  | Create Tax Group                         |
| GL Account Type     | `GET /v1/accounting/enumeration?type=glAccountType` | `description`     | `id`  | Create Tax Component (if GL account set) |
| GL Account (Debit)  | `GET /v1/glaccounts`                                | `name` / `glCode` | `id`  | Create Tax Component (optional)          |
| GL Account (Credit) | `GET /v1/glaccounts`                                | `name` / `glCode` | `id`  | Create Tax Component (optional)          |
| Tax Group           | `GET /v1/taxes/group`                               | `name`            | `id`  | Create Charge, Savings Product           |

---

## 6. API Call Order

### Create Tax Component

```
GET /v1/taxes/component/template
    ↓
    (shows GL account type options + GL account options)
    ↓
Submit POST /v1/taxes/component
```

### Create Tax Group

```
GET /v1/taxes/component
    ↓
    (select tax components to include)
    ↓
Submit POST /v1/taxes/group
```

### Create Charge with Tax

```
GET /v1/taxes/group
    ↓
GET /v1/charges/template
    ↓
Submit POST /v1/charges (with taxGroupId)
```

---

## 7. Request Payload Analysis

### POST /v1/taxes/component

```json
{
  "name": "VAT 10%",
  "percentage": 10,
  "startDate": "11 April 2016",
  "debitAccountType": 4,
  "debitAccountId": 4,
  "creditAccountType": 2,
  "creditAccountId": 5,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

| Field               | Type          | Required | Validation                                                 | Source   |
| ------------------- | ------------- | -------- | ---------------------------------------------------------- | -------- |
| `name`              | String        | Yes      | Not blank, max 100 chars                                   | User     |
| `percentage`        | BigDecimal    | Yes      | 0 < value ≤ 100                                            | User     |
| `startDate`         | String (date) | No       | If provided, valid date; defaults to current business date | User     |
| `debitAccountType`  | Integer       | No*      | 1=ASSET, 2=LIABILITY, 3=EQUITY, 4=INCOME, 5=EXPENSE        | Template |
| `debitAccountId`    | Long          | No*      | Must exist in `m_gl_account`                               | Template |
| `creditAccountType` | Integer       | No*      | Same enum as debit                                         | Template |
| `creditAccountId`   | Long          | No*      | Must exist in `m_gl_account`                               | Template |
| `locale`            | String        | No       | e.g. "en"                                                  | User     |
| `dateFormat`        | String        | No       | e.g. "dd MMMM yyyy"                                        | User     |

*If debitAccountType is provided, debitAccountId is required (and vice versa). Same for credit pair.

### PUT /v1/taxes/component/{id}

```json
{
  "name": "VAT 12%",
  "percentage": 12,
  "startDate": "15 April 2016",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

Debit/credit accounts CANNOT be modified after creation. Only `name`, `percentage`, and `startDate` are updatable. Changing percentage triggers creation of a `TaxComponentHistory` record.

### POST /v1/taxes/group

```json
{
  "name": "Standard Taxes",
  "taxComponents": [
    {
      "taxComponentId": 7,
      "startDate": "11 April 2016"
    }
  ],
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

| Field                            | Type          | Required | Validation                            | Source                    |
| -------------------------------- | ------------- | -------- | ------------------------------------- | ------------------------- |
| `name`                           | String        | Yes      | Not blank                             | User                      |
| `taxComponents`                  | Array         | Yes      | Non-empty array                       | —                         |
| `taxComponents[].taxComponentId` | Long          | Yes      | Must reference existing tax component | `GET /v1/taxes/component` |
| `taxComponents[].startDate`      | String (date) | No       | Valid date                            | User                      |
| `locale`                         | String        | No       | —                                     | User                      |
| `dateFormat`                     | String        | No       | —                                     | User                      |

### PUT /v1/taxes/group/{id}

```json
{
  "name": "Updated Tax Group",
  "taxComponents": [
    {
      "id": 1,
      "taxComponentId": 7,
      "endDate": "22 April 2016"
    },
    {
      "taxComponentId": 8
    }
  ],
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

For existing mappings (with `id`): can only update `endDate`. Cannot change `taxComponentId` or `startDate`.
For new mappings (without `id`): provide `taxComponentId` and optional `startDate`.
`startDate` and `endDate` cannot both be present in a single mapping.

---

## 8. Validation Rules

### Tax Component — Create

| Rule                          | Code                                                  | Detail                                                              |
| ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| Name required                 | `tax.component.name`                                  | Not blank                                                           |
| Percentage required           | `tax.component.percentage`                            | Not blank, positive amount, not greater than 100                    |
| Debit account type valid      | `tax.component.debitAccountType`                      | Must be 1-5 (ASSET-LIABILITY-EQUITY-INCOME-EXPENSE), ignore if null |
| Debit account ID valid        | `tax.component.debitAccountId`                        | Long greater than zero                                              |
| Debit pair required together  | `tax.component.debitAccountType` / `debitAccountId`   | If one is provided, both must be                                    |
| Credit account type valid     | `tax.component.creditAccountType`                     | Same as debit                                                       |
| Credit account ID valid       | `tax.component.creditAccountId`                       | Same as debit                                                       |
| Credit pair required together | `tax.component.creditAccountType` / `creditAccountId` | If one is provided, both must be                                    |

### Tax Component — Update

| Rule                     | Code                       | Detail                                                                  |
| ------------------------ | -------------------------- | ----------------------------------------------------------------------- |
| Name (if provided)       | `tax.component.name`       | Not blank                                                               |
| Percentage (if provided) | `tax.component.percentage` | Not blank, 0 < value ≤ 100                                              |
| Start date (if provided) | `tax.component.startDate`  | Must be after current business date                                     |
| New start date           | `tax.component.startDate`  | Must be after existing start date (validated in `validateStartDate`)    |
| Total percentage         | `group.total.percentage`   | Sum of all percentages in all associated tax groups must not exceed 100 |

Debit/credit accounts cannot be modified during update (they are absent from `SUPPORTED_TAX_COMPONENT_UPDATE_PARAMETERS`).

### Tax Group — Create

| Rule                    | Code                                     | Detail                                                                       |
| ----------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| Name required           | `tax.group.name`                         | Not blank                                                                    |
| Tax components required | `tax.group.taxComponents`                | Non-blank array, size > 0                                                    |
| Tax component ID valid  | `tax.group.taxComponents.taxComponentId` | Not null, long > 0 for each array element                                    |
| Total percentage ≤ 100  | `tax.group.total.percentage`             | Sum of all component percentages at any applicable date must not exceed 100% |
| No overlapping dates    | `component.dates.are.overlapping`        | Same tax component cannot appear twice with overlapping date ranges          |

### Tax Group — Update

| Rule                                 | Code                                             | Detail                                                                 |
| ------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------- |
| End date after start date (existing) | `tax.group.endDate`                              | Must be after the mapping's start date                                 |
| End date cannot be modified twice    | `endDate.can.not.modify.end.date.once.updated`   | If end date was already set, it cannot be changed to a different value |
| Component ID cannot change           | `taxComponentId.update.not.supported`            | Cannot swap a mapping to a different tax component                     |
| No end date on new associations      | `endDate.not.supported.for.new.association`      | New tax component mappings cannot have an end date                     |
| Start and end both present           | `start.date.end.date.both.should.not.be.present` | A single mapping cannot have both startDate and endDate                |

### Post-Creation Validation (Tax Group)

After assembling the entity, `validateTaxGroup` checks:

1. **Total percentage** — at every applicable date across all component histories, the sum of active percentages must not exceed 100%.
2. **Overlapping components** — the same tax component cannot exist in the group with overlapping date ranges.

---

## 9. Business Flow

### Create Tax Component

```
POST /v1/taxes/component
  ↓
TaxComponentApiResource.createTaxComponent()
  ↓  wraps request in CommandWrapper
PortfolioCommandSourceWritePlatformService.logCommandSource()
  ↓  triggers command processing
CreateTaxComponentCommandHandler
  ↓
TaxWritePlatformServiceImpl.createTaxComponent()
  ↓  1. TaxValidator.validateForTaxComponentCreate()
  ↓  2. TaxAssembler.assembleTaxComponentFrom(command)
  ↓  3. TaxComponentRepository.saveAndFlush()
  ↓
Database: m_tax_component
```

### Create Tax Group

```
POST /v1/taxes/group
  ↓
TaxGroupApiResource.createTaxGroup()
  ↓
CreateTaxGroupCommandHandler
  ↓
TaxWritePlatformServiceImpl.createTaxGroup()
  ↓  1. TaxValidator.validateForTaxGroupCreate()
  ↓  2. TaxAssembler.assembleTaxGroupFrom(command)
  ↓  3. TaxValidator.validateTaxGroup()  ← validates total % and overlaps
  ↓  4. TaxGroupRepository.saveAndFlush()
  ↓
Database: m_tax_group + m_tax_group_mappings
```

### Tax Calculation (on Loan Charge)

```
Charge is applied to loan
  ↓
LoanCharge.calculate() / applyTax()
  ↓
ChargeTaxApplicationServiceImpl.splitTax()
  ↓
TaxUtils.splitTax(amount, date, taxGroupMappings, scale)
  ↓  for each active mapping at given date:
     tax = amount × percentage / 100
  ↓
Stored in m_loan_charge_tax_details
```

### Withholding Tax (on Savings Interest)

```
Interest is posted to savings account
  ↓
SavingsAccountInterestPostingServiceImpl
  ↓
TaxUtils.splitTax() calculates tax on interest amount
  ↓
WITHHOLD_TAX transaction created on savings account
  ↓
Stored in m_savings_account_transaction_tax_details
```

---

## 10. Related Operations

| Feature          | Endpoint / Command          | Relation                                                       |
| ---------------- | --------------------------- | -------------------------------------------------------------- |
| Charge           | `POST /v1/charges`          | Can include `taxGroupId` to associate a tax group              |
| Charge           | `GET /v1/charges/{id}`      | Returns `taxGroupId` if set                                    |
| Loan Charge      | Loan charge assessment      | Automatically calculates tax via `ChargeTaxApplicationService` |
| Savings Product  | `POST /v1/savingsproducts`  | Can set `withHoldTax` (boolean) and `taxGroupId`               |
| Savings Account  | `POST /v1/savingsaccounts`  | Can set `withHoldTax` and `taxGroupId`                         |
| Savings Account  | `UPDATEWITHHOLDTAX` command | Updates withhold tax settings on an existing savings account   |
| Interest Posting | Automatic on savings        | Withholding tax deducted from interest via `TaxUtils`          |

---

## 11. Hidden Dependencies

| Dependency                                    | Why It Matters                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **GL Accounts must exist**                    | If debit/credit accounts are specified for a Tax Component, the GL accounts must already exist in `m_gl_account`          |
| **GL Account Type enum**                      | Must pass valid values (1-5) matching `GLAccountType` enum                                                                |
| **Audit fields**                              | `AbstractAuditableCustom` requires authenticated user; commands are processed asynchronously through the command pipeline |
| **Tax Component must exist before Tax Group** | Tax Groups reference existing Tax Components by ID                                                                        |
| **Effective dating**                          | Tax percentage changes create history records; percentage at a given date depends on the effective date                   |
| **Total percentage ≤ 100%**                   | Validated across all overlapping date ranges. Adding a new component can fail if total would exceed 100%                  |
| **No delete endpoints**                       | Tax Components and Tax Groups cannot be deleted. Once created, they persist                                               |
| **Debit/credit accounts immutable**           | GL account mapping on Tax Components is set at creation and cannot be changed                                             |
| **Command pipeline**                          | All write operations go through the command (CQRS) pipeline, not direct API calls to the service                          |
| **`template=true` on Tax Group GET**          | To get template data (available tax components) when viewing a single group, pass `?template=true`                        |
| **Liquibase migrations**                      | Tax tables are created in the initial schema (part 0001). No special migration ordering needed                            |
| **Permissions**                               | `TAXCOMPONENT` and `TAXGROUP` permissions must be granted to the user role                                                |

---

## 12. Implementation Checklist

### Tax Component

- [ ] `GET /v1/taxes/component/template` — load GL account type options and GL account options
- [ ] `GET /v1/taxes/component` — list all tax components
- [ ] `GET /v1/taxes/component/{id}` — view single tax component with history
- [ ] `POST /v1/taxes/component` — create tax component (validate: name, percentage, optional GL accounts)
- [ ] `PUT /v1/taxes/component/{id}` — update name/percentage (triggers history)

### Tax Group

- [ ] `GET /v1/taxes/group/template` — load all tax components for lookup
- [ ] `GET /v1/taxes/group` — list all tax groups
- [ ] `GET /v1/taxes/group/{id}` — view single tax group with associations
- [ ] `GET /v1/taxes/group/{id}?template=true` — view with template data
- [ ] `POST /v1/taxes/group` — create tax group (name + array of taxComponents with taxComponentId)
- [ ] `PUT /v1/taxes/group/{id}` — update (add new components, set endDate on existing)

### Integration — Charges

- [ ] Load tax groups for charge create/edit forms
- [ ] Pass `taxGroupId` when creating a charge
- [ ] Display associated `taxGroupId` on charge detail
- [ ] Handle tax-inclusive pricing if configured

### Integration — Savings

- [ ] Load tax groups for savings product/account forms
- [ ] Set `withHoldTax` boolean + `taxGroupId` on product/account creation
- [ ] Handle `UPDATEWITHHOLDTAX` command on savings accounts
- [ ] Display withholding tax information on account summary

### Business Rules to Implement in UI

- [ ] Percentage must be between 0 and 100 (exclusive of 0, inclusive of 100)
- [ ] Total percentage in a tax group must never exceed 100%
- [ ] Debit and credit account type/id must be provided as a pair
- [ ] GL account types limited to: ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
- [ ] Once created, debit/credit GL accounts cannot be changed
- [ ] Tax groups cannot be deleted
- [ ] Tax components cannot be deleted
