================================================================================
RECURRING DEPOSIT PRODUCTS & ACCOUNTS — BUSINESS LOGIC & API REFERENCE
================================================================================

TABLE OF CONTENTS

1. Overview
2. Product Definitions (RecurringDepositProduct)
3. Customer Accounts (RecurringDepositAccount)
4. Transactions (RecurringDepositAccountTransactions)
5. Account Actions (approve / activate / close)
6. Account Type Resolver
7. Routing / Navigation
8. File Inventory

================================================================================

1. OVERVIEW
   \================================================================================

The recurring deposit module has two levels:
A. PRODUCT DEFINITIONS — templates that define terms (interest, currency,
deposit frequency, min/max term, accounting rules, charts/slabs).
B. CUSTOMER ACCOUNTS — individual applications created from a product,
with client, deposit amount, deposit period, and a lifecycle
(Submitted → Approved → Active → Closed).

Three Angular services (auto-generated OpenAPI) handle the API layer:

- RecurringDepositProductService → /v1/recurringdepositproducts
- RecurringDepositAccountService → /v1/recurringdepositaccounts
- RecurringDepositAccountTransactionsService → /v1/recurringdepositaccounts/{id}/transactions

All calls require basicAuth + tenantid headers. Base path is injected via
BASE_PATH token (typically https://<host>/api/v1).

No centralized state management (NgRx, etc.). Each component fetches on
ngOnInit() and stores locally. DepositAccountViewComponent uses Angular
signal() for reactive state.

================================================================================ 2. PRODUCT DEFINITIONS (src/app/api/api/recurringDepositProduct.service.ts)
================================================================================

BUSINESS LOGIC
--------------

- Products are templates. They define:
  • name, shortName, description, currencyCode, digitsAfterDecimal,
  inMultiplesOf
  • interestCompoundingPeriodType, interestPostingPeriodType,
  interestCalculationType, interestCalculationDaysInYearType
  • recurringDepositFrequency + recurringDepositFrequencyType
  (how often the customer must deposit)
  • minDepositTerm + minDepositTermTypeId
  • maxDepositTerm + maxDepositTermTypeId
  • preClosurePenalInterest + preClosurePenalInterestOnTypeId
  • depositAmount (the recurring installment amount)
  • accountingRule + accounting mappings
  • Charts (interest rate slabs)
- Defaults applied by RecurringDepositProductFormComponent:
  currencyCode=USD, digitsAfterDecimal=2,
  interestCompoundingPeriodType=4 (Monthly),
  interestPostingPeriodType=4 (Monthly),
  interestCalculationType=1 (Daily),
  interestCalculationDaysInYearType=365,
  accountingRule=1 (NONE),
  recurringEvery=1, recurringFrequencyType=2 (Months),
  minDepositTerm=1, minDepositTermTypeId=2,
  depositAmount=1000
- Create payload includes a charts array with a default chartSlab at 5%.
- The form fields `recurringEvery` / `recurringFrequencyType` are UI-only;
  they are deleted before POST. The API response uses
  recurringDepositFrequency / recurringDepositFrequencyType.

API ENDPOINTS
-------------

DELETE /v1/recurringdepositproducts/{productId}
→ DeleteRecurringDepositProductsProductIdResponse

GET /v1/recurringdepositproducts
→ Array<GetRecurringDepositProductsResponse>

GET /v1/recurringdepositproducts/{productId}
→ GetRecurringDepositProductsProductIdResponse

GET /v1/recurringdepositproducts/template
→ string (JSON template data)

POST /v1/recurringdepositproducts
Body: PostRecurringDepositProductsRequest
→ PostRecurringDepositProductsResponse
Mandatory: name, shortName, description, currencyCode,
digitsAfterDecimal, inMultiplesOf,
interestCompoundingPeriodType,
interestPostingPeriodType, interestCalculationType,
interestCalculationDaysInYearType, minDepositTerm,
minDepositTermTypeId, accountingRule, depositAmount,
charts

PUT /v1/recurringdepositproducts/{productId}
Body: PutRecurringDepositProductsRequest
→ PutRecurringDepositProductsResponse

================================================================================ 3. CUSTOMER ACCOUNTS (src/app/api/api/recurringDepositAccount.service.ts)
================================================================================

BUSINESS LOGIC
--------------

- Accounts are created from a product for a client (or group).
- Mandatory create fields: clientId / groupId, productId,
  submittedOnDate, depositAmount, depositPeriod, depositPeriodFrequencyId.
- Optional: recurringFrequency + recurringFrequencyType (when not
  inheriting from a calendar), isCalendarInherited.
- Accounts have a lifecycle:
  Submitted (pending approval)
  → Approve (command="approve")
  → Reject (command="reject")
  → Withdraw (command="withdraw")
  → Delete (DELETE, only in Submitted state)
  Approved
  → Activate (command="activate")
  Active
  → Close (command="close")
  → Premature Close (command="prematureClose")
  → Calculate Interest (command="calculateInterest")
  → Post Interest (command="postInterest")
  → Calculate Premature Amount (command="calculatePrematureAmount")
- Edit only allowed in "Submitted and pending approval" state.
- Template endpoint returns eligible products for a given client/group.

API ENDPOINTS
-------------

DELETE /v1/recurringdepositaccounts/{accountId}
→ DeleteRecurringDepositAccountsResponse

GET /v1/recurringdepositaccounts
Query: ?paged=&offset=&limit=&orderBy=&sortOrder=
→ Array<GetRecurringDepositAccountsResponse>

GET /v1/recurringdepositaccounts/{accountId}
Query: ?staffInSelectedOnlyOffice=&chargeStatus=
→ GetRecurringDepositAccountsAccountIdResponse

GET /v1/recurringdepositaccounts/{accountId}/template
Query: ?command=
→ string (JSON)

GET /v1/recurringdepositaccounts/template
Query: ?clientId=&groupId=&productId=&staffInSelectedOfficeOnly=
→ GetRecurringDepositAccountsTemplateResponse

POST /v1/recurringdepositaccounts
Body: PostRecurringDepositAccountsRequest
→ PostRecurringDepositAccountsResponse
Mandatory: clientId/groupId, productId, submittedOnDate,
depositAmount, depositPeriod, depositPeriodFrequencyId

POST /v1/recurringdepositaccounts/{accountId}
Query: ?command=approve|activate|close|reject|withdraw|
prematureClose|calculateInterest|postInterest|
calculatePrematureAmount
Body: { approvedOnDate?, activatedOnDate?, closedOnDate?, note? }
→ PostRecurringDepositAccountsAccountIdResponse

PUT /v1/recurringdepositaccounts/{accountId}
Body: PutRecurringDepositAccountsAccountIdRequest
(depositAmount, locale, dateFormat)
→ PutRecurringDepositAccountsAccountIdResponse

GET /v1/recurringdepositaccounts/downloadtemplate
Query: ?officeId=&staffId=&dateFormat=
(Excel, Accept: application/vnd.ms-excel)

POST /v1/recurringdepositaccounts/uploadtemplate
Body (multipart/form-data): dateFormat, locale, uploadedInputStream
→ string

GET /v1/recurringdepositaccounts/transactions/downloadtemplate
Query: ?officeId=&dateFormat=
(Excel)

POST /v1/recurringdepositaccounts/transactions/uploadtemplate
Body (multipart/form-data): dateFormat, locale, uploadedInputStream
→ string

================================================================================ 4. TRANSACTIONS (src/app/api/api/recurringDepositAccountTransactions.service.ts)
================================================================================

BUSINESS LOGIC
--------------

- Deposit and withdrawal transactions on a specific RD account.
- Transaction template provides payment type options.
- Commands: "deposit" or "withdrawal" on POST create.
- Existing transactions can be "adjust"ed or "undo"ne via POST with command.

API ENDPOINTS
-------------

GET /v1/recurringdepositaccounts/{recurringDepositAccountId}
/transactions/template
Query: ?command=deposit|withdrawal
→ GetRecurringDepositAccountsRecurringDepositAccountId
TransactionsTemplateResponse

GET /v1/recurringdepositaccounts/{recurringDepositAccountId}
/transactions/{transactionId}
→ GetRecurringDepositAccountsRecurringDepositAccountId
TransactionsTransactionIdResponse

POST /v1/recurringdepositaccounts/{recurringDepositAccountId}
/transactions
Query: ?command=deposit|withdrawal
Body: PostRecurringDepositAccountsRecurringDepositAccountId
TransactionsRequest
(transactionDate, transactionAmount, paymentTypeId,
dateFormat, locale)
→ PostRecurringDepositAccountsRecurringDepositAccountId
TransactionsResponse

POST /v1/recurringdepositaccounts/{recurringDepositAccountId}
/transactions/{transactionId}
Query: ?command=adjust|undo
Body: PostRecurringDepositAccountsRecurringDepositAccountId
TransactionsRequest
→ PostRecurringDepositAccountsRecurringDepositAccountId
TransactionsTransactionIdResponse

================================================================================ 5. ACCOUNT ACTIONS (approve / activate / close / etc.)
================================================================================

BUSINESS LOGIC
--------------

- Reusable AccountActionFormComponent handles actions for savings, fixed
  deposit, recurring deposit, and loan accounts.
- For recurring deposits:
  • Loads account: RecurringDepositAccountService
  .getRecurringdepositaccountsAccountId()
  • Submits action: RecurringDepositAccountService
  .postRecurringdepositaccountsAccountId() with command query param
  and date payload
  • Commands: approve, activate, close, reject, withdraw, prematureClose,
  calculateInterest, postInterest, calculatePrematureAmount
- Cancel/back → /products/recurring-deposits
- Success → /products/recurring-deposits

================================================================================ 6. ACCOUNT TYPE RESOLVER (src/app/core/utils/account-type-resolver.ts)
================================================================================

BUSINESS LOGIC
--------------

- resolveAccountActionType(data):
  depositType.id === 200 OR depositTypeId === 200 → "fixed"
  depositType.id === 300 OR depositTypeId === 300 → "recurring"
  productName.includes("recurring") → "recurring"
  productName.includes("fixed") → "fixed"
  else → "savings"
- resolveAccountRoutePrefix(type):
  "recurring" → "recurring-deposits"
  "fixed" → "fixed-deposits"
  "savings" → "savings-accounts"

================================================================================ 7. ROUTING / NAVIGATION
================================================================================

Product Definitions (Recurring Deposit PRODUCTS):
/products/recurring → RecurringDepositProductsListComponent
/products/recurring/create → RecurringDepositProductFormComponent
/products/recurring/edit/:id → RecurringDepositProductFormComponent

Customer Accounts (Recurring Deposit ACCOUNTS):
/products/recurring-deposits → RecurringDepositsListComponent
/products/recurring-deposits/create → RecurringDepositAccountFormComponent
/products/recurring-deposits/edit/:id → RecurringDepositAccountFormComponent
/products/recurring-deposits/view/:id → DepositAccountViewComponent

Shared:
/products/:accountType/:accountId/action/:command
→ AccountActionFormComponent
/products/recurring-deposits/:accountId/transactions/create
→ RecurringDepositTransactionFormComponent

Sidebar (under Products):

- "Recurring Deposit Products" (icon: autorenew) → /products/recurring
- "Recurring Deposits" (icon: history) → /products/recurring-deposits

================================================================================ 8. FILE INVENTORY
================================================================================

Service files (auto-generated OpenAPI):
src/app/api/api/recurringDepositAccount.service.ts
src/app/api/api/recurringDepositProduct.service.ts
src/app/api/api/recurringDepositAccountTransactions.service.ts

Model files (auto-generated, ~70+ files):
src/app/api/model/_Recurring_.ts (get, post, put, delete models)

Feature components:
src/app/features/products/recurring-deposits/
recurring-deposit-products-list.component.ts
recurring-deposits-list.component.ts
recurring-deposit-product-form.component.ts
recurring-deposit-form.component.ts
src/app/features/products/recurring-deposit-transactions/
recurring-deposit-transaction-form.component.ts
recurring-deposit-transaction-form.component.spec.ts
src/app/features/products/deposit-account-view.component.ts
src/app/features/products/account-action-form.component.ts

Utilities:
src/app/core/utils/account-type-resolver.ts

Routes:
src/app/app.routes.ts

================================================================================
END OF DOCUMENT
================================================================================
