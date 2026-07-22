ACCOUNT TRANSFERS MODULE - COMPLETE API CALLS & BUSINESS LOGIC
=============================================================

This document captures every API call and business logic rule across the
/transfers pages of fineract-backoffice-ui.

================================================================================

1. ACCOUNT TRANSFER LIST (AccountTransfersListComponent)
   \================================================================================

FILE: account-transfers-list.component.ts
ROUTE: /transfers/history

--- API CALL: List Account Transfers ---

Service: AccountTransfersService.getAccounttransfers()
Endpoint: GET /api/v2/accounttransfers
Parameters: (none - no pagination, no filters)
Response: GetAccountTransfersResponse
{ pageItems?: Array<GetAccountTransfersPageItems> }

GetAccountTransfersPageItems:
{ id?, fromAccount?:{id?}, toAccount?:{id?}, currency?:{code?},
transferAmount?, transferDate?, transferDescription? }

--- BUSINESS LOGIC ---

Simple subscribe (no RxJS pipeline)
Uses plain mat-table (NOT DataTableComponent)
Uses isLoading local flag

loadTransfers():
getAccounttransfers().subscribe()
On success: transfers = Array.from(response.pageItems || [])
On error: isLoading = false

--- DISPLAYED COLUMNS ---

id, fromAccountId (row.fromAccount?.id), toAccountId (row.toAccount?.id),
currency.code, transferAmount (DecimalPipe 1.2-2),
transferDate (parseDate + DatePipe mediumDate), transferDescription

--- DATE PARSING ---

parseDate(transferDate): Date | null
null -> null, number[] -> new Date(arr[0], arr[1]-1, arr[2]),
string/number -> new Date(transferDate)

================================================================================ 2. ACCOUNT TRANSFER FORM (AccountTransferFormComponent)
================================================================================

FILE: account-transfer-form.component.ts (~425 lines)
ROUTE: /transfers/account-transfer

--- UI LAYOUT ---

Two-column grid: LEFT (From) and RIGHT (To) sections
Each section: Office -> Client -> Account Type -> Account (cascading)
Bottom: Transfer Date, Amount, Description

--- CASCADING DROPDOWN LOGIC ---

From Office -> loads Clients -> select Client
-> select Account Type (2=Savings, 1=Loans) -> loads Accounts
To Office -> loads Clients -> select Client
-> select Account Type -> loads Accounts

--- API CALL: Load Offices ---

Service: OfficesService.getOffices()
Endpoint: GET /api/v2/offices
Response: GetOfficesResponse[] -> offices signal
First office auto-selects by default

--- API CALL: Load Clients (on Office select) ---

onOfficeChange(type):
Service: ClientService.getClients()
Endpoint: GET /api/v2/clients?officeId={officeId}
Populates: fromClients[] or toClients[] signal

--- API CALL: Load Accounts (on Client + Account Type select) ---

onAccountTypeChange(type):
Service: ClientService.getClientsClientIdAccounts()
Endpoint: GET /api/v2/clients/{clientId}/accounts
If accountType === '2' (Savings) -> data.savingsAccounts as MiniAccount[]
Else (Loans, type 1) -> data.loanAccounts as MiniAccount[]

--- FORM FIELDS (template) ---

FROM Section (left column):
Office (select, from offices())
Client (select, from fromClients())
Account Type (select: 1=Loans, 2=Savings)
Account (select, from fromAccounts())
Display: accountNo - productName

TO Section (right column):
Office (select, from toOffices())
Client (select, from toClients())
Account Type (select: 1=Loans, 2=Savings)
Account (select, from toAccounts())
Display: accountNo - productName

Bottom (full width):
Transfer Date (datepicker, default new Date())
Transfer Amount (number, REQUIRED)
Transfer Description (text)

--- CLASS PROPERTIES ---

request: AccountTransferRequest = {} // ALL fields are strings
transferDate: Date = new Date()
Signals: offices, fromClients, toClients, fromAccounts, toAccounts

--- API CALL: Create Transfer ---

Service: AccountTransfersService.postAccounttransfers()
Endpoint: POST /api/v2/accounttransfers
Body: AccountTransferRequest
{ fromOfficeId:string, fromClientId:string, fromAccountType:string,
fromAccountId:string, toOfficeId:string, toClientId:string,
toAccountType:string, toAccountId:string,
transferAmount:string, transferDescription:string,
transferDate:string, dateFormat:'dd MMMM yyyy', locale:'en' }

ALL ID fields are converted to STRING before send (not Number)

--- NAVIGATION ---

On success: router.navigate(['/clients/view', request.fromClientId])
On cancel: if fromClientId -> /clients/view/:id else -> /clients

================================================================================ 3. STANDING INSTRUCTIONS LIST (StandingInstructionsListComponent)
================================================================================

FILE: standing-instructions-list.component.ts
ROUTE: /transfers/standing-instructions

--- API CALL: List ---

Service: StandingInstructionsService.getStandinginstructions()
Endpoint: GET /api/v2/standinginstructions
Response: { pageItems?: Array<GetPageItemsStandingInstructionSwagger> }

--- COLUMNS (DataTable, localLogic) ---

name, fromClientName, fromAccount.accountNo, toClientName,
toAccount.accountNo, amount (DecimalPipe), validFrom (DatePipe),
validTill (DatePipe), status.value, actions (Edit button)

================================================================================ 4. STANDING INSTRUCTION FORM (StandingInstructionFormComponent)
================================================================================

FILE: standing-instruction-form.component.ts (~605 lines)
ROUTES: /transfers/standing-instructions/create
/transfers/standing-instructions/edit/:id

--- MODE DETECTION ---

isEditMode = route param 'id' exists
If edit: instructionId = +params.get('id')

--- FORM SECTIONS ---

1. Name (text, REQUIRED, full width)

2. From Account (cascading: Office -> Client -> Account Type -> Account)

3. To Account (cascading: Office -> Client -> Account Type -> Account)

4. Rule Details:
   Transfer Type (select: 1=Client selected)
   Amount (number, required)
   Instruction Type (select: 1=Fixed)
   Priority (select: 1=Urgent, 2=High, 3=Medium, 4=Low)
   Recurrence Type (select: 1=Periodic, 2=As Jove)
   Recurrence Frequency (select: 0=Days,1=Weeks,2=Months,3=Years)
   Recurrence Interval (number)
   Status (select: 1=Active)
   Valid From (datepicker, REQUIRED)
   Valid Till (datepicker, optional)

--- API CALLS (cascading) ---

Offices: OfficesService.getOffices()
Clients: ClientService.getClients(officeId)
Accounts: ClientService.getClientsClientIdAccounts(clientId)
Identical cascading pattern as Account Transfer Form

--- API CALL: Load Data (Edit mode) ---

Service: StandingInstructionsService.getStandinginstructionsStandingInstructionId()
Endpoint: GET /api/v2/standinginstructions/{id}
Populates all from/to and rule fields including validFrom/validTill dates

--- API CALL: Create ---

Service: StandingInstructionsService.postStandinginstructions()
Endpoint: POST /api/v2/standinginstructions
Body: StandingInstructionCreationRequest with ALL fields stringified:
{ name, fromOfficeId, fromClientId, fromAccountType, fromAccountId,
toOfficeId, toClientId, toAccountType, toAccountId,
transferType, amount, instructionType, priority,
recurrenceType, recurrenceFrequency?, recurrenceInterval?,
status, validFrom, validTill?, dateFormat, locale, monthDayFormat }

Additional field: monthDayFormat: 'dd MMMM'

--- API CALL: Update ---

Service: StandingInstructionsService.putStandinginstructionsStandingInstructionId()
Endpoint: PUT /api/v2/standinginstructions/{id}
Body: Same as create payload

--- NAVIGATION ---

On success/cancel: router.navigate(['/transfers/standing-instructions'])

================================================================================ 5. STANDING INSTRUCTION HISTORY (StandingInstructionHistoryComponent)
================================================================================

FILE: standing-instruction-history.component.ts
ROUTE: /transfers/standing-instructions/history

--- API CALL: List History ---

Service: StandingInstructionsHistoryService.getStandinginstructionrunhistory()
Endpoint: GET /api/v2/standinginstructionrunhistory
Response: { pageItems?: Array<GetStandingInstructionHistoryPageItemsResponse> }

--- COLUMNS (DataTable, localLogic) ---

name, fromClientName, fromAccount.accountNo, toClientName,
toAccount.accountNo, amount (DecimalPipe),
executionTime (DatePipe medium), status, errorLog
Read-only - no actions

================================================================================ 6. SHARED PATTERNS
================================================================================

--- CASCADING DROPDOWN ---

Office -> Clients -> Account Type (1=Loans, 2=Savings) -> Accounts
Uses ClientService.getClientsClientIdAccounts() for both transfer forms

--- STRING CONVERSION ---

ALL ID fields converted to String() before API submission
Applies to AccountTransferRequest AND StandingInstructionCreationRequest

--- DATE FORMAT ---

Both forms: 'dd MMMM yyyy' via formatDateToFineract()
Standing Instruction adds: monthDayFormat: 'dd MMMM'

================================================================================ 7. I18N TRANSLATION KEY PREFIXES
================================================================================

TRANSFERS.* - Transfer/history labels
CLIENTS.* - Shared labels (TRANSFER_FROM, TRANSFER_TO, etc.)
COMMON.* - Shared labels
ACTIONS.ACCOUNT_TRANSFER - Form title

================================================================================
END OF DOCUMENT
================================================================================

MiniAccount: { id: number, accountNo: string, productName: string }
