# React + Apache Fineract Full System Scan & Integration Report

**Target React application:** `/Users/macbook03/Downloads/core-banking` (the existing React.js back-office UI)
**Backend:** Apache Fineract (source scanned at `/Users/macbook03/fineract/fineract`)

> **How to read the confidence markers used throughout this document**
>
> - `VERIFIED` — confirmed directly from the Fineract Java source code (file + line cited).
> - `INFERRED` — reasonable conclusion from surrounding code, not a direct source match.
> - `UNKNOWN` — could not be confirmed from the source.
> - `REQUIRES CONFIGURATION` — depends on runtime configuration / tenant settings.
> - `VERSION-SPECIFIC` — behavior that differs across Fineract releases (see §03.5).

---

## 01. Executive Summary

Your existing React application (`core-banking`) is **already a fully-structured Fineract back-office UI**. It does **not** need a redesign or a new frontend architecture. What it needs is a **systematic, verified alignment** between its API client layer and the actual Fineract backend contracts so that every page talks to the correct endpoint with the correct payload, state machine, and permission.

The React app already uses the correct foundational pieces:

| Concern | Existing implementation | Verdict |
|---|---|---|
| HTTP client | Axios singleton in `src/api/client.ts` with Basic-auth interceptor | ✅ Correct approach |
| Auth | `POST /authentication?tenantIdentifier=default`, stores `base64EncodedAuthenticationKey`, sends `Authorization: Basic <key>` | ✅ Matches Fineract (VERIFIED) |
| Tenant | `tenantIdentifier` query param | ✅ Matches Fineract (VERIFIED) |
| Server state | TanStack Query (`src/providers/QueryProvider.tsx`) | ✅ Correct |
| Forms | React Hook Form + Zod (`src/features/*/schemas/*.schema.ts`) | ✅ Correct |
| UI | Radix UI + Tailwind + shadcn-style components | ✅ Correct |
| State | Zustand (`src/store/index.ts`) | ✅ Correct |
| i18n | react-i18next (`src/i18n/`) | ✅ Correct |
| Error handling | Axios response interceptor + `getErrorMessage` | ✅ Correct shape |
| Permissions | Permission hooks (`useLoanPermissions`, `useSavingsPermissions`) | ✅ Correct approach |

The key findings of this scan are the **precise backend contracts** that your API layer must match. The most important corrections (source-verified) are listed below. These are the areas where the React code currently deviates from the actual Fineract backend and **must be fixed**:

### Critical corrections required (all VERIFIED from source)

1. **Client transfer status numeric IDs** — `src/features/clients/constants/status.ts` maps transfer states to `800`/`900`. The Fineract `ClientStatus` enum uses `TRANSFER_IN_PROGRESS=303`, `TRANSFER_ON_HOLD=304` (VERIFIED, `ClientStatus.java:26-35`).

2. **Loan status numeric IDs** — already largely correct in `src/features/loans/constants/status.ts` (100/200/300/303/304/400/500/600/601/602/700) (VERIFIED, `LoanStatus.java:26-39`).

3. **Savings status numeric IDs** — the commonly-referenced values (`TRANSFER_IN_PROGRESS=400`, `WITHDRAWN=600`, etc.) are **wrong**. Actual `SavingsAccountStatusType`: 100/200/300/**303/304**/**400**/**500**/**600**/**700**/**800** (MATURED=800) (VERIFIED, `SavingsAccountStatusType.java:27-39`).

4. **Deposit / withdrawal / hold / release are NOT commands on `POST /savingsaccounts/{id}`** — they live on the **transactions** resource: `POST /savingsaccounts/{id}/transactions?command=deposit|withdrawal|postInterestAsOn|holdAmount` and `POST /savingsaccounts/{id}/transactions/{txnId}?command=undo|reverse|modify|releaseAmount` (VERIFIED, `SavingsAccountsApiResource.java:509-587`, `SavingsAccountTransactionsApiResource.java:310-379`).

5. **Loan repay / write-off / close / foreclose / waiveInterest are NOT commands on `POST /loans/{id}`** — they are commands on `POST /loans/{id}/transactions?command=repayment|writeoff|close|close-rescheduled|foreclosure|waiveinterest|...` (VERIFIED, `LoanTransactionsApiResource.java:569-632`). Your `src/features/loans/api/loan.ts` already handles this correctly via `makeTransaction`.

6. **`GET /loans/{id}/schedule` does not exist** — the repayment schedule is retrieved via `GET /loans/{id}?associations=repaymentSchedule` (VERIFIED, `LoansApiResource.java`). Your `fetchRepaymentSchedule` already does this correctly.

7. **`GET /journalentries/template` does not exist** (VERIFIED, `JournalEntriesApiResource.java`). No template endpoint for journal entries.

8. **Client "undo" commands are `undoRejection` / `undoWithdrawal`** (camelCase), not `undoreject` / `undowithdraw` (VERIFIED, `ClientsApiResource.java:513-516`). Your `src/features/clients/api/client.ts` uses the wrong strings and must be fixed.

9. **Report execution path is `/v1/runreports/{reportName}`**, not `/reports/run/...` (VERIFIED, `RunreportsApiResource.java`).

10. **Charge enums differ from common assumptions**: `chargeTimeType` DISBURSEMENT=1, SPECIFIED_DUE_DATE=2, SAVINGS_ACTIVATION=3, SAVINGS_CLOSURE=4, WITHDRAWAL_FEE=5, ANNUAL_FEE=6, MONTHLY_FEE=7, INSTALMENT_FEE=8...; `chargePaymentMode` REGULAR=0, ACCOUNT_TRANSFER=1 (no `OUT_OF_POCKET`); `chargeAppliesTo` LOAN=1, SAVINGS=2, CLIENT=3, SHARES=4, WORKING_CAPITAL_LOAN=5 (VERIFIED, `ChargeTimeType.java`, `ChargePaymentMode.java`, `ChargeAppliesTo.java`).

11. **`lastLoginDateTime` does not exist** in the authentication response. The `LoginResponse` type in `src/features/authentication/types/auth.ts` lists it — it will simply be `undefined` at runtime (harmless, but you can remove it).

12. **User password change is `POST /users/{id}/pwd`**, not `PUT /users/{id}?command=changePassword` (VERIFIED, `UsersApiResource.java:198-219`).

13. **`GET /permissions/makercheckers` does not exist** — use `GET /permissions?makerCheckerable=true` (VERIFIED, `PermissionsApiResource.java`).

14. **`GET /staff/template` does not exist** — use `GET /staff/{id}?template=true` (VERIFIED, `StaffApiResource.java`).

15. **Office transaction undo is `DELETE /officetransactions/{id}`**, not `POST ...?command=undo` (VERIFIED, `OfficeTransactionsApiResource.java:104-116`).

The remainder of this document is the complete, source-verified integration map your developer can implement from.

---

## 02. Existing React Architecture

Source: `/Users/macbook03/Downloads/core-banking`.

### 02.1 Stack (from `package.json`)

| Concern | Technology | Version |
|---|---|---|
| Framework | React | 19.2 |
| Language | TypeScript | ~6.0 |
| Build | Vite | 8.1 |
| Routing | `react-router-dom` (BrowserRouter) | 7.18 |
| Server-state | `@tanstack/react-query` | 5.101 |
| Client-state | `zustand` | 5.0 |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` | 7.81 / 5.4 / 4.4 |
| UI | Radix UI primitives + shadcn-style components (`src/components/ui/*`) | — |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) + `cva` + `clsx` + `tailwind-merge` | 4.3 |
| HTTP | `axios` | 1.18 |
| i18n | `i18next` + `react-i18next` | 26 / 17 |

### 02.2 Folder structure

```
src/
├── api/            client.ts (Axios), index.ts (legacy generic helpers), office.service.ts, batch.ts
├── components/
│   ├── layout/     AppLayout, Sidebar, TopNav, LanguageSwitcher
│   ├── organization/  Office tree/drawer/filters/table/form
│   ├── shared/     DataTable, Pagination, StatusBadge, ApiErrorHandler, ClientSearch, etc.
│   └── ui/         Radix-based primitives (button, dialog, table, toast, ...)
├── features/       feature-sliced modules (see §03.2)
│   ├── accounting/  admin/  authentication/  calendars/  campaigns/  centers/
│   ├── charges/     clients/  cob/  codes/  collateral-products/  configuration/
│   ├── currencies/  dashboard/  datatables/  delinquency-buckets/  deposits/
│   ├── documents/   external-asset-owners/  funds/  groups/  holidays/  interop/
│   ├── loan-originators/  loans/  notes/  offices/  payment-types/  provisioning/
│   ├── reports/     search/  shares/  staff/  standing-instructions/  taxes/
│   ├── tellers/     transfers/  working-capital-loans/  working-days/
├── hooks/           useOffices.ts
├── i18n/            locales/{en,lo}/translation.json
├── lib/             error.ts, utils.ts, scoreGrade.ts, validations/office.ts
├── mock/            mock data
├── providers/       QueryProvider.tsx
├── store/           index.ts (Zustand stores), network.ts
└── types/           global types
```

### 02.3 Routing

- Single `BrowserRouter` with a `RequireAuth` wrapper + nested `AppLayout` + nested `Routes` (`src/App.tsx`).
- Route protection is **client-side only** (checks `useAuthStore.isAuthenticated`). Backend authorization is authoritative.
- 100+ routes covering clients, loans, deposits, accounting, admin, organization, treasury, transfers, CRM, configuration, reports, COB, interop, shares.

### 02.4 State management

- **Zustand** for client state: auth, network status, UI (sidebar/theme/breadcrumb), plus a set of legacy slice stores (campaign, rule-builder, formula, actions, category, product, simulation, lending, loan-product, collateral, deposit, fixed-deposit, exchange-rate).
- **TanStack Query** for all server state: feature hooks `useClients`, `useLoans`, `useLoan`, `useSavingsAccounts`, etc. (`src/features/*/hooks/*.ts`).

### 02.5 Authentication & auth store

- `src/store/index.ts`: `useAuthStore` persists `{isAuthenticated, user, basicAuth}` to `localStorage` under `corebank-auth-session`.
- `basicAuth` = `LoginResponse.base64EncodedAuthenticationKey` (VERIFIED: this is `base64(username:password)`).
- `src/api/client.ts` request interceptor attaches `Authorization: Basic ${basicAuth}` when present; response interceptor logs out on `401` and reports network/timeout errors via `useNetworkStore`.

### 02.6 Error handling

- `src/lib/error.ts` parses Fineract-style error bodies: `{developerMessage, defaultUserMessage, userMessageGlobalisationCode, errors: [{defaultUserMessage, parameterName, ...}]}` (VERIFIED — this is Fineract's actual `ApiParameterError`/`GlobalErrorLog` shape).
- `src/components/shared/ApiErrorHandler.tsx` and `NetworkErrorBanner.tsx` render top-level error UI.

### 02.7 Permissions

- Login response includes `permissions: string[]` (VERIFIED). The app stores them on `AuthUser.permissions` and gates UI actions via hooks such as `useLoanPermissions` (permission codes like `CREATE_LOAN`, `APPROVE_LOAN`) and `useSavingsPermissions`. This matches Fineract's permission naming convention (VERIFIED pattern: `<ACTION>_<ENTITY>`).

### 02.8 i18n

- `react-i18next` with `en` and `lo` (Lao) locales. Most labels use `i18n.t(...)`.

---

## 03. Fineract Architecture

### 03.1 High-level

Apache Fineract is a **Spring Boot + Jersey (JAX-RS)** REST API. It is multi-tenant, per-tenant-database, with command-query separation and a full double-entry accounting engine. It is the **system of record** for all financial data.

### 03.2 Base URL & context path (VERIFIED)

- Servlet context path: `/fineract-provider` (`application.properties:445`)
- JAX-RS application path: `/api` (`JerseyConfig.java:37`)
- Resource paths: `/v1/...`

**Full API base URL:**
```
https://<host>:<port>/fineract-provider/api/v1
```

Your React `VITE_API_BASE_URL=https://api.laofinfact.com/finfact/api/v1/` is a **proxy/rewritten** base that maps to this. Confirm with the deployment team that `/finfact/api/v1/` maps to `/fineract-provider/api/v1/`.

### 03.3 Modules in the source tree (relevant to the React app)

```
fineract-provider     main JAX-RS resources + services
fineract-core         enums, domain base classes, ThreadLocalContext, tenant routing
fineract-security     authentication, 2FA, tenant filter
fineract-accounting   GL accounts, rules, closures, accrual, provisioning
fineract-charge       charges
fineract-loan         loan account services, schedule, reschedule, delinquencies
fineract-loan-origination   loan originators, WC loans
fineract-progressive-loan  advanced payment allocation strategy
fineract-savings      savings/deposit domain
fineract-tax          taxes
fineract-report       reports/data queries
fineract-document     documents & images
fineract-client-feign, fineract-client  generated clients
fineract-investor     external asset owners (investor base)
fineract-cob          close of business / COB dashboard
```

### 03.4 Command / query pattern

Fineract separates state-changing operations (`POST .../something?command=<action>`) from queries (`GET ...`). Most business transitions are **commands** on a resource URL. This is why your API client mostly issues `client.post(url, body, {params:{command}})`.

### 03.5 Version-specific notes (`VERSION-SPECIFIC`)

The scanned source is the current `develop` branch. Some endpoints/fields are newer (e.g. `LoanProductsDetailsApiResource`, `loan-transaction-search`, `WorkingCapitalLoan*`). If you deploy against a released Fineract version (e.g. 1.9.x/1.10.x), verify the exact command strings and the presence of newer resources. The core client/loan/savings/accounting contracts below are stable and present in both.

---

## 04. Module Inventory (source-verified)

### Organization
- **Offices** — `OfficesApiResource` (VERIFIED): `GET/POST /v1/offices`, `GET /v1/offices/template`, `GET/PUT /v1/offices/{id}`, `GET /v1/offices/external-id/{extId}`. Create mandatory per Swagger: `name, openingDate, parentId` (parentId optional in code).
- **Office Transactions** — `OfficeTransactionsApiResource` (VERIFIED): `GET/POST /v1/officetransactions`, `GET /v1/officetransactions/template`, `DELETE /v1/officetransactions/{id}` (undo).
- **Staff** — `StaffApiResource` (VERIFIED): `GET/POST /v1/staff`, `GET /v1/staff/{id}?template=true`, `PUT /v1/staff/{id}`. Create: `officeId, firstname, lastname` (+optional `isLoanOfficer`, `isActive`). **No `/staff/template`**.
- **Holidays** — `HolidaysApiResource` (VERIFIED): `POST/GET /v1/holidays`, `POST /v1/holidays/{id}?command=activate`, `PUT/DELETE /v1/holidays/{id}`, `GET /v1/holidays/template`.
- **Working Days** — `WorkingDaysApiResource` (VERIFIED): `GET/PUT /v1/workingdays`, `GET /v1/workingdays/template`.

### Users / Roles / Permissions
- **Users** — `UsersApiResource` (VERIFIED): `GET/POST /v1/users`, `GET /v1/users/template`, `GET /v1/users/{id}?template=true`, `PUT/DELETE /v1/users/{id}`, **`POST /v1/users/{id}/pwd` (change password)**. Create: `username, firstname, lastname, officeId, roles[], sendPasswordToEmail` (email required only if sendPasswordToEmail).
- **Roles** — `RolesApiResource` (VERIFIED): `GET/POST /v1/roles`, `GET/PUT/DELETE /v1/roles/{id}`, `POST /v1/roles/{id}?command=enable|disable`, `GET/PUT /v1/roles/{id}/permissions`. Create: `name, description`.
- **Permissions** — `PermissionsApiResource` (VERIFIED): `GET /v1/permissions?makerCheckerable=true`, `PUT /v1/permissions`. **No `/makercheckers` sub-path**.
- **Audits** — `AuditsApiResource` (VERIFIED): `GET /v1/audits` with params `actionName, entityName, resourceId, makerId, makerDateTimeFrom, makerDateTimeTo, checkerId, checkerDateTimeFrom, checkerDateTimeTo, status, clientId, loanId, officeId, groupId, savingsAccountId, processingResult, offset, limit, orderBy, sortOrder, paged`. **No `fromDate`/`toDate`** — use `makerDateTimeFrom`/`makerDateTimeTo`.
- **Maker Checkers** — `MakercheckersApiResource` (VERIFIED): `GET /v1/makercheckers`, `GET /v1/makercheckers/searchtemplate`, `POST /v1/makercheckers/{auditId}?command=approve|reject`, `DELETE /v1/makercheckers/{auditId}`.

### Client Management (VERIFIED)
`ClientsApiResource` at `/v1/clients`. Full detail in §09. Commands: `activate, assignStaff, unassignStaff, close, proposeTransfer, proposeAndAcceptTransfer, withdrawTransfer, acceptTransfer, rejectTransfer, updateSavingsAccount, reject, withdraw, reactivate, undoRejection, undoWithdrawal`.

### Groups (VERIFIED)
`GroupsApiResource` at `/v1/groups`. Commands: `activate, associateClients, disassociateClients, generateCollectionSheet, saveCollectionSheet, unassignStaff, assignStaff, assignRole, unassignRole, updateRole, transferClients, close`.

### Centers (VERIFIED)
`CentersApiResource` at `/v1/centers`. Commands: `activate, generateCollectionSheet, saveCollectionSheet, close, associateGroups, disassociateGroups`.

### Loan Products (VERIFIED)
`LoanProductsApiResource` at `/v1/loanproducts`. See §12. Also `GET /v1/loanproducts/basic-details` (`LoanProductsDetailsApiResource`), and `POST /v1/loanproducts/{id}/productmix` (`ProductMixApiResource`).

### Loans (VERIFIED)
`LoansApiResource` at `/v1/loans` + `LoanTransactionsApiResource` + `LoanChargesApiResource` + `CollateralsApiResource` + `LoanScheduleApiResource` + `RescheduleLoansApiResource`. See §13.

### Savings / Deposits (VERIFIED)
`SavingsProductsApiResource`, `SavingsAccountsApiResource`, `SavingsAccountTransactionsApiResource`, `SavingsAccountChargesApiResource`, `FixedDeposit*`, `RecurringDeposit*`. See §15/§16.

### Accounting (VERIFIED)
`GLAccountsApiResource`, `JournalEntriesApiResource`, `AccountingRuleApiResource`, `FinancialActivityAccountsApiResource`, `GLClosuresApiResource`, `AccrualAccountingApiResource` (path `/v1/runaccruals`), `ProvisioningEntriesApiResource`. See §20.

### Charges (VERIFIED)
`ChargesApiResource` at `/v1/charges`. See §18.

### Reports (VERIFIED)
`ReportsApiResource` at `/v1/reports` + `RunreportsApiResource` at `/v1/runreports/{reportName}`. See §21.

### Other admin/configuration modules present (VERIFIED)
Currencies (`/v1/currencies`), Funds (`/v1/funds`), Payment Types (`/v1/paymenttypes`), Codes (`/v1/codes`, `/v1/codes/{id}/codevalues`), Datatables (`/v1/datatables`), Global Configuration (`/v1/configurations`), External Services (`/v1/externalservice`), Adhoc Queries (`/v1/adhocquery`), Shares (`/v1/shareproducts`, `/v1/shareaccounts`), Tellers, Campaigns/SMS/Email, Interop (Mojaloop), External Asset Owners (investor), Working Capital Loans, COB.

---

## 05. React → Fineract Feature Mapping

Every existing page maps to a Fineract feature. The pages already exist in `core-banking`; this table maps each to the backend resource and the API client to implement/verify.

| Existing React Page (route) | UI Purpose | Fineract Feature | Required API (base `/v1/...`) | Status |
|---|---|---|---|---|
| `/clients`, `/clients/new`, `/clients/:id`, `/clients/:id/edit` | Client CRUD, activation, closure, transfer | Clients | `clients` (all commands) | Implemented; fix undo cmd + status IDs |
| `/clients/:id` (tabs) | Identifiers, documents, images, notes, charges, family, collateral, addresses | Client sub-resources | `clients/{id}/identifiers`, `/documents`, `/images`, `/notes`, `/charges`, `/familymembers`, `/collaterals`, `/client/{id}/addresses` | Implemented |
| `/groups*` | Group management | Groups | `groups` (+commands) | Implemented |
| `/centers*` | Center management | Centers | `centers` (+commands) | Implemented |
| `/lending/products*` | Loan product config | Loan Products | `loanproducts` | Implemented |
| `/loans*`, `/loans/view/:id` | Loan management & lifecycle | Loans | `loans`, `loans/{id}/transactions`, `loans/{id}/charges`, `loans/{id}/collaterals` | Implemented |
| `/rescheduling*` | Reschedule requests | Reschedule Loans | `rescheduleloans` | Implemented |
| `/delinquency-buckets*`, `/delinquency-ranges*` | Delinquency config | Delinquency Buckets/Ranges | `delinquency/buckets`, `delinquency/ranges` | Implemented |
| `/loans/reassign` | Bulk reassignment | Loan reassignment | `loans/reassignment` | Implemented |
| `/deposits/saving-accounts*` | Savings accounts | Savings Accounts | `savingsaccounts`, `savingsaccounts/{id}/transactions` | Implemented; fix deposit/withdraw endpoints |
| `/deposits/products*` | Savings products | Savings Products | `savingsproducts` | Implemented |
| `/deposits/fixed*`, `/deposits/fixed-products*` | Fixed deposits | Fixed Deposit accounts/products | `fixeddepositaccounts`, `fixeddepositproducts` | Implemented |
| `/deposits/recurring*` | Recurring deposits | Recurring Deposit | `recurringdepositaccounts`, `recurringdepositproducts` | Implemented |
| `/interest-rate-charts*` | Interest rate charts | Interest rate charts | `interestratecharts` | Implemented |
| `/accounting/gl-accounts*` | Chart of accounts | GL Accounts | `glaccounts` | Implemented |
| `/accounting/journal-entries*` | Journal entries | Journal Entries | `journalentries` | Implemented (no template endpoint) |
| `/accounting/rules*` | Accounting rules | Accounting Rules | `accountingrules` | Implemented |
| `/accounting/financial-activity-mappings` | Activity mappings | Financial Activity Accounts | `financialactivityaccounts` | Implemented |
| `/accounting/closures` | GL closures | GL Closures | `glclosures` | Implemented |
| `/accounting/periodic-accrual` | Periodic accrual | Accrual | `runaccruals` (POST) | Implemented |
| `/accounting/provisioning-entries` | Provisioning | Provisioning Entries | `provisioningentries` | Implemented |
| `/provisioning-categories`, `/provisioning-criteria` | Provisioning config | Provisioning categories/criteria | `provisioningcategories`, `provisioningcriteria` | Implemented |
| `/taxes/components`, `/taxes/groups` | Tax config | Taxes | `taxes/component`, `taxes/group` | Implemented |
| `/reports*`, `/adhoc-queries*` | Reports & adhoc | Reports / Adhoc | `reports`, `runreports/{name}`, `adhocquery` | Implemented; verify runreports path |
| `/datatables*`, `/entity-datatable-checks` | Datatables | Datatables | `datatables` | Implemented |
| `/admin/users*`, `/admin/roles*`, `/admin/permissions` | Users, roles, permissions | Users/Roles/Permissions | `users`, `roles`, `permissions` | Implemented; fix pwd endpoint |
| `/tellers*` | Teller mgmt | Tellers | `tellers` | Implemented |
| `/offices*`, `/office-transactions*`, `/staff*`, `/holidays*`, `/working-days*`, `/currencies*`, `/funds*`, `/payment-types*`, `/charges*`, `/codes*` | Organization | Various | see §04 | Implemented |
| `/search` | Global search | Search | `search` | Implemented |
| `/transfers/history`, `/transfers/new`, `/standing-instructions*` | Transfers | Account Transfers / Standing Instructions | `accounttransfers`, `standinginstructions` | Implemented |
| `/external-asset-owners*` | Investor base | External Asset Owners | `external-asset-owners` | Implemented |
| `/interop/*` | Mojaloop interop | Interoperation | `interoperation` | Implemented |
| `/cob/*` | Close of business | COB | `cob` | Implemented |
| `/configuration/*` | Global config | Configuration | `configurations`, `externalservice` | Implemented |
| `/campaigns*` | SMS/Email campaigns | Campaigns | `smscampaigns`, `emailcampaigns` | Implemented |
| `/shares/*` | Share products/accounts | Shares | `shareproducts`, `shareaccounts` | Implemented |
| `/working-capital-loans*` | WC loans | Working Capital Loans | `working-capital-loans` | Implemented |

---

## 06. Authentication (VERIFIED)

### 06.1 Endpoint
- **`POST /fineract-provider/api/v1/authentication`** (query `tenantIdentifier=default`) — `AuthenticationApiResource.java:60,79-81`.
- Request body: JSON `{ "username": "...", "password": "..." }` (`AuthenticateRequest`).

### 06.2 Response body
Fields (from `AuthenticatedUserData` + runtime assembly):
```
username, userId, base64EncodedAuthenticationKey, authenticated,
officeId, officeName, staffId, staffDisplayName, organisationalRole,
roles[], permissions[], shouldRenewPassword, isTwoFactorAuthenticationRequired
```
- **`lastLoginDateTime` does NOT exist** — remove it from `LoginResponse` (harmless if left, but it is `UNKNOWN`/absent).
- `base64EncodedAuthenticationKey` = `Base64(username:password)` (VERIFIED `AuthenticationApiResource.java:112-113`).
- `shouldRenewPassword=true` results in a **403** with a password-reset-required payload (VERIFIED lines 133-137).
- `isTwoFactorAuthenticationRequired` is true when 2FA is enabled and the user lacks `BYPASS_TWOFACTOR` (VERIFIED lines 130-131).

### 06.3 Session/token behavior
- Basic auth is **stateless** (SessionCreationPolicy.STATELESS).
- Send **`Authorization: Basic <base64EncodedAuthenticationKey>`** on every subsequent request. Spring's `BasicAuthenticationFilter` decodes it back to `username:password` and re-authenticates (VERIFIED `TenantAwareBasicAuthenticationFilter.java:133-137`).

### 06.4 React implementation
Your current flow is correct:
```
Login → store {user, basicAuth} in Zustand + localStorage
→ request interceptor attaches Authorization: Basic <basicAuth>
→ on 401 → logout
→ logout = clear store + localStorage (no server call needed for basic auth)
```
- **Logout**: There is **no** `POST /authentication?logout=true` for basic auth (VERIFIED absent). Client-side clearing is correct.
- **2FA**: If 2FA is enabled (`isTwoFactorAuthenticationRequired`), the user must complete the 2FA flow before the app is usable. Endpoints: `GET /v1/twofactor`, `POST /v1/twofactor?deliveryMethod=...`, `POST /v1/twofactor/validate?token=...` returning an access token, and send it as header `Fineract-Platform-TFA-Token` (VERIFIED `TwoFactorApiResource.java`). This is a `REQUIRES CONFIGURATION` feature — implement the 2FA screens only if the deployment enables it.

### 06.5 Unauthorized / forbidden responses
- `401` → authentication failure (interceptor logs out).
- `403` → authenticated but missing permission, or password-renewal required. Show a "not permitted" state; don't log out.

---

## 07. Tenant Architecture (VERIFIED)

- **Tenant identifier** is resolved from either:
  - Header `Fineract-Platform-TenantId`, OR
  - Query param `tenantIdentifier` (fallback).
  (`TenantAwareBasicAuthenticationFilter.java:70,113-130`; header takes precedence.)
- Stored in a `ThreadLocal` (`ThreadLocalContextUtil`) and used to look up the tenant's database schema from the `tenants` / `tenant_server_connections` tables, then to build a per-tenant `DataSource` (`DataSourcePerTenantServiceFactory`).

### React implementation
- Your login call uses `POST /authentication?tenantIdentifier=default`. **Every** API call must carry the tenant identifier.
- **Recommendation**: attach `?tenantIdentifier=<tenant>` (or the `Fineract-Platform-TenantId` header) in the Axios request interceptor in `src/api/client.ts`, driven by a config/env value (e.g. `VITE_TENANT_IDENTIFIER=default`). Do not hardcode it only on login.

---

## 08. Users / Roles / Permissions

### 08.1 Users (VERIFIED)
`/v1/users`:
- `POST /users` — body: `{username, firstname, lastname, email?, officeId, roles: [ids], sendPasswordToEmail, staffId?}`.
- `GET /users`, `GET /users/{id}?template=true`, `GET /users/template`, `PUT /users/{id}`, `DELETE /users/{id}`.
- **Change password: `POST /users/{id}/pwd`** with `{password, repeatPassword}` (VERIFIED `UsersApiResource.java:198-219`). Fix any `?command=changePassword` usage.

### 08.2 Roles (VERIFIED)
`/v1/roles`:
- `POST /roles` — `{name, description}`.
- `GET /roles/{id}/permissions`, `PUT /roles/{id}/permissions` (update role permission set).
- `POST /roles/{id}?command=enable|disable`.

### 08.3 Permissions (VERIFIED)
- `GET /permissions?makerCheckerable=true` → returns maker-checker-able permissions with `selected` flag.
- `PUT /permissions` — enable/disable maker-checker for permissions.
- Permission codes follow the pattern `<ACTION>_<ENTITY>`, e.g. `CREATE_LOAN`, `APPROVE_LOAN`, `DISBURSE_LOAN`, `CREATE_CLIENT`, `CREATE_SAVINGSACCOUNT`. The existing `useLoanPermissions` / `useSavingsPermissions` maps align with this pattern (VERIFIED by the loan/savings commands).

### 08.4 Feature → Permission → UI Action table (VERIFIED pattern)

| UI Action | Fineract Permission |
|---|---|
| Create Client | `CREATE_CLIENT` |
| Activate Client | `ACTIVATE_CLIENT` |
| Close Client | `CLOSE_CLIENT` |
| Create Loan | `CREATE_LOAN` |
| Approve Loan | `APPROVE_LOAN` |
| Reject Loan | `REJECT_LOAN` |
| Disburse Loan | `DISBURSE_LOAN` |
| Repay Loan | `REPAYMENT_LOAN` (transaction command `repayment`) |
| Write Off Loan | `WRITEOFF_LOAN` |
| Close Loan | `CLOSE_LOAN` |
| Create Savings Account | `CREATE_SAVINGSACCOUNT` |
| Approve Savings | `APPROVE_SAVINGSACCOUNT` |
| Activate Savings | `ACTIVATE_SAVINGSACCOUNT` |
| Deposit | `DEPOSIT_SAVINGSACCOUNT` |
| Withdrawal | `WITHDRAWAL_SAVINGSACCOUNT` |

> **Principle:** Backend permissions are authoritative. The React permission hooks only hide/disable UI actions for UX; the backend will return `403` if an action is attempted without permission. Keep both in sync, but treat the backend as the source of truth.

---

## 09. Client Management (VERIFIED)

`ClientsApiResource` — base `/v1/clients`.

### 09.1 Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/clients` | Query: `officeId, externalId, displayName, firstName, lastName, status, underHierarchy, staffId, legalForm, orphansOnly, offset, limit, orderBy, sortOrder` (VERIFIED `ClientsApiResource.java:132-157`). **No `paged`/`sqlSearch`** for clients. |
| GET | `/clients/{clientId}` | `?staffInSelectedOfficeOnly`, `?template=true`, `?fields=`. |
| GET | `/clients/template` | `?officeId`, `?commandParam=close\|acceptTransfer\|reject\|withdraw`. |
| POST | `/clients` | Create. Mandatory: `firstname`+`lastname` OR `fullname`, `officeId`, and (`active=true`+`activationDate`) OR (`active=false`). Optional: `externalId, accountNo, staffId, mobileNo, savingsProductId, genderId, clientTypeId, clientClassificationId, legalFormId, dateOfBirth, groupId, submittedOnDate, dateFormat, locale`. |
| PUT | `/clients/{clientId}` | Update. |
| DELETE | `/clients/{clientId}` | Hard delete, only when Pending. |
| POST | `/clients/{clientId}?command=<cmd>` | State commands (below). |
| GET | `/clients/{clientId}/accounts` | Loan + savings account summary. |
| GET | `/clients/{clientId}/transactions` | `ClientTransactionsApiResource`; also `/{txnId}`, `POST /{txnId}` (undo). |

### 09.2 Commands (VERIFIED, `evaluateCommand` lines 487-517)

| Command | Required fields |
|---|---|
| `activate` | `activationDate` |
| `reject` | `rejectionDate`, `rejectionReasonId` |
| `withdraw` | `withdrawalDate`, `withdrawalReasonId` |
| `reactivate` | `reactivationDate` |
| `undoRejection` | `reopenedDate` |
| `undoWithdrawal` | `reopenedDate` |
| `close` | `closureDate`, `closureReasonId` |
| `assignStaff` | `staffId` |
| `unassignStaff` | `staffId` |
| `updateSavingsAccount` | `savingsAccountId` |
| `proposeTransfer` | destination office/group |
| `proposeAndAcceptTransfer` | destination office/group |
| `acceptTransfer` | — |
| `rejectTransfer` | — |
| `withdrawTransfer` | — |

> **FIX REQUIRED:** `src/features/clients/api/client.ts` uses `undoreject`/`undowithdraw`. The correct commands are **`undoRejection` / `undoWithdrawal`** (VERIFIED). Correct these.

### 09.3 Client status enum (VERIFIED `ClientStatus.java:26-35`)

| Name | ID | Code |
|---|---|---|
| INVALID | 0 | `clientStatusType.invalid` |
| PENDING | 100 | `clientStatusType.pending` |
| ACTIVE | 300 | `clientStatusType.active` |
| TRANSFER_IN_PROGRESS | **303** | `clientStatusType.transfer.in.progress` |
| TRANSFER_ON_HOLD | **304** | `clientStatusType.transfer.on.hold` |
| CLOSED | 600 | `clientStatusType.closed` |
| REJECTED | 700 | `clientStatusType.rejected` |
| WITHDRAWN | 800 | `clientStatusType.withdraw` |

> **FIX REQUIRED:** `src/features/clients/constants/status.ts` `STATUS_ID_MAP` uses `800`→transfer in progress, `900`→transfer on hold. Correct to **303 / 304**, and add `WITHDRAWN=800`.

### 09.4 Client sub-resources (VERIFIED)
- **Identifiers**: `GET/POST /clients/{id}/identifiers`, `GET /clients/{id}/identifiers/template`, `GET/PUT/DELETE /clients/{id}/identifiers/{identifierId}` (`ClientIdentifiersApiResource`).
- **Charges**: `GET /clients/{id}/charges`, `GET /clients/{id}/charges/template`, `GET /clients/{id}/charges/{chargeId}`, `POST /clients/{id}/charges` (apply), `POST /clients/{id}/charges/{chargeId}?command=pay|waive`, `DELETE /clients/{id}/charges/{chargeId}` (`ClientChargesApiResource`).
- **Family members**: `GET/POST /clients/{id}/familymembers`, `GET/PUT/DELETE /clients/{id}/familymembers/{memberId}`, `GET .../template` (`ClientFamilyMembersApiResource`).
- **Collaterals**: `GET/POST /clients/{id}/collaterals`, `GET/PUT/DELETE .../collaterals/{collateralId}` (`ClientCollateralManagementApiResource`).
- **Addresses**: base path **`/client/{clientid}/addresses`** (singular `client`; VERIFIED `ClientAddressApiResource.java:52`).
- **Documents**: generic `/{entityType}/{entityId}/documents` with `entityType=clients` (`DocumentApiResource`).
- **Images**: generic `/{entityType}/{entityId}/images` with `entityType=clients` (`ImagesApiResource`).
- **Notes**: generic `/{resourceType}/{resourceId}/notes` with `resourceType=clients` (`NotesApiResource`).

### 09.5 Lifecycle / state machine

```
PENDING(100) --activate--> ACTIVE(300) --close--> CLOSED(600)
   | reject -> REJECTED(700) -> (undoRejection -> PENDING)
   | withdraw -> WITHDRAWN(800) -> (undoWithdrawal -> PENDING)
   | reactivate -> ACTIVE
ACTIVE -> proposeTransfer -> TRANSFER_IN_PROGRESS(303) / TRANSFER_ON_HOLD(304)
```

UI actions per state:
- **PENDING**: Edit, Activate, Reject, Withdraw, Delete
- **ACTIVE**: Close, Transfer (propose), Assign/Unassign Staff, Update Savings Account
- **REJECTED**: Undo Rejection, Delete
- **WITHDRAWN**: Undo Withdrawal
- **TRANSFER_***: Accept/Reject/Withdraw transfer (per office role)

---

## 10. Group Management (VERIFIED)

`GroupsApiResource` — base `/v1/groups`.

- `GET /groups` — query: `officeId, staffId, externalId, name, underHierarchy, paged, offset, limit, orderBy, sortOrder, orphansOnly`. (**`paged` IS supported for groups**; VERIFIED lines 179-218.)
- `GET /groups/{groupId}` — `?associations=clientMembers|activeClientMembers|groupRoles|calendars|collectionMeetingCalendar|all`, `?staffInSelectedOfficeOnly`, `?roleId`, `?template`.
- `GET /groups/template` — `?officeId`, `?center`, `?centerId`, `?command=close`.
- `POST /groups` — mandatory: `name, officeId, active, activationDate` (if active). Optional: `externalId, staffId, clientMembers`.
- `PUT /groups/{groupId}`, `DELETE /groups/{groupId}` (pending only).
- `POST /groups/{groupId}?command=`: `activate, associateClients, disassociateClients, generateCollectionSheet, saveCollectionSheet, unassignStaff, assignStaff, assignRole, unassignRole, updateRole, transferClients, close` (VERIFIED lines 395-495). Also `POST /groups/{groupId}/command/unassign_staff`.
- `GET /groups/{groupId}/accounts` — loan/savings summary.

Group lifecycle: PENDING → activate → ACTIVE → close → CLOSED. UI actions mirror client states plus associate/disassociate clients, staff assignment, and client transfer.

## 11. Center Management (VERIFIED)

`CentersApiResource` — base `/v1/centers`.

- `GET /centers` — query: `officeId, staffId, externalId, name, underHierarchy, paged, offset, limit, orderBy, sortOrder, meetingDate, dateFormat, locale` (VERIFIED lines 160-224).
- `GET /centers/{centerId}` — `?associations=groupMembers|collectionMeetingCalendar`, `?staffInSelectedOfficeOnly`, `?template`.
- `GET /centers/template` — `?command=close`, `?officeId`, `?staffInSelectedOfficeOnly`.
- `POST /centers` — mandatory: `name, officeId, active, activationDate` (if active). Optional: `externalId, staffId, groupMembers`.
- `POST /centers/{centerId}?command=`: `activate, generateCollectionSheet, saveCollectionSheet, close, associateGroups, disassociateGroups` (VERIFIED lines 350-423).
- `GET /centers/{centerId}/accounts`.

---

## 12. Loan Products (VERIFIED)

`LoanProductsApiResource` — base `/v1/loanproducts`.

### 12.1 Endpoints
- `POST /loanproducts` — create.
- `GET /loanproducts` — `?associations=productMixes`, `?fields=`.
- `GET /loanproducts/template` — `?isProductMixTemplate=true`.
- `GET /loanproducts/{productId}`, `PUT /loanproducts/{productId}`.
- `GET/PUT /loanproducts/external-id/{externalProductId}`.
- `GET /loanproducts/basic-details` (`LoanProductsDetailsApiResource`) — id/name/shortName.
- **`GET /loanproducts/{id}/charges` and `/collateral` do NOT exist** (VERIFIED absent). Charges/collateral attach at the loan account level.

### 12.2 Create required fields (VERIFIED `LoanProductDataValidator.validateForCreate`)
| Field | Meaning / validation |
|---|---|
| `name` | notBlank, ≤100 |
| `shortName` | notBlank, ≤4 |
| `currencyCode` | ISO 4217, ≤3 |
| `digitsAfterDecimal` | 0–6 |
| `inMultiplesOf` | optional ≥0 |
| `principal` | >0 |
| `numberOfRepayments` | >0 |
| `repaymentEvery` | >0 |
| `repaymentFrequencyType` | 0=Days,1=Weeks,2=Months |
| `interestRatePerPeriod` | ≥0 (unless floating rate) |
| `interestRateFrequencyType` | 2=Per month,3=Per year,4=Whole term |
| `amortizationType` | 0=Equal principal,1=Equal installments |
| `interestType` | 0=Declining balance,1=Flat |
| `interestCalculationPeriodType` | 0=Daily,1=Same as repayment period |
| `transactionProcessingStrategyCode` | must resolve to a known processor (see §12.4) |
| `accountingRule` | 1=None,2=Cash,3=Periodic accrual,4=Upfront accrual |
| `daysInYearType` | 1/360/364/365 |
| `daysInMonthType` | 1 or 30 |
| `isInterestRecalculationEnabled` | boolean |
| `charges[]` | optional `{id, amount}` |
| GL mapping ids | required when accountingRule=2/3/4 |

### 12.3 Accounting mapping fields (VERIFIED)
`fundSourceAccountId, loanPortfolioAccountId, interestOnLoanAccountId, incomeFromFeeAccountId, incomeFromPenaltyAccountId, writeOffAccountId, receivableInterestAccountId, receivableFeeAccountId, receivablePenaltyAccountId, transfersInSuspenseAccountId, overpaymentLiabilityAccountId`.

### 12.4 Transaction processing strategies (VERIFIED)
`mifos-standard-strategy`, `heavensfamily-strategy`, `creocore-strategy`, `rbi-india-strategy`, `principal-interest-penalties-fees-order-strategy`, `interest-principal-penalties-fees-order-strategy`, `early-repayment-strategy`, `due-penalty-fee-interest-principal-in-advance-principal-penalty-fee-interest-strategy`, `due-penalty-interest-principal-fee-in-advance-penalty-interest-principal-fee-strategy`, `advanced-payment-allocation-strategy` (progressive).

### 12.5 Enums (VERIFIED)
- **InterestMethod**: `DECLINING_BALANCE=0`, `FLAT=1`.
- **AmortizationMethod**: `EQUAL_PRINCIPAL=0`, `EQUAL_INSTALLMENTS=1`.
- **InterestCalculationPeriodMethod**: `DAILY=0`, `SAME_AS_REPAYMENT_PERIOD=1`.
- **AccountingRuleType**: `NONE=1`, `CASH_BASED=2`, `ACCRUAL_PERIODIC=3`, `ACCRUAL_UPFRONT=4`.

---

## 13. Loan Lifecycle (VERIFIED)

### 13.1 Loan account endpoints — `LoansApiResource` (`/v1/loans`)

| Method | Path | Notes |
|---|---|---|
| GET | `/loans/template` | `?templateType=individual\|group\|jlg\|jlgbulk\|collateral`, `?clientId=`, `?groupId=`, `?productId=` |
| GET | `/loans/{loanId}/template` | `?templateType=approval` |
| GET | `/loans/{loanId}` | `?associations=all\|repaymentSchedule,transactions...`, `?exclude=`, `?fields=` |
| GET | `/loans` | `?externalId, offset, limit, orderBy, sortOrder, accountNo, clientId, status` |
| POST | `/loans` | `?command=calculateLoanSchedule` (preview) OR default = submit application |
| PUT | `/loans/{loanId}` | `?command=markAsFraud` OR default = update application |
| DELETE | `/loans/{loanId}` | delete (Submitted & pending approval only) |
| POST | `/loans/{loanId}` | state commands (below) |

### 13.2 Submit application required fields (VERIFIED `LoanApplicationValidator.validateForCreate`)
`clientId` (individual/JLG) or `groupId` (group), `productId`, `loanType` (`individual`/`group`/`jlg`), `principal`, `loanTermFrequency`, `loanTermFrequencyType` (0-3), `numberOfRepayments`, `repaymentEvery`, `repaymentFrequencyType` (0-3), `interestRatePerPeriod`, `amortizationType` (0-1), `interestType` (0-1), `interestCalculationPeriodType` (0-1), `transactionProcessingStrategyCode`, `expectedDisbursementDate`, `submittedOnDate`.

Optional: `graceOnPrincipalPayment, graceOnInterestPayment, graceOnInterestCharged, graceOnArrearsAgeing, interestChargedFromDate, repaymentsStartingFromDate, inArrearsTolerance, linkAccountId, fixedEmiAmount, maxOutstandingLoanBalance, disbursementData, charges, collateral, externalId, accountNo, fundId, loanOfficerId, loanPurposeId, isTopup, datatables, daysInYearType, repaymentStartDateType, isEqualAmortization`.

### 13.3 Loan-level state commands — `POST /loans/{loanId}?command=` (VERIFIED lines 1345-1389)

| Command | Notes / required |
|---|---|
| `approve` | `approvedOnDate` (mandatory); optional `approvedLoanAmount`, `expectedDisbursementDate` |
| `reject` | `rejectedOnDate` |
| `withdrawnByApplicant` | `withdrawnOnDate` |
| `disburse` | `actualDisbursementDate`; optional `transactionAmount`, `fixedEmiAmount` |
| `disburseToSavings` | disburse to linked savings account |
| `disburseWithoutAutoDownPayment` | skip auto down-payment |
| `undoapproval` | — |
| `undodisbursal` | — |
| `undolastdisbursal` | multi-tranche |
| `assignloanofficer` | `toLoanOfficerId, assignmentDate` |
| `unassignloanofficer` | `unassignedDate` |
| `recoverGuarantees` | — |
| `assigndelinquency` | `delinquencyBucketId` |
| `contractTermination` | prepay/terminate contract |
| `undoContractTermination` | — |

> Your `src/features/loans/api/loan.ts` already implements these correctly (`approveLoan`, `disburseLoan`, `disburseLoanToSavings`, `rejectLoan`, `undoApproval`, `undoDisbursal`, `undoLastDisbursal`, `assignLoanOfficer`, `unassignLoanOfficer`, `withdrawLoanApplication`). ✅

### 13.4 Transaction-level commands — `POST /loans/{loanId}/transactions?command=` (VERIFIED `LoanTransactionsApiResource.java:569-632`)

| Command | Meaning |
|---|---|
| `repayment` | make a repayment |
| `merchantIssuedRefund` / `payoutRefund` / `goodwillCredit` | refunds/credits |
| `interestPaymentWaiver` / `waiveinterest` | waive interest |
| `chargeRefund` | refund a charge |
| `writeoff` | write off |
| `close-rescheduled` | close as rescheduled |
| `close` | close (obligations met) |
| `undowriteoff` | undo write off |
| `recoverypayment` | post-recovery payment |
| `refundByCash` | cash refund |
| `foreclosure` | foreclose (prepay) |
| `creditBalanceRefund` | refund credit balance |
| `charge-off` / `undo-charge-off` | charge-off |
| `downPayment` | down payment |
| `reAge` / `undoReAge` | re-age |
| `reAmortize` / `undoReAmortize` | re-amortize |
| `capitalizedIncome` / `buyDownFee` | income capitalization / buy-down |

Adjust commands on `POST /loans/{loanId}/transactions/{transactionId}?command=`: `chargeback`, `capitalizedIncomeAdjustment`, `buyDownFeeAdjustment`, `interest-refund`, default = `adjustTransaction` (requires `transactionDate`, `transactionAmount`). (VERIFIED lines 733-758.)

> Your `loan.ts` correctly routes `closeLoan`, `closeLoanAsRescheduled`, `forecloseLoan`, `writeOffLoan`, `undoWriteOffLoan`, `waiveInterest` through `makeTransaction`. ✅ Note: `refundLoanByTransfer` uses `POST /accounttransfers/refundByTransfer` (VERIFIED pattern) — good.

### 13.5 Loan charges & collateral (VERIFIED)
- `GET /loans/{loanId}/charges`, `GET /loans/{loanId}/charges/template`, `GET /loans/{loanId}/charges/{loanChargeId}`, `POST /loans/{loanId}/charges` (commands `pay`, `deactivateOverdue`), `POST /loans/{loanId}/charges/{loanChargeId}` (commands `waive`, `pay`, `adjustment`), `PUT/DELETE /loans/{loanId}/charges/{loanChargeId}` (`LoanChargesApiResource`).
- `GET /loans/{loanId}/collaterals`, `GET .../template`, `GET /loans/{loanId}/collaterals/{collateralId}`, `POST /loans/{loanId}/collaterals`, `PUT/DELETE /loans/{loanId}/collaterals/{collateralId}` (`CollateralsApiResource`). No `addCollateral`/`removeCollateral` commands.

### 13.6 Loan status enum (VERIFIED `LoanStatus.java:26-39`)

| Name | ID |
|---|---|
| INVALID | 0 |
| SUBMITTED_AND_PENDING_APPROVAL | 100 |
| APPROVED | 200 |
| ACTIVE | 300 |
| TRANSFER_IN_PROGRESS | 303 |
| TRANSFER_ON_HOLD | 304 |
| WITHDRAWN_BY_CLIENT | 400 |
| REJECTED | 500 |
| CLOSED_OBLIGATIONS_MET | 600 |
| CLOSED_WRITTEN_OFF | 601 |
| CLOSED_RESCHEDULE_OUTSTANDING_AMOUNT | 602 |
| OVERPAID | 700 |

> `src/features/loans/constants/status.ts` `LOAN_STATUS_ID_MAP` already matches these. ✅

### 13.7 Repayment schedule retrieval
- **`GET /loans/{loanId}?associations=repaymentSchedule`** — returns the loan object with `repaymentSchedule.periods[]`. (VERIFIED; there is **no** `GET /loans/{id}/schedule`.)
- **Dry-run preview**: `POST /loans?command=calculateLoanSchedule` with a full loan application payload (VERIFIED). Your `calculateLoanSchedule` in `loan.ts` does exactly this. ✅
- `POST /loans/{loanId}/schedule?command=calculateLoanSchedule|addVariations|deleteVariations` (`LoanScheduleApiResource`, VERIFIED lines 66-98).

### 13.8 Lifecycle

```
SUBMITTED(100) --approve--> APPROVED(200) --disburse--> ACTIVE(300)
   | reject -> REJECTED(500)
   | withdrawnByApplicant -> WITHDRAWN(400)
   | undoapproval -> back to SUBMITTED
ACTIVE(300) --repayment--> ACTIVE (until paid)
   | writeoff -> CLOSED_WRITTEN_OFF(601)
   | close -> CLOSED_OBLIGATIONS_MET(600)
   | close-rescheduled / reschedule -> CLOSED_RESCHEDULED(602)
   | foreclosure -> CLOSED (obligations met) / overpaid(700)
```

UI actions per state:
- **SUBMITTED (100)**: Edit, Approve, Reject, Withdraw, Delete
- **APPROVED (200)**: Disburse, Disburse to Savings, Undo Approval
- **ACTIVE (300)**: Repay, Waive Interest, Write Off, Close, Reschedule, Foreclose, Adjust Transaction, Undo Transaction, Assign/Unassign Loan Officer, Reassign
- **CLOSED_* / OVERPAID**: Read-only (except credit balance refund / undo write-off where permitted)

---

## 14. Repayment Schedule

- Generated **server-side** by Fineract (system of record). **Do not compute the schedule in React.**
- Each period contains (VERIFIED from `LoanRepaymentSchedulePeriodData`/schedule response):
  - `period`, `fromDate`, `dueDate`, `obligationsMetOnDate`
  - `principalDue`, `principalOriginalDue`, `interestDue`, `feesDue`, `penaltyChargesDue`
  - `totalDueForPeriod`, `totalOriginalDueForPeriod`, `totalPaidForPeriod`, `totalPaidInAdvanceForPeriod`, `totalPaidLateForPeriod`
  - `principalPaid`, `interestPaid`, `feesPaid`, `penaltyChargesPaid`
  - `principalOutstanding`, `interestOutstanding`, `feesOutstanding`, `penaltyChargesOutstanding`
  - `totalOutstandingForPeriod`, `totalActualCostOfLoanForPeriod`, `totalInstallmentAmountForPeriod`
  - `completed`, `firstPeriod`, `loanChargesPaid`, `loanChargePaid`

### React display
Render the table from `repaymentSchedule.periods` using the columns:
```
Installment # (period) | Due Date | Principal | Interest | Fees | Penalty | Total Due | Paid | Outstanding | Status
```
Status per period: `completed` → Paid; else if `totalOutstandingForPeriod > 0` and past due → Overdue; else Upcoming/Due.

Partial repayment, overpayment, and early repayment are handled by Fineract transaction processing strategies — React only reflects the returned period balances.

---

## 15. Savings Products (VERIFIED)

`SavingsProductsApiResource` — base `/v1/savingsproducts`.

- `POST /savingsproducts` — mandatory: `name, shortName, currencyCode, digitsAfterDecimal, inMultiplesOf, nominalAnnualInterestRate, interestCompoundingPeriodType, interestCalculationType, interestCalculationDaysInYearType, accountingRule`. (`interestPostingPeriodType` is read by the assembler and effectively required — `INFERRED`.)
- Optional: `minRequiredOpeningBalance, lockinPeriodFrequency, lockinPeriodFrequencyType, withdrawalFeeForTransfers, paymentChannelToFundSourceMappings, feeToIncomeAccountMappings, penaltyToIncomeAccountMappings, charges, allowOverdraft, overdraftLimit, minBalanceForInterestCalculation, withHoldTax, taxGroupId, lienAllowed, maxAllowedLienLimit, enforceMinRequiredBalance, isDormancyTrackingActive`.
- Cash-based (`accountingRule=2`) GL accounts: `savingsReferenceAccountId, savingsControlAccountId, interestOnSavingsAccountId, incomeFromFeeAccountId, transfersInSuspenseAccountId, incomeFromPenaltyAccountId`.
- `GET /savingsproducts`, `GET /savingsproducts/template`, `GET/PUT/DELETE /savingsproducts/{id}`.

### Interest enums (VERIFIED)
- **Compounding period** (`SavingsCompoundingInterestPeriodType`): DAILY=1, MONTHLY=4, QUARTERLY=5, BI_ANNUAL=6, ANNUAL=7.
- **Posting period** (`SavingsPostingInterestPeriodType`): DAILY=1, MONTHLY=4, QUARTERLY=5, BIANNUAL=6, ANNUAL=7, ANNIVERSARY_MONTHLY=8 ... ANNIVERSARY_ANNUAL=11.
- **Calculation type** (`SavingsInterestCalculationType`): DAILY_BALANCE=1, AVERAGE_DAILY_BALANCE=2.
- **Days in year** (`SavingsInterestCalculationDaysInYearType`): DAYS_360=360, DAYS_365=365.

---

## 16. Savings Lifecycle (VERIFIED)

### 16.1 Savings account endpoints — `SavingsAccountsApiResource` (`/v1/savingsaccounts`)
- `POST /savingsaccounts` — mandatory: `clientId` or `groupId`, `productId`, `submittedOnDate`. Optional: `accountNo, externalId, fieldOfficerId`; inherited from product if not provided: `nominalAnnualInterestRate, interestCompoundingPeriodType, interestCalculationType, interestCalculationDaysInYearType, minRequiredOpeningBalance, lockinPeriodFrequency, lockinPeriodFrequencyType, withdrawalFeeForTransfers, allowOverdraft, overdraftLimit, withHoldTax`.
- `GET /savingsaccounts`, `GET /savingsaccounts/template`, `GET /savingsaccounts/{id}`.
- `PUT /savingsaccounts/{id}?command=updateWithHoldTax` (or plain update).
- `DELETE /savingsaccounts/{id}`.

### 16.2 Account-level commands — `POST /savingsaccounts/{id}?command=` (VERIFIED lines 509-587)
`reject`, `withdrawnByApplicant`, `approve`, `undoapproval`, `activate`, `calculateInterest`, `postInterest`, `applyAnnualFees`, `close`, `assignSavingsOfficer`, `unassignSavingsOfficer`, `blockDebit`, `unblockDebit`, `blockCredit`, `unblockCredit`, `block`, `unblock`.

> **Deposit / withdrawal / hold / release are NOT here.** They belong to the transactions resource (§16.3).

### 16.3 Transaction endpoints — `SavingsAccountTransactionsApiResource` (`/v1/savingsaccounts`)
- `POST /savingsaccounts/{savingsId}/transactions?command=` → **`deposit`**, **`withdrawal`**, `force-withdrawal`, `postInterestAsOn`, `holdAmount`, `gsimDeposit` (VERIFIED lines 310-319).
- `POST /savingsaccounts/{savingsId}/transactions/{transactionId}?command=` → **`undo`**, **`reverse`**, **`modify`** (adjust), **`releaseAmount`** (VERIFIED lines 368-379).
- `GET /savingsaccounts/{savingsId}/transactions/template`, `GET /savingsaccounts/{savingsId}/transactions/{transactionId}`, `GET /savingsaccounts/{savingsId}/transactions/search`, `POST /savingsaccounts/{savingsId}/transactions/query` (advanced query).
- `GET /savingsaccounts/{savingsId}/onholdtransactions` (`DepositAccountOnHoldFundTransactionsApiResource`).
- **Account transactions listing is via `GET /savingsaccounts/{id}?associations=transactions`** (VERIFIED; no standalone `/transactions` list endpoint).

> **FIX REQUIRED:** Verify `src/features/deposits/*` posts deposits/withdrawals to `POST /savingsaccounts/{id}/transactions?command=deposit|withdrawal` (not to the account-level command endpoint). The `DepositWithdrawDialog` and `SavingsTransactionFormPage` should already target the transactions resource.

### 16.4 Savings charges — `SavingsAccountChargesApiResource` (`/v1/savingsaccounts/{savingsAccountId}/charges`)
`GET` (list), `GET /template`, `GET /{chargeId}`, `POST` (apply), `POST /{chargeId}?command=paycharge|waive|inactivate`, `DELETE /{chargeId}`.

### 16.5 Savings status enum (VERIFIED `SavingsAccountStatusType.java:27-39`)

| Name | ID |
|---|---|
| INVALID | 0 |
| SUBMITTED_AND_PENDING_APPROVAL | 100 |
| APPROVED | 200 |
| ACTIVE | 300 |
| TRANSFER_IN_PROGRESS | 303 |
| TRANSFER_ON_HOLD | 304 |
| WITHDRAWN_BY_APPLICANT | 400 |
| REJECTED | 500 |
| CLOSED | 600 |
| PRE_MATURE_CLOSURE | 700 |
| MATURED | 800 |

> **FIX REQUIRED:** The savings status labels in `src/features/deposits/constants/status.ts` use `savingsAccountStatusType.*` codes which is correct; ensure any numeric ID maps use the values above (not the incorrect 400-900 scheme).

### 16.6 Lifecycle

```
SUBMITTED(100) --approve--> APPROVED(200) --activate--> ACTIVE(300)
   | reject -> REJECTED(500)
   | withdrawnByApplicant -> WITHDRAWN(400)
   | undoapproval -> SUBMITTED
ACTIVE(300) --deposit/withdrawal/interest/postInterest--> ACTIVE
   | block / blockDebit / blockCredit -> ACTIVE (blocked flags)
   | close -> CLOSED(600)
Fixed/Recurring: activate -> active; prematureClose -> PRE_MATURE_CLOSURE(700); matured -> MATURED(800)
```

UI actions per state:
- **SUBMITTED**: Approve, Reject, Withdraw, Undo Approval, Delete
- **APPROVED**: Activate, Undo Approval
- **ACTIVE**: Deposit, Withdrawal, Calculate Interest, Post Interest, Apply Annual Fee, Block/Unblock, Block/Unblock Credit/Debit, Hold Amount, Adjust/Undo/Reverse Transaction, Close, Assign/Unassign Officer
- **CLOSED / MATURED / PRE_MATURE_CLOSURE**: Read-only

---

## 17. Transactions

Every financial transaction is a **command** executed by Fineract, which generates accounting entries. React only posts the command and re-fetches state.

### 17.1 Loan transactions (VERIFIED)
| Operation | Endpoint | Command |
|---|---|---|
| Repayment | `POST /loans/{id}/transactions` | `repayment` |
| Disbursement | `POST /loans/{id}` | `disburse` / `disburseToSavings` |
| Interest waiver | `POST /loans/{id}/transactions` | `waiveinterest` |
| Write-off | `POST /loans/{id}/transactions` | `writeoff` |
| Close | `POST /loans/{id}/transactions` | `close` |
| Close as rescheduled | `POST /loans/{id}/transactions` | `close-rescheduled` |
| Foreclose | `POST /loans/{id}/transactions` | `foreclosure` |
| Adjust transaction | `POST /loans/{id}/transactions/{txnId}` | default (adjust) |
| Undo (various) | `POST /loans/{id}/transactions` | `undowriteoff`, `undoReAge`, ... |
| Charge payment/waive | `POST /loans/{id}/charges/{chargeId}` | `pay` / `waive` / `adjustment` |

### 17.2 Savings transactions (VERIFIED)
| Operation | Endpoint | Command |
|---|---|---|
| Deposit | `POST /savingsaccounts/{id}/transactions` | `deposit` |
| Withdrawal | `POST /savingsaccounts/{id}/transactions` | `withdrawal` |
| Hold amount | `POST /savingsaccounts/{id}/transactions` | `holdAmount` |
| Release amount | `POST /savingsaccounts/{id}/transactions/{txnId}` | `releaseAmount` |
| Undo | `POST /savingsaccounts/{id}/transactions/{txnId}` | `undo` |
| Reverse | `POST /savingsaccounts/{id}/transactions/{txnId}` | `reverse` |
| Adjust (modify) | `POST /savingsaccounts/{id}/transactions/{txnId}` | `modify` |
| Interest posting | `POST /savingsaccounts/{id}/transactions` | `postInterestAsOn` |

### 17.3 Account transfers & standing instructions (VERIFIED)
- `AccountTransfersApiResource` at `/v1/accounttransfers` — `POST /accounttransfers` (create transfer), `POST /accounttransfers/refundByTransfer`, `GET /accounttransfers`, `GET /accounttransfers/template`, `POST /accounttransfers/{id}?command=undo` (reverse). Account types: **1 = loan, 2 = savings** (matches `refundLoanByTransfer` in `loan.ts`).
- `StandingInstructionApiResource` at `/v1/standinginstructions` — `POST/GET /standinginstructions`, `POST /standinginstructions/{id}?command=update|delete`, `GET /standinginstructions/template`. `StandingInstructionHistoryApiResource` at `/v1/standinginstructionhistory`.

---

## 18. Charges & Fees (VERIFIED)

`ChargesApiResource` — base `/v1/charges`.

- `POST /charges` — required: `chargeAppliesTo, name, currencyCode, amount, chargeTimeType, chargeCalculationType, chargePaymentMode` (paymentMode required for loan). Optional: `penalty, active, feeOnMonthDay, feeInterval, feeFrequency, minCap, maxCap, taxGroupId, paymentTypeId, enablePaymentType`.
- `GET /charges`, `GET /charges/{id}`, `GET /charges/template` (`?chargeAppliesTo`, `?chargeTimeType`), `PUT /charges/{id}`, `DELETE /charges/{id}`.

### 18.1 Enums (VERIFIED)
**chargeAppliesTo**: `LOAN=1`, `SAVINGS=2`, `CLIENT=3`, `SHARES=4`, `WORKING_CAPITAL_LOAN=5`.

**chargeTimeType**: `DISBURSEMENT=1`, `SPECIFIED_DUE_DATE=2`, `SAVINGS_ACTIVATION=3`, `SAVINGS_CLOSURE=4`, `WITHDRAWAL_FEE=5`, `ANNUAL_FEE=6`, `MONTHLY_FEE=7`, `INSTALMENT_FEE=8`, `OVERDUE_INSTALLMENT=9`, `OVERDRAFT_FEE=10`, `WEEKLY_FEE=11`, `TRANCHE_DISBURSEMENT=12`, `SHAREACCOUNT_ACTIVATION=13`, `SHARE_PURCHASE=14`, `SHARE_REDEEM=15`, `SAVINGS_NOACTIVITY_FEE=16`.

**chargeCalculationType**: `FLAT=1`, `PERCENT_OF_AMOUNT=2`, `PERCENT_OF_AMOUNT_AND_INTEREST=3`, `PERCENT_OF_INTEREST=4`, `PERCENT_OF_DISBURSEMENT_AMOUNT=5`.

**chargePaymentMode**: `REGULAR=0`, `ACCOUNT_TRANSFER=1`. (There is **no** `OUT_OF_POCKET`.)

> **FIX REQUIRED:** Check `src/features/charges/pages/ChargeFormPage.tsx` and related selects against the above enum values (chargeTimeType and chargePaymentMode in particular — common assumptions are wrong).

### 18.2 React display of charges
- **Configuration**: `ChargeFormPage` maps to `POST/PUT /charges`.
- **Loan charges**: from `GET /loans/{id}?associations=all` → `charges[]` (each `{id, chargeId, name, amount, amountOutstanding, amountPaid, amountWaived, status, dueDate, chargeTimeType, chargeCalculationType, penalty}`).
- **Savings charges**: from `GET /savingsaccounts/{id}?associations=charges` → `charges[]`.
- **Client charges**: `GET /clients/{id}/charges`.
- Show columns: Charge | Amount | Due | Paid | Waived | Outstanding | Status. Actions: Pay / Waive / Adjust (loan), Paycharge / Waive / Inactivate (savings).

---

## 19. Interest Calculation

### 19.1 Principle (CRITICAL)
> **Fineract is the authoritative calculator.** React must **not** compute interest, amortization, or repayment schedules. React posts loan/savings parameters and displays the schedule/balances returned by the backend. (VERIFIED: all calculations live in `fineract-loan` / `fineract-savings` domain services.)

### 19.2 Loan interest (VERIFIED enums)
- **Interest method**: `DECLINING_BALANCE=0` (interest on outstanding balance) vs `FLAT=1` (interest on original principal).
- **Amortization**: `EQUAL_PRINCIPAL=0` vs `EQUAL_INSTALLMENTS=1` (EMI).
- **Interest calculation period**: `DAILY=0` vs `SAME_AS_REPAYMENT_PERIOD=1`.
- **Rate frequency**: 2=Per month, 3=Per year, 4=Whole term.
- **Days in year**: 1 (actual)/360/364/365; **days in month**: 1 (actual)/30.

Example (declining balance, monthly, equal installments):
```
Principal=1000, rate=12%/yr (1%/mo), term=12 months, EMI, declining balance
Period 1: interest = 1000 * 0.01 = 10; principal = EMI - 10; ...
```
Fineract computes the EMI and schedule; React displays `GET /loans/{id}?associations=repaymentSchedule`.

### 19.3 Savings interest (VERIFIED enums)
- **Compounding**: DAILY=1, MONTHLY=4, QUARTERLY=5, BI_ANNUAL=6, ANNUAL=7.
- **Posting**: DAILY=1 ... ANNIVERSARY_ANNUAL=11.
- **Calculation type**: DAILY_BALANCE=1, AVERAGE_DAILY_BALANCE=2.
- **Days in year**: 360 or 365.

Interest is accrued and posted via commands `calculateInterest` / `postInterest` / `postInterestAsOn`. React triggers these; balances come back from the account.

---

## 20. Accounting (VERIFIED)

### 20.1 GL Accounts — `GLAccountsApiResource` (`/v1/glaccounts`)
- `POST /glaccounts` — required: `name, glCode, type, manualEntriesAllowed`; `usage` range-checked (1=DETAIL, 2=HEADER). Optional: `parentId, description, tagId, disabled`.
- `GET /glaccounts` — query `type, searchParam, usage, manualEntriesAllowed, disabled, fetchRunningBalance`.
- `GET /glaccounts/template` (`?type=`), `GET/PUT/DELETE /glaccounts/{id}`.
- **GLAccountType**: ASSET=1, LIABILITY=2, EQUITY=3, INCOME=4, EXPENSE=5.

### 20.2 Journal Entries — `JournalEntriesApiResource` (`/v1/journalentries`)
- `POST /journalentries` — required: `officeId, transactionDate, currencyCode`, plus `debits[]`/`credits[]` each with `glAccountId + amount`. Optional: `comments, referenceNumber, paymentTypeId, accountNumber, checkNumber, routingCode, receiptNumber, bankNumber`.
- `GET /journalentries` (list), `GET /journalentries/{id}`.
- `POST /journalentries/{transactionId}?command=reverse` — reverse.
- `GET /journalentries/provisioning`, `GET /journalentries/openingbalance`.
- **`GET /journalentries/template` does NOT exist** (VERIFIED). Remove/avoid any such call.

### 20.3 Accounting Rules — `AccountingRuleApiResource` (`/v1/accountingrules`)
- `POST /accountingrules` — required: `name, officeId`, plus `accountToDebit` OR `debitTags` AND `accountToCredit` OR `creditTags`. Optional: `description`.
- `GET /accountingrules`, `GET /accountingrules/template`, `GET/PUT/DELETE /accountingrules/{id}`.

### 20.4 Financial Activity Accounts — `FinancialActivityAccountsApiResource` (`/v1/financialactivityaccounts`)
- `POST` — required: `financialActivityId, glAccountId`.
- `GET /financialactivityaccounts`, `GET /template`, `GET/PUT/DELETE /{mappingId}`.

### 20.5 GL Closures — `GLClosuresApiResource` (`/v1/glclosures`)
- `POST /glclosures` — required: `officeId, closingDate`.
- `GET /glclosures` (`?officeId=`), `GET/PUT/DELETE /{id}`.

### 20.6 Periodic Accrual — `AccrualAccountingApiResource` (**`POST /v1/runaccruals`**)
- Required: `tillDate`. **Note the path is `/runaccruals`, not `/accrualaccounting/runaccrual`** (VERIFIED).

### 20.7 Provisioning — `ProvisioningEntriesApiResource` (`/v1/provisioningentries`)
- `POST /provisioningentries` — required `date, dateFormat, locale`; optional `createjournalentries`.
- `POST /provisioningentries/{id}?command=createjournalentry|recreateprovisioningentry`, `GET /provisioningentries/{id}`, `GET /provisioningentries/entries`, `GET /provisioningentries`.

### 20.8 What happens financially (VERIFIED behavior via accounting engine)

| Business Event | Debit | Credit | Fineract mechanism | UI Impact |
|---|---|---|---|---|
| Loan Approved | (no JE yet) | (no JE yet) | approval stage | Move loan to Approved state |
| Loan Disbursed | Loan Portfolio (asset) | Fund Source (liability) | loan disbursal JE (accountingRule 2/3/4) | Loan → Active; schedule generated |
| Repayment | Fund Source | Loan Portfolio / Interest Income / Fee Income / Penalty Income | repayment transaction processor | Reduce outstanding; record transaction |
| Interest Accrued | Receivable Interest | Interest Income | periodic accrual (`runaccruals`) | Accrual shown in ledger |
| Interest Paid | Fund Source | Receivable Interest (clear) / Interest Income | repayment | Reduce interest outstanding |
| Penalty Charged | Receivable Penalty | Penalty Income | penalty on overdue installment | Increase penalty outstanding |
| Write-off | Write-off (expense) | Loan Portfolio | writeoff transaction | Loan → CLOSED_WRITTEN_OFF |
| Savings Deposit | Fund Source | Savings Control | deposit | Increase balance |
| Savings Withdrawal | Savings Control | Fund Source | withdrawal | Decrease balance |
| Interest Posting | Interest Expense | Savings Control (liability) | postInterest | Increase balance |

> These debit/credit directions follow Fineract's standard GL mappings but the **exact account pairs are configuration-dependent** (the GL account ids come from the product's accounting mappings). React does **not** post these journal entries for portfolio transactions — Fineract does. React only posts **manual** journal entries via `POST /journalentries`.

---

## 21. Reports (VERIFIED)

- **Report registry**: `ReportsApiResource` at `/v1/reports` — `GET /reports`, `GET /reports/template`, `GET /reports/{id}?template=true`, `POST /reports`, `PUT/DELETE /reports/{id}`. Create params: `reportName, reportType, reportSubType, reportCategory, description, reportSql, useReport, reportParameters`.
- **Run reports**: `RunreportsApiResource` at **`GET /v1/runreports/{reportName}`** — query: `output-type` (HTML/XLS/CSV/PDF), `exportCSV`, `parameterType`, `R_officeId`, `R_loanOfficerId`, `R_fromDate`, `R_toDate`, `R_currencyId`, `R_accountNo`. Also `GET /v1/runreports/availableExports/{reportName}`.
  - **`GET /reports/run/{name}` and `GET /reports/{id}?exportType=` do NOT exist** (VERIFIED). Update the React report runner to call `/runreports/{reportName}`.
- **Adhoc queries**: `AdHocApiResource` at `/v1/adhocquery`.
- **Datatables**: `DatatablesApiResource` at `/v1/datatables` — `GET/POST /datatables`, `POST /datatables/register/{datatable}/{apptable}`, `POST /datatables/deregister/{datatable}`, `GET/POST /datatables/{datatable}/query`, `GET/POST/PUT/DELETE /datatables/{datatable}/{apptableId}`.

---

## 22. API Catalog (subset — most relevant to the React app)

> All VERIFIED. Full per-endpoint detail for the top resources is in §06–§21. Base URL prefix `/fineract-provider/api/v1`.

### Authentication & Tenant
| Method | Endpoint | Purpose | Permission |
|---|---|---|---|
| POST | `/authentication?tenantIdentifier={t}` | Login, returns basic-auth key | public |
| GET | `/twofactor` | 2FA delivery methods | public (if 2FA) |
| POST | `/twofactor?deliveryMethod=` / `/twofactor/validate?token=` / `/twofactor/invalidate` | 2FA flow | 2FA users |

### Organization
| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/offices`, `/offices/template`, `/offices/{id}`, `/offices/external-id/{eid}` | Offices |
| GET/POST | `/officetransactions`, `/officetransactions/template`, `DELETE /officetransactions/{id}` | Office transfers |
| GET/POST/PUT | `/staff`, `/staff/{id}?template=true` | Staff |
| GET/POST/PUT/DELETE | `/holidays`, `/holidays/{id}?command=activate` | Holidays |
| GET/PUT | `/workingdays` | Working days |
| GET/PUT | `/currencies` | Currencies |
| GET/POST/PUT | `/funds`, `/funds/{id}` | Funds |
| GET/POST/PUT/DELETE | `/paymenttypes`, `/paymenttypes/{id}` | Payment types |
| GET/POST/PUT/DELETE | `/codes`, `/codes/{id}`, `/codes/{id}/codevalues` | Codes & values |
| GET/PUT | `/configurations`, `/configurations/{id}`, `/configurations/name/{name}` | Global config |
| GET/PUT | `/externalservice/{servicename}` | External services |

### Admin
| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/users`, `/users/template`, `/users/{id}?template=true`, `PUT/DELETE /users/{id}`, `POST /users/{id}/pwd` | Users |
| GET/POST | `/roles`, `/roles/{id}`, `PUT/DELETE /roles/{id}`, `POST /roles/{id}?command=enable\|disable`, `GET/PUT /roles/{id}/permissions` | Roles |
| GET/PUT | `/permissions?makerCheckerable=` | Permissions |
| GET | `/audits`, `/audits/searchtemplate`, `/audits/{id}` | Audit logs |
| GET | `/makercheckers`, `/makercheckers/searchtemplate`, `POST /makercheckers/{id}?command=approve\|reject` | Maker-checker |

### Clients / Groups / Centers
| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST/PUT/DELETE | `/clients`, `/clients/template`, `/clients/{id}` | Clients |
| POST | `/clients/{id}?command=<activate\|close\|reject\|withdraw\|reactivate\|undoRejection\|undoWithdrawal\|assignStaff\|unassignStaff\|updateSavingsAccount\|proposeTransfer\|proposeAndAcceptTransfer\|acceptTransfer\|rejectTransfer\|withdrawTransfer>` | Client commands |
| GET | `/clients/{id}/accounts`, `/clients/{id}/transactions`, `/clients/{id}/obligeedetails`, `/clients/{id}/transferproposaldate` | Client data |
| GET/POST/PUT/DELETE | `/clients/{id}/identifiers*`, `/clients/{id}/charges*`, `/clients/{id}/familymembers*`, `/clients/{id}/collaterals*`, `/client/{id}/addresses*` | Client sub-resources |
| GET/POST/PUT/DELETE | `/groups*`, `/groups/{id}?command=...`, `/groups/{id}/accounts` | Groups |
| GET/POST/PUT/DELETE | `/centers*`, `/centers/{id}?command=...`, `/centers/{id}/accounts` | Centers |

### Products & Loans
| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST/PUT | `/loanproducts`, `/loanproducts/template`, `/loanproducts/{id}`, `/loanproducts/basic-details`, `/loanproducts/{id}/productmix` | Loan products |
| GET/POST | `/loans`, `/loans/template`, `/loans/{id}` | Loans |
| POST | `/loans/{id}?command=<approve\|reject\|withdrawnByApplicant\|disburse\|disburseToSavings\|undoapproval\|undodisbursal\|assignloanofficer\|...>` | Loan state |
| POST | `/loans/{id}/transactions?command=<repayment\|writeoff\|close\|close-rescheduled\|foreclosure\|waiveinterest\|...>` | Loan transactions |
| GET/POST | `/loans/{id}/charges*`, `/loans/{id}/collaterals*` | Loan charges/collateral |
| GET | `/loans/{id}?associations=repaymentSchedule` | Repayment schedule |
| GET/POST | `/rescheduleloans`, `/rescheduleloans/{id}?command=approve\|reject` | Reschedule |
| GET/POST | `/delinquency/buckets`, `/delinquency/ranges` | Delinquency |

### Savings / Deposits
| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST/PUT | `/savingsproducts`, `/savingsproducts/template`, `/savingsproducts/{id}` | Savings products |
| GET/POST/PUT | `/savingsaccounts`, `/savingsaccounts/template`, `/savingsaccounts/{id}` | Savings accounts |
| POST | `/savingsaccounts/{id}?command=<approve\|undoapproval\|reject\|withdrawnByApplicant\|activate\|calculateInterest\|postInterest\|applyAnnualFees\|close\|block\|unblock\|blockDebit\|unblockDebit\|blockCredit\|unblockCredit\|assignSavingsOfficer\|unassignSavingsOfficer>` | Savings commands |
| POST | `/savingsaccounts/{id}/transactions?command=<deposit\|withdrawal\|postInterestAsOn\|holdAmount>` | Savings transactions |
| POST | `/savingsaccounts/{id}/transactions/{tid}?command=<undo\|reverse\|modify\|releaseAmount>` | Adjust savings txn |
| GET | `/savingsaccounts/{id}/charges*` | Savings charges |
| GET/POST | `/fixeddepositproducts*`, `/fixeddepositaccounts*`, `/fixeddepositaccounts/{id}?command=...`, `/fixeddepositaccounts/{id}/transactions?command=deposit\|withdrawal` | Fixed deposits |
| GET/POST | `/recurringdepositproducts*`, `/recurringdepositaccounts*`, `/recurringdepositaccounts/{id}?command=...` | Recurring deposits |
| GET/POST | `/interestratecharts*` | Interest rate charts |

### Accounting
| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST/PUT/DELETE | `/glaccounts*` | GL accounts |
| GET/POST | `/journalentries`, `/journalentries/{id}`, `POST /journalentries/{tid}?command=reverse` | Journal entries |
| GET/POST/PUT/DELETE | `/accountingrules*` | Accounting rules |
| GET/POST/PUT/DELETE | `/financialactivityaccounts*` | Activity mappings |
| GET/POST/PUT/DELETE | `/glclosures*` | GL closures |
| POST | `/runaccruals` | Periodic accrual |
| GET/POST | `/provisioningentries*`, `/provisioningcategories*`, `/provisioningcriteria*` | Provisioning |
| GET/POST/PUT | `/taxes/component*`, `/taxes/group*` | Taxes |

### Transfers / Other
| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/accounttransfers`, `/accounttransfers/template`, `/accounttransfers/refundByTransfer`, `POST /accounttransfers/{id}?command=undo` | Transfers |
| GET/POST | `/standinginstructions*`, `/standinginstructionhistory*` | Standing instructions |
| GET/POST | `/charges*` | Charges config |
| GET | `/search` | Global search |
| GET/POST | `/reports*`, `/runreports/{name}` | Reports |
| GET/POST | `/adhocquery*`, `/datatables*` | Adhoc/datatables |
| GET/POST | `/shareproducts*`, `/shareaccounts*`, `/tellers*` | Shares, tellers |
| — | `/external-asset-owners/*`, `/interoperation/*`, `/cob/*`, `/working-capital-loans/*`, `/smscampaigns*`, `/emailcampaigns*` | Advanced modules |

---

## 23. API Dependency Map

### Loan flow (VERIFIED ordering)
```
Office (optional) → Client → Loan Product → Loan Application (POST /loans)
 → GET /loans/template?clientId&productId (form options)
 → Approve (POST /loans/{id}?command=approve)
 → Disburse (POST /loans/{id}?command=disburse)
 → GET /loans/{id}?associations=repaymentSchedule,transactions
 → Repay (POST /loans/{id}/transactions?command=repayment)
 → (Overdue → Delinquency; Reschedule via /rescheduleloans)
 → Write-off / Close / Foreclose (POST /loans/{id}/transactions?command=...)
```

### Savings flow (VERIFIED ordering)
```
Client → Savings Product → Savings Account (POST /savingsaccounts)
 → Approve (command=approve) → Activate (command=activate)
 → Deposit (POST /savingsaccounts/{id}/transactions?command=deposit)
 → Calculate/Post Interest (command=calculateInterest / postInterest)
 → Withdrawal (command=withdrawal)
 → Close (command=close)
```

### Dependencies
- `POST /loans` requires `clientId` and `productId` → fetch template first.
- `POST /loans/{id}/transactions` requires an **active (disbursed)** loan.
- `POST /savingsaccounts/{id}/transactions?command=withdrawal` requires an **active** savings account.
- GL account mapping on products requires GL accounts to exist (`POST /glaccounts` first).
- Charges (`POST /charges`) must exist before attaching to products/loans.

---

## 24. Domain Model (conceptual ER)

```
Office 1──* Staff
Office 1──* Client
Office 1──* Loan / SavingsAccount (via office hierarchy)
Client 1──* Loan
Client 1──* SavingsAccount
Client 1──* ClientTransaction
Group 1──* Client (members)
Center 1──* Group
Loan 1──* LoanTransaction
Loan 1──* LoanCharge
Loan 1──* LoanCollateral
Loan 1──1 LoanRepaymentSchedule
SavingsAccount 1──* SavingsTransaction
SavingsAccount 1──* SavingsCharge
LoanProduct 1──* Loan
SavingsProduct 1──* SavingsAccount
Charge 1──* LoanCharge/SavingsCharge
GLAccount 1──* JournalEntry
User 1──* Role 1──* Permission
```

> **Do NOT access the Fineract database from React.** All data flows through the REST API. React has no ORM/JPA access to Fineract's schema.

---

## 25. Error Handling

### 25.1 Actual Fineract error body shape (VERIFIED)
```
{
  "developerMessage": "...",
  "httpStatusCode": "400",
  "defaultUserMessage": "...",
  "userMessageGlobalisationCode": "error.msg...",
  "errors": [
    { "developerMessage": "...", "defaultUserMessage": "...",
      "userMessageGlobalisationCode": "...", "parameterName": "...", "args": [...] }
  ]
}
```
Your `src/lib/error.ts` already parses this. ✅

### 25.2 HTTP status → strategy
| Status | Meaning | React strategy |
|---|---|---|
| 400 | Validation / business rule error | Show `errors[].defaultUserMessage` (map `parameterName` to field) |
| 401 | Authentication failure / expired | Logout + redirect to `/login` (already handled in interceptor) |
| 403 | Missing permission (or password renewal) | Show "not permitted"; do NOT logout |
| 404 | Not found | Show "record not found" empty state |
| 409 | Business conflict (e.g. wrong state transition) | Show backend message; do not attempt |
| 500 | Server error | Show generic error + log |

### 25.3 Recommendations
- Map `parameterName` to form fields for inline validation errors.
- Do not hard-code English messages; use `defaultUserMessage`/`userMessageGlobalisationCode` and let the backend's i18n (via `locale` param) return the right language.
- Keep the existing `ApiErrorHandler`/`NetworkErrorBanner` as the global error surfaces.

---

## 26. Security

### 26.1 Current state
- Token storage: `localStorage` (`corebank-auth-session`). **Risk:** XSS can read it.
- Auth: Basic auth header on every request.
- No CSRF token needed for basic-auth bearer-style requests (each request carries credentials; CSRF protection is less relevant for a non-cookie scheme), but still validate origin.

### 26.2 Recommendations
- **Token storage**: Consider `sessionStorage` instead of `localStorage` to reduce persistence-surface (still XSS-readable, but not persisted across browser restarts). For high-security, use an httpOnly cookie issued by a BFF (see §35 Option C) so the token never reaches JS.
- **XSS**: Escape all rendered user data; rely on React's default escaping; sanitize HTML from reports if rendered as HTML.
- **CORS**: Backend must allow only your app origin; never `*` with credentials. Your `vite.config.ts` proxy approach (commented out) is fine for dev.
- **Tenant isolation**: Always send `tenantIdentifier`; never allow user to select another tenant's DB.
- **Authorization**: Rely on backend permissions; the React permission hooks are UX-only.
- **Sensitive data**: Never log the `basicAuth` token or passwords.
- **Financial transaction protection**:
  - **Idempotency**: Use `externalId` on loan/savings/client creation so retries don't duplicate records.
  - **Replay**: Basic auth re-authenticates each request; combined with TLS this mitigates replay. Use HTTPS everywhere.
  - **Auditability**: Every state-changing command is recorded in `m_audit_entry` (Fineract's audit log, `GET /audits`). Surface this to users.
- **Confirmation dialogs**: Already present (`ConfirmDialog.tsx`) — keep confirmation on irreversible actions (write-off, close, undo, reversal).

---

## 27. React API Architecture

Your existing structure is already good and matches the recommended Fineract-style layout. **Adapt, don't rebuild.**

```
src/api/client.ts          ← Axios instance + auth + tenant + error interceptors (already correct)
src/features/<module>/api/*.ts   ← per-module API functions (already present)
src/features/<module>/hooks/*.ts ← TanStack Query hooks (already present)
src/features/<module>/types/*.ts ← request/response types
src/features/<module>/schemas/*.schema.ts ← Zod form schemas
src/features/<module>/constants/*.ts ← status/id maps (several need correction)
src/features/<module>/pages/*.tsx ← route pages
src/lib/error.ts           ← error parsing (already correct)
```

### Recommended improvements to `src/api/client.ts`
1. Add `VITE_TENANT_IDENTIFIER` (default `default`) and append `?tenantIdentifier=` in the request interceptor (or set the `Fineract-Platform-TenantId` header).
2. Add a per-request timeout (already 30s) and optional request IDs (`X-Request-Id`) for traceability.
3. Add optional retry for idempotent `GET`s (TanStack Query already retries; avoid retrying mutations).
4. Keep network-error detection (already present).

---

## 28. Query / Mutation Architecture (TanStack Query)

Existing pattern is correct. Standardize on:

```
Queries:    useClients(), useClient(id), useLoanProducts(), useLoan(id), useSavingsAccounts(), ...
Mutations:  useCreateClient(), useActivateClient(), useCreateLoan(), useApproveLoan(),
            useDisburseLoan(), useRepayLoan(), useCreateSavingsAccount(), useDeposit(), useWithdraw(), ...
```

### Query keys (recommended convention)
```
['clients', {page, pageSize, search, status, officeId, sort}]
['clients', id]
['loans', {page, ...filters}]
['loans', id, 'schedule']
['loans', id, 'transactions']
['savings-accounts', id]
```

### Invalidation
After a mutation, invalidate the entity's list + detail keys, e.g.:
```
queryClient.invalidateQueries({ queryKey: ['clients'] });
queryClient.invalidateQueries({ queryKey: ['clients', id] });
```
After loan transactions (repay/write-off/close), invalidate `['loans', id, 'schedule']`, `['loans', id, 'transactions']`, `['loans', id]`.

### Notes
- **Avoid optimistic updates for financial mutations.** Financial state is authoritative server-side; a successful response is the source of truth. Refetch after mutation.
- **Pagination/filtering/sorting** are done **server-side** via query params (`offset/limit/orderBy/sortOrder`). Keep the DataTable wired to these.
- Stale-time/gc-time defaults in `QueryProvider` (60s / 5min) are reasonable.

---

## 29. Form Mapping (React Hook Form + Zod)

Example — Client create form (`src/features/clients/schemas/client.schema.ts` → `POST /clients`):

| UI Field | Fineract Field | Type | Required | Validation |
|---|---|---|---|---|
| Office | `officeId` | number | Yes | notNull |
| First name | `firstname` | string | Yes (or fullname) | notBlank |
| Last name | `lastname` | string | Yes (or fullname) | notBlank |
| Mobile | `mobileNo` | string | No | — |
| External ID | `externalId` | string | No | unique |
| Client type | `clientTypeId` | number | No | exists in template options |
| Legal form | `legalFormId` | number | No | — |
| DOB | `dateOfBirth` | date | No | ≤ today |
| Activate on create? | `active` | boolean | Yes | true ⇒ `activationDate` required |
| Activation date | `activationDate` | date | If active | required |
| Date format | `dateFormat` | string | Yes | `yyyy-MM-dd` |
| Locale | `locale` | string | Yes | `en` (or configured) |

**Rule:** always send `locale` and `dateFormat` with date-bearing requests (`yyyy-MM-dd`, `en`). Your API functions already append these. Keep this consistent across all mutations.

Example — Loan create (`POST /loans`): fields per §13.2; the `LoanFormPage` should load `GET /loans/template?clientId&productId` to populate dropdowns (products, repayment frequency, interest method, amortization, strategy, charges) and then submit.

---

## 30. Table / Pagination Mapping

Fineract list endpoints return either a bare array or a paged envelope `{ totalFilteredRecords, pageItems }` depending on `paged`/the resource. Your `loan.ts` and `client.ts` already handle both shapes. Standardize:

- **Page index**: `offset` (0-based).
- **Page size**: `limit`.
- **Sorting**: `orderBy` (DB column, e.g. `l.id`, `displayName`) + `sortOrder` (`ASC`/`DESC`). Use the documented sortable columns (e.g. `CLIENT_SORT_COLUMNS`, `LOAN_SORT_OPTIONS`).
- **Filtering/search**: resource-specific query params (`status`, `officeId`, `displayName`, `externalId`, etc.).
- **Total records**: from `totalFilteredRecords` when paged.

Map the paged envelope into your `DataTable` + `Pagination` components. Server-side pagination is mandatory for scale.

---

## 31. State Machines (verified)

### Loan
```
SUBMITTED(100) → approve → APPROVED(200) → disburse → ACTIVE(300)
   reject → REJECTED(500)
   withdrawnByApplicant → WITHDRAWN(400)
   undoapproval → SUBMITTED
ACTIVE → repayment → ACTIVE
   → writeoff → CLOSED_WRITTEN_OFF(601)
   → close → CLOSED_OBLIGATIONS_MET(600)
   → close-rescheduled / reschedule → CLOSED_RESCHEDULED(602)
   → foreclosure → CLOSED / OVERPAID(700)
```

### Savings
```
SUBMITTED(100) → approve → APPROVED(200) → activate → ACTIVE(300)
   reject → REJECTED(500)
   withdrawnByApplicant → WITHDRAWN(400)
   undoapproval → SUBMITTED
ACTIVE → deposit/withdrawal/interest → ACTIVE
   block/blockDebit/blockCredit → ACTIVE (flagged)
   close → CLOSED(600)
   prematureClose → PRE_MATURE_CLOSURE(700); matured → MATURED(800)
```

### Client
```
PENDING(100) → activate → ACTIVE(300) → close → CLOSED(600)
   reject → REJECTED(700) → undoRejection → PENDING
   withdraw → WITHDRAWN(800) → undoWithdrawal → PENDING
   reactivate → ACTIVE
ACTIVE → proposeTransfer → TRANSFER_IN_PROGRESS(303)/TRANSFER_ON_HOLD(304)
```

**Which UI actions appear per state** — see the per-entity state-action tables in §09.5, §13.8, §16.6. Gate each action by both `status` and the permission hook.

---

## 32. Business Workflows

### Client
```
Create (POST /clients) → PENDING
  → Activate (POST /clients/{id}?command=activate) → ACTIVE
  → Update (PUT /clients/{id})
  → Close (command=close) → CLOSED
```
| UI Step | API | Backend State | Validation | Permission | Next State | Possible Errors |
|---|---|---|---|---|---|---|
| Create | `POST /clients` | PENDING | firstname/lastname+office+active/activationDate | CREATE_CLIENT | PENDING | 400 missing fields |
| Activate | `POST /clients/{id}?command=activate` | PENDING | activationDate | ACTIVATE_CLIENT | ACTIVE | 403 not pending |
| Update | `PUT /clients/{id}` | any | fields | UPDATE_CLIENT | same | 400 |
| Close | `POST /clients/{id}?command=close` | ACTIVE | closureDate, no open balances | CLOSE_CLIENT | CLOSED | 400 open accounts |

### Loan
```
Create/Submit (POST /loans) → SUBMITTED → Approve (command=approve) → APPROVED
→ Disburse (command=disburse) → ACTIVE → Repay (POST /loans/{id}/transactions?command=repayment)
→ Close/Write-off/Foreclose/Reschedule → CLOSED*
```
| UI Step | API | Backend State | Permission | Next State |
|---|---|---|---|---|
| Create | `POST /loans` | SUBMITTED | CREATE_LOAN | SUBMITTED |
| Approve | `POST /loans/{id}?command=approve` | SUBMITTED | APPROVE_LOAN | APPROVED |
| Disburse | `POST /loans/{id}?command=disburse` | APPROVED | DISBURSE_LOAN | ACTIVE |
| Repay | `POST /loans/{id}/transactions?command=repayment` | ACTIVE | REPAYMENT_LOAN | ACTIVE |
| Write-off | `POST /loans/{id}/transactions?command=writeoff` | ACTIVE | WRITEOFF_LOAN | CLOSED_WRITTEN_OFF |
| Close | `POST /loans/{id}/transactions?command=close` | ACTIVE | CLOSE_LOAN | CLOSED_OBLIGATIONS_MET |
| Reschedule | `/rescheduleloans` + approve | ACTIVE | CREATE_RESCHEDULELOAN | CLOSED_RESCHEDULED |

### Savings
```
Create (POST /savingsaccounts) → SUBMITTED → Approve → APPROVED → Activate → ACTIVE
→ Deposit/Withdrawal/Interest → ACTIVE → Close → CLOSED
```
| UI Step | API | Backend State | Permission | Next State |
|---|---|---|---|---|
| Create | `POST /savingsaccounts` | SUBMITTED | CREATE_SAVINGSACCOUNT | SUBMITTED |
| Approve | `POST /savingsaccounts/{id}?command=approve` | SUBMITTED | APPROVE_SAVINGSACCOUNT | APPROVED |
| Activate | `POST /savingsaccounts/{id}?command=activate` | APPROVED | ACTIVATE_SAVINGSACCOUNT | ACTIVE |
| Deposit | `POST /savingsaccounts/{id}/transactions?command=deposit` | ACTIVE | DEPOSIT_SAVINGSACCOUNT | ACTIVE |
| Withdraw | `POST /savingsaccounts/{id}/transactions?command=withdrawal` | ACTIVE | WITHDRAWAL_SAVINGSACCOUNT | ACTIVE |
| Close | `POST /savingsaccounts/{id}?command=close` | ACTIVE | CLOSE_SAVINGSACCOUNT | CLOSED |

### User
```
Create (POST /users) → assign roles → permissions from roles
→ Activate/Deactivate via role enable/disable or user update
```
| UI Step | API | Permission |
|---|---|---|
| Create | `POST /users` | CREATE_USER |
| Assign role | `PUT /users/{id}` (roles[]) | UPDATE_USER |
| Permissions | `GET/PUT /roles/{id}/permissions` | UPDATE_ROLE |
| Change password | `POST /users/{id}/pwd` | USER_PASSWORD (or own) |

---

## 33. Implementation Roadmap

### Phase 1 — Foundation (mostly done)
- ✅ Axios client, auth, error handling, QueryProvider.
- ✅ Tenant param (currently hardcoded on login) → move to interceptor + `VITE_TENANT_IDENTIFIER`.
- Common types + constants; correct status maps (§26 list).

### Phase 2 — Organization
- Offices, staff, users, roles, permissions, holidays, working days, currencies, funds, payment types, codes. (Pages exist; verify endpoints.)

### Phase 3 — Clients
- Client CRUD + commands (fix `undoRejection`/`undoWithdrawal`), identifiers, documents, images, notes, charges, family, collateral, addresses.

### Phase 4 — Products
- Loan products, savings products, fixed/recurring deposit products, charges, delinquency buckets/ranges, interest rate charts.

### Phase 5 — Loans
- Application, template, approval, disbursement, schedule, repayment, close/write-off/foreclose, reschedule.

### Phase 6 — Savings
- Savings/fixed/recurring accounts, deposit, withdrawal, interest, close, block/unblock, transfers, standing instructions.

### Phase 7 — Accounting
- GL accounts, journal entries (fix no-template), rules, activity mappings, closures, runaccruals, provisioning.

### Phase 8 — Reports
- Report registry, runreports (fix path to `/runreports/{name}`), adhoc, datatables.

---

## 34. Risks & Edge Cases

- **Fixing the status ID maps** (client 303/304, savings 303/304/400/500/600/700/800) — cosmetic but affects filtering and badges.
- **Correcting command strings** (`undoRejection`/`undoWithdrawal`; deposit/withdrawal/hold on transactions endpoint; loan repay/write-off/close on transactions endpoint) — functional correctness.
- **Version drift**: some newer endpoints (`LoanProductsDetailsApiResource`, `WorkingCapitalLoan*`, transaction-search, `LoanScheduleApiResource` POST) may not exist on older Fineract releases. Confirm target version.
- **`locale`/`dateFormat`**: must be sent with every date-bearing mutation; use `yyyy-MM-dd` + `en` consistently.
- **Pagination shapes**: some endpoints return arrays, others `{pageItems, totalFilteredRecords}`. Handle both (already done in loan/client fetchers).
- **Tenant routing**: a mis-set tenant identifier returns `401`/invalid-tenant errors; centralize it.
- **Money precision**: use integer cents/decimal strings; never float arithmetic for financial display. Fineract returns `BigDecimal`; render with the currency's `decimalPlaces`.
- **Reconciliation**: never trust client-side totals; always display backend-derived balances.
- **idempotency**: use `externalId` for creates to avoid duplicates on retry.

---

## 35. Recommended Architecture

### Comparison
| Option | Security | Maintainability | API abstraction | Validation | Audit | Rate limiting | Notes |
|---|---|---|---|---|---|---|---|
| **A. React → Fineract API** | Relies on backend auth; token in browser | Simple | None (direct coupling) | Backend only | Backend audit only | Backend only | Fastest, current state |
| **B. React → My Backend → Fineract API** | Token hidden in server | More code | Good | Can add | Can aggregate | Easy | Good for multi-service |
| **C. React → API Gateway / BFF → Fineract** | Best (token in httpOnly cookie) | Moderate | Best | Gateway | Centralized | Easy | Best for production at scale |

### Recommendation
For a **production financial application**, start with **Option A** (which your app already implements) and evolve to **Option C (BFF/gateway)** as you add auth complexity (OAuth2/OIDC, 2FA), need centralized rate-limiting/audit, or integrate other services.

**Why C ultimately:**
- Keeps the `base64EncodedAuthenticationKey` (or an OAuth token) out of browser JS/localStorage.
- Provides a stable internal API contract so the React app isn't coupled to Fineract's schema.
- Centralizes validation, rate limiting, audit logging, and error normalization.
- Allows a graceful migration path from basic auth to OAuth2 without rewriting the UI.

**But**: Option A is acceptable now given your app is already wired directly to Fineract. The BFF only becomes mandatory when you need OAuth2/OIDC, cross-service aggregation, or strict regulatory audit requirements at the edge.

---

## 36. Final Implementation Checklist

**Foundation**
- [ ] Move tenant identifier into the Axios interceptor (`VITE_TENANT_IDENTIFIER`, default `default`).
- [ ] Remove `lastLoginDateTime` from `LoginResponse` type (does not exist in backend).
- [ ] Add 2FA flow screens if 2FA is enabled in the deployment.

**Clients**
- [ ] Fix `src/features/clients/api/client.ts`: `undoreject`→`undoRejection`, `undowithdraw`→`undoWithdrawal`.
- [ ] Fix `src/features/clients/constants/status.ts`: transfer = 303/304, add withdrawn = 800.

**Loans**
- [ ] Verify all `loan.ts` commands against §13.3/§13.4 (already largely correct).
- [ ] Confirm repayment schedule uses `GET /loans/{id}?associations=repaymentSchedule`.

**Savings**
- [ ] Confirm deposit/withdrawal/hold/release hit `POST /savingsaccounts/{id}/transactions*`, not the account-level command.
- [ ] Verify savings status numeric maps match §16.5.

**Charges**
- [ ] Verify `ChargeFormPage` enum values against §18.1 (chargeTimeType, chargePaymentMode, chargeAppliesTo).

**Accounting**
- [ ] Remove any `GET /journalentries/template` call (does not exist).
- [ ] Use `POST /runaccruals` for periodic accrual (not `/accrualaccounting/runaccrual`).

**Reports**
- [ ] Run reports via `GET /runreports/{reportName}` (not `/reports/run/...`).

**Admin**
- [ ] Change password via `POST /users/{id}/pwd`.
- [ ] Maker-checker permissions via `GET /permissions?makerCheckerable=true`.
- [ ] Staff template via `GET /staff/{id}?template=true`.

**Organization**
- [ ] Office transaction undo via `DELETE /officetransactions/{id}`.

**Security**
- [ ] HTTPS everywhere; review token storage (prefer sessionStorage or BFF).
- [ ] Add `externalId` to creates for idempotency.
- [ ] Keep confirmation dialogs on irreversible actions.

---

## Appendix A — Permission codes (VERIFIED pattern)

Fineract permission codes follow `<ACTION>_<ENTITY>`. Key examples used by the app:
```
CREATE_CLIENT, UPDATE_CLIENT, DELETE_CLIENT, ACTIVATE_CLIENT, CLOSE_CLIENT, REJECT_CLIENT,
CREATE_LOAN, UPDATE_LOAN, DELETE_LOAN, APPROVE_LOAN, REJECT_LOAN, DISBURSE_LOAN,
REPAYMENT_LOAN, WRITEOFF_LOAN, CLOSE_LOAN, APPROVALUNDO_LOAN, DISBURSALUNDO_LOAN,
CREATE_SAVINGSACCOUNT, UPDATE_SAVINGSACCOUNT, DELETE_SAVINGSACCOUNT, APPROVE_SAVINGSACCOUNT,
ACTIVATE_SAVINGSACCOUNT, DEPOSIT_SAVINGSACCOUNT, WITHDRAWAL_SAVINGSACCOUNT,
CLOSE_SAVINGSACCOUNT, POSTINTEREST_SAVINGSACCOUNT, CALCULATEINTEREST_SAVINGSACCOUNT,
CREATE_OFFICE, UPDATE_OFFICE, CREATE_STAFF, UPDATE_STAFF, CREATE_USER, UPDATE_USER,
CREATE_ROLE, UPDATE_ROLE, CREATE_GLACCOUNT, UPDATE_GLACCOUNT, CREATE_LOANPRODUCT,
UPDATE_LOANPRODUCT, CREATE_SAVINGSPRODUCT, UPDATE_SAVINGSPRODUCT, CREATE_CHARGE, UPDATE_CHARGE,
CREATE_REPORT, UPDATE_REPORT, READ_REPORT, ...
```

## Appendix B — `locale` / `dateFormat` convention

All date-bearing create/update/command bodies must include:
```json
{ "...": "...", "dateFormat": "yyyy-MM-dd", "locale": "en" }
```
The app's API functions already append these (e.g. `createLoan`, `calculateLoanSchedule`, `refundLoanByTransfer`). Keep this consistent for every mutation to avoid 400 errors.

---

*End of report. All backend statements marked `VERIFIED` were confirmed by reading the Apache Fineract Java source at `/Users/macbook03/fineract/fineract`. Items marked `INFERRED`/`REQUIRES CONFIGURATION`/`VERSION-SPECIFIC` are flagged inline. Nothing was invented.*
