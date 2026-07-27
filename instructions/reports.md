# Reports & Datatables

## Overview

Reports and Datatables provide flexible data management and reporting capabilities. **Reports** are predefined SQL-based queries with parameters, supporting multiple output formats (HTML, PDF, CSV, XLS). **Datatables** allow plugging custom MySQL tables into core Fineract entities (client, loan, group, etc.) via the API.

---

## Reports

### Backend Structure

| File                         | Description                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `ReportsApiResource.java`    | `@Path("/v1/reports")` — CRUD for report definitions                                                                            |
| `RunreportsApiResource.java` | `@Path("/v1/runreports")` — Execute reports with parameters, export                                                             |
| `ReportData.java`            | DTO: id, reportName, reportType, reportSubType, reportCategory, description, reportSql, coreReport, useReport, reportParameters |
| `ReportParameterData.java`   | DTO: id, parameterName, parameterType, selectOne, reportParameterName                                                           |
| `ReportExportType.java`      | Export type descriptor                                                                                                          |
| `ReadReportingService.java`  | Read/report execution service                                                                                                   |

### Reports API — `@Path("/v1/reports")`

| Method | Path        | Operation                | Description                                                      |
| ------ | ----------- | ------------------------ | ---------------------------------------------------------------- |
| GET    | (list)      | `retrieveReportList`     | List all reports and their parameters                            |
| GET    | `/template` | `retrieveOfficeTemplate` | Report creation template (allowed params + types)                |
| GET    | `/{id}`     | `retrieveReport`         | Get report detail. `?template=true` appends allowed params/types |
| POST   | (root)      | `createReport`           | Create a new report                                              |
| PUT    | `/{id}`     | `updateReport`           | Update report (core reports: only useReport + description)       |
| DELETE | `/{id}`     | `deleteReport`           | Delete report (non-core only)                                    |

**Response data:** id, reportName, reportType, reportSubType, reportCategory, description, reportSql, coreReport, useReport, reportParameters

**Core reports:** Can only be updated (useReport, description). Non-core reports can be fully created, updated, and deleted.

### Run Reports API — `@Path("/v1/runreports")`

| Method | Path                             | Operation                     | Description                    |
| ------ | -------------------------------- | ----------------------------- | ------------------------------ |
| GET    | `/{reportName}`                  | `runReport`                   | Execute report with parameters |
| GET    | `/availableExports/{reportName}` | `retrieveAllAvailableExports` | Get available export types     |

**Produces:** `application/json`, `text/csv`, `application/vnd.ms-excel`, `application/pdf`, `text/html`

**Parameters** (passed as query params):

- `output-type` — HTML, XLS, CSV, PDF
- `exportCSV` — true/false
- `parameterType` — true/false (if true, returns dropdown listbox values)
- Report-specific params like `R_officeId`, `R_loanOfficerId`, `R_fromDate`, `R_toDate`, `R_currencyId`, `R_accountNo`

**Permissions:** Users must have explicit report permission. If `parameterType=true`, no permission check (only fetching dropdown values).

**Service:** `ReportingProcessService` (pluggable per report type)

### Example: Running a Report

```
GET /v1/runreports/Client%20Listing?output-type=HTML&R_officeId=1
GET /v1/runreports/Expected%20Payments%20By%20Date?output-type=CSV&R_fromDate=2023-01-01&R_toDate=2023-12-31
```

### Example: Get Available Export Types

```
GET /v1/runreports/availableExports/Client%20Listing
```

---

## Datatables

Datatables allow users to define custom MySQL tables linked to core Fineract entities (`m_client`, `m_group`, `m_loan`, `m_office`, `m_saving_account`, `m_product_loan`, `m_savings_product`). Supports one-to-one or one-to-many relationships.

### Backend Structure

| File                         | Description                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `DatatablesApiResource.java` | `@Path("/v1/datatables")` — Register, manage, CRUD datatables                   |
| `DatatableData.java`         | DTO: datatableName, apptableName, columns (type, name, mandatory, length, code) |
| `GenericResultsetData.java`  | Generic resultset format for datatable entry data                               |
| `DatatableReadService.java`  | Read operations                                                                 |
| `DatatableWriteService.java` | Write operations                                                                |
| `GenericDataService.java`    | JSON generation utilities                                                       |

### Datatables API — `@Path("/v1/datatables")`

#### Datatable Registration / Management

| Method | Path                               | Operation             | Description                                                           |
| ------ | ---------------------------------- | --------------------- | --------------------------------------------------------------------- |
| GET    | (list)                             | `getDatatables`       | List registered datatables. `?apptable=m_client` to filter            |
| GET    | `/{datatable}`                     | `getDatatable`        | Get datatable details                                                 |
| POST   | (root)                             | `createDatatable`     | Create + register a new datatable                                     |
| PUT    | `/{datatable}`                     | `updateDatatable`     | Update datatable (add/change columns, or re-register to new apptable) |
| DELETE | `/{datatable}`                     | `deleteDatatable`     | Delete datatable + deregister                                         |
| POST   | `/register/{datatable}/{apptable}` | `registerDatatable`   | Register existing table with apptable                                 |
| POST   | `/deregister/{datatable}`          | `deregisterDatatable` | Deregister (no longer available via API)                              |

#### Datatable Columns

**Column types:** Boolean, Date, DateTime, Decimal, Dropdown, Number, String, Text

**Column definition:**

```json
{
  "name": "BusinessDescription",
  "type": "String",
  "length": 200,
  "mandatory": true,
  "code": "code_cd_name"
}
```

**Mandatory fields in create:**

- `datatableName` — name of the data table
- `apptableName` — one of: m_client, m_group, m_loan, m_office, m_saving_account, m_product_loan, m_savings_product, m_wc_loan_product, m_wc_loan
- `columns` — array of column definitions

**Optional:** `multiRow` — if true, multiple entries allowed (one-to-many); if false/omitted, one-to-one

#### Datatable Data CRUD

| Method | Path                                      | Operation                       | Description                                                                                 |
| ------ | ----------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| GET    | `/{datatable}/{apptableId}`               | `getDatatable`                  | Get entry(s) for entity. `?genericResultSet=true` for tabular format, `?order=` for sorting |
| GET    | `/{datatable}/{apptableId}/{datatableId}` | `getDatatableManyEntry`         | Get specific entry (one-to-many)                                                            |
| GET    | `/{datatable}/query`                      | `queryValues`                   | Query with columnFilter, valueFilter, resultColumns                                         |
| POST   | `/{datatable}/query`                      | `advancedQuery`                 | Advanced paginated query with `PagedLocalRequest<AdvancedQueryData>`                        |
| POST   | `/{datatable}/{apptableId}`               | `createDatatableEntry`          | Create entry (one-to-one or one-to-many)                                                    |
| PUT    | `/{datatable}/{apptableId}`               | `updateDatatableEntryOnetoOne`  | Update entry (one-to-one)                                                                   |
| PUT    | `/{datatable}/{apptableId}/{datatableId}` | `updateDatatableEntryOneToMany` | Update entry (one-to-many)                                                                  |
| DELETE | `/{datatable}/{apptableId}`               | `deleteDatatableEntries`        | Delete all entries for entity                                                               |
| DELETE | `/{datatable}/{apptableId}/{datatableId}` | `deleteDatatableEntry`          | Delete specific entry (one-to-many)                                                         |

**Data entry example:**

```json
{
  "BusinessDescription": "Livestock sales",
  "Comment": "First comment made",
  "Education_cv": "Primary",
  "Gender_cd": 6,
  "HighestRatePaid": 8.5,
  "NextVisit": "01 October 2012",
  "YearsinBusiness": 5,
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

**Note:** Field names with spaces are converted to underscores. `genericResultSet=true` returns an optimized JSON format for tabular display.

---

## Entity Datatable Checks

Define mandatory datatable entry requirements for entities, optionally scoped to specific products.

### API — `@Path("/v1/entityDatatableChecks")`

| Method | Path         | Operation                    | Description                                                                 |
| ------ | ------------ | ---------------------------- | --------------------------------------------------------------------------- |
| GET    | (list)       | `retrieveAll`                | List checks. Filters: `status`, `entity`, `productId`, `offset`, `limit`    |
| GET    | `/template`  | `getTemplate`                | Creation template with available entities/datatables                        |
| POST   | (root)       | `createEntityDatatableCheck` | Create check. Mandatory: entity, status, datatableName. Optional: productId |
| DELETE | `/{checkId}` | `deleteDatatable`            | Delete check                                                                |

**Responses data:** `EntityDataTableChecksData`, `EntityDataTableChecksTemplateData`

**Purpose:** Enforces that certain datatables must have entries filled for an entity (e.g., a client must have "extra_family_details" filled before a loan can be created).

---

## Adhoc Queries

Pre-defined SQL queries saved in the system for reuse.

### API — `@Path("/v1/adhocquery")`

| Method | Path         | Operation            | Description            |
| ------ | ------------ | -------------------- | ---------------------- |
| GET    | (list)       | `retrieveAll`        | List all adhoc queries |
| GET    | `/template`  | `template`           | Creation template      |
| GET    | `/{adHocId}` | `retrieveAdHocQuery` | Get specific query     |
| POST   | (root)       | `createAdHocQuery`   | Create query           |
| PUT    | `/{adHocId}` | `update`             | Update query           |
| DELETE | `/{adHocId}` | `deleteAdHocQuery`   | Delete query           |

**Data Model:** `AdHocData` (id, name, query, tableName, tableField, isActive, email), `AdHocRequest`

**Note:** Adhoc queries are separate from the "advanced search" in the Search API (`/v1/search/advance`). This is a CRUD for saved SQL queries themselves. The actual execution/run of an adhoc query is not directly exposed via this API — these are query definitions. For running query-like reports, use `GET /v1/runreports/{reportName}`.

---

## API Endpoints Summary

```
# Reports
GET    /v1/reports
GET    /v1/reports/template
GET    /v1/reports/{id}
POST   /v1/reports
PUT    /v1/reports/{id}
DELETE /v1/reports/{id}

# Run Reports
GET    /v1/runreports/{reportName}?output-type=&R_officeId=&R_fromDate=&R_toDate=&...
GET    /v1/runreports/availableExports/{reportName}

# Datatables
GET    /v1/datatables
GET    /v1/datatables/{datatable}
GET    /v1/datatables/{datatable}/query?columnFilter=&valueFilter=&resultColumns=
POST   /v1/datatables/{datatable}/query
GET    /v1/datatables/{datatable}/{apptableId}
GET    /v1/datatables/{datatable}/{apptableId}/{datatableId}
POST   /v1/datatables
POST   /v1/datatables/{datatable}/{apptableId}
PUT    /v1/datatables/{datatable}
PUT    /v1/datatables/{datatable}/{apptableId}
PUT    /v1/datatables/{datatable}/{apptableId}/{datatableId}
DELETE /v1/datatables/{datatable}
DELETE /v1/datatables/{datatable}/{apptableId}
DELETE /v1/datatables/{datatable}/{apptableId}/{datatableId}
POST   /v1/datatables/register/{datatable}/{apptable}
POST   /v1/datatables/deregister/{datatable}

# Entity Datatable Checks
GET    /v1/entityDatatableChecks
GET    /v1/entityDatatableChecks/template
POST   /v1/entityDatatableChecks
DELETE /v1/entityDatatableChecks/{checkId}

# Adhoc Queries
GET    /v1/adhocquery
GET    /v1/adhocquery/template
GET    /v1/adhocquery/{adHocId}
POST   /v1/adhocquery
PUT    /v1/adhocquery/{adHocId}
DELETE /v1/adhocquery/{adHocId}
```
