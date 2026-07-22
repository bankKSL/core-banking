SAVINGS ACCOUNTS MODULE - COMPLETE API CALLS & BUSINESS LOGIC
=============================================================

This document captures every API call and business logic rule across the
/products/savings-accounts pages of fineract-backoffice-ui (Angular standalone components).

================================================================================

1. SAVINGS ACCOUNTS LIST (SavingsAccountsListComponent)
   \================================================================================

FILE: savings-accounts-list.component.ts

--- API CALL: Get Paginated Savings Accounts ---

Service: SavingsAccountService.getSavingsaccounts()
Endpoint: GET /api/v2/savingsaccounts
Parameters: - search: string | undefined (free text search) - offset: number | undefined (pageIndex * pageSize) - limit: number | undefined (pageSize) - orderBy: string | undefined (column key) - sortOrder: string | undefined ("ASC" | "DESC")

Response Type: GetSavingsAccountsResponse
{
pageItems?: Set<GetSavingsPageItems>, // <-- NOTE: Set, not Array
totalFilteredRecords?: number
}

GetSavingsPageItems:
{
accountNo?: string,
clientId?: number,
clientName?: string,
currency?: GetSavingsCurrency,
fieldOfficerId?: number,
id?: number,
interestCalculationDaysInYearType?: GetSavingsInterestCalculationDaysInYearType,
interestCalculationType?: GetSavingsInterestCalculationType,
interestCompoundingPeriodType?: GetSavingsInterestCompoundingPeriodType,
interestPostingPeriodType?: GetSavingsInterestPostingPeriodType,
nominalAnnualInterestRate?: number,
savingsProductId?: number,
savingsProductName?: string,
status?: GetSavingsStatus,
summary?: GetSavingsSummary,
timeline?: GetSavingsTimeline,
}

GetSavingsStatus:
{
active?: boolean, approved?: boolean, closed?: boolean,
code?: string, id?: number, rejected?: boolean,
submittedAndPendingApproval?: boolean, value?: string,
withdrawnByApplicant?: boolean
}

--- BUSINESS LOGIC: Reactive Data Loading ---

Uses RxJS merge() of 3 event streams: 1. searchSubject - user typing in search bar 2. sortSubject - column header click 3. pageSubject - paginator page change

Pipeline:
merge(streams).pipe(
startWith({}),
switchMap(() => {
isLoading = true
offset = currentPage.pageIndex * currentPage.pageSize
limit = currentPage.pageSize
orderBy = currentSort.active || undefined
sortOrder = currentSort.direction?.toUpperCase() || undefined
searchVal = currentFilter || undefined
return savingsService.getSavingsaccounts(searchVal, offset, limit, orderBy, sortOrder)
.pipe(catchError(() => of(null)))
}),
map(response => {
isLoading = false
if (!response) return []
const items = Array.from(response.pageItems || [])
.filter(account => {
depositTypeId = account.depositType?.id || account.depositTypeId
return depositTypeId !== 200 // Exclude Fixed Deposit (type 200)
})
totalRecords = response.totalFilteredRecords || 0
// Adjust totalRecords if we filtered client-side
if (response.pageItems && response.pageItems.size !== items.length) {
totalRecords = Math.max(0, totalRecords - (response.pageItems.size - items.length))
}
return items
})
).subscribe(data => accounts = data)

KEY DIFFERENCE from Clients list: The API returns a Set<GetSavingsPageItems>
(not Array). Array.from() is used to convert. Fixed Deposits (depositTypeId 200)
are filtered out client-side to show only regular savings accounts.

--- COLUMNS ---

Columns: ColumnDef[] = [
{ key: 'accountNo', label: 'SAVINGS.ACCOUNT_NO', sortable: true },
{ key: 'savingsProductName', label: 'SAVINGS.PRODUCT', sortable: true },
{ key: 'clientName', label: 'COMMON.CLIENT_NAME', sortable: true },
{ key: 'summary.accountBalance', label: 'SAVINGS.BALANCE', sortable: true },
{ key: 'status', label: 'COMMON.STATUS', sortable: true },
{ key: 'actions', label: 'COMMON.ACTIONS', sortable: false },
]

Custom renderings: - "accountNo": clickable link -> /products/{routePrefix}/view/:id
routePrefix resolved by resolveAccountRoutePrefix(account) - "summary.accountBalance": formatted with CurrencyPipe using account.currency?.code - "status": <app-status-badge [status]="account.status"> - "actions": Edit, Deposit, Withdraw, Approve buttons (permission-checked)

--- ACTIONS COLUMN BUTTONS ---

Edit: if hasPermission 'UPDATE_SAVINGSACCOUNT'
navigate -> /products/{routePrefix}/edit/:id
Deposit: if hasPermission 'DEPOSIT_SAVINGSACCOUNT'
navigate -> /products/{routePrefix}/:id/transactions/deposit
Withdrawal: if hasPermission 'WITHDRAW_SAVINGSACCOUNT'
navigate -> /products/{routePrefix}/:id/transactions/withdrawal
Approve: if status.submittedAndPendingApproval && hasPermission 'APPROVE_SAVINGSACCOUNT'
navigate -> /products/{actionType}/:id/action/approve

--- NAVIGATION HELPERS ---

getAccountRoutePrefix(account): calls resolveAccountRoutePrefix()
Returns 'savings-accounts' | 'fixed-deposits' | 'recurring-deposits'
getAccountActionType(account): calls resolveAccountActionType()
Returns 'savings' | 'fixed' | 'recurring'

--- PERMISSION ---

'CREATE_SAVINGSACCOUNT' - for "Create Account" button

================================================================================ 2. SAVINGS ACCOUNT VIEW / DETAIL (SavingsAccountViewComponent)
================================================================================

FILE: savings-account-view.component.ts (~555 lines)

--- API CALL: Get Single Savings Account ---

Service: SavingsAccountService.getSavingsaccountsAccountId()
Endpoint: GET /api/v2/savingsaccounts/{accountId}
Parameters: - accountId: number - staffInSelectedOfficeOnly?: boolean (false) - chargeStatus?: string (undefined) - loanOfficerId?: string ('all')

Response: SavingsAccountData (very large composite object, ~140 properties)

Key properties: - id, accountNo, savingsProductId, savingsProductName - clientId, clientName, groupId, groupName - status: SavingsAccountStatusEnumData - subStatus: SavingsAccountSubStatusEnumData - currency: CurrencyData - depositType: EnumOptionData (id: 100=Savings, 200=Fixed, 300=Recurring) - summary: SavingsAccountSummaryData - timeline: SavingsAccountApplicationTimelineData - transactions: Array<SavingsAccountTransactionData> - charges: Array<SavingsAccountChargeData> - nominalAnnualInterestRate - interestCompoundingPeriodType, interestCalculationType - interestPostingPeriodType, interestCalculationDaysInYearType - minRequiredBalance, minRequiredOpeningBalance - allowOverdraft, overdraftLimit - lockinPeriodFrequency, lockinPeriodFrequencyType - withdrawalFeeForTransfers, withHoldTax - clientData, fieldOfficerId, fieldOfficerName - savingsProduct, productOptions, chargeOptions, datatables

SavingsAccountStatusEnumData:
{ active?, approved?, closed?, matured?, prematureClosed?, rejected?,
submittedAndPendingApproval?, transferInProgress?, transferOnHold?,
withdrawnByApplicant?, code?, id?, value? }

SavingsAccountTransactionData:
{ id?, accountId?, date? (number[]), transactionDate?, entryDate?,
type?: (EnumOptionData), amount?, runningBalance?, reversed?,
paymentDetailData?, interestedPosted?, submittedByUsername?,
note?, externalId? }

SavingsAccountChargeData:
{ id?, chargeId?, name?, amount?, amountOutstanding?, amountPaid?,
chargeTimeType?, chargeCalculationType?, dueDate?, isPaid?,
isActive?, isWaived?, waivable?, penalty? }

--- LOADING LOGIC ---

ngOnInit(): subscribes to route.paramMap
On param change: accountId = +params.get('id'); calls loadAccountData()

loadAccountData():
calls savingsService.getSavingsaccountsAccountId(accountId, false, undefined, 'all')
On success: sets account signal, transactions signal, charges signal
On error: shows snackbar 'Operation failed. Please try again.'

--- HEADER ACTIONS (status-based) ---

When status.submittedAndPendingApproval: - Approve -> action/approve (perm: 'APPROVE_SAVINGSACCOUNT') - Reject -> action/reject (perm: 'REJECT_SAVINGSACCOUNT') - Withdraw -> action/withdrawByApplicant (perm: 'WITHDRAW_SAVINGSACCOUNT') - Delete -> deleted action (perm: 'DELETE_SAVINGSACCOUNT')

When status.active: - Deposit -> transactions/deposit (perm: 'DEPOSIT_SAVINGSACCOUNT') - Withdrawal -> transactions/withdrawal (perm: 'WITHDRAW_SAVINGSACCOUNT') - Block Account -> action/block - Close Account -> action/close

--- DETAILS CARD ---

Account No, External Id, Client Name, Group Name, Field Officer,
Savings Product, Nominal Interest Rate, Currency, Min Required Balance,
Submitted On, Activated On (formatted from number[])

--- INTEREST RATE TABLE ---

Interest Rate, Interest Compounding Period, Interest Posting Period,
Interest Calculation Type, Interest Calculation Days In Year,
Lock-in Period, Min Required Opening Balance, Withdrawal Fee,
Allow Overdraft, Overdraft Limit, Withhold Tax

--- TRANSACTIONS TABLE ---

Columns: ID, Date, Type, Amount, Running Balance
Display: debits=red, credits=green, reversed=line-through+opacity

--- CHARGES TABLE ---

Columns: Name, Amount, Outstanding

--- NAVIGATION ---

onTransaction(command): /products/savings-accounts/{id}/transactions/{cmd}
onSavingsAction(command): resolveAccountActionType() + /products/{type}/{id}/action/{cmd}
onBack(): resolveAccountRoutePrefix() -> /products/{routePrefix}
================================================================================

3. SAVINGS ACCOUNT CREATE/EDIT FORM (SavingsAccountFormComponent)
   \================================================================================

FILE: savings-account-form.component.ts

--- MODE DETECTION ---

isEditMode = route has :id param (via paramMap subscription)
If edit: accountId = +params.get('id')

--- API CALL: Get Client ID from Query Params ---

Route.queryParams.subscribe:
If query param 'clientId' is present -> account.clientId = +clientId
Used when navigating from Client View "Create Savings" button

--- API CALL: Load Products ---

Service: SavingsProductService.getSavingsproducts()
Endpoint: GET /api/v2/savingsproducts
Response: GetSavingsProductsResponse[]
Populates: products dropdown

--- API CALL: Load Account Data (Edit mode) ---

Service: SavingsAccountService.getSavingsaccountsAccountId()
Endpoint: GET /api/v2/savingsaccounts/{accountId}
Response: SavingsAccountData
Populates: - account.clientId = data.clientId - account.productId = data.savingsProductId - interestRate = data.nominalAnnualInterestRate - submittedOnDate from data.timeline.submittedOnDate (number[] -> Date)

--- FORM FIELDS (template) ---

Grid layout: 2 columns

Section 1 - Client Selection (full width row):
ClientSearchComponent with "create new client" button
[label]="'COMMON.CLIENT_ID'", [required]="true"
(clientSelected) -> account.clientId = $event

Section 2 - Product Selection (full width row):
Product select dropdown with "create new product" button
[disabled]="isEditMode"
Options loaded from SavingsProductService.getSavingsproducts()
(ngModel) on account.productId

Section 3 - Details (2-column grid):
Row 1: - Submitted On Date (datepicker, REQUIRED)
Row 2: - Nominal Annual Interest Rate (number input, bound to interestRate separately)
NOTE: No % suffix in template

NOTE: There is NO External ID field in the UI template despite
PostSavingsAccountsRequest having externalId as an optional field

--- CLASS PROPERTIES ---

account: PostSavingsAccountsRequest = {};
Typed model (not Record), fields: clientId?, productId?, submittedOnDate?,
dateFormat?, externalId?, locale?

interestRate = 0;
Bound separately because nominalAnnualInterestRate is NOT in PostSavingsAccountsRequest
(API model mismatch -- must be added via Record cast in the payload)

submittedOnDate: Date = new Date();

products: GetSavingsProductsResponse[] = [];
Loaded on init (unlike Fixed which loads after client selection)

--- API CALL: Load Products ---

Service: SavingsProductService.getSavingsproducts()
Endpoint: GET /api/v2/savingsproducts
Response: GetSavingsProductsResponse[]
Timing: Called in ngOnInit(), ALWAYS loads all products (no clientId filter)
Populates: products dropdown

--- API CALL: Load Account Data (Edit mode) ---

Service: SavingsAccountService.getSavingsaccountsAccountId()
Endpoint: GET /api/v2/savingsaccounts/{accountId}
Response: SavingsAccountData
Populates: - account.clientId = data.clientId - account.productId = data.savingsProductId - interestRate = data.nominalAnnualInterestRate || 0 - submittedOnDate from data.timeline.submittedOnDate (number[] -> Date)

--- API CALL: Create Savings Account ---

Service: SavingsAccountService.postSavingsaccounts()
Endpoint: POST /api/v2/savingsaccounts
Body: PostSavingsAccountsRequest (built as Record<string,unknown>)
{
clientId: number,
productId: number,
submittedOnDate: string (formatted via formatDateToFineract),
dateFormat: 'yyyy-MM-dd',
locale: 'en',
nominalAnnualInterestRate: number // added via Record spread
}

Payload construction:
account.submittedOnDate = formatDateToFineract(submittedOnDate)
account.dateFormat = FINERACT_DATE_FORMAT
account.locale = FINERACT_LOCALE
payload = { ...account, nominalAnnualInterestRate: interestRate }

MANDATORY fields per API: clientId, productId, submittedOnDate

--- API CALL: Update Savings Account ---

Service: SavingsAccountService.putSavingsaccountsAccountId()
Endpoint: PUT /api/v2/savingsaccounts/{accountId}
Body: Record<string, unknown> (same built payload as create)
{
clientId: number,
productId: number,
submittedOnDate: string,
dateFormat: 'yyyy-MM-dd',
locale: 'en',
nominalAnnualInterestRate: number
}

--- ON SUCCESS NAVIGATION ---

On success: router.navigate(['/products/savings-accounts'])
On cancel: router.navigate(['/products/savings-accounts'])

--- INLINE CREATE ---

onCreateClient(): router.navigate(['/clients/create'])
onCreateProduct(): router.navigate(['/products/savings/create'])

================================================================================ 4. SAVINGS ACCOUNT TRANSACTION FORM (SavingsAccountTransactionFormComponent)
================================================================================

FILE: savings-account-transaction-form.component.ts

--- COMMANDS SUPPORTED ---

command: 'deposit' or 'withdrawal' (from route param)
Title: 'SAVINGS.DEPOSIT' or 'SAVINGS.WITHDRAWAL'

--- API CALL: Load Transaction Template ---

Service: SavingsAccountTransactionsService.getSavingsaccountsSavingsIdTransactionsTemplate()
Endpoint: GET /api/v2/savingsaccounts/{savingsId}/transactions/template

IMPORTANT: OpenAPI returns Observable<string> (template as raw string).
The component: 1. Parses string to JSON if needed: JSON.parse(template) 2. Extracts: paymentTypeOptions, date (number[] -> Date)

--- FORM FIELDS ---

Transaction Date (datepicker, required)
Transaction Amount (number, required)
Payment Type (select from template, required)
Note (textarea)

--- API CALL: Execute Transaction ---

Service: SavingsAccountTransactionsService.postSavingsaccountsSavingsIdTransactions()
Endpoint: POST /api/v2/savingsaccounts/{savingsId}/transactions?command={command}
Body: PostSavingsAccountTransactionsRequest (via Record<string,unknown>)
{
transactionDate: string (formatted as 'yyyy-MM-dd'),
transactionAmount: number,
paymentTypeId: number,
dateFormat: 'yyyy-MM-dd', // DIFFERENT format from other modules
locale: 'en',
note: string
}

--- ON SUCCESS ---

On success: router.navigate(['/products/savings-accounts'])
On cancel: router.navigate(['/products/savings-accounts'])

================================================================================ 5. SAVINGS ACCOUNT ACTION FORM (AccountActionFormComponent) [NEW]
================================================================================

FILE: account-action-form.component.ts (~599 lines)
NOTE: SHARED component for savings, fixed, recurring, AND loan accounts
ROUTE: /products/{accountType}/{accountId}/action/{command}

--- ROUTE & COMMANDS ---

accountType: 'savings' | 'fixed' | 'recurring' | 'loan' (from route param)
accountId: number (from route param)
command: string (from route param, default: 'approve')

Commands for savings:
approve -> 'ACTIONS.APPROVE_ACCOUNT' / approval date
activate -> 'ACTIONS.ACTIVATE_ACCOUNT' / activation date
close -> 'ACTIONS.CLOSE_ACCOUNT' / closure date
block -> (falls back to approve config)
reject -> (falls back to approve config)

Commands for loan only:
disburse, assignloanofficer, unassignloanofficer, applycharges

--- API CALL: Load Account Details ---

Determined by accountType:
savings: SavingsAccountService.getSavingsaccountsAccountId(id)
fixed: FixedDepositAccountService (retrieveOne14 dynamic)
recurring: RecurringDepositAccountService (retrieveOne18 dynamic)
loan: LoansService.retrieveLoan(id)

Response populates accountDetails (Record<string,unknown>)

Summary panel fields: Account No, Client/Group Name, Product Name,
Amount (depositAmount/principal) with currency, Interest Rate %,
Term (depositPeriod/numberOfRepayments) with frequency, Submitted On Date

--- FORM FIELDS (template) ---

1. Staff select (ONLY for assignloanofficer)
   Loaded from StaffService.getStaff() -> staffOptions[]

2. Charge select + Amount (ONLY for applycharges)
   Loaded from ChargesService.getCharges(), filtered active+Loan
   onChargeSelected auto-fills amount

3. Action Date (datepicker, REQUIRED)
   Default: new Date(), label varies by command

4. Expected Disbursement Date (ONLY for loan approve)
   datepicker, required

5. Note (textarea, optional, 4 rows)

--- API CALL: Execute Savings Action ---

Service: SavingsAccountService.postSavingsaccountsAccountId()
Endpoint: POST /api/v2/savingsaccounts/{accountId}?command={command}
Body: Record<string, unknown>
{
dateFormat: 'yyyy-MM-dd',
locale: 'en',
note?: string, // included for all EXCEPT 'activate'
approvedOnDate?: string, // for 'approve'
activatedOnDate?: string, // for 'activate'
closedOnDate?: string // for 'close'
}

--- NAVIGATION ON SUCCESS/CANCEL ---

Based on accountType:
savings: router.navigate(['/products/savings-accounts'])
fixed: router.navigate(['/products/fixed-deposits'])
recurring: router.navigate(['/products/recurring-deposits'])
loan: router.navigate(['/loans/view', accountId])

--- COMPLETE SAVINGS ACCOUNT LIFECYCLE FLOW ---

CREATED (Submitted and pending approval)
Component: SavingsAccountFormComponent
Page: /products/savings-accounts/create
API: POST /api/v2/savingsaccounts

    --> APPROVE
      Component:  AccountActionFormComponent
      Page:       /products/savings/{id}/action/approve
      API:        POST /api/v2/savingsaccounts/{id}?command=approve
                  { approvedOnDate, dateFormat, locale, note }

    --> REJECT (alternative from pending)
      Component:  AccountActionFormComponent
      Page:       /products/savings/{id}/action/reject
      API:        POST /api/v2/savingsaccounts/{id}?command=reject

APPROVED
--> ACTIVATE
Component: AccountActionFormComponent
Page: /products/savings/{id}/action/activate
API: POST /api/v2/savingsaccounts/{id}?command=activate
{ activatedOnDate, dateFormat, locale }
NOTE: Note is NOT included for activate

ACTIVE (status.active === true)
--> DEPOSIT
Component: SavingsAccountTransactionFormComponent
Page: /products/savings-accounts/{id}/transactions/deposit
API: POST /api/v2/savingsaccounts/{id}/transactions?command=deposit

    --> WITHDRAWAL
      Component:  SavingsAccountTransactionFormComponent
      Page:       /products/savings-accounts/{id}/transactions/withdrawal
      API:        POST /api/v2/savingsaccounts/{id}/transactions?command=withdrawal

    --> BLOCK
      Component:  AccountActionFormComponent
      Page:       /products/savings/{id}/action/block
      API:        POST /api/v2/savingsaccounts/{id}?command=block

    --> CLOSE
      Component:  AccountActionFormComponent
      Page:       /products/savings/{id}/action/close
      API:        POST /api/v2/savingsaccounts/{id}?command=close
                  { closedOnDate, dateFormat, locale, note }

CLOSED - End of lifecycle

--- PERMISSIONS ---

'APPROVE_SAVINGSACCOUNT' -> Approve
'ACTIVATE_SAVINGSACCOUNT' -> Activate
'CLOSE_SAVINGSACCOUNT' -> Close
'REJECT_SAVINGSACCOUNT' -> Reject
'DEPOSIT_SAVINGSACCOUNT' -> Deposit
'WITHDRAW_SAVINGSACCOUNT' -> Withdrawal

================================================================================

================================================================================ 6. SAVINGS CHARGES LIST (SavingsChargesListComponent)
================================================================================

FILE: savings-charges/savings-charges-list.component.ts

Route param: savingsAccountId (via snapshot)

--- API CALL: List Charges ---

Service: SavingsChargesService.getSavingsaccountsSavingsAccountIdCharges()
Endpoint: GET /api/v2/savingsaccounts/{savingsAccountId}/charges
Response: GetSavingsAccountsSavingsAccountIdChargesResponse[]
{ id?, name?, amount?, amountOutstanding? }

--- COLUMNS ---

name, amount, amountOutstanding, actions (Delete)

--- API CALL: Delete Charge ---

Service: SavingsChargesService.deleteSavingsaccountsSavingsAccountIdChargesSavingsAccountChargeId()
Endpoint: DELETE /api/v2/savingsaccounts/{savingsAccountId}/charges/{chargeId}
Uses window.confirm()

--- NAVIGATION ---

onCreate(): /products/savings-accounts/{savingsAccountId}/charges/create

================================================================================ 7. SAVINGS CHARGE CREATE FORM (SavingsChargeFormComponent)
================================================================================

FILE: savings-charges/savings-charge-form.component.ts

Route param: savingsAccountId (via snapshot)

--- API CALL: Load Charge Options ---

Service: SavingsChargesService.getSavingsaccountsSavingsAccountIdChargesTemplate()
Endpoint: GET /api/v2/savingsaccounts/{savingsAccountId}/charges/template
Response: { chargeOptions?: GetSavingsChargesOptions[] }
GetSavingsChargesOptions: { id?, name? }

--- FORM FIELDS ---

Charge (select from template, required)
Amount (number, required)
Due Date (datepicker, optional)

--- API CALL: Create Charge ---

Service: SavingsChargesService.postSavingsaccountsSavingsAccountIdCharges()
Endpoint: POST /api/v2/savingsaccounts/{savingsAccountId}/charges
Body: PostSavingsAccountsSavingsAccountIdChargesRequest
{ chargeId, amount, dueDate, dateFormat:'yyyy-MM-dd', locale:'en' }

--- NAVIGATION ---

On success: /products/savings-accounts/{savingsAccountId}/charges
On cancel: /products/savings-accounts/{savingsAccountId}/charges

================================================================================ 8. SHARED UTILITY: ACCOUNT TYPE RESOLVER
================================================================================

FILE: core/utils/account-type-resolver.ts

--- resolveAccountActionType(account) ---

Returns 'savings' | 'fixed' | 'recurring'

Resolution order: 1. Check nested account['depositType']['id'] 2. Check root account['depositTypeId'] 3. Fallback to productName inspection (contains 'fixed' or 'recurring') 4. Deposit ID 200 = 'fixed', 300 = 'recurring', else 'savings'

--- resolveAccountRoutePrefix(account) ---

Returns 'savings-accounts' | 'fixed-deposits' | 'recurring-deposits'
Based on resolveAccountActionType():
'fixed' -> 'fixed-deposits'
'recurring' -> 'recurring-deposits'
default -> 'savings-accounts'

Used extensively for dynamic navigation across savings-related routes.

================================================================================ 9. DATE FORMATTING
================================================================================

FILE: core/utils/date-formatter.ts

formatDateToFineract(date): 'yyyy-MM-dd' format
Used in: Create/Update Savings Account, Savings Charge Create

EXCEPTION: Transaction form uses raw 'yyyy-MM-dd' format inline
(NOT using the shared formatDateToFineract utility)

================================================================================ 10. PERMISSION DIRECTIVE
================================================================================

FILE: shared/directives/has-permission.directive.ts

Permissions used: - 'CREATE_SAVINGSACCOUNT' - 'UPDATE_SAVINGSACCOUNT' - 'DELETE_SAVINGSACCOUNT' - 'APPROVE_SAVINGSACCOUNT' - 'REJECT_SAVINGSACCOUNT' - 'WITHDRAW_SAVINGSACCOUNT' - 'DEPOSIT_SAVINGSACCOUNT'

================================================================================ 11. I18N TRANSLATION KEY PREFIXES
================================================================================

SAVINGS.* - Savings account labels
SAVINGS_CHARGES.* - Savings charges labels
COMMON.* - Shared labels
HELP.* - Help text tooltips
nav.savingsAccounts - List page title

================================================================================ 12. SAVINGS PRODUCT FORM (SavingsProductFormComponent)
================================================================================

FILE: savings-product-form.component.ts (~264 lines)
NOTE: Route is /products/savings (create / edit)

--- MODE DETECTION ---

isEditMode = route has :id param (via paramMap subscription)
If edit: productId = +params.get('id')

--- DEFAULTS ---

product: PostSavingsProductsRequest = {
currencyCode: 'USD',
digitsAfterDecimal: 2,
interestCompoundingPeriodType: 1,
interestPostingPeriodType: 4,
interestCalculationType: 1,
interestCalculationDaysInYearType: 365,
accountingRule: 1,
};

--- API CALL: Load Product Data (Edit mode) ---

Service: SavingsProductService.getSavingsproductsProductId()
Endpoint: GET /api/v2/savingsproducts/{productId}
Response: GetSavingsProductsProductIdResponse
Populates: - product.name = data.name - product.shortName = data.shortName - product.description = data.description - product.currencyCode = data.currency?.code - product.digitsAfterDecimal = data.currency?.decimalPlaces - product.nominalAnnualInterestRate = data.nominalAnnualInterestRate

IMPORTANT: interestCompoundingPeriodType, interestPostingPeriodType,
interestCalculationType, interestCalculationDaysInYearType
are OVERWRITTEN back to defaults (1,4,1,365) — NOT from API

--- FORM FIELDS (template layout) ---

Grid layout: 2 columns

Row 1 - Name (text, REQUIRED) [full width via full-width class]
matTooltip: 'HELP.PRODUCT_NAME_DESC'
ngModel: product.name

Row 2: - Short Name (text, REQUIRED, maxlength 4)
matTooltip: 'HELP.SHORT_NAME_DESC'
ngModel: product.shortName - Currency Code (select, REQUIRED)
matTooltip: 'HELP.CURRENCY_DESC'
Options: USD, EUR, INR (hardcoded, NOT from API)
ngModel: product.currencyCode

Row 3: - Description (textarea, 3 rows, full width)
matTooltip: 'HELP.DESCRIPTION_DESC'
ngModel: product.description
(empty cell)

Row 4: - Digits After Decimal (number, REQUIRED)
matTooltip: 'HELP.DECIMAL_PLACES_DESC'
ngModel: product.digitsAfterDecimal - Nominal Annual Interest Rate (number, REQUIRED, no % suffix)
matTooltip: 'HELP.INTEREST_RATE_DESC'
ngModel: product.nominalAnnualInterestRate

--- API CALL: Create ---

Service: SavingsProductService.postSavingsproducts()
Endpoint: POST /api/v2/savingsproducts
Body: PostSavingsProductsRequest (typed)
{ name, shortName, description?, currencyCode, digitsAfterDecimal,
nominalAnnualInterestRate?, interestCompoundingPeriodType,
interestPostingPeriodType, interestCalculationType,
interestCalculationDaysInYearType, accountingRule, locale:'en' }

--- API CALL: Update ---

Service: SavingsProductService.putSavingsproductsProductId()
Endpoint: PUT /api/v2/savingsproducts/{productId}
Body: PutSavingsProductsProductIdRequest (product cast)
SAME fields as create (no charts needed unlike Fixed)

--- NAVIGATION ---

On success: router.navigate(['/products/savings'])
On cancel: router.navigate(['/products/savings'])

================================================================================
END OF DOCUMENT
================================================================================
