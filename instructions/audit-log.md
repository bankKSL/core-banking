AUDIT LOGS MODULE - COMPLETE API CALLS & BUSINESS LOGIC
========================================================

This document captures every API call and business logic rule across the
/security/audits page of fineract-backoffice-ui (Angular standalone component).

FILE: audit-logs-list.component.ts (single page, no sub-components)
ROUTE: /security/audits

================================================================================

1. API CALL: Get Audit Search Template
   \================================================================================

Service: AuditsService.getAuditsSearchtemplate()
Endpoint: GET /api/v2/audits/searchtemplate
Parameters: (none)
Response: AuditSearchData
{
actionNames?: Array<string>,
appUsers?: Array<AppUserData>,
entityNames?: Array<string>,
statuses?: Array<ProcessingResultLookup>
}

NOTE: This endpoint is NOT called in the current implementation.
Filter dropdowns use hardcoded values or free-text inputs.

================================================================================ 2. API CALL: Get Paginated Audit Logs
================================================================================

Service: AuditsService.getAudits()
Endpoint: GET /api/v2/audits

Filter parameters: - actionName: string | undefined - entityName: string | undefined - resourceId: number | undefined - makerId: number | undefined - makerDateTimeFrom: string | undefined (YYYY-MM-DD) - makerDateTimeTo: string | undefined (YYYY-MM-DD) - checkerId: undefined (not used) - checkerDateTimeFrom/To: undefined (not used) - status/clientId/loanId/officeId/groupId/savingsAccountId: undefined (not used) - processingResult: string | undefined ("success" | "failure")

Format: dateFormat: 'yyyy-MM-dd', locale:'en'
Pagination: offset, limit, orderBy, sortOrder, paged: true

Response: Observable<string> (OpenAPI returns string, must JSON.parse)
Parsed shape: { pageItems?: Array<Record<string,unknown>>, totalFilteredRecords?, totalRecords? }

Audit item fields: id, resourceId, entityName, actionName, maker,
madeOnDate (ISO), checker, checkedOnDate (ISO), processingResult,
commandAsJson (string)

================================================================================ 3. BUSINESS LOGIC: Reactive Data Loading
================================================================================

Uses RxJS merge() of 3 event streams: 1. sortSubject - column header click (default: id desc) 2. pageSubject - paginator page change 3. filterSubject - Apply/Reset Filters click

Pipeline:
merge(streams).pipe(
startWith({}),
switchMap(() => {
fromDate = activeFilters.makerDateTimeFrom?.toISOString().split('T')[0]
toDate = activeFilters.makerDateTimeTo?.toISOString().split('T')[0]
return auditsService.getAudits(
actionName||undef, entityName||undef, resourceId, makerId,
fromDate, toDate,
undef,undef,undef,undef,undef,undef,undef,undef,undef,
processingResult||undef,
'yyyy-MM-dd', 'en',
offset, limit, orderBy, sortOrder, true
).pipe(catchError(() => of(null)))
}),
map(data => {
if (!data) return []
const result = typeof data === 'string' ? JSON.parse(data) : data
const items = result['pageItems'] ? result['pageItems'] : result
if (Array.isArray(items)) {
const limit = pageSize()
const offset = pageIndex() * limit
// Heuristic: if page is full, estimate more records exist
const total = items.length === limit
? offset + limit + 1
: result['totalFilteredRecords'] || result['totalRecords'] || offset + items.length
totalRecords.set(total)
return items
}
return []
})
).subscribe(data => auditLogs.set(data))

Key: API returns string (not JSON) - must JSON.parse()
Default sort: id DESC (newest first)
No real-time search - requires Apply button

================================================================================ 4. FILTER UI (Expansion Panel)
================================================================================

Type: MatExpansionPanel (collapsible, default collapsed)

Filter fields (grid layout, auto-fill min 200px): - Action Name (text, keyup.enter triggers apply) - Entity Name (text, keyup.enter triggers apply) - Resource ID (number, keyup.enter triggers apply) - Maker ID (number, keyup.enter triggers apply) - Maker Date From (datepicker) - Maker Date To (datepicker) - Processing Result (select)
Options: All, Success, Failure

Action buttons: RESET (warn) -> onResetFilters()
APPLY (primary) -> onApplyFilters()

onApplyFilters(): pageIndex=0, filterSubject.next()
onResetFilters(): clears activeFilters to defaults, calls onApplyFilters()

================================================================================ 5. AUDIT LOGS TABLE
================================================================================

Component: DataTableComponent (server-side)
showSearch: false
pageSize: 10 default

Columns: id, resourceId, entityName, actionName, maker,
madeOnDate (DatePipe medium), checker,
checkedOnDate (DatePipe medium), processingResult,
actions (View Details icon button)

================================================================================ 6. VIEW DETAILS DIALOG
================================================================================

onViewDetails(row):
payload = row['commandAsJson'] || JSON.stringify(row, null, 2)
Opens MatDialog - ViewPayloadDialogComponent (600px)

ViewPayloadDialogComponent (tasks/checker-inbox/):
Shows formatted JSON in <pre> block (monospace, scrollable)
Parses JSON, formats with indent 2; fallback to raw string

================================================================================ 7. CLASS PROPERTIES & STATE
================================================================================

AuditFilters: { actionName, entityName, resourceId?, makerId?,
makerDateTimeFrom/To (Date|null), processingResult }

Signals: auditLogs, totalRecords, isLoading, pageSize(10), pageIndex(0)
Subjects: sortSubject, pageSubject, filterSubject
Default sort: Sort { active: 'id', direction: 'desc' }

================================================================================ 8. UNIQUE CHARACTERISTICS
================================================================================

1. API returns Observable<string> (must JSON.parse)
2. Total records heuristic (unreliable from API)
3. No real-time search - Apply button required
4. Default sort: id DESC (newest first)
5. 20 API parameters - most complex in app
6. Uses signals (not plain properties)
7. MatExpansionPanel for collapsible filters
8. showSearch=false on DataTable

================================================================================
END OF DOCUMENT
================================================================================

No real-time search - requires Apply button
