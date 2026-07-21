CLIENTS MODULE - COMPLETE API CALLS & BUSINESS LOGIC
=====================================================

This document captures every API call and business logic rule across the
/clients pages of fineract-backoffice-ui (Angular standalone components).

I am migrating Apache Fineract Angular to my existing React application.

My stack:

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- React Hook Form
- Zod
- Zustand
- TailwindCSS
- shadcn/ui
- Axios
- React Table (TanStack Table)

I DO NOT want Angular code.

================================================================================

1. CLIENTS LIST (ClientsListComponent)
   \================================================================================

FILE: clients-list.component.ts

--- API CALL: Get Paginated Clients ---

Service: ClientService.getClients()
Endpoint: GET /api/v2/clients
Parameters: (all optional) - officeId: number | undefined - externalId: string | undefined - displayName: string | undefined (search term wrapped in %...%) - firstName: string | undefined - lastName: string | undefined - status: string | undefined ("active" | "pending" | "closed") - phone: string | undefined - offset: number | undefined (pageIndex * pageSize) - limit: number | undefined (pageSize) - orderBy: string | undefined (column key) - sortOrder: string | undefined ("ASC" | "DESC") - staffInSelectedOfficeOnly: boolean | undefined (always false) - loanOfficerId: number | undefined (always 1)

Response Type: GetClientsResponse
{ pageItems?: Array<GetClientsPageItemsResponse>, totalFilteredRecords?: number }

GetClientsPageItemsResponse:
{ accountNo?, active?, displayName?, emailAddress?, fullname?, id?, officeId?, officeName?, status?: GetClientStatus }

GetClientStatus:
{ code?: string, description?: string, id?: number }

--- BUSINESS LOGIC: Reactive Data Loading ---

Uses RxJS merge() of 4 event streams: 1. searchSubject - user typing in search bar 2. sortSubject - column header click 3. pageSubject - paginator page change 4. filterSubject - status dropdown change

Pipeline:
merge(streams).pipe(
startWith({}), // triggers initial load
switchMap(() => {
offset = currentPage.pageIndex * currentPage.pageSize
limit = currentPage.pageSize
orderBy = currentSort.active || undefined
sortOrder = currentSort.direction?.toUpperCase() || undefined
displayName = currentFilter ? `%${currentFilter}%` : undefined
status = activeFilters.status
return clientService.getClients(_,_,displayName,_,_,status,_,offset,limit,orderBy,sortOrder,false,1)
.pipe(catchError(() => of(null)))
}),
map(response => {
if (!response) return []
totalRecords = response.totalFilteredRecords || 0
return response.pageItems || []
})
).subscribe(data => clients = data)

Every search/sort/page/filter resets pageIndex to 0 (except page change).
Error silently returns empty array via catchError.
Search uses SQL LIKE pattern: %query%.

--- COLUMNS ---

Columns: ColumnDef[] = [
{ key: 'accountNo', label: 'CLIENTS.ACCOUNT_NO', sortable: true },
{ key: 'fullname', label: 'COMMON.NAME', sortable: true },
{ key: 'status', label: 'COMMON.STATUS', sortable: true },
{ key: 'officeName',label: 'COMMON.OFFICE', sortable: true },
{ key: 'actions', label: 'COMMON.ACTIONS', sortable: false },
]

Custom renderings: - "fullname": clickable <a> link -> /clients/view/:id - "status": <app-status-badge [status]="client.status"> - "actions": Edit (/clients/edit/:id) + View (/clients/view/:id) buttons

--- STATUS FILTER ---

Options: All | Active | Pending | Closed
Stored in: activeFilters.status (string | undefined)
On change: resets pageIndex to 0, triggers filterSubject.next()

--- PERMISSION ---

"Create Client" button requires: 'CREATE_CLIENT' (*appHasPermission)

--- NAVIGATION ---

onCreateClient(): router.navigate(['/clients/create'])
onEditClient(client): router.navigate(['/clients/edit', client.id])
onViewClient(client): router.navigate(['/clients/view', client.id])

================================================================================ 2. CLIENT VIEW / 360-PROFILE (ClientViewComponent)
================================================================================

FILE: client-view.component.ts (~955 lines)

--- API CALL: Get Single Client ---

Service: ClientService.getClientsClientId()
Endpoint: GET /api/v2/clients/{clientId}
Response: GetClientsClientIdResponse (large composite object)

Key properties: - id, accountNo, displayName, firstname, lastname, middlename, fullname - externalId, mobileNo, emailAddress - officeId, officeName, status: GetClientStatus - activatedOnDate, submittedOnDate, activationDate: number[] - timeline: ClientTimelineData - savingsProductList, savingsAccounts: Array<GetClientsSavingsAccounts> - loanAccounts: Array<GetClientsLoanAccounts> - legalForm: { id, code, value } - dateOfBirth, clientType, clientClassification, staff, groups - isStaff, isChildGroup - closureReason/Date, rejectionReason/Date, withdrawalReason/Date, reactivationDate

GetClientsLoanAccounts:
{ accountNo, productName, loanType, loanCycle, disbursedAmount,
principalAmount, outstandingBalance, totalOverpaid, inArrears, status }

GetClientsSavingsAccounts:
{ accountNo, productName, accountBalance, status }

--- LOADING LOGIC ---

ngOnInit(): reads route 'id', calls loadClientData()
loadClientData(): calls clientService.getClientsClientId(this.clientId)
-> sets client signal, computes summaries, loads datatables

--- STATUS ID MAPPING ---

100 -> Pending (can: activate, reject, withdraw, delete)
300 -> Active (can: close)
400 -> Withdrawn
500 -> Rejected (can: undoReject)
600 -> Closed (can: reactivate)

--- DASHBOARD SUMMARY STATS ---

computed from client(): - activeLoanCount: loans where status.id === 300 - totalActiveLoanAmount: sum of principalAmount for active loans - savingsCount: savingsAccounts?.length || 0 - totalSavingsBalance: sum of accountBalance for savings

--- ACTIONS DROPDOWN (mat-menu) ---

Status 100 (Pending): Activate->'ACTIVATE_CLIENT', Reject->'REJECT_CLIENT',
Withdraw->'WITHDRAW_CLIENT', Delete->'DELETE_CLIENT'
Status 300 (Active): Close->'CLOSE_CLIENT'
Status 600 (Closed): Reactivate->'REACTIVATE_CLIENT'
Status 500 (Rejected): Undo Reject->'UNDOREJECT_CLIENT'
Status 400 (Withdrawn):Undo Withdraw->'UNDOWITHDRAW_CLIENT'

--- API CALL: Execute Client Action ---

Service: ClientService.postClientsClientId()
Endpoint: POST /api/v2/clients/{clientId}?command={command}

Payloads:
activate: { activationDate, dateFormat, locale }
reject: { rejectionDate, dateFormat, locale, rejectionReasonId? }
withdraw: { withdrawalDate, dateFormat, locale, withdrawalReasonId? }
close: { closureDate, dateFormat, locale, closureReasonId? }
reactivate: { reactivationDate, dateFormat, locale }
undoReject: { reopenedDate, dateFormat, locale }
undoWithdraw:{ reopenedDate, dateFormat, locale }
(dateFormat='dd MMMM yyyy', locale='en')

--- API CALL: Delete Client ---

Service: ClientService.deleteClientsClientId()
Endpoint: DELETE /api/v2/clients/{clientId}
Uses window.confirm(), on success: router.navigate(['/clients'])

--- BUSINESS LOGIC: Action Dialog ---

Opens MatDialog (ClientActionDialogComponent)
data: { title, command, clientId }
Returns: { actionDate: Date, reasonId?: number, note?: string }
Post-action: for activate/reactivate/undoReject/undoWithdraw,
if result.note -> NotesService.postResourceTypeResourceIdNotes()

--- LOAN ACCOUNTS TABLE ---

Columns: accountNo (->/products/loan/:id), productName,
loanType.value, loanCycle, disbursedAmount, principalAmount,
outstandingBalance, totalOverpaid, inArrears, status, actions

--- SAVINGS ACCOUNTS TABLE ---

Columns: accountNo, productName, accountBalance, status, actions
Actions: Transaction, Action (type resolved via resolveAccountActionType)

--- CREATE PRODUCT NAVIGATION ---

onCreateLoan(): /loans/create?clientId={clientId}
onCreateSavings(): /products/savings-accounts/create?clientId={clientId}
onCreateFixed(): /products/fixed-deposits/create?clientId={clientId}
onCreateRecurring(): /products/recurring-deposits/create?clientId={clientId}

--- TAB SYSTEM ---

Tab 1: ClientIdentifiersListComponent (@Input clientId)
Tab 2: ClientAddressesListComponent (@Input clientId)
Tab 3: ClientFamilyMembersListComponent (@Input clientId)
Tab 4: ClientNotesListComponent (@Input clientId)
Tab 5: ClientDocumentsListComponent (@Input clientId)
Tab 6: ClientChargesListComponent (route param clientId)
Tab 7: ClientCollateralListComponent (route param clientId)
Tab 8: ClientTransactionsListComponent (route param clientId)
Tab 9: EntityDatatablesComponent (entityType='clients', @Input entityId)

================================================================================ 3. CLIENT CREATE/EDIT FORM (ClientFormComponent)
================================================================================

FILE: clients-list.component.ts

--- API CALL: Get Paginated Clients ---

Service: ClientService.getClients()
Endpoint: GET /api/v2/clients
Parameters: (all optional) - officeId: number | undefined - externalId: string | undefined - displayName: string | undefined (search term wrapped in %...%) - firstName: string | undefined - lastName: string | undefined - status: string | undefined ("active" | "pending" | "closed") - phone: string | undefined - offset: number | undefined (pageIndex * pageSize) - limit: number | undefined (pageSize) - orderBy: string | undefined (column key) - sortOrder: string | undefined ("ASC" | "DESC") - staffInSelectedOfficeOnly: boolean | undefined (always false) - loanOfficerId: number | undefined (always 1)

Response Type: GetClientsResponse
{ pageItems?: Array<GetClientsPageItemsResponse>, totalFilteredRecords?: number }

GetClientsPageItemsResponse:
{ accountNo?, active?, displayName?, emailAddress?, fullname?, id?, officeId?, officeName?, status?: GetClientStatus }

GetClientStatus:
{ code?: string, description?: string, id?: number }

--- BUSINESS LOGIC: Reactive Data Loading ---

Uses RxJS merge() of 4 event streams: 1. searchSubject — user typing in search bar 2. sortSubject — column header click 3. pageSubject — paginator page change 4. filterSubject — status dropdown change

Pipeline:
merge(streams).pipe(
startWith({}), // triggers initial load
switchMap(() => {
offset = currentPage.pageIndex * currentPage.pageSize
limit = currentPage.pageSize
orderBy = currentSort.active || undefined
sortOrder = currentSort.direction?.toUpperCase() || undefined
displayName = currentFilter ? `%${currentFilter}%` : undefined
status = activeFilters.status
return clientService.getClients(_,_,displayName,_,_,status,_,offset,limit,orderBy,sortOrder,false,1)
.pipe(catchError(() => of(null)))
}),
map(response => {
if (!response) return []
totalRecords = response.totalFilteredRecords || 0
return response.pageItems || []
})
).subscribe(data => clients = data)

Every search/sort/page/filter resets pageIndex to 0 (except page change).
Error silently returns empty array via catchError.
Search uses SQL LIKE pattern: %query%.

--- COLUMNS ---

Columns: ColumnDef[] = [
{ key: 'accountNo', label: 'CLIENTS.ACCOUNT_NO', sortable: true },
{ key: 'fullname', label: 'COMMON.NAME', sortable: true },
{ key: 'status', label: 'COMMON.STATUS', sortable: true },
{ key: 'officeName',label: 'COMMON.OFFICE', sortable: true },
{ key: 'actions', label: 'COMMON.ACTIONS', sortable: false },
]

Custom renderings: - "fullname": clickable <a> link -> /clients/view/:id - "status": <app-status-badge [status]="client.status"> - "actions": Edit (/clients/edit/:id) + View (/clients/view/:id) buttons

--- STATUS FILTER ---

Options: All | Active | Pending | Closed
Stored in: activeFilters.status (string | undefined)
On change: resets pageIndex to 0, triggers filterSubject.next()

--- PERMISSION ---

"Create Client" button requires: 'CREATE_CLIENT' (*appHasPermission)

--- NAVIGATION ---

onCreateClient(): router.navigate(['/clients/create'])
onEditClient(client): router.navigate(['/clients/edit', client.id])
onViewClient(client): router.navigate(['/clients/view', client.id])

================================================================================ 4. CLIENT SEARCH V2 (ClientSearchV2Component)
================================================================================

FILE: client-search-v2.component.ts

--- API CALL: Search Clients ---

Service: ClientSearchV2Service.postClientsSearch()
Endpoint: POST /api/v2/clients/search
Body: { request: { text: string }, page: number, size: number }
Response: PageClientSearchData { content?: ClientSearchData[], totalElements? }

--- PAGINATION ---

Default pageSize: 10, options: [10, 25, 50]
search(page): calls API, sets results signal
onPage(event): updates pageSize/pageNumber, calls search(event.pageIndex)

--- NAVIGATION ---

viewClient(id): router.navigate(['/clients/view', id])

================================================================================ 5. CLIENT ACTION DIALOG (ClientActionDialogComponent)
================================================================================

FILE: client-action-dialog.component.ts

--- API CALL: Load Business Date ---

Service: BusinessDateManagementService.getBusinessdate()
Endpoint: GET /api/v2/businessdate
Finds entry with type === 'BUSINESS_DATE', converts number[] to Date
Sets actionDate = maxDate = business date

--- API CALL: Load Reason Code Values ---

Step 1: CodesService.getCodesNameCodeName(codeName)
GET /api/v2/codes/{codeName}
Step 2: CodeValuesService.getCodesCodeIdCodevalues(codeId)
GET /api/v2/codes/{codeId}/codevalues

Code names: 'ClientRejectReason', 'ClientWithdrawReason', 'ClientClosureReason'

--- COMMAND CONFIG ---

activate: { date: activationDateLabel }
reject: { date, reason, codeName: 'ClientRejectReason' }
withdraw: { date, reason, codeName: 'ClientWithdrawReason' }
close: { date, reason, codeName: 'ClientClosureReason' }
reactivate: { date: activationDateLabel }
undoReject: { date: activationDateLabel }
undoWithdraw:{date: activationDateLabel }

--- DIALOG RETURN ---

{ actionDate: Date, reasonId?: number, note: string }

================================================================================ 6. CLIENT IDENTIFIERS (Tab & Form)
================================================================================

--- LIST (ClientIdentifiersListComponent) ---

@Input clientId (required)

API CALL:
Service: ClientIdentifierService.getClientsClientIdIdentifiers()
Endpoint: GET /api/v2/clients/{clientId}/identifiers
Response: ClientIdentifierData[]

Columns: documentType.name, documentKey, description, status, actions

API CALL: Delete
Service: ClientIdentifierService.deleteClientsClientIdIdentifiersIdentifierId()
Endpoint: DELETE /api/v2/clients/{clientId}/identifiers/{identifierId}
Uses window.confirm()

--- FORM (ClientIdentifierFormComponent) ---

Mode: edit if route has :id param

API CALL: Load Template
Service: ClientIdentifierService.getClientsClientIdIdentifiersTemplate()
Endpoint: GET /api/v2/clients/{clientId}/identifiers/template
Loads: allowedDocumentTypes

API CALL: Load Identifier Data (edit)
Service: ClientIdentifierService.getClientsClientIdIdentifiersIdentifierId()
Endpoint: GET /api/v2/clients/{clientId}/identifiers/{identifierId}

API CALL: Create
Service: ClientIdentifierService.postClientsClientIdIdentifiers()
Endpoint: POST /api/v2/clients/{clientId}/identifiers
Body: ClientIdentifierRequest

API CALL: Update
Service: ClientIdentifierService.putClientsClientIdIdentifiersIdentifierId()
Endpoint: PUT /api/v2/clients/{clientId}/identifiers/{identifierId}
Body: ClientIdentifierRequest

Fields: Document Type (select), Document Key, Status (Active/Inactive), Description
On success: navigate to /clients/view/{clientId}

--- STATUS ID MAPPING ---

100 → Pending (can: activate, reject, withdraw, delete)
300 → Active (can: close)
400 → Withdrawn
500 → Rejected (can: undoReject)
600 → Closed (can: reactivate)
================================================================================

7. CLIENT ADDRESSES (Tab & Form)
   \================================================================================

--- LIST (ClientAddressesListComponent) ---

@Input clientId (required)

API CALL:
Service: ClientsAddressService.getClientClientidAddresses()
Endpoint: GET /api/v2/clients/{clientId}/addresses
Response: AddressData[]

Columns: addressType, address (line1+line2+line3), city, stateName,
countryName, isActive (icon), actions

--- FORM (ClientAddressFormComponent) ---

Mode: edit if route has :id param

API CALL: Load Template
Service: ClientsAddressService.getClientAddressesTemplate()
Endpoint: GET /api/v2/clients/addresses/template
Loads: addressTypeIdOptions, stateProvinceIdOptions, countryIdOptions

API CALL: Load Address Data (edit)
Service: ClientsAddressService.getClientClientidAddresses()
Finds address where addressId matches route :id

API CALL: Create
Service: ClientsAddressService.postClientClientidAddresses()
Endpoint: POST /api/v2/clients/{clientId}/addresses?type={addressTypeId}
Body: ClientAddressRequest

API CALL: Update
Service: ClientsAddressService.putClientClientidAddresses()
Endpoint: PUT /api/v2/clients/{clientId}/addresses
Body: ClientAddressRequest

Fields: Address Type, Address Line 1/2/3, City, Town/Village, County/District,
State/Province, Country, Postal Code, Latitude, Longitude, Is Active
On success: navigate to /clients/view/{clientId}

================================================================================ 8. CLIENT FAMILY MEMBERS (Tab & Form)
================================================================================

--- LIST (ClientFamilyMembersListComponent) ---

@Input clientId (required)

API CALL:
Service: ClientFamilyMemberService.getClientsClientIdFamilymembers()
Endpoint: GET /api/v2/clients/{clientId}/familymembers
Response: ClientFamilyMembersData[]

Columns: fullname (firstName+middleName+lastName), relationship, gender,
profession, mobileNumber, actions

API CALL: Delete
Service: ClientFamilyMemberService.deleteClientsClientIdFamilymembersFamilyMemberId()
Endpoint: DELETE /api/v2/familymembers/{familyMemberId}?clientId={clientId}
Uses window.confirm()

--- FORM (ClientFamilyMemberFormComponent) ---

Mode: edit if route has :id param

API CALL: Load Template
Service: ClientFamilyMemberService.getClientsClientIdFamilymembersTemplate()
Endpoint: GET /api/v2/clients/{clientId}/familymembers/template
Loads: relationshipIdOptions, genderIdOptions, maritalStatusIdOptions, professionIdOptions

API CALL: Load Member Data (edit)
Service: ClientFamilyMemberService.getClientsClientIdFamilymembersFamilyMemberId()
Endpoint: GET /api/v2/familymembers/{familyMemberId}?clientId={clientId}
dateOfBirth converted from number[] to Date

API CALL: Create
Service: ClientFamilyMemberService.postClientsClientIdFamilymembers()
Endpoint: POST /api/v2/clients/{clientId}/familymembers
Body: ClientFamilyMemberRequest

API CALL: Update
Service: ClientFamilyMemberService.putClientsClientIdFamilymembersFamilyMemberId()
Endpoint: PUT /api/v2/familymembers/{familyMemberId}?clientId={clientId}
Body: ClientFamilyMemberRequest

Fields: First Name (req), Middle Name, Last Name (req), Relationship, Gender,
Marital Status, Profession (selects), Date of Birth, Qualification,
Mobile Number, Age, Is Dependent (checkbox)
On success: navigate to /clients/view/{clientId}

================================================================================ 9. CLIENT NOTES (Tab & Form)
================================================================================

--- LIST (ClientNotesListComponent) ---

@Input clientId (required)

API CALL:
Service: NotesService.getResourceTypeResourceIdNotes()
Endpoint: GET /api/v2/{resourceType}/{resourceId}/notes
Parameters: resourceType='clients', resourceId=clientId
Response: NoteData[]

Columns: note, createdByUsername, createdOn (DatePipe 'medium'), actions

API CALL: Delete
Service: NotesService.deleteResourceTypeResourceIdNotesNoteId()
Endpoint: DELETE /api/v2/{resourceType}/{resourceId}/notes/{noteId}
Uses window.confirm()

--- FORM (ClientNoteFormComponent) ---

Mode: edit if route has :id param

API CALL: Load Note Data (edit)
Service: NotesService.getResourceTypeResourceIdNotesNoteId()
Endpoint: GET /api/v2/{resourceType}/{resourceId}/notes/{noteId}

API CALL: Create
Service: NotesService.postResourceTypeResourceIdNotes()
Endpoint: POST /api/v2/{resourceType}/{resourceId}/notes
Body: NoteCreateRequest { note: string }

API CALL: Update
Service: NotesService.putResourceTypeResourceIdNotesNoteId()
Endpoint: PUT /api/v2/{resourceType}/{resourceId}/notes/{noteId}
Body: NoteCreateRequest

Fields: Note (textarea, required)
On success: navigate to /clients/view/{clientId}

================================================================================ 10. CLIENT DOCUMENTS (Tab & Form)
================================================================================

--- LIST (ClientDocumentsListComponent) ---

@Input clientId (required)

API CALL:
Service: DocumentsService.getEntityTypeEntityIdDocuments()
Endpoint: GET /api/v2/{entityType}/{entityId}/documents
Parameters: entityType='clients', entityId=clientId
Response: DocumentData[]

Columns: name, fileName, type, actions

API CALL: Download Document
Service: DocumentsService.getEntityTypeEntityIdDocumentsDocumentIdAttachment()
Endpoint: GET /api/v2/{entityType}/{entityId}/documents/{documentId}/attachment
Response: Blob
Logic: creates object URL, triggers download, revokes URL

API CALL: Delete
Service: DocumentsService.deleteEntityTypeEntityIdDocumentsDocumentId()
Endpoint: DELETE /api/v2/{entityType}/{entityId}/documents/{documentId}
Uses window.confirm()

--- FORM (ClientDocumentFormComponent) ---

Mode: edit if route has :id param

API CALL: Load Document Data (edit)
Service: DocumentsService.getEntityTypeEntityIdDocumentsDocumentId()
Endpoint: GET /api/v2/{entityType}/{entityId}/documents/{documentId}
Reads: name, description

API CALL: Create (with file upload)
Service: DocumentsService.postEntityTypeEntityIdDocuments()
Endpoint: POST /api/v2/{entityType}/{entityId}/documents
Parameters: contentLength (File.size), description, file (File), name

API CALL: Update
Service: DocumentsService.putEntityTypeEntityIdDocumentsDocumentId()
Endpoint: PUT /api/v2/{entityType}/{entityId}/documents/{documentId}
Parameters: contentLength=undefined, description, file=undefined, name

Fields: Name (req), Description (textarea), File (req for create, hidden for edit)
On success: navigate to /clients/view/{clientId}

================================================================================ 11. CLIENT CHARGES (Tab & Form)
================================================================================

--- LIST (ClientChargesListComponent) ---

Route param: clientId (via snapshot)

API CALL:
Service: ClientChargesService.getClientsClientIdCharges()
Endpoint: GET /api/v2/clients/{clientId}/charges
Response: { pageItems?: Array<GetClientsChargesPageItems> }

Columns: name, amount, dueDate (formatted), amountPaid (default 0),
amountOutstanding (default 0), actions

API CALL: Delete
Service: ClientChargesService.deleteClientsClientIdChargesChargeId()
Endpoint: DELETE /api/v2/clients/{clientId}/charges/{chargeId}
Uses window.confirm()

--- FORM (ClientChargeFormComponent) ---

Route param: clientId

API CALL: Load Template
Service: ClientChargesService.getClientsClientIdChargesTemplate()
Endpoint: GET /api/v2/clients/{clientId}/charges/template
Response: { chargeOptions?: ChargeData[] } (cast from unknown)

API CALL: Create
Service: ClientChargesService.postClientsClientIdCharges()
Endpoint: POST /api/v2/clients/{clientId}/charges
Body: PostClientsClientIdChargesRequest
{ chargeId, amount, dueDate, dateFormat, locale }

Fields: Charge (select from template), Amount, Due Date (date input)
On success: navigate to /clients/{clientId}/charges

================================================================================ 12. CLIENT COLLATERAL (Tab & Form)
================================================================================

--- LIST (ClientCollateralListComponent) ---

Route param: clientId

API CALL:
Service: ClientCollateralManagementService.getClientsClientIdCollaterals()
Endpoint: GET /api/v2/clients/{clientId}/collaterals
Response: ClientCollateralManagementData[] { id, name, quantity, unitPrice, totalCollateral }

Columns: name, quantity, unitPrice, totalCollateral, actions

API CALL: Delete
Service: ClientCollateralManagementService.deleteClientsClientIdCollateralsCollateralId()
Endpoint: DELETE /api/v2/clients/{clientId}/collaterals/{collateralId}
Uses window.confirm()

--- FORM (ClientCollateralFormComponent) ---

Route param: clientId, optional :id for edit mode

API CALL: Load Template
Service: ClientCollateralManagementService.getClientsClientIdCollateralsTemplate()
Endpoint: GET /api/v2/clients/{clientId}/collaterals/template
Response: LoanCollateralTemplateData[] { collateralId, name }

API CALL: Load Collateral Data (edit)
Service: ClientCollateralManagementService.getClientsClientIdCollateralsClientCollateralId()
Endpoint: GET /api/v2/clients/{clientId}/collaterals/{collateralId}
Reads: id (as collateralId), quantity

API CALL: Create
Service: ClientCollateralManagementService.postClientsClientIdCollaterals()
Endpoint: POST /api/v2/clients/{clientId}/collaterals
Body: { collateralId, quantity, locale }

API CALL: Update
Service: ClientCollateralManagementService.putClientsClientIdCollateralsCollateralId()
Endpoint: PUT /api/v2/clients/{clientId}/collaterals/{collateralId}
Body: { quantity, locale }

Rules: Product select DISABLED in edit mode (cannot change collateral type)
Fields: Product (select, disabled in edit), Quantity (number, required)
On success: navigate to /clients/{clientId}/collaterals

================================================================================ 13. CLIENT TRANSACTIONS (Tab)
================================================================================

FILE: transactions/client-transactions-list.component.ts

Route param: clientId

API CALL: List
Service: ClientTransactionService.getClientsClientIdTransactions()
Endpoint: GET /api/v2/clients/{clientId}/transactions
Response: { pageItems?: Array<GetClientsPageItems> }

Columns: id, date (formatted), amount, type.value, actions

API CALL: Undo Transaction
Service: ClientTransactionService.postClientsClientIdTransactionsTransactionId()
Endpoint: POST /api/v2/clients/{clientId}/transactions/{transactionId}?command=undo
Uses window.confirm()
Undo button disabled when row.reversed === true

================================================================================ 14. SHARED UTILITIES
================================================================================

--- DATE FORMATTING (core/utils/date-formatter.ts) ---

formatDateToFineract(date: Date|string|null|undefined): string
Converts to 'dd MMMM yyyy' format (e.g. "21 July 2026")

formatArrayDate(value: unknown): string
Converts number[] date [year, month, day] from Fineract API to string

Constants:
FINERACT_DATE_FORMAT = 'dd MMMM yyyy'
FINERACT_LOCALE = 'en'

Usage: All create/update payloads include { dateFormat, locale }

--- ACCOUNT TYPE RESOLVER (core/utils/account-type-resolver.ts) ---

resolveAccountActionType(account: Record<string, unknown>): string
Determines product type from account data for routing
Used in client-view for savings account action links

================================================================================ 15. PERMISSION DIRECTIVE
================================================================================

FILE: shared/directives/has-permission.directive.ts

Structural directive: *appHasPermission
Accepts: string (single) or string[] (AND logic)

Permissions used in clients module:
'CREATE_CLIENT', 'UPDATE_CLIENT', 'DELETE_CLIENT'
'ACTIVATE_CLIENT', 'CLOSE_CLIENT', 'REJECT_CLIENT',
'WITHDRAW_CLIENT', 'REACTIVATE_CLIENT',
'UNDOREJECT_CLIENT', 'UNDOWITHDRAW_CLIENT'
'CREATE_CLIENTIDENTIFIER', 'UPDATE_CLIENTIDENTIFIER', 'DELETE_CLIENTIDENTIFIER'
'CREATE_ADDRESS', 'UPDATE_ADDRESS'
'CREATE_CLIENTFAMILYMEMBER', 'UPDATE_CLIENTFAMILYMEMBER', 'DELETE_CLIENTFAMILYMEMBER'
'CREATE_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE'
'CREATE_DOCUMENT', 'READ_DOCUMENT', 'DELETE_DOCUMENT'

================================================================================ 16. I18N TRANSLATION KEY PREFIXES
================================================================================

CLIENTS.* - Client-specific labels
COMMON.* - Shared labels (Name, Status, Actions, Edit, Delete)
MODULES.* - Module titles (CLIENTS_CONTRACTS)
HELP.* - Help text tooltips
ACTIONS.* - Action labels (ACTIVATE_CLIENT, REJECT_CLIENT, etc.)
CLIENT_CHARGES.* - Charges labels
CLIENT_COLLATERAL.* - Collateral labels
CLIENT_TRANSACTIONS._- Transaction labels
CLIENT_SEARCH_V2._ - Search v2 labels

================================================================================
END OF DOCUMENT
================================================================================
