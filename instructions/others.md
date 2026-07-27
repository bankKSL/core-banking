# Other Features

## 1. Global Search

Search across scoped resources (clients, loans, groups) on specified fields.

**API:** `@Path("/v1/search")`

| Method | Path        | Operation                          | Description                                                               |
| ------ | ----------- | ---------------------------------- | ------------------------------------------------------------------------- |
| GET    | `/template` | `retrieveAdHocSearchQueryTemplate` | Returns adhoc search query template                                       |
| GET    | (list)      | `searchData`                       | Basic search. Query params: `query`, `resource` (comma-sep), `exactMatch` |
| POST   | `/advance`  | `advancedSearch`                   | Adhoc query search with filters                                           |

**Basic Search:**

```
GET /v1/search?query=000000001
GET /v1/search?query=Petra&resource=clients,groups&exactMatch=true
```

**Advanced Search:**

```
POST /v1/search/advance
```

Body includes: `entities` (mandatory), `loanStatus`, `loanProducts`, `offices`, `loanDateOption`, `loanFromDate`, `loanToDate`, `includeOutStandingAmountPercentage`, `outstandingAmountPercentageCondition`, `minOutStandingAmountPercentage`, `maxOutStandingAmountPercentage`, `includeOutstandingAmount`, `outstandingAmountCondition`, `minOutstandingAmount`, `maxOutstandingAmount`.

**Data Model:** `SearchData`, `AdHocSearchQueryData`, `AdHocQuerySearchRequest`

**Service:** `SearchReadService`

---

## 2. Collection Sheet

Generate and save collection sheets for individual loans (bulk repayment and mandatory savings deposit).

**API:** `@Path("/v1/collectionsheet")`

| Method | Path                           | Operation                 | Description                                  |
| ------ | ------------------------------ | ------------------------- | -------------------------------------------- |
| POST   | `?command=generate`            | `generateCollectionSheet` | Generate collection sheet (individual loans) |
| POST   | `?command=saveCollectionSheet` | `saveCollectionSheet`     | Save/bulk repay                              |

**Request body (`CollectionSheetRequest`):**

```json
{
  "officeId": 1,
  "staffId": 1,
  "dateFormat": "dd MMMM yyyy",
  "transactionDate": "01 June 2025",
  "locale": "en"
}
```

**Note:** Collection sheets are also available via Group/Center APIs (`POST /v1/groups/{groupId}?command=generateCollectionSheet`, `POST /v1/centers/{centerId}?command=generateCollectionSheet`) for JLG loans.

**Service:** `CollectionSheetReadPlatformService`

---

## 3. Batch API Requests

Execute multiple API requests in a single HTTP call, with support for dependent parameters via JSON Path.

**API:** `@Path("/v1/batches")`

| Method | Path                                | Operation             | Description                          |
| ------ | ----------------------------------- | --------------------- | ------------------------------------ |
| POST   | `?enclosingTransaction=true\|false` | `handleBatchRequests` | Batch requests in single transaction |

**Request:** Array of `BatchRequest` objects:

```json
[
  {
    "requestId": 1,
    "method": "POST",
    "relativeUrl": "clients",
    "headers": ["Content-Type: application/json"],
    "body": "{ \"officeId\": 1, ... }"
  },
  {
    "requestId": 2,
    "method": "GET",
    "relativeUrl": "clients/$.clientId/loans",
    "reference": 1
  }
]
```

**Response:** Array of `BatchResponse` objects (requestId, statusCode, headers, body).

**Dependencies:** Reference via `$.paramName` — substituted from referenced request's response body.

**Enclosing Transaction:** If `?enclosingTransaction=true`, all DB operations are rolled back on any failure.

**Read-only mode:** If instance is read-only, non-GET requests are rejected.

**Service:** `BatchApiService`

---

## 4. Entity Access Mapping

Manage mappings between entities (e.g., Office-to-LoanProduct access control).

**API:** `@Path("/v1/entitytoentitymapping")`

| Method | Path                       | Operation                   | Description                      |
| ------ | -------------------------- | --------------------------- | -------------------------------- |
| GET    | (list)                     | `retrieveAll`               | List all supported mapping types |
| GET    | `/{mapId}`                 | `retrieveOne`               | Get mappings by map ID           |
| GET    | `/{mapId}/{fromId}/{toId}` | `getEntityToEntityMappings` | Get specific mappings            |
| POST   | `/{relId}`                 | `createMap`                 | Create a mapping                 |
| PUT    | `/{mapId}`                 | `updateMap`                 | Update a mapping                 |
| DELETE | `/{mapId}`                 | `delete`                    | Delete a mapping                 |

**Data Model:** `FineractEntityRelationData`, `FineractEntityToEntityMappingData`

---

## 5. Credit Bureau Configuration

Manage credit bureau integrations, configurations, and loan product mappings.

**API:** `@Path("/v1/CreditBureauConfiguration")`

| Method | Path                                | Operation                              | Description                     |
| ------ | ----------------------------------- | -------------------------------------- | ------------------------------- |
| GET    | (root)                              | `getCreditBureau`                      | List all credit bureaus         |
| GET    | `/mappings`                         | `getCreditBureauLoanProductMapping`    | List loan product mappings      |
| GET    | `/organisationCreditBureau`         | `getOrganisationCreditBureau`          | List org-credit bureau links    |
| GET    | `/config/{orgCreditBureauId}`       | `getConfiguration`                     | Get config by org credit bureau |
| GET    | `/loanProduct`                      | `fetchLoanProducts`                    | Fetch loan products             |
| GET    | `/loanProduct/{loanProductId}`      | `fetchMappingByLoanProductId`          | Mapping by loan product         |
| PUT    | `/organisationCreditBureau`         | `updateCreditBureau`                   | Update org credit bureau        |
| PUT    | `/mappings`                         | `updateCreditBureauLoanProductMapping` | Update loan product mapping     |
| POST   | `/organisationCreditBureau/{orgId}` | `addOrganisationCreditBureau`          | Add org credit bureau           |
| POST   | `/mappings/{orgId}`                 | `createCreditBureauLoanProductMapping` | Create loan product mapping     |
| POST   | `/configuration/{creditBureauId}`   | `createCreditBureauConfiguration`      | Add config                      |
| PUT    | `/configuration/{configId}`         | `updateCreditBureauConfiguration`      | Update config                   |

**Data Model:** `CreditBureauData`, `CreditBureauConfigurationData`, `CreditBureauLoanProductMappingData`, `OrganisationCreditBureauData`

---

## 6. Credit Report Lookup

Fetch, save, retrieve, and delete credit reports from credit bureaus.

**API:** `@Path("/v1/creditBureauIntegration")`

| Method | Path                                            | Operation              | Description                     |
| ------ | ----------------------------------------------- | ---------------------- | ------------------------------- |
| POST   | `/creditReport`                                 | `fetchCreditReport`    | Fetch credit report from bureau |
| POST   | `/addCreditReport`                              | `addCreditReport`      | Upload credit report file       |
| POST   | `/saveCreditReport?creditBureauId=&nationalId=` | `saveCreditReport`     | Save fetched report to DB       |
| GET    | `/creditReport/{creditBureauId}`                | `getSavedCreditReport` | List saved reports by bureau    |
| DELETE | `/deleteCreditReport/{creditBureauId}`          | `deleteCreditReport`   | Delete saved report             |

**Data Model:** `CreditReportData`

**Services:** `CreditReportReadPlatformService`, `CreditReportWritePlatformService`

---

## 7. Surveys

Survey management — register survey tables, fulfill surveys for clients, and retrieve results.

**API:** `@Path("/v1/survey")`

| Method | Path                                     | Operation                 | Description                       |
| ------ | ---------------------------------------- | ------------------------- | --------------------------------- |
| GET    | (list)                                   | `retrieveSurveys`         | List all registered survey tables |
| GET    | `/{surveyName}`                          | `retrieveSurvey`          | Get survey details                |
| GET    | `/{surveyName}/{clientId}`               | `getClientSurveyOverview` | Get client scores overview        |
| GET    | `/{surveyName}/{clientId}/{entryId}`     | `getSurveyEntry`          | Get specific survey entry         |
| POST   | `/{surveyName}/{apptableId}`             | `createDatatableEntry`    | Create/fulfill survey entry       |
| PUT    | `/register/{surveyName}/{apptable}`      | `register`                | Register a survey table           |
| DELETE | `/{surveyName}/{clientId}/{fulfilledId}` | `deleteDatatableEntries`  | Delete survey entry               |

**Surveys are datatable-based** — each survey is registered as a datatable linked to an application table (e.g., `m_client`).

**Data Model:** `SurveyDataTableData`, `SurveyData`, `ClientScoresOverview`

---

## 8. Scorecards

Scorecard entries for surveys — create and retrieve client scoring data.

**API:** `@Path("/v1/surveys/scorecards")`

| Method | Path                             | Operation               | Description                   |
| ------ | -------------------------------- | ----------------------- | ----------------------------- |
| GET    | `/{surveyId}`                    | `findBySurvey`          | List scorecards by survey     |
| GET    | `/{surveyId}/clients/{clientId}` | `findBySurveyAndClient` | Scorecards by survey + client |
| GET    | `/clients/{clientId}`            | `findByClient`          | Scorecards by client          |
| POST   | `/{surveyId}`                    | `createScorecard`       | Create scorecard entry        |

**Mandatory Fields for creation:** clientId, createdOn, questionId, responseId, staffId

**Data Model:** `ScorecardData`, `Scorecard` (domain)

**Services:** `SpmService`, `ScorecardService`, `ScorecardReadPlatformService`

---

## 9. Poverty Lines

Retrieve Poverty Probability Index (PPI) poverty line data.

**API:** `@Path("/v1/povertyLine")`

| Method | Path                        | Operation     | Description                              |
| ------ | --------------------------- | ------------- | ---------------------------------------- |
| GET    | `/{ppiName}`                | `retrieveAll` | Get poverty lines by PPI name            |
| GET    | `/{ppiName}/{likelihoodId}` | `retrieveAll` | Get poverty lines filtered by likelihood |

**Data Model:** `PpiPovertyLineData`, `LikeliHoodPovertyLineData`

---

## 10. Likelihood Configuration

Manage likelihood values used in PPI poverty calculations.

**API:** `@Path("/v1/likelihood")`

| Method | Path                        | Operation     | Description                  |
| ------ | --------------------------- | ------------- | ---------------------------- |
| GET    | `/{ppiName}`                | `retrieveAll` | List likelihoods by PPI name |
| GET    | `/{ppiName}/{likelihoodId}` | `retrieve`    | Get specific likelihood      |
| PUT    | `/{ppiName}/{likelihoodId}` | `update`      | Update likelihood value      |

**Data Model:** `LikelihoodData`

---

## 11. Mix (XBRL) Report

Generate XBRL-format reports for MIX (Microfinance Information Exchange).

**API:** `@Path("/v1/mixreport")`

| Method | Path                             | Operation            | Description                |
| ------ | -------------------------------- | -------------------- | -------------------------- |
| GET    | `?startDate=&endDate=&currency=` | `retrieveXBRLReport` | Retrieve XBRL report (XML) |

**Produces:** `application/xml`

**Services:** `MixReportXBRLResultService`, `MixReportXBRLBuilder`

---

## 12. Mix Taxonomy / Mapping

List mix taxonomies and manage taxonomy-to-GLF mapping.

**Mix Taxonomy API:** `@Path("/v1/mixtaxonomy")`

| Method | Path   | Operation     | Description             |
| ------ | ------ | ------------- | ----------------------- |
| GET    | (list) | `retrieveAll` | List all mix taxonomies |

**Data Model:** `MixTaxonomyData`

**Service:** `MixTaxonomyReadService`

---

**Mix Mapping API:** `@Path("/v1/mixmapping")`

| Method | Path   | Operation                 | Description                  |
| ------ | ------ | ------------------------- | ---------------------------- |
| GET    | (list) | `retrieveTaxonomyMapping` | Get current taxonomy mapping |
| PUT    | (root) | `updateTaxonomyMapping`   | Update taxonomy mapping      |

**Data Model:** `MixTaxonomyMappingData`, `MixTaxonomyMappingUpdateRequest`, `MixTaxonomyMappingUpdateResponse`

---

## 13. Report Mailing Job

Schedule jobs that run reports and email them to specified recipients.

**API:** `@Path("/v1/reportmailingjobs")`

| Method | Path        | Operation                          | Description               |
| ------ | ----------- | ---------------------------------- | ------------------------- |
| GET    | (list)      | `retrieveAllReportMailingJobs`     | List all jobs (paginated) |
| GET    | `/template` | `retrieveReportMailingJobTemplate` | Job creation template     |
| GET    | `/{jobId}`  | `retrieveReportMailingJob`         | Get job detail            |
| POST   | (root)      | `createReportMailingJob`           | Create job                |
| PUT    | `/{jobId}`  | `updateReportMailingJob`           | Update job                |
| DELETE | `/{jobId}`  | `deleteReportMailingJob`           | Delete job                |

**Mandatory Fields:** name, startDateTime, stretchyReportId, emailRecipients, emailSubject, emailMessage, emailAttachmentFileFormatId, recurrence, isActive

**Optional Fields:** description, stretchyReportParamMap

---

**Run History API:** `@Path("/v1/reportmailingjobrunhistory")`

| Method | Path                                  | Operation                         | Description      |
| ------ | ------------------------------------- | --------------------------------- | ---------------- |
| GET    | `?reportMailingJobId=&offset=&limit=` | `retrieveAllByReportMailingJobId` | List run history |

**Data Model:** `ReportMailingJobData`, `ReportMailingJobRunHistoryData`

---

## 14. Templates (UGD)

User Generated Documents based on Mustache templates with mappers for data aggregation.

**API:** `@Path("/v1/templates")`

| Method | Path                     | Operation                 | Description                                    |
| ------ | ------------------------ | ------------------------- | ---------------------------------------------- |
| GET    | (list)                   | `retrieveAllTemplates`    | List templates (optional `?typeId=&entityId=`) |
| GET    | `/template`              | `retrieveTemplateDetails` | Get template creation details                  |
| GET    | `/{templateId}`          | `retrieveOneTemplate`     | Get template by ID                             |
| GET    | `/{templateId}/template` | `retrieveTemplateById`    | Get template with details                      |
| POST   | (root)                   | `createTemplate`          | Create template                                |
| PUT    | `/{templateId}`          | `saveTemplate`            | Update template                                |
| DELETE | `/{templateId}`          | `deleteTemplate`          | Delete template                                |
| POST   | `/{templateId}`          | `mergeTemplate`           | Merge template with data (returns HTML)        |

**Entity values:** client=0, loan=1
**Type values:** Document=0, Email=1, SMS=2

**Data Model:** `TemplateData`, `TemplateCreateRequest`, `TemplateCreateResponse`, `TemplateUpdateRequest`, `TemplateUpdateResponse`, `TemplateDeleteResponse`, `TemplateDetailsData`, `TemplateItemData`

---

## 15. Provisioning Categories

Manage provisioning categories for loan loss provisioning.

**API:** `@Path("/v1/provisioningcategory")`

| Method | Path            | Operation                    | Description                      |
| ------ | --------------- | ---------------------------- | -------------------------------- |
| GET    | (list)          | `retrieveAll`                | List all provisioning categories |
| POST   | (root)          | `createProvisioningCategory` | Create category                  |
| PUT    | `/{categoryId}` | `updateProvisioningCategory` | Update category                  |
| DELETE | `/{categoryId}` | `deleteProvisioningCategory` | Delete category                  |

**Data Model:** `ProvisioningCategoryData`

---

## 16. Provisioning Criteria

Define provisioning criteria with loan product associations.

**API:** `@Path("/v1/provisioningcriteria")`

| Method | Path            | Operation                          | Description         |
| ------ | --------------- | ---------------------------------- | ------------------- |
| GET    | `/template`     | `retrieveTemplate`                 | Creation template   |
| GET    | (list)          | `retrieveAllProvisioningCriterias` | List all criteria   |
| GET    | `/{criteriaId}` | `retrieveProvisioningCriteria`     | Get criteria detail |
| POST   | (root)          | `createProvisioningCriteria`       | Create criteria     |
| PUT    | `/{criteriaId}` | `updateProvisioningCriteria`       | Update criteria     |
| DELETE | `/{criteriaId}` | `deleteProvisioningCriteria`       | Delete criteria     |

**Mandatory Fields:** criteriaName, provisioningcriteria
**Optional Fields:** loanProducts

**Data Model:** `ProvisioningCriteriaData`

---

**Provisioning Entries API:** `@Path("/v1/provisioningentries")`

Generate and manage provisioning entries based on criteria.

| Method | Path                                                               | Operation                        | Description                        |
| ------ | ------------------------------------------------------------------ | -------------------------------- | ---------------------------------- |
| GET    | (list)                                                             | `retrieveAllProvisioningEntries` | List all entries (paginated)       |
| GET    | `/{entryId}`                                                       | `retrieveProvisioningEntry`      | Get entry metadata                 |
| GET    | `/entries`                                                         | `retrieveProviioningEntries`     | Get loan product entries filtered  |
| POST   | (root)                                                             | `createProvisioningEntries`      | Create entries (mandatory: date)   |
| POST   | `/{entryId}?command=createjournalentry\|recreateprovisioningentry` | `modifyProvisioningEntry`        | Create journal entries or recreate |

---

## 17. Maker-Checker (4-Eye) Queue

Approve or reject pending command audit entries (the "four-eye" principle).

**API:** `@Path("/v1/makercheckers")`

| Method | Path                         | Operation                     | Description                       |
| ------ | ---------------------------- | ----------------------------- | --------------------------------- |
| GET    | (list)                       | `retrieveCommands`            | List pending entries for approval |
| GET    | `/searchtemplate`            | `retrieveAuditSearchTemplate` | Search/filter template            |
| POST   | `/{auditId}?command=approve` | `approveMakerCheckerEntry`    | Approve entry                     |
| POST   | `/{auditId}?command=reject`  | `approveMakerCheckerEntry`    | Reject entry                      |
| DELETE | `/{auditId}`                 | `deleteMakerCheckerEntry`     | Delete entry                      |

**Filter params for list:** actionName, entityName, resourceId, makerId, makerDateTimeFrom, makerDateTimeTo, officeId, groupId, clientId, loanId, savingsAccountId, includeJson

**Data Model:** `AuditData`, `AuditSearchData`, `MakerCheckerRequest`

---

## API Endpoints Summary

```
# Global Search
GET    /v1/search/template
GET    /v1/search?query=&resource=&exactMatch=
POST   /v1/search/advance

# Collection Sheet
POST   /v1/collectionsheet?command=generate|saveCollectionSheet

# Batch API
POST   /v1/batches?enclosingTransaction=true|false

# Entity Access Mapping
GET    /v1/entitytoentitymapping
GET    /v1/entitytoentitymapping/{mapId}
GET    /v1/entitytoentitymapping/{mapId}/{fromId}/{toId}
POST   /v1/entitytoentitymapping/{relId}
PUT    /v1/entitytoentitymapping/{mapId}
DELETE /v1/entitytoentitymapping/{mapId}

# Credit Bureau Configuration
GET    /v1/CreditBureauConfiguration
GET    /v1/CreditBureauConfiguration/mappings
GET    /v1/CreditBureauConfiguration/organisationCreditBureau
GET    /v1/CreditBureauConfiguration/config/{orgCreditBureauId}
GET    /v1/CreditBureauConfiguration/loanProduct
GET    /v1/CreditBureauConfiguration/loanProduct/{loanProductId}
PUT    /v1/CreditBureauConfiguration/organisationCreditBureau
PUT    /v1/CreditBureauConfiguration/mappings
POST   /v1/CreditBureauConfiguration/organisationCreditBureau/{orgId}
POST   /v1/CreditBureauConfiguration/mappings/{orgId}
POST   /v1/CreditBureauConfiguration/configuration/{creditBureauId}
PUT    /v1/CreditBureauConfiguration/configuration/{configId}

# Credit Bureau Integration (Credit Report)
POST   /v1/creditBureauIntegration/creditReport
POST   /v1/creditBureauIntegration/addCreditReport
POST   /v1/creditBureauIntegration/saveCreditReport?creditBureauId=&nationalId=
GET    /v1/creditBureauIntegration/creditReport/{creditBureauId}
DELETE /v1/creditBureauIntegration/deleteCreditReport/{creditBureauId}

# Surveys
GET    /v1/survey
GET    /v1/survey/{surveyName}
GET    /v1/survey/{surveyName}/{clientId}
GET    /v1/survey/{surveyName}/{clientId}/{entryId}
POST   /v1/survey/{surveyName}/{apptableId}
PUT    /v1/survey/register/{surveyName}/{apptable}
DELETE /v1/survey/{surveyName}/{clientId}/{fulfilledId}

# Scorecards
GET    /v1/surveys/scorecards/{surveyId}
GET    /v1/surveys/scorecards/{surveyId}/clients/{clientId}
GET    /v1/surveys/scorecards/clients/{clientId}
POST   /v1/surveys/scorecards/{surveyId}

# Poverty Line
GET    /v1/povertyLine/{ppiName}
GET    /v1/povertyLine/{ppiName}/{likelihoodId}

# Likelihood
GET    /v1/likelihood/{ppiName}
GET    /v1/likelihood/{ppiName}/{likelihoodId}
PUT    /v1/likelihood/{ppiName}/{likelihoodId}

# Mix Report (XBRL)
GET    /v1/mixreport?startDate=&endDate=&currency=

# Mix Taxonomy
GET    /v1/mixtaxonomy

# Mix Mapping
GET    /v1/mixmapping
PUT    /v1/mixmapping

# Report Mailing Jobs
GET    /v1/reportmailingjobs
GET    /v1/reportmailingjobs/template
GET    /v1/reportmailingjobs/{jobId}
POST   /v1/reportmailingjobs
PUT    /v1/reportmailingjobs/{jobId}
DELETE /v1/reportmailingjobs/{jobId}

# Report Mailing Job Run History
GET    /v1/reportmailingjobrunhistory?reportMailingJobId=

# Templates (UGD)
GET    /v1/templates
GET    /v1/templates/template
GET    /v1/templates/{templateId}
GET    /v1/templates/{templateId}/template
POST   /v1/templates
PUT    /v1/templates/{templateId}
DELETE /v1/templates/{templateId}
POST   /v1/templates/{templateId}  (merge, returns HTML)

# Provisioning Categories
GET    /v1/provisioningcategory
POST   /v1/provisioningcategory
PUT    /v1/provisioningcategory/{categoryId}
DELETE /v1/provisioningcategory/{categoryId}

# Provisioning Criteria
GET    /v1/provisioningcriteria/template
GET    /v1/provisioningcriteria
GET    /v1/provisioningcriteria/{criteriaId}
POST   /v1/provisioningcriteria
PUT    /v1/provisioningcriteria/{criteriaId}
DELETE /v1/provisioningcriteria/{criteriaId}

# Provisioning Entries
GET    /v1/provisioningentries
GET    /v1/provisioningentries/{entryId}
GET    /v1/provisioningentries/entries?entryId=&offset=&limit=&officeId=&productId=&categoryId=
POST   /v1/provisioningentries
POST   /v1/provisioningentries/{entryId}?command=createjournalentry|recreateprovisioningentry

# Maker-Checker Queue
GET    /v1/makercheckers
GET    /v1/makercheckers/searchtemplate
POST   /v1/makercheckers/{auditId}?command=approve|reject
DELETE /v1/makercheckers/{auditId}
```
