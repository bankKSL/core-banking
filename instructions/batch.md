BATCH OPERATIONS MODULE - COMPLETE API CALLS & BUSINESS LOGIC
=============================================================

This document captures every API call and business logic rule across the
/admin/batch-operations page of fineract-backoffice-ui.

FILE: batch-operations.component.ts (single component, ~148 lines)
ROUTE: /admin/batch-operations

================================================================================

1. UI LAYOUT
   \================================================================================

Single mat-card with:

1. Textarea (10 rows, full width)
   - Label: 'BATCH_OPERATIONS.INPUT' / "Batch Request (JSON Array)"
   - Placeholder: "[]"
   - ngModel: batchInput

2. Checkbox
   - Label: 'BATCH_OPERATIONS.ENCLOSE' / "Enclose in Transaction"
   - ngModel: enclosingTransaction

3. Error message (conditional, red text)
   - Shown when error() signal is not null
   - Label: 'BATCH_OPERATIONS.PARSE_ERROR'

4. Submit button (primary, raised)
   - Label: 'BATCH_OPERATIONS.SUBMIT' / "Submit"
   - Disabled while isSubmitting
   - Shows mat-spinner when submitting

5. Results card (conditional, shown when results().length > 0)
   - Title: 'BATCH_OPERATIONS.RESULTS' / "Results"
   - Content: <pre><code>{{ results() | json }}</code></pre>

================================================================================ 2. API CALL: Execute Batch Request
================================================================================

Service: BatchAPIService.postBatches()
Endpoint: POST /api/v2/batches
Parameters: - body: BatchRequest[] (parsed from textarea input) - enclose: boolean (enclosingTransaction flag)

BatchRequest interface:
{
requestId?: number,
relativeUrl: string,
method: string,
headers?: Record<string, string>,
reference?: string,
body?: unknown // JSON-serialized body
}

Response: BatchResponse[] | BatchResponse
The component normalizes by wrapping single response in array:
Array.isArray(response) ? response : [response]

BatchResponse interface:
{
requestId?: number,
statusCode?: number,
headers?: Record<string, string>,
body?: string,
reference?: string
}

================================================================================ 3. BUSINESS LOGIC
================================================================================

--- submit() method flow ---

1. Clear previous error and results
2. Parse batchInput string as JSON
   - If parse fails or not an array: set error signal, return early
3. Set isSubmitting = true
4. Call postBatches(parsedArray, enclosingTransaction)
5. On success:
   - Normalize response to array
   - Set results signal
   - Set isSubmitting = false
6. On error:
   - Extract error.message or fallback 'Request failed'
   - Set error signal
   - Set isSubmitting = false

================================================================================ 4. COMPONENT STATE
================================================================================

batchInput = '' // textarea value
enclosingTransaction = false // checkbox value
results = signal<BatchResponse[]>([]) // API response for display
error = signal<string | null>(null) // parse/submit error
isSubmitting = false // loading state

================================================================================ 5. I18N TRANSLATION KEY PREFIXES
================================================================================

BATCH_OPERATIONS.TITLE - "Batch API Operations"
BATCH_OPERATIONS.INPUT - "Batch Request (JSON Array)"
BATCH_OPERATIONS.ENCLOSE - "Enclose in Transaction"
BATCH_OPERATIONS.PARSE_ERROR - "Parse Error"
BATCH_OPERATIONS.SUBMIT - "Submit"
BATCH_OPERATIONS.RESULTS - "Results"

================================================================================
END OF DOCUMENT
================================================================================
