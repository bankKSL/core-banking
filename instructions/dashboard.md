DASHBOARD MODULE - COMPLETE API CALLS & BUSINESS LOGIC
=======================================================

This document captures every API call and business logic rule across the
/dashboard page of fineract-backoffice-ui.

FILE: system-status.component.ts (single component, ~616 lines)
ROUTE: /dashboard

================================================================================

1. API CALLS (Parallel via forkJoin)
   \================================================================================

All dashboard data fetched in parallel using forkJoin on init.

--- API: Client Count ---

Service: ClientService.getClients()
Endpoint: GET /api/v2/clients
Parameters: (all undefined) offset:0, limit:1
Extracts: totalFilteredRecords -> clientCount

--- API: Active Loan Count (status 300) ---

Service: LoansService.getLoans()
Endpoint: GET /api/v2/loans
Parameters: offset:0, limit:1, status:'300'
Extracts: totalFilteredRecords -> activeLoans

--- API: Pending Loan Count (status 100) ---

Service: LoansService.getLoans()
Endpoint: GET /api/v2/loans
Parameters: offset:0, limit:1, status:'100'
Extracts: totalFilteredRecords (for chart)

--- API: Closed Loan Count (status 600) ---

Service: LoansService.getLoans()
Endpoint: GET /api/v2/loans
Parameters: offset:0, limit:1, status:'600'
Extracts: totalFilteredRecords (for chart)

--- API: Savings Accounts (for chart) ---

Service: SavingsAccountService.getSavingsaccounts()
Endpoint: GET /api/v2/savingsaccounts
Parameters: offset:0, limit:100
Extracts: totalFilteredRecords -> savingsCount
Filters status.active -> Active count for chart
Filters status.submittedAndPendingApproval -> Pending count for chart

--- API: Pending Loan List (separate call after forkJoin) ---

Service: LoansService.getLoans()
Endpoint: GET /api/v2/loans
Parameters: offset:0, limit:50, status:'100'
Extracts: pageItems -> pendingLoans (first 50 pending)

================================================================================ 2. WIDGETS & DISPLAY
================================================================================

--- WIDGET CARDS (4 cards, grid colspan 3) ---

1. Total Clients (icon: people, color: #2196F3)
   Value: clientCount(), Sub: 'DASHBOARD.ACTIVE_MEMBERS'

2. Active Loans (icon: account_balance, color: #4CAF50)
   Value: activeLoans()
   Sub (warn): "{N} Pending Approvals" (N = pendingLoans().length)

3. Savings Accounts (icon: account_balance_wallet, color: #42A5F5)
   Value: savingsCount()
   Sub: "{N} Pending Approval"

4. API Configuration (icon: settings, color: #607D8B)
   Runtime API URL from ConfigService, Fallback from environment
   Configure button -> /system/config

--- DONUT CHARTS (colspan 2 each) ---

Loan Portfolio: Active (#2ecc71) / Pending (#f39c12) / Closed (#95a5a6)
Savings: Active (#3498db) / Pending (#f39c12)

--- PENDING APPROVALS TABLE (full width) ---

Columns: AccountNo (link to approve), ClientName, Product,
Principal (| number), SubmittedOn (date), Status
50 items max, loading spinner while isLoading()

================================================================================ 3. COMPONENT STATE

Signals: isLoading, clientCount, activeLoans, savingsCount,
pendingLoans[], pendingSavings[], loanChartData, savingsChartData

ChartData: { label: string, value: number, color: string }

================================================================================ 4. NAVIGATION

Pending loan row: /products/loan/{id}/action/approve
Configure: /system/config

================================================================================ 5. DONUT CHART (shared)

FILE: shared/components/charts/donut-chart.component.ts
SVG circle segments using stroke-dasharray/dashoffset
Center text: total sum, Legend: color dot + label + value

================================================================================ 6. I18N
================================================================================

DASHBOARD._, COMMON._

================================================================================
END OF DOCUMENT
================================================================================
