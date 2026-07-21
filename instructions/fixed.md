FIXED DEPOSITS MODULE - COMPLETE API CALLS & BUSINESS LOGIC
===========================================================

This document captures every API call and business logic rule across the
/products/fixed-deposits pages of fineract-backoffice-ui.

================================================================================

1. FIXED DEPOSIT ACCOUNTS LIST (FixedDepositAccountsListComponent)
   \================================================================================

FILE: fixed-deposits/fixed-deposits-list.component.ts

--- API CALL: List Fixed Deposit Accounts ---

Service: FixedDepositAccountService.getFixeddepositaccounts()
Endpoint: GET /api/v2/fixeddepositaccounts
Parameters (all optional): - paged: boolean - offset: number - limit: number - orderBy: string - sortOrder: string

Response Type: Array<GetFixedDepositAccountsResponse>

GetFixedDepositAccountsResponse:
{ accountNo?: number, clientId?, clientName?, currency?,
depositAmount?, depositPeriod?, depositPeriodFrequency?,
id?, interestCalculationDaysInYearType?, interestCalculationType?,
interestCompoundingPeriodType?, interestPostingPeriodType?,
maturityAmount?, maturityDate?, maxDepositTerm?, minDepositTerm?,
preClosurePenalApplicable?, savingsProductId?, savingsProductName?,
status?: GetFixedDepositAccountsStatus, summary?, timeline? }

GetFixedDepositAccountsStatus:
{ active?, approved?, closed?, code?, description?, id?,
prematureClosed?, rejected?, submittedAndPendingApproval?,
transferInProgress?, transferOnHold?, withdrawnByApplicant? }

--- BUSINESS LOGIC ---

Loads ALL accounts on init (client-side logic: localLogic=true)
No reactive RxJS pipeline - simple subscribe pattern

Data flow:
loadAccounts() -> getFixeddepositaccounts().subscribe()
On success: accounts = data || []
On error: console.error

--- COLUMNS ---

Columns: ColumnDef[] = [
{ key: 'accountNo', label: 'COMMON.ACCOUNT_NO', sortable: true },
{ key: 'clientName', label: 'COMMON.NAME', sortable: true },
{ key: 'depositAmount', label: 'COMMON.AMOUNT', sortable: true },
{ key: 'maturityAmount',label: 'COMMON.MATURITY_AMOUNT', sortable: true },
{ key: 'status', label: 'COMMON.STATUS', sortable: true },
{ key: 'actions', label: 'COMMON.ACTIONS', sortable: false },
]

Custom renderings: - depositAmount/maturityAmount: CurrencyPipe with account.currency?.code - status: <app-status-badge [status]="account.status"> - actions: Approve (if pending approval) + Edit button

--- ACTIONS COLUMN ---

Approve (shown when status.value === 'Submitted and pending approval'):
-> router.navigate(['/products/fixed/{account.id}/action/approve'])

Edit:
-> router.navigate(['/products/fixed-deposits/edit', account.id])

--- NAVIGATION ---

onCreateAccount(): router.navigate(['/products/fixed-deposits/create'])
onEditAccount(account): /products/fixed-deposits/edit/:id
onApprove(account): /products/fixed/:id/action/approve (uses singular 'fixed')
================================================================================

2. FIXED DEPOSIT ACCOUNT FORM (FixedDepositFormComponent)
   \================================================================================

FILE: fixed-deposits/fixed-deposit-form.component.ts (~460 lines)

--- MODE DETECTION ---

isEditMode = route has :id param (via paramMap subscription)
If edit: accountId = +params.get('id')

--- API CALL: Get Client ID from Query Params ---

Route.queryParams.subscribe:
If query param 'clientId' is present -> account.clientId = +clientId
Used when navigating from Client View "Create Fixed Deposit" button

--- API CALL: Load Products (Template) ---

Service: FixedDepositAccountService.getFixeddepositaccountsTemplate()
Endpoint: GET /api/v2/fixeddepositaccounts/template
Response: GetFixedDepositAccountsTemplateResponse
{ clientId?, clientName?, productOptions?: Set<GetFixedDepositAccountsProductOptions> }

GetFixedDepositAccountsProductOptions:
{ id?: number, name?: string }
NOTE: productOptions is a Set, must use Array.from()
Populates: productOptions dropdown

--- API CALL: Load Product Defaults (on product select change) ---

Service: FixedDepositAccountService.getFixeddepositaccountsTemplate()
(same template endpoint)
When user selects a product, extract from template response: - depositAmount - depositPeriod - depositPeriodFrequencyId (from depositPeriodFrequency.id) - nominalAnnualInterestRate
Values extracted via Record<string, unknown> cast

--- API CALL: Load Account Data (Edit mode) ---

Service: FixedDepositAccountService.getFixeddepositaccountsAccountId()
Endpoint: GET /api/v2/fixeddepositaccounts/{accountId}
Response: GetFixedDepositAccountsAccountIdResponse
Populates: - clientId, savingsProductId, depositAmount, depositPeriod - depositPeriodFrequency?.id - nominalAnnualInterestRate (from Record cast) - submittedOnDate from timeline.submittedOnDate (number[] -> Date)

--- FORM FIELDS ---

Client Search (ClientSearchComponent, required)
Fixed Deposit Product (select from productOptions, required)
External ID (text, optional)
Submitted On Date (datepicker, required)
Deposit Amount (number, required)
Deposit Period (number, required)
Deposit Period Frequency (select: Days/Months/Years, required)
Interest Rate (read-only, inherited from product)

--- API CALL: Create Fixed Deposit Account ---

Service: FixedDepositAccountService.postFixeddepositaccounts()
Endpoint: POST /api/v2/fixeddepositaccounts
Body: PostFixedDepositAccountsRequest (via Record<string,unknown>)
{
clientId, productId, submittedOnDate, depositAmount,
depositPeriod, depositPeriodFrequencyId,
locale: 'en', dateFormat: 'dd MMMM yyyy'
}

MANDATORY fields: clientId, productId, submittedOnDate,
depositAmount, depositPeriod, depositPeriodFrequencyId

--- API CALL: Update Fixed Deposit Account ---

Service: FixedDepositAccountService.putFixeddepositaccountsAccountId()
Endpoint: PUT /api/v2/fixeddepositaccounts/{accountId}
Body: PutFixedDepositAccountsAccountIdRequest & Record<string,unknown>
{
depositAmount, depositPeriod?, depositPeriodFrequencyId?,
nominalAnnualInterestRate?, locale: 'en', dateFormat: 'dd MMMM yyyy'
}

NOTE: Update payload ONLY includes deposit fields (different from create)

--- NAVIGATION ---

On create/update success: router.navigate(['/products/fixed-deposits'])
On cancel: router.navigate(['/products/fixed-deposits'])

onCreateClient(): router.navigate(['/clients/create'])
onCreateProduct(): router.navigate(['/products/fixed/create'])

================================================================================ 3. FIXED/TERM DEPOSIT ACCOUNT VIEW (DepositAccountViewComponent)
================================================================================

FILE: deposit-account-view.component.ts (~352 lines)
NOTE: SHARED component for BOTH fixed-deposits and recurring-deposits

--- MODE DETECTION ---

isRD = router.url.includes('recurring')
If isRD: uses RecurringDepositAccountService
If !isRD: uses FixedDepositAccountService

--- API CALL: Get Single Deposit Account ---

Dynamic method dispatch:
service = isRD ? rdService : fdService (as Record<string, unknown>)
method = isRD ? 'retrieveOne18' : 'retrieveOne14'
service[method](accountId).subscribe(...)

Response: Record<string, unknown>
Key properties: productName, accountNo, clientName, status, currency,
accountBalance, timeline.activatedOnDate, transactions

--- HEADER ACTIONS ---

Actions dropdown (mat-menu):
Deposit -> ONLY for RD -> /products/recurring-deposits/{id}/transactions/deposit
Withdraw -> FD: /products/fixed-deposits/{id}/transactions/withdrawal
RD: /products/recurring-deposits/{id}/transactions/withdrawal

--- DETAILS SECTION ---

Fields: Account No, Product Name, Client Name, Currency Symbol,
Account Balance, Activation Date, Status

--- TRANSACTIONS TABLE (mat-table, inline) ---

Columns: Date, Type, Amount (color-coded: credit=green, debit=red),
Running Balance
Read-only (no create/undo/delete)

--- DATATABLES TAB ---

Uses EntityDatatablesComponent with apptableName and entityId

--- NAVIGATION ---

onBack(): isRD -> /products/recurring-deposits
!isRD -> /products/fixed-deposits

================================================================================ 4. FIXED DEPOSIT TRANSACTIONS LIST (FixedDepositTransactionsListComponent)
================================================================================

FILE: fixed-deposit-transactions/fixed-deposit-transactions-list.component.ts

Route param: accountId (via snapshot)

--- API CALL: List Transactions ---

Service: FixedDepositAccountTransactionsService.getFixeddepositaccountsFixedDepositAccountIdTransactions()
Endpoint: GET /api/v2/fixeddepositaccounts/{fixedDepositAccountId}/transactions
Response: GetFixedDepositAccountsAccountIdTransactionsResponse[]
{ accountId?, accountNo?, amount?, date?, id?, reversed?,
runningBalance?, transactionType? }

NOTE: Read-only list - no create/delete/undo actions

--- COLUMNS ---

Columns: ColumnDef[] = [
{ key: 'date', label: 'FIXED_DEPOSIT_TRANSACTIONS.DATE', sortable: true },
{ key: 'amount', label: 'FIXED_DEPOSIT_TRANSACTIONS.AMOUNT', sortable: true },
{ key: 'transactionType', label: 'FIXED_DEPOSIT_TRANSACTIONS.TYPE', sortable: false },
]

Custom renderings: - date: row.date (direct string) - amount: row.amount (direct number) - transactionType: row.transactionType?.code
Uses localLogic: true

================================================================================ 5. FIXED DEPOSIT PRODUCTS LIST (FixedDepositProductsListComponent)
================================================================================

FILE: fixed-deposits/fixed-deposit-products-list.component.ts
NOTE: Route is /products/fixed (not fixed-deposits)

--- API CALL: List Products ---

Service: FixedDepositProductService.getFixeddepositproducts()
Endpoint: GET /api/v2/fixeddepositproducts
Response: GetFixedDepositProductsResponse[]
{ id?, name?, shortName?, currency?, nominalAnnualInterestRate? }

--- COLUMNS ---

Columns: ColumnDef[] = [
{ key: 'name', label: 'COMMON.NAME', sortable: true },
{ key: 'shortName', label: 'PRODUCTS.SHORT_NAME', sortable: true },
{ key: 'currency.code', label: 'PRODUCTS.CURRENCY', sortable: true },
{ key: 'nominalAnnualInterestRate', label: 'PRODUCTS.NOMINAL_ANNUAL_INTEREST_RATE', sortable: true },
{ key: 'actions', label: 'COMMON.ACTIONS', sortable: false },
]

Custom renderings: - nominalAnnualInterestRate: number pipe + '%' suffix - actions: Edit button

--- NAVIGATION ---

onCreate(): router.navigate(['/products/fixed/create'])
onEdit(p): router.navigate(['/products/fixed/edit', p.id])

================================================================================ 6. FIXED DEPOSIT PRODUCT FORM (FixedDepositProductFormComponent)
================================================================================

FILE: fixed-deposits/fixed-deposit-product-form.component.ts (~303 lines)
NOTE: Route is /products/fixed

--- MODE DETECTION ---

isEditMode = route has :id param
If edit: productId = +id

--- DEFAULTS ---

DEFAULT_CURRENCY = 'USD'
DEFAULT_LOCALE = 'en'
DEFAULT_DATE_FORMAT = 'yyyy-MM-dd'

Initial defaults:
{ currencyCode: 'USD', digitsAfterDecimal: 2, inMultiplesOf: 0,
interestCompoundingPeriodType: 4, // Monthly
interestPostingPeriodType: 4, // Monthly
interestCalculationType: 1, // Daily
interestCalculationDaysInYearType: 365,
accountingRule: 1, // NONE
minDepositTerm: 1,
minDepositTermTypeId: 2, // Months
depositAmount: 1000 }

--- API CALL: Load Product Data (Edit mode) ---

Service: FixedDepositProductService.getFixeddepositproductsProductId()
Endpoint: GET /api/v2/fixeddepositproducts/{productId}
Response: GetFixedDepositProductsProductIdResponse
Populates: name, shortName, description, currencyCode, digitsAfterDecimal,
minDepositTerm, minDepositTermTypeId, accountingRule

--- FORM FIELDS ---

Name (required, text), Short Name (required, text, maxlength 4)
Description (textarea), Currency Code (select: USD)
Digits After Decimal (number)
Minimum Deposit Term (number, default 1)
Minimum Deposit Term Type (select: Days/Months/Years)

--- BUSINESS LOGIC: Charts (mandatory) ---

On submit, default chart added:
charts: [{
fromDate: today (YYYY-MM-DD), dateFormat: 'yyyy-MM-dd', locale: 'en',
chartSlabs: [{ periodType: 2, fromPeriod: 1, annualInterestRate: 5 }] }]

--- API CALL: Create ---

Service: FixedDepositProductService.postFixeddepositproducts()
Endpoint: POST /api/v2/fixeddepositproducts
Body: name, shortName, description, currencyCode, digitsAfterDecimal,
inMultiplesOf, interestCompoundingPeriodType, interestPostingPeriodType,
interestCalculationType, interestCalculationDaysInYearType,
accountingRule, minDepositTerm, minDepositTermTypeId,
depositAmount, charts, locale

--- API CALL: Update ---

Service: FixedDepositProductService.putFixeddepositproductsProductId()
Endpoint: PUT /api/v2/fixeddepositproducts/{productId}
Body: Same fields as create including charts

--- NAVIGATION ---

On success: router.navigate(['/products/fixed'])
On cancel: router.navigate(['/products/fixed'])

================================================================================ 7. DATE FORMATTING
================================================================================

Account forms use: 'dd MMMM yyyy' (via formatDateToFineract utility)
Product forms use: 'yyyy-MM-dd' (hardcoded inline)

================================================================================ 8. I18N TRANSLATION KEY PREFIXES
================================================================================

FIXED_DEPOSITS.* - Account labels
FIXED_DEPOSIT_TRANSACTIONS.* - Transaction labels
PRODUCTS.* - Product labels
COMMON.* - Shared labels
HELP.* - Help text
nav.fixedDepositProducts - Product list title

================================================================================
END OF DOCUMENT
================================================================================
