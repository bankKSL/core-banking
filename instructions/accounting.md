# Accounting — React Implementation Guide

## 1. Overview

The Accounting module manages the Chart of Accounts, manual journal entries, accounting rules, financial activity mapping, accounting closures, periodic accrual, and provisioning. It consists of 7 sub-features:

| Sub-Feature                | Base Path                       | Description                                                                                   |
| -------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------- |
| GL Accounts                | `/v1/glaccounts`                | Chart of Accounts (COA) — hierarchical list of asset/liability/equity/income/expense accounts |
| Journal Entries            | `/v1/journalentries`            | Manual and system-generated debit/credit entries                                              |
| Accounting Rules           | `/v1/accountingrules`           | Predefined debit/credit templates for non-accountant users                                    |
| Financial Activity Mapping | `/v1/financialactivityaccounts` | Maps financial activities (e.g. "Fund Source") to GL accounts                                 |
| Accounting Closures        | `/v1/glclosures`                | Locks journal entry posting before a given date per office                                    |
| Periodic Accrual           | `/v1/runaccruals`               | Accrues loan income up to a specified date                                                    |
| Provisioning Entries       | `/v1/provisioningentries`       | Creates loan loss provision entries                                                           |

---

## 2. Lifecycle

There is no single state machine — each sub-feature has its own lifecycle.

### GL Account Lifecycle

```
Active (disabled=false)
  ↓ (set disabled=true)
Disabled (disabled=true)
  ↓ (can still be referenced by historical entries)
Delete (only if no journal entries reference it)
```

### Journal Entry Lifecycle

```
Created (manualEntry=true|false)
  ↓ (POST /v1/journalentries/{transactionId}?command=reverse)
Reversed (reversed=true)
```

### Accounting Closure Lifecycle

```
Open (no closure for this office/date)
  ↓ (POST /v1/glclosures)
Closed (closingDate set — no entries before this date allowed)
  ↓ (DELETE only the latest closure per office)
Deleted
```

### Accounting Rule Lifecycle

```
Active (systemDefined=false)
  ↓
Updated
  ↓
Deleted
```

### Provisioning Entry Lifecycle

```
Created (date, locale, dateFormat)
  ↓ (POST /v1/provisioningentries/{entryId}?command=createjournalentry)
Journal Entries Generated
  ↓ (POST /v1/provisioningentries/{entryId}?command=recreateprovisioningentry)
Recreated
```

### Periodic Accrual

```
Single action: POST /v1/runaccruals with tillDate
  ↓ (scheduled batch job can also run automatically)
Accrual entries created for all active loans up to the date
```

---

## 3. API Inventory

### 3.1 GL Accounts — `/v1/glaccounts`

| Method   | Path                              | Description                                                                                                  |
| -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `GET`    | `/v1/glaccounts/template`         | Create form template (type options, usage options, header accounts, tag options)                             |
| `GET`    | `/v1/glaccounts`                  | List with filters: `type`, `searchParam`, `usage`, `manualEntriesAllowed`, `disabled`, `fetchRunningBalance` |
| `GET`    | `/v1/glaccounts/{id}`             | Detail (supports `?template=true`, `?fetchRunningBalance=true`)                                              |
| `POST`   | `/v1/glaccounts`                  | Create (mandatory: name, glCode, type, usage, manualEntriesAllowed)                                          |
| `PUT`    | `/v1/glaccounts/{id}`             | Update                                                                                                       |
| `DELETE` | `/v1/glaccounts/{id}`             | Delete                                                                                                       |
| `GET`    | `/v1/glaccounts/downloadtemplate` | Download Excel bulk import template                                                                          |
| `POST`   | `/v1/glaccounts/uploadtemplate`   | Upload Excel bulk import                                                                                     |

### 3.2 Journal Entries — `/v1/journalentries`

| Method | Path                                  | Description                                                                                                                                                                                |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/v1/journalentries`                  | List with pagination/sorting/filters: `officeId`, `glAccountId`, `manualEntriesOnly`, `fromDate`, `toDate`, `transactionId`, `loanId`, `savingsId`, `runningBalance`, `transactionDetails` |
| `GET`  | `/v1/journalentries/{id}`             | Detail                                                                                                                                                                                     |
| `POST` | `/v1/journalentries`                  | Create (balanced entry: officeId, transactionDate, currencyCode, credits[], debits[])                                                                                                      |
| `POST` | `/v1/journalentries/{transactionId}`  | Reverse (`?command=reverse`) or update running balance                                                                                                                                     |
| `GET`  | `/v1/journalentries/provisioning`     | Provisioning-related journal entries                                                                                                                                                       |
| `GET`  | `/v1/journalentries/openingbalance`   | Opening balance for an office/currency                                                                                                                                                     |
| `GET`  | `/v1/journalentries/downloadtemplate` | Download Excel bulk import template                                                                                                                                                        |
| `POST` | `/v1/journalentries/uploadtemplate`   | Upload Excel bulk import                                                                                                                                                                   |

### 3.3 Accounting Rules — `/v1/accountingrules`

| Method   | Path                           | Description                                                                                    |
| -------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `GET`    | `/v1/accountingrules/template` | Create form template (allowed accounts, offices, tag options)                                  |
| `GET`    | `/v1/accountingrules`          | List (supports `?associations=all`)                                                            |
| `GET`    | `/v1/accountingrules/{id}`     | Detail (supports `?template=true`)                                                             |
| `POST`   | `/v1/accountingrules`          | Create (mandatory: name, officeId, accountToDebit OR debitTags, accountToCredit OR creditTags) |
| `PUT`    | `/v1/accountingrules/{id}`     | Update                                                                                         |
| `DELETE` | `/v1/accountingrules/{id}`     | Delete                                                                                         |

### 3.4 Financial Activity Account Mapping — `/v1/financialactivityaccounts`

| Method   | Path                                     | Description                                                        |
| -------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `GET`    | `/v1/financialactivityaccounts/template` | Create form template (financial activities list, GL accounts list) |
| `GET`    | `/v1/financialactivityaccounts`          | List all mappings                                                  |
| `GET`    | `/v1/financialactivityaccounts/{id}`     | Detail (supports `?template=true`)                                 |
| `POST`   | `/v1/financialactivityaccounts`          | Create (mandatory: financialActivityId, glAccountId)               |
| `PUT`    | `/v1/financialactivityaccounts/{id}`     | Update                                                             |
| `DELETE` | `/v1/financialactivityaccounts/{id}`     | Delete                                                             |

### 3.5 Accounting Closures — `/v1/glclosures`

| Method   | Path                  | Description                                                 |
| -------- | --------------------- | ----------------------------------------------------------- |
| `GET`    | `/v1/glclosures`      | List (optional filter: `officeId`)                          |
| `GET`    | `/v1/glclosures/{id}` | Detail (supports `?template=true` — returns allowedOffices) |
| `POST`   | `/v1/glclosures`      | Create (mandatory: officeId, closingDate)                   |
| `PUT`    | `/v1/glclosures/{id}` | Update (only comments may be edited)                        |
| `DELETE` | `/v1/glclosures/{id}` | Delete (only the latest closure for a branch)               |

### 3.6 Periodic Accrual Accounting — `/v1/runaccruals`

| Method | Path              | Description                   |
| ------ | ----------------- | ----------------------------- |
| `POST` | `/v1/runaccruals` | Execute (mandatory: tillDate) |

### 3.7 Provisioning Entries — `/v1/provisioningentries`

| Method | Path                                | Description                                                                                |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `GET`  | `/v1/provisioningentries`           | List (paginated)                                                                           |
| `GET`  | `/v1/provisioningentries/{id}`      | Detail (metadata)                                                                          |
| `GET`  | `/v1/provisioningentries/entries`   | List loan product provisioning entries (filters: entryId, officeId, productId, categoryId) |
| `POST` | `/v1/provisioningentries`           | Create (mandatory: date, dateFormat, locale)                                               |
| `POST` | `/v1/provisioningentries/{entryId}` | Command: `?command=createjournalentry` or `?command=recreateprovisioningentry`             |

---

## 4. CRUD

### 4.1 GL Account

#### List

```
GET /v1/glaccounts?type=1&usage=1&manualEntriesAllowed=true&disabled=false&searchParam=cash
```

Response: `GLAccountData[]`

#### Detail / Template

```
GET /v1/glaccounts/template?type=1    (new account template, optional type filter)
GET /v1/glaccounts/1?template=true     (edit account with template data)
GET /v1/glaccounts/1                   (account detail only)
```

#### Create

```json
POST /v1/glaccounts
{
  "name": "Cash at Bangalore",
  "glCode": "100001",
  "type": 1,
  "usage": 1,
  "manualEntriesAllowed": true,
  "parentId": 10,
  "tagId": 5,
  "description": "Petty cash for Bangalore office"
}
```

Response: `{ "resourceId": 22 }`

#### Update

```json
PUT /v1/glaccounts/22
{
  "name": "Cash at Bangalore Updated",
  "disabled": false
}
```

Response: `{ "resourceId": 22, "changes": { "name": "Cash at Bangalore Updated" } }`

#### Delete

```
DELETE /v1/glaccounts/22
```

Response: `{ "resourceId": 22 }`

### 4.2 Journal Entry

#### Create

```json
POST /v1/journalentries
{
  "officeId": 1,
  "transactionDate": "15 July 2013",
  "currencyCode": "USD",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en",
  "comments": "Manual adjustment",
  "referenceNumber": "REF001",
  "debits": [
    { "glAccountId": 1, "amount": 1000.00 }
  ],
  "credits": [
    { "glAccountId": 2, "amount": 1000.00 }
  ]
}
```

Response: `{ "resourceId": "PB37X8Y21EQUY4S" }` (transactionId string)

#### Reverse

```json
POST /v1/journalentries/PB37X8Y21EQUY4S?command=reverse
{
  "officeId": 1
}
```

Response: `{ "resourceId": "...", "changes": { "reversed": true } }`

#### List with pagination

```
GET /v1/journalentries?officeId=1&manualEntriesOnly=true&fromDate=1 July 2013&toDate=15 July 2013&dateFormat=dd MMMM yyyy&locale=en&offset=0&limit=50&orderBy=transactionDate&sortOrder=DESC
```

### 4.3 Accounting Rule

#### Create

```json
POST /v1/accountingrules
{
  "name": "Cash Deposit to Bank",
  "officeId": 1,
  "accountToDebit": 10,
  "accountToCredit": 20,
  "description": "Record cash deposited to bank account"
}
```

Response: `{ "resourceId": 5 }`

With tags (compound rule):

```json
POST /v1/accountingrules
{
  "name": "Compound Rule",
  "officeId": 1,
  "creditTags": [{ "tagId": 1 }],
  "debitTags": [{ "tagId": 2 }, { "tagId": 3 }],
  "allowMultipleCreditEntries": false,
  "allowMultipleDebitEntries": true
}
```

### 4.4 Financial Activity Mapping

```json
POST /v1/financialactivityaccounts
{
  "financialActivityId": 100,
  "glAccountId": 25
}
```

### 4.5 Accounting Closure

```json
POST /v1/glclosures
{
  "officeId": 1,
  "closingDate": "15 July 2013",
  "comments": "Month-end closure",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### 4.6 Periodic Accrual

```json
POST /v1/runaccruals
{
  "tillDate": "15 July 2013",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### 4.7 Provisioning Entry

```json
POST /v1/provisioningentries
{
  "date": "15 July 2013",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en",
  "createjournalentries": true
}
```

---

## 5. Lookup API Table

| UI Component                 | Endpoint                                                             | Label Field       | Value Field | Required                  | Notes                                               |
| ---------------------------- | -------------------------------------------------------------------- | ----------------- | ----------- | ------------------------- | --------------------------------------------------- |
| GL Account Type              | `GET /v1/glaccounts/template` → `accountTypeOptions`                 | `value` (code)    | `id` (enum) | Yes                       | 1=Asset, 2=Liability, 3=Equity, 4=Income, 5=Expense |
| GL Account Usage             | `GET /v1/glaccounts/template` → `usageOptions`                       | `value` (code)    | `id` (enum) | Yes                       | 1=Detail, 2=Header                                  |
| Parent Account (Assets)      | `GET /v1/glaccounts/template` → `assetHeaderAccountOptions`          | `name` + `glCode` | `id`        | No                        | Enabled header accounts of ASSET type               |
| Parent Account (Liabilities) | `GET /v1/glaccounts/template` → `liabilityHeaderAccountOptions`      | `name` + `glCode` | `id`        | No                        | Enabled header accounts of LIABILITY type           |
| Parent Account (Equity)      | `GET /v1/glaccounts/template` → `equityHeaderAccountOptions`         | `name` + `glCode` | `id`        | No                        | Enabled header accounts of EQUITY type              |
| Parent Account (Income)      | `GET /v1/glaccounts/template` → `incomeHeaderAccountOptions`         | `name` + `glCode` | `id`        | No                        | Enabled header accounts of INCOME type              |
| Parent Account (Expense)     | `GET /v1/glaccounts/template` → `expenseHeaderAccountOptions`        | `name` + `glCode` | `id`        | No                        | Enabled header accounts of EXPENSE type             |
| Tag (Asset)                  | `GET /v1/glaccounts/template` → `allowedAssetsTagOptions`            | `name`            | `id`        | No                        | Code values for `assetAccountTag`                   |
| Tag (Liability)              | `GET /v1/glaccounts/template` → `allowedLiabilitiesTagOptions`       | `name`            | `id`        | No                        | Code values for `liabilityAccountTag`               |
| Tag (Equity)                 | `GET /v1/glaccounts/template` → `allowedEquityTagOptions`            | `name`            | `id`        | No                        | Code values for `equityAccountTag`                  |
| Tag (Income)                 | `GET /v1/glaccounts/template` → `allowedIncomeTagOptions`            | `name`            | `id`        | No                        | Code values for `incomeAccountTag`                  |
| Tag (Expense)                | `GET /v1/glaccounts/template` → `allowedExpensesTagOptions`          | `name`            | `id`        | No                        | Code values for `expenseAccountTag`                 |
| Office                       | `GET /offices`                                                       | `name`            | `id`        | Yes (for closures, rules) |                                                     |
| GL Account (detail)          | `GET /glaccounts?usage=1`                                            | `name` (`glCode`) | `id`        | Yes (for JE, mappings)    | Only detail accounts (usage=1)                      |
| Financial Activities         | `GET /financialactivityaccounts/template` → financialActivityOptions | `name`            | `id`        | Yes (for mapping)         | Predefined financial activities                     |
| Office (for rules)           | `GET /accountingrules/template` → `allowedOffices`                   | `name`            | `id`        | Yes (for rules)           |                                                     |
| Accounting Rule (for JE)     | `GET /accountingrules`                                               | `name`            | `id`        | No                        | Used to auto-populate JE form                       |
| Payment Type                 | `GET /codes/{codeId}/codevalues`                                     | `name`            | `id`        | No                        | For journal entry payment details                   |
| Provisioning Category        | `GET /provisioningcategory`                                          | `categoryName`    | `id`        | No                        | For provisioning entries filtering                  |
| Loan Products                | `GET /loanproducts`                                                  | `name`            | `id`        | No                        | For provisioning entries filtering                  |
| Currency                     | Derived from loan/savings product or `GET /currencies`               | `name`            | `code`      | Yes (for JE)              |                                                     |

---

## 6. Dependency Graph

### GL Account Create

```
Page Load
  ↓
GET /v1/glaccounts/template
  ↓
Populate: Account Type, Usage, Parent Account (filtered by type), Tags (filtered by type), disabled=false, manualEntriesAllowed=true (defaults)
  ↓
User fills form
  ↓
POST /v1/glaccounts
```

### Journal Entry Create

```
Page Load
  ↓
GET /offices (for office dropdown)
GET /glaccounts?usage=1 (detail accounts only)
GET /accountingrules (optional rule selection)
  ↓
User selects Office, fills debits[] and credits[] (at least one of each)
  ↓
POST /v1/journalentries
```

### Accounting Rule Create

```
Page Load
  ↓
GET /v1/accountingrules/template
  ↓
Populate: allowedOffices, allowedAccounts (all detail GL accounts), allowedCreditTagOptions, allowedDebitTagOptions
  ↓
User fills form
  ↓
POST /v1/accountingrules
```

### Accounting Closure Create

```
Page Load
  ↓
GET /offices (for office dropdown)
  ↓
User selects Office, enters closingDate
  ↓
POST /v1/glclosures
```

### Financial Activity Mapping Create

```
Page Load
  ↓
GET /v1/financialactivityaccounts/template
  ↓
Populate: financialActivityOptions, glAccountOptions
  ↓
User selects Financial Activity and GL Account
  ↓
POST /v1/financialactivityaccounts
```

### Provisioning Entry Create

```
Page Load
  ↓
User enters date
  ↓
POST /v1/provisioningentries
  ↓
(Optional) POST /v1/provisioningentries/{entryId}?command=createjournalentry
```

### Periodic Accrual Execute

```
Page Load
  ↓
User enters tillDate
  ↓
POST /v1/runaccruals
```

---

## 7. Form Layout

### 7.1 GL Account Create/Edit Form

**Basic Information**

- `name` (text, required, max 200) — Account name
- `glCode` (text, required, max 45) — Unique GL code
- `type` (select, required) — Asset / Liability / Equity / Income / Expense
- `usage` (select, required) — Detail or Header
- `manualEntriesAllowed` (checkbox, required, default true) — Allow manual journal entries
- `disabled` (checkbox, default false) — Disable account

**Hierarchy**

- `parentId` (select, optional) — Parent header account, filtered by selected type

**Details**

- `description` (textarea, optional, max 500) — Description
- `tagId` (select, optional) — Tag, filtered by selected type

### 7.2 Journal Entry Create Form

**Header**

- `officeId` (select, required)
- `transactionDate` (date, required)
- `currencyCode` (select, required — show all currencies)
- `referenceNumber` (text, optional)
- `comments` (textarea, optional)
- `accountingRuleId` (select, optional) — Pre-fills debits/credits if selected

**Debits Table** (dynamic rows, at least 1 required)

- `glAccountId` (select, required) — Detail GL accounts only
- `amount` (number, required, positive)

**Credits Table** (dynamic rows, at least 1 required)

- `glAccountId` (select, required) — Detail GL accounts only
- `amount` (number, required, positive)

**Payment Details** (optional, expandable)

- `paymentTypeId` (select)
- `accountNumber`, `checkNumber`, `routingCode`, `receiptNumber`, `bankNumber`

**Validation**: Total debits must equal total credits.

### 7.3 Accounting Rule Create/Edit Form

**Basic Information**

- `name` (text, required)
- `officeId` (select, required)
- `description` (textarea, optional)

**Debit Selection** (choose one mode)

- Mode A: Select single `accountToDebit` (select, detail GL accounts)
- Mode B: Select multiple `debitTags` (tag multi-select), enable `allowMultipleDebitEntries`

**Credit Selection** (choose one mode)

- Mode A: Select single `accountToCredit` (select, detail GL accounts)
- Mode B: Select multiple `creditTags` (tag multi-select), enable `allowMultipleCreditEntries`

### 7.4 Accounting Closure Create Form

- `officeId` (select, required)
- `closingDate` (date, required)
- `comments` (textarea, optional)

### 7.5 Financial Activity Mapping Create/Edit Form

- `financialActivityId` (select, required) — Predefined activities
- `glAccountId` (select, required) — Detail GL accounts

### 7.6 Periodic Accrual Form

- `tillDate` (date, required)

### 7.7 Provisioning Entry Create Form

- `date` (date, required)
- `createjournalentries` (checkbox, optional) — Also generate journal entries

---

## 8. API Call Sequence

### GL Account List Page

```
1. GET /v1/glaccounts?type=&usage=&manualEntriesAllowed=&disabled=&searchParam=
2. (Optional) GET /v1/glaccounts?type=1&fetchRunningBalance=true for running balance
```

### GL Account Create Page

```
1. GET /v1/glaccounts/template                        → typeOptions, usageOptions, headerAccountOptions, tagOptions
2. onChange("type")                                    → filter parentId options & tagId options
3. POST /v1/glaccounts                                 → resourceId
```

### GL Account Edit Page

```
1. GET /v1/glaccounts/{id}?template=true               → account data + template options
2. PUT /v1/glaccounts/{id}                             → resourceId
```

### Journal Entry List Page

```
1. GET /v1/journalentries?officeId=&fromDate=&toDate=&offset=0&limit=50&orderBy=transactionDate&sortOrder=DESC
2. (Optional) GET /v1/journalentries?runningBalance=true
```

### Journal Entry Create Page

```
1. GET /offices                                        → officeId options
2. GET /v1/glaccounts?usage=1                          → detail GL accounts for debit/credit selects
3. GET /v1/accountingrules                             → rule options (optional, to auto-fill form)
4. onChange("accountingRuleId")                        → auto-populate debits[] and credits[]
5. User adds/removes debit/credit rows
6. POST /v1/journalentries                             → transactionId
```

### Accounting Rule List Page

```
1. GET /v1/accountingrules?associations=all
```

### Accounting Rule Create Page

```
1. GET /v1/accountingrules/template                    → allowedOffices, allowedAccounts, allowedCreditTagOptions, allowedDebitTagOptions
2. POST /v1/accountingrules                            → resourceId
```

### Accounting Closure List Page

```
1. GET /v1/glclosures?officeId=
```

### Accounting Closure Create Page

```
1. GET /offices                                        → officeId options
2. POST /v1/glclosures                                 → resourceId
```

---

## 9. TypeScript Interfaces

```typescript
// ============================================================
// GL Account
// ============================================================
export interface GLAccountData {
  id: number;
  name: string;
  parentId: number | null;
  glCode: string;
  disabled: boolean;
  manualEntriesAllowed: boolean;
  type: EnumOptionData;
  usage: EnumOptionData;
  description: string | null;
  nameDecorated: string;
  tagId: CodeValueData | null;
  organizationRunningBalance: number | null;

  // template fields (present only in template response)
  accountTypeOptions?: EnumOptionData[];
  usageOptions?: EnumOptionData[];
  assetHeaderAccountOptions?: GLAccountData[];
  liabilityHeaderAccountOptions?: GLAccountData[];
  equityHeaderAccountOptions?: GLAccountData[];
  incomeHeaderAccountOptions?: GLAccountData[];
  expenseHeaderAccountOptions?: GLAccountData[];
  allowedAssetsTagOptions?: CodeValueData[];
  allowedLiabilitiesTagOptions?: CodeValueData[];
  allowedEquityTagOptions?: CodeValueData[];
  allowedIncomeTagOptions?: CodeValueData[];
  allowedExpensesTagOptions?: CodeValueData[];
}

export interface CreateGLAccountRequest {
  name: string;
  glCode: string;
  type: number; // 1-5
  usage: number; // 1=Detail, 2=Header
  manualEntriesAllowed: boolean;
  parentId?: number;
  tagId?: number;
  description?: string;
}

export interface UpdateGLAccountRequest {
  name?: string;
  glCode?: string;
  type?: number;
  usage?: number;
  manualEntriesAllowed?: boolean;
  parentId?: number;
  tagId?: number;
  description?: string;
  disabled?: boolean;
}

// ============================================================
// Journal Entry
// ============================================================
export interface JournalEntryData {
  id: number;
  officeId: number;
  officeName: string;
  glAccountName: string;
  glAccountId: number;
  glAccountCode: string;
  glAccountType: EnumOptionData;
  transactionDate: string; // LocalDate
  entryType: EnumOptionData; // DEBIT or CREDIT
  amount: number;
  currency: CurrencyData;
  transactionId: string;
  manualEntry: boolean;
  entityType: EnumOptionData | null;
  entityId: number | null;
  createdByUserId: number;
  createdDate: string;
  createdByUserName: string;
  comments: string | null;
  reversed: boolean;
  referenceNumber: string | null;
  officeRunningBalance: number | null;
  organizationRunningBalance: number | null;
  runningBalanceComputed: boolean;
  transactionDetails: TransactionDetailData | null;
  submittedOnDate: string;
}

export interface CreditDebit {
  glAccountId: number;
  amount: number;
}

export interface CreateJournalEntryRequest {
  officeId: number;
  transactionDate: string;
  currencyCode: string;
  dateFormat: string;
  locale: string;
  credits: CreditDebit[];
  debits: CreditDebit[];
  comments?: string;
  referenceNumber?: string;
  accountingRuleId?: number;
  paymentTypeId?: number;
  accountNumber?: string;
  checkNumber?: string;
  routingCode?: string;
  receiptNumber?: string;
  bankNumber?: string;
  externalAssetOwner?: string;
}

export interface ReverseJournalEntryRequest {
  officeId: number;
}

export interface OfficeOpeningBalancesData {
  // opening balance data for an office/currency
}

// ============================================================
// Accounting Rule
// ============================================================
export interface AccountingRuleData {
  id: number;
  officeId: number;
  officeName: string;
  name: string;
  description: string;
  systemDefined: boolean;
  allowMultipleDebitEntries: boolean;
  allowMultipleCreditEntries: boolean;
  creditTags: AccountingTagRuleData[];
  debitTags: AccountingTagRuleData[];

  // template fields
  allowedOffices?: OfficeData[];
  allowedAccounts?: GLAccountData[];
  allowedCreditTagOptions?: CodeValueData[];
  allowedDebitTagOptions?: CodeValueData[];
  creditAccounts?: GLAccountDataForLookup[];
  debitAccounts?: GLAccountDataForLookup[];
}

export interface AccountingTagRuleData {
  tag: CodeValueData;
}

export interface GLAccountDataForLookup {
  id: number;
  name: string;
  glCode: string;
}

export interface CreateAccountingRuleRequest {
  name: string;
  officeId: number;
  description?: string;
  accountToDebit?: number; // single account mode
  accountToCredit?: number; // single account mode
  creditTags?: { tagId: number }[]; // tag mode
  debitTags?: { tagId: number }[]; // tag mode
  allowMultipleCreditEntries?: boolean;
  allowMultipleDebitEntries?: boolean;
}

// ============================================================
// Financial Activity Account Mapping
// ============================================================
export interface FinancialActivityAccountData {
  id: number;
  financialActivityId: number;
  financialActivityData: FinancialActivityData;
  glAccountId: number;
  glAccountData: GLAccountData;

  // template fields
  financialActivityOptions?: FinancialActivityData[];
  glAccountOptions?: GLAccountData[];
}

export interface FinancialActivityData {
  id: number;
  name: string;
  code: string;
}

export interface CreateFinancialActivityMappingRequest {
  financialActivityId: number;
  glAccountId: number;
}

// ============================================================
// Accounting Closure (GL Closure)
// ============================================================
export interface GLClosureData {
  id: number;
  officeId: number;
  officeName: string;
  closingDate: string;
  deleted: boolean;
  createdDate: string;
  lastUpdatedDate: string;
  createdByUserId: number;
  createdByUsername: string;
  lastUpdatedByUserId: number;
  lastUpdatedByUsername: string;
  comments: string;
  allowedOffices?: OfficeData[];
}

export interface CreateGLClosureRequest {
  officeId: number;
  closingDate: string;
  dateFormat: string;
  locale: string;
  comments?: string;
}

// ============================================================
// Periodic Accrual
// ============================================================
export interface ExecutePeriodicAccrualRequest {
  tillDate: string;
  dateFormat: string;
  locale: string;
}

// ============================================================
// Provisioning Entry
// ============================================================
export interface ProvisioningEntryData {
  id: number;
  createdBy: string;
  createdDate: string;
  date: string;
  journalEntriesCreated: boolean;
}

export interface LoanProductProvisioningEntryData {
  // provisioning details per loan product
}

export interface CreateProvisioningEntryRequest {
  date: string;
  dateFormat: string;
  locale: string;
  createjournalentries?: boolean;
}

// ============================================================
// Shared Types
// ============================================================
export interface EnumOptionData {
  id: number;
  code: string;
  value: string;
}

export interface CodeValueData {
  id: number;
  name: string;
  description?: string;
  position?: number;
}

export interface OfficeData {
  id: number;
  name: string;
  nameDecorated: string;
  externalId: string;
  openingDate: string;
  hierarchy: string;
  parentId: number;
}

export interface CurrencyData {
  code: string;
  name: string;
  decimalPlaces: number;
  displaySymbol: string;
  nameCode: string;
  displayLabel: string;
}

export interface TransactionDetailData {
  paymentTypeId: number;
  paymentTypeName: string;
  accountNumber: string;
  checkNumber: string;
  routingCode: string;
  receiptNumber: string;
  bankNumber: string;
}

export interface CommandProcessingResult {
  resourceId: number | string; // number for GL account/rule/closure, string (transactionId) for JE
  changes?: Record<string, unknown>;
  resourceIdentifier?: string;
}

export interface Page<T> {
  totalFilteredRecords: number;
  pageItems: T[];
}
```

### Cache Invalidation

| Mutation                                        | Invalidate                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| Create/Update/Delete GL Account                 | `glAccountKeys.all`                                                    |
| Create/Reverse Journal Entry                    | `journalEntryKeys.all`, `glAccountKeys.detail(id)` (if runningBalance) |
| Create/Update/Delete Accounting Rule            | `accountingRuleKeys.all`                                               |
| Create/Update/Delete Financial Activity Mapping | `financialActivityAccountKeys.all`                                     |
| Create/Update/Delete GL Closure                 | `glClosureKeys.all`                                                    |
| Execute Periodic Accrual                        | `journalEntryKeys.list()`                                              |
| Create Provisioning Entry                       | `provisioningEntryKeys.all`                                            |

## 12. Zod Validation

```typescript
import { z } from "zod";

// ============================================================
// GL Account
// ============================================================
export const glAccountTypeSchema = z.number().int().min(1).max(5);
export const glAccountUsageSchema = z.number().int().min(1).max(2);

export const createGLAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less"),
  glCode: z.string().min(1, "GL Code is required").max(45, "GL Code must be 45 characters or less"),
  type: glAccountTypeSchema,
  usage: glAccountUsageSchema,
  manualEntriesAllowed: z.boolean(),
  parentId: z.number().int().positive().optional(),
  tagId: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
});

export const updateGLAccountSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    glCode: z.string().min(1).max(45).optional(),
    type: glAccountTypeSchema.optional(),
    usage: glAccountUsageSchema.optional(),
    manualEntriesAllowed: z.boolean().optional(),
    parentId: z.number().int().positive().optional(),
    tagId: z.number().int().positive().optional(),
    description: z.string().max(500).optional(),
    disabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided for update" });

// ============================================================
// Journal Entry
// ============================================================
export const creditDebitSchema = z.object({
  glAccountId: z.number({ required_error: "GL Account is required" }).int().positive(),
  amount: z.number({ required_error: "Amount is required" }).positive("Amount must be positive"),
});

export const createJournalEntrySchema = z
  .object({
    officeId: z.number({ required_error: "Office is required" }).int().positive(),
    transactionDate: z.string({ required_error: "Transaction date is required" }).min(1),
    currencyCode: z.string({ required_error: "Currency is required" }).min(1),
    dateFormat: z.string().optional(),
    locale: z.string().optional(),
    credits: z.array(creditDebitSchema).min(1, "At least one credit entry is required"),
    debits: z.array(creditDebitSchema).min(1, "At least one debit entry is required"),
    comments: z.string().max(500).optional(),
    referenceNumber: z.string().max(100).optional(),
    accountingRuleId: z.number().int().positive().optional(),
    paymentTypeId: z.number().int().positive().optional(),
    accountNumber: z.string().optional(),
    checkNumber: z.string().optional(),
    routingCode: z.string().optional(),
    receiptNumber: z.string().optional(),
    bankNumber: z.string().optional(),
    externalAssetOwner: z.string().max(100).optional(),
  })
  .refine(
    (data) => {
      const totalCredits = data.credits.reduce((sum, c) => sum + c.amount, 0);
      const totalDebits = data.debits.reduce((sum, d) => sum + d.amount, 0);
      return Math.abs(totalCredits - totalDebits) < 0.001;
    },
    { message: "Total debits must equal total credits", path: ["debits"] },
  );

// ============================================================
// Accounting Rule
// ============================================================
export const createAccountingRuleSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    officeId: z.number({ required_error: "Office is required" }).int().positive(),
    description: z.string().optional(),
    accountToDebit: z.number().int().positive().optional(),
    accountToCredit: z.number().int().positive().optional(),
    creditTags: z.array(z.object({ tagId: z.number().int().positive() })).optional(),
    debitTags: z.array(z.object({ tagId: z.number().int().positive() })).optional(),
    allowMultipleCreditEntries: z.boolean().optional(),
    allowMultipleDebitEntries: z.boolean().optional(),
  })
  .refine((data) => data.accountToDebit || (data.debitTags && data.debitTags.length > 0), {
    message: "Either accountToDebit or debitTags is required",
    path: ["accountToDebit"],
  })
  .refine((data) => data.accountToCredit || (data.creditTags && data.creditTags.length > 0), {
    message: "Either accountToCredit or creditTags is required",
    path: ["accountToCredit"],
  });

// ============================================================
// Financial Activity Account
// ============================================================
export const createFinancialActivityMappingSchema = z.object({
  financialActivityId: z.number({ required_error: "Financial activity is required" }).int().positive(),
  glAccountId: z.number({ required_error: "GL Account is required" }).int().positive(),
});

// ============================================================
// GL Closure
// ============================================================
export const createGLClosureSchema = z.object({
  officeId: z.number({ required_error: "Office is required" }).int().positive(),
  closingDate: z.string({ required_error: "Closing date is required" }).min(1),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
  comments: z.string().optional(),
});

// ============================================================
// Periodic Accrual
// ============================================================
export const executePeriodicAccrualSchema = z.object({
  tillDate: z.string({ required_error: "Till date is required" }).min(1),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});

// ============================================================
// Provisioning Entry
// ============================================================
export const createProvisioningEntrySchema = z.object({
  date: z.string({ required_error: "Date is required" }).min(1),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
  createjournalentries: z.boolean().optional(),
});
```

---

## 13. Error Handling

| HTTP Status | Meaning               | Common Causes                                                              |
| ----------- | --------------------- | -------------------------------------------------------------------------- |
| `400`       | Bad Request           | Validation error — missing/invalid fields                                  |
| `401`       | Unauthorized          | No valid authentication token                                              |
| `403`       | Forbidden             | User lacks permission (e.g. `GLACCOUNT`, `JOURNALENTRY`, `ACCOUNTINGRULE`) |
| `404`       | Not Found             | Resource does not exist                                                    |
| `409`       | Conflict              | GL code already exists, closure already exists for this office/date        |
| `422`       | Unprocessable         | Business validation failure                                                |
| `500`       | Internal Server Error | Unexpected server error                                                    |

### Permission Names

| Permission                        | Resource                           |
| --------------------------------- | ---------------------------------- |
| `READ_GLACCOUNT`                  | View GL accounts                   |
| `CREATE_GLACCOUNT`                | Create GL accounts                 |
| `UPDATE_GLACCOUNT`                | Update GL accounts                 |
| `DELETE_GLACCOUNT`                | Delete GL accounts                 |
| `READ_JOURNALENTRY`               | View journal entries               |
| `CREATE_JOURNALENTRY`             | Create journal entries             |
| `REVERSE_JOURNALENTRY`            | Reverse journal entries            |
| `READ_ACCOUNTINGRULE`             | View accounting rules              |
| `CREATE_ACCOUNTINGRULE`           | Create accounting rules            |
| `UPDATE_ACCOUNTINGRULE`           | Update accounting rules            |
| `DELETE_ACCOUNTINGRULE`           | Delete accounting rules            |
| `READ_GLCLOSURE`                  | View accounting closures           |
| `CREATE_GLCLOSURE`                | Create accounting closures         |
| `UPDATE_GLCLOSURE`                | Update accounting closures         |
| `DELETE_GLCLOSURE`                | Delete accounting closures         |
| `READ_FINANCIALACTIVITYACCOUNT`   | View financial activity mappings   |
| `CREATE_FINANCIALACTIVITYACCOUNT` | Create financial activity mappings |
| `UPDATE_FINANCIALACTIVITYACCOUNT` | Update financial activity mappings |
| `DELETE_FINANCIALACTIVITYACCOUNT` | Delete financial activity mappings |

### GL Account Type Constants

```typescript
export const GL_ACCOUNT_TYPE = {
  ASSET: 1,
  LIABILITY: 2,
  EQUITY: 3,
  INCOME: 4,
  EXPENSE: 5,
} as const;

export const GL_ACCOUNT_TYPE_LABELS: Record<number, string> = {
  1: "Asset",
  2: "Liability",
  3: "Equity",
  4: "Income",
  5: "Expense",
};

export const GL_ACCOUNT_USAGE = {
  DETAIL: 1,
  HEADER: 2,
} as const;

export const GL_ACCOUNT_USAGE_LABELS: Record<number, string> = {
  1: "Detail",
  2: "Header",
};

export const ACCOUNTING_RULE_TYPE = {
  NONE: 1,
  CASH_BASED: 2,
  ACCRUAL_PERIODIC: 3,
  ACCRUAL_UPFRONT: 4,
} as const;

export const ACCOUNTING_RULE_TYPE_LABELS: Record<number, string> = {
  1: "No Accounting",
  2: "Cash Based",
  3: "Periodic Accrual",
  4: "Upfront Accrual",
};
```

---

## 15. Implementation Checklist

### GL Accounts

- [ ] GL Account List (filters: type, usage, manualEntriesAllowed, disabled, search)
- [ ] GL Account Detail (with optional running balance)
- [ ] GL Account Create (5 mandatory fields + optional parent/tag/description)
- [ ] GL Account Edit (partial update)
- [ ] GL Account Delete
- [ ] Conditional parentId options based on selected type
- [ ] Conditional tagId options based on selected type
- [ ] Hierarchy display (nameDecorated = "....Name" indicates depth)
- [ ] Running balance display with refresh capability

### Journal Entries

- [ ] Journal Entry List (with pagination, sorting, filters: officeId, date range, glAccountId, loanId, savingsId)
- [ ] Journal Entry Detail (with optional running balance and transaction details)
- [ ] Journal Entry Create (with dynamic debit/credit row management)
- [ ] Journal Entry Reverse
- [ ] Balance validation (total debits === total credits) before submit
- [ ] Accounting Rule auto-populate (when rule selected, pre-fill debits/credits)
- [ ] Running balance toggle
- [ ] Transaction details toggle (payment info)
- [ ] Opening balance retrieval
- [ ] Bulk import via Excel template

### Accounting Rules

- [ ] Accounting Rule List
- [ ] Accounting Rule Detail
- [ ] Accounting Rule Create (with two modes: single account vs tag-based)
- [ ] Accounting Rule Edit
- [ ] Accounting Rule Delete
- [ ] Conditional rendering of account select vs tag multi-select

### Financial Activity Account Mappings

- [ ] Mapping List
- [ ] Mapping Detail
- [ ] Mapping Create (select financial activity + select GL account)
- [ ] Mapping Edit
- [ ] Mapping Delete

### Accounting Closures

- [ ] Closure List (filterable by office)
- [ ] Closure Detail
- [ ] Closure Create (office + closing date)
- [ ] Closure Edit (comments only)
- [ ] Closure Delete (only latest per office)

### Periodic Accrual Accounting

- [ ] Accrual form (tillDate)
- [ ] Execute accrual button with loading state

### Provisioning Entries

- [ ] Provisioning Entry List (paginated)
- [ ] Provisioning Entry Detail (metadata)
- [ ] Provisioning Entry Create (date + optional createjournalentries)
- [ ] Create Journal Entries for provisioning entry
- [ ] Recreate provisioning entry
- [ ] Provisioning entries detail view (by loan product)

### General

- [ ] All list pages support pagination (offset, limit) and sorting (orderBy, sortOrder)
- [ ] All date fields use configurable locale and dateFormat
- [ ] All create/update pages validate with Zod before API call
- [ ] All API errors parsed and displayed as user-friendly messages
- [ ] Loading states for all queries and mutations
- [ ] Empty states for all list pages
- [ ] Permission-based UI (hide actions the user cannot perform)
- [ ] Correct permission checked for each operation
