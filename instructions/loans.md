LOANS MODULE - COMPLETE API CALLS & BUSINESS LOGIC
===================================================

This document captures every API call and business logic rule across the
/loans pages of fineract-backoffice-ui.

================================================================================

1. LOANS LIST (LoansListComponent)
   \================================================================================

FILE: loans-list.component.ts
ROUTE: /loans (main list)

--- API CALL: Get Paginated Loans ---

Service: LoansService.getLoans()
Endpoint: GET /api/v2/loans
Parameters: - officeId: undefined - offset: number (pageIndex * pageSize) - limit: number (pageSize) - orderBy: string | undefined - sortOrder: string | undefined - searchByParam: string | undefined (free text) - loanType: undefined - accountNo: undefined - status: string | undefined

Response: { pageItems?, totalFilteredRecords? }
pageItems: Set<GetLoansLoanIdResponse> (converted via Array.from)

Status filter uses numeric IDs:
100=Pending, 300=Active, 600=Closed, 700=Overpaid

--- BUSINESS LOGIC ---

Same reactive pattern as Clients:
merge(searchSubject, sortSubject, pageSubject, filterSubject)
.pipe(startWith({}), switchMap(...), map(...)).subscribe(...)

Columns: accountNo, clientName, loanProductName, status, actions

Actions: Collateral, Rescheduling, Approve, Disburse, Edit
onCreateLoan(): router.navigate(['/loans/create'])

================================================================================ 2. LOAN FORM (LoanFormComponent)
================================================================================

FILE: loan-form.component.ts (~615 lines)
ROUTES: /loans/create, /loans/edit/:id

--- MODE ---

isEditMode = route param 'id' exists
clientId from query param 'clientId' (from Client View)

--- API CALLS ---

Load Products: LoanProductsService.getLoanproducts()
-> GET /api/v2/loanproducts -> products dropdown

Product Details: LoanProductsService.getLoanproductsProductId()
-> GET /api/v2/loanproducts/{id} -> selectedProductDetails

Load Loan (edit): LoansService.getLoansLoanId()
-> GET /api/v2/loans/{id} -> populates form fields

--- FORM FIELDS (2-column grid) ---

Row: ClientSearch (req) | Product select (disabled in edit)
Row: Principal (req) | External ID
Row: Loan Term Frequency | Loan Term Frequency Type (0=Days,1=Weeks,2=Months,3=Years)
Row: Number of Repayments (req) | Repayment Every (req)
Row: Repayment Frequency Type (0=Days,1=Weeks,2=Months) | Interest Rate Per Period (req)
Row: Interest Type (0=Declining,1=Flat) | Amortization Type (1=Equal Installments,0=Equal Principal)
Row: Interest Calc Period (0=Daily,1=Same as Repayment) | Grace on Principal
Row: Grace on Interest | Grace on Interest Charged
Row: In Arrears Tolerance | Repayments Starting From Date
Row: Submitted On Date | Expected Disbursement Date
Row (progressive only): Interest Recognition on Disbursement Date (checkbox)
Allow Full Term for Tranche (checkbox)
--- API: Create/Update Loan ---

Create: LoansService.postLoans(loan)
-> POST /api/v2/loans
Update: LoansService.putLoansLoanId(id, loan)
-> PUT /api/v2/loans/{id}

Body (PostLoansRequest + Record cast):
{ clientId, productId, principal, externalId?, loanTermFrequency,
loanTermFrequencyType, numberOfRepayments, repaymentEvery,
repaymentFrequencyType, interestRatePerPeriod, interestType,
amortizationType, interestCalculationPeriodType,
graceOnPrincipalPayment?, graceOnInterestPayment?,
graceOnInterestCharged?, inArrearsTolerance?,
loanType: 'individual',
submittedOnDate, expectedDisbursementDate,
repaymentsStartingFromDate?,
interestRecognitionOnDisbursementDate?,
allowFullTermForTranche?,
transactionProcessingStrategyCode,
dateFormat: 'dd MMMM yyyy', locale: 'en' }

--- BUSINESS LOGIC ---

transactionProcessingStrategyCode resolved from: 1. selectedProductDetails.transactionProcessingStrategyCode 2. selectedProduct.transactionProcessingStrategy (if available) 3. Default: 'mifos-standard-strategy'

================================================================================ 3. LOAN VIEW (LoanViewComponent)
================================================================================

FILE: loan-view.component.ts (~1464 lines - LARGEST in app)
ROUTE: /loans/view/:id

--- API CALL: Get Loan (with all associations) ---

Service: LoansService.getLoansLoanId()
Endpoint: GET /api/v2/loans/{id}
Parameters: id, false, 'all'
Response: GetLoansLoanIdResponse (very large object)

Key fields: id, accountNo, clientName, loanProductName, principal,
annualInterestRate, numberOfRepayments, repaymentEvery,
repaymentFrequencyType, loanOfficerName, currency, status,
timeline (submittedOnDate, expectedDisbursementDate, activatedOnDate,
closedOnDate),
summary (principalDisbursed, principalPaid, interestCharged,
interestPaid, feesCharged, feesPaid, penaltyCharged,
penaltyPaid, totalOutstanding, totalOverpaid),
repaymentSchedule.periods[], transactions[], charges[],
collateral[], guarantors[], loanScheduleType,
progressiveLoanData, buydownFees, capitalizedIncome, ...

--- HEADER ACTION BUTTONS ---

Repayment -> /loans/{id}/transactions/repayment
Approve -> /products/loan/{id}/action/approve (if pending)
Disburse -> /loans/{id}/transactions/disburse (if approved)

Actions dropdown:
All: Add Charge, Add Collateral, Assign Loan Officer
Pending: Reject, Withdrawn by Client, Delete, Modify Application
Active: Undo Disbursal, Waive Interest, Prepay Loan, Foreclosure, Close, Write-off

--- OVERVIEW TAB ---

Loan Terms: Principal, Annual Interest Rate, Repayments, Loan Officer
Timeline: Submitted Date, Expected Disbursement, Total Disbursed, Total Outstanding

--- REPAYMENT SCHEDULE TAB ---

Complex mat-table with merged header groups:
Period -> Balance (Principal Due) -> Cost (Interest, Fees, Penalty) -> Totals
Footer row with column totals

--- TRANSACTIONS TABLE ---

Columns: id, date, type, amount (debit=red/credit=green)
Click row -> TransactionDetailDialogComponent

--- ALL TABS ---

Overview, Repayment Schedule, Transactions, Collateral, Guarantors,
Charges, Notes, Documents, Rescheduling, Interest Pauses,
Post Dated Checks, Loan Account Lock, Datatables,
Disbursement Details, Collateral Management,
Progressive Loan Details, Buydown Fees, Capitalized Income

--- NAVIGATION ---

onRepayment(): /loans/{id}/transactions/repayment
onDisburse(): /loans/{id}/transactions/disburse
onLoanAction(cmd): /products/loan/{id}/action/{cmd}
onLoanTransactionAction(type): /loans/{id}/transactions/{type}
onAddCharge(): /loans/{id}/charges/create
onAddCollateral(): /loans/{id}/collateral/create
onAssignLoanOfficer(): /products/loan/{id}/action/assignloanofficer
onBack(): /loans

================================================================================ 4. LOAN TRANSACTION FORM (LoanTransactionFormComponent)
================================================================================

FILE: loan-transaction-form.component.ts (~407 lines)
ROUTES: /loans/{loanId}/transactions/{transactionType}

--- TYPES ---

repayment, disburse, approve, reject, withdrawnByClient,
undoDisbursal, waiveinterest, prepayLoan, foreclosure, close, writeoff

--- API: Load Template ---

Service: LoanTransactionsService.getLoansLoanIdTransactionsTemplate()
-> GET /api/v2/loans/{loanId}/transactions/template
Loads: paymentTypeOptions, loanSummary

--- API CALLS: Execute ---

State transitions (approve, disburse, undoDisbursal):
LoansService.postLoansLoanId(id, payload, command)
-> POST /api/v2/loans/{id}?command={command}

Transaction sub-resource (all others):
LoanTransactionsService.postLoansLoanIdTransactions(id, payload, type)
-> POST /api/v2/loans/{id}/transactions?command={type}

--- FORM FIELDS ---

Date shown for all except undoDisbursal
Amount + Payment Type shown for repayment, prepayLoan only
For repayment: Receipt Number, Bank Number, Check Number, Routing Code
Note (textarea) for all types

--- PAYLOADS ---

approve: { approvedOnDate, dateFormat:'yyyy-MM-dd', locale:'en', note }
disburse: { actualDisbursementDate, dateFormat, locale,
transactionAmount, paymentTypeId, note }
undoDisbursal: { note } (no date/amount)
Other types: { transactionDate, dateFormat:'yyyy-MM-dd', locale:'en',
transactionAmount?, paymentTypeId?, receiptNumber?,
bankNumber?, checkNumber?, routingCode?, note }

Destructive actions (writeoff,foreclosure,close,undoDisbursal):
ConfirmDialogComponent before execution

Amount NOT sent for: writeoff,foreclosure,close,waiveinterest
(computed server-side from outstanding balance)

================================================================================
================================================================================

5. LOAN PRODUCTS LIST (LoanProductsListComponent)
   \================================================================================

FILE: loan-products-list.component.ts
ROUTE: /products/loan

--- API CALL: List Loan Products ---

Service: LoanProductsService.getLoanproducts()
Endpoint: GET /api/v2/loanproducts
Parameters: (none)
Response: GetLoanProductsResponse[]

NOTE: loanScheduleType missing from model - read via cast to unknown

--- COLUMNS (DataTable, localLogic) ---

name, shortName, description, loanScheduleType (mat-chip, color accent=PROGRESSIVE/primary=CUMULATIVE), actions (View + Edit)

--- NAVIGATION ---

onCreateProduct(): /products/loan/create
onEditProduct(p): /products/loan/edit/{id}
onViewProduct(p): /products/loan/view/{id}

================================================================================ 6. LOAN PRODUCT FORM (LoanProductFormComponent)
================================================================================

FILE: loan-product-form.component.ts (~569 lines)
ROUTES: /products/loan/create, /products/loan/edit/:id

--- API CALLS ---

Load Funds: FundsService.retrieveFunds() -> GET /api/v2/funds
Load Delinquency Buckets: GET /api/v2/delinquency/buckets
Load Product (edit): GET /api/v2/loanproducts/{id}

--- DEFAULTS ---

{ currencyCode:'USD', digitsAfterDecimal:2, inMultiplesOf:0,
principal:10000, interestRatePerPeriod:12, numberOfRepayments:12,
repaymentEvery:1, repaymentFrequencyType:2, interestRateFrequencyType:3,
amortizationType:1, interestType:0, interestCalculationPeriodType:1,
accountingRule:1, daysInYearType:1, daysInMonthType:1,
isInterestRecalculationEnabled:false, loanScheduleType:'CUMULATIVE' }

--- FORM FIELDS (2 columns) ---

Row 1: Name (req) | Short Name (req, maxlength 4)
Row 2 (full): Description (textarea, 3 rows)
Row 3 (full): External ID
Row 4: Fund (select) | Delinquency Bucket (select)
Row 5: Currency (USD/EUR/INR) | Digits After Decimal
Row 6: Principal (req) | Interest Rate Per Period (req)
Row 7: Number of Repayments (req) | Repayment Every (req)
Row 8: Repayment Freq Type (0=Days,1=Weeks,2=Months) | Interest Rate Freq Type (2=Per month,3=Per annum)
Row 9: Amortization Type (1=Equal Installments,0=Equal Principal) | Interest Type (0=Declining,1=Flat)
Row 10: Interest Calc Period Type (0=Daily,1=Same as Repayment) | Loan Schedule Type (select)
Row 11: Transaction Processing Strategy (disabled for progressive) | Loan Schedule Processing Type (progressive only)
Row 12: Days In Year Type | Days In Month Type
Row 13: Interest Recalculation Enabled (checkbox)
Row 14 (if progressive): Payment Credit Allocation Editor

--- BUSINESS LOGIC ---

onLoanScheduleTypeChange(type):
Sets isProgressive = (type === 'PROGRESSIVE')
Filters transactionProcessingStrategyOptions:
PROGRESSIVE -> only ADVANCED_PAYMENT_ALLOCATION strategies
CUMULATIVE -> hide ADVANCED_PAYMENT_ALLOCATION strategies
Auto-selects first available strategy

--- API: Create/Update Product ---

Create: LoanProductsService.postLoanproducts(product)
-> POST /api/v2/loanproducts
Update: LoanProductsService.putLoanproductsProductId(id, product)
-> PUT /api/v2/loanproducts/{id}

Body: PostLoanProductsRequest (with Record cast)
{ name, shortName, description?, externalId?, fundId?, delinquencyBucketId?,
currencyCode, digitsAfterDecimal, inMultiplesOf,
principal, interestRatePerPeriod, numberOfRepayments, repaymentEvery,
repaymentFrequencyType, interestRateFrequencyType,
amortizationType, interestType, interestCalculationPeriodType,
loanScheduleType, loanScheduleProcessingType?,
transactionProcessingStrategyCode,
daysInYearType, daysInMonthType,
isInterestRecalculationEnabled?,
paymentAllocation?, creditAllocation?,
accountingRule, locale: 'en' }

================================================================================ 7. ADDITIONAL FEATURES & SUB-COMPONENTS
================================================================================

Charges List: GET /api/v2/loans/{loanId}/charges
Collateral List: GET /api/v2/loans/{loanId}/collaterals
Documents: GET /api/v2/loans/{loanId}/documents
Reschedule: GET /api/v2/loans/{loanId}/reschedule
Bulk Reassignment, COB Catchup, Point in Time, Schedule Modify

================================================================================ 8. COMPLETE LOAN LIFECYCLE
================================================================================

CREATED (status 100): /loans/create (LoanFormComponent)
-> APPROVE: /products/loan/{id}/action/approve or /loans/{id}/transactions/approve
APPROVED (status 200)
-> DISBURSE: /loans/{id}/transactions/disburse
ACTIVE (status 300)
-> repayment, waiveinterest, prepayLoan, writeoff, close, foreclosure
CLOSED (600) / WRITTEN OFF (601)

================================================================================ 9. I18N TRANSLATION KEY PREFIXES
================================================================================

LOANS._, MODULES._, HELP._, COMMON._, PRODUCTS._, CLIENTS._

================================================================================
================================================================================

10. LOAN PRODUCT VIEW (LoanProductViewComponent)
    \================================================================================

FILE: loan-product-view.component.ts (~252 lines)
ROUTE: /products/loan/view/:id

--- API CALL ---

Service: LoanProductsService.getLoanproductsProductId()
Endpoint: GET /api/v2/loanproducts/{id}
Response: GetLoanProductsProductIdResponse

--- DISPLAY ---

Header: name + shortName, Edit + Back buttons
Details: Currency, Principal, Interest Rate, Repayments Count,
Amortization Type, Interest Type, Interest Calc Period,
Repayment Every + Frequency, Loan Schedule Type (chip),
Transaction Processing Strategy Code
Progressive only: Payment Allocation rules + Credit Allocation rules

--- NAVIGATION ---

onEdit(): /products/loan/edit/{id}
onBack(): /products/loan

================================================================================

END OF DOCUMENT
================================================================================
