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

--- FORM FIELDS ---

Client: using ClientSearchComponent (with create new client option)
Savings Product (select from products, with create new product option)
External ID (text input)
Interest Rate (number, bound separately - missing from model)
Submitted On Date (datepicker)

--- API CALL: Create Savings Account ---

Service: SavingsAccountService.postSavingsaccounts()
Endpoint: POST /api/v2/savingsaccounts
Body (via Record<string,unknown>):
{ clientId, productId, externalId?, submittedOnDate,
nominalAnnualInterestRate, dateFormat, locale }

--- API CALL: Update Savings Account ---

Service: SavingsAccountService.putSavingsaccountsAccountId()
Endpoint: PUT /api/v2/savingsaccounts/{accountId}
Body: Record<string, unknown> (same fields)

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

================================================================================ 5. SAVINGS CHARGES LIST (SavingsChargesListComponent)
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

================================================================================ 6. SAVINGS CHARGE CREATE FORM (SavingsChargeFormComponent)
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
{ chargeId, amount, dueDate, dateFormat:'dd MMMM yyyy', locale:'en' }

--- NAVIGATION ---

On success: /products/savings-accounts/{savingsAccountId}/charges
On cancel: /products/savings-accounts/{savingsAccountId}/charges

================================================================================ 7. SHARED UTILITY: ACCOUNT TYPE RESOLVER
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

================================================================================ 8. DATE FORMATTING
================================================================================

FILE: core/utils/date-formatter.ts

formatDateToFineract(date): 'dd MMMM yyyy' format
Used in: Create/Update Savings Account, Savings Charge Create

EXCEPTION: Transaction form uses raw 'yyyy-MM-dd' format inline
(NOT using the shared formatDateToFineract utility)

================================================================================ 9. PERMISSION DIRECTIVE
================================================================================

FILE: shared/directives/has-permission.directive.ts

Permissions used: - 'CREATE_SAVINGSACCOUNT' - 'UPDATE_SAVINGSACCOUNT' - 'DELETE_SAVINGSACCOUNT' - 'APPROVE_SAVINGSACCOUNT' - 'REJECT_SAVINGSACCOUNT' - 'WITHDRAW_SAVINGSACCOUNT' - 'DEPOSIT_SAVINGSACCOUNT'

================================================================================ 10. I18N TRANSLATION KEY PREFIXES
================================================================================

SAVINGS.* - Savings account labels
SAVINGS_CHARGES.* - Savings charges labels
COMMON.* - Shared labels
HELP.* - Help text tooltips
nav.savingsAccounts - List page title

================================================================================
END OF DOCUMENT
================================================================================
