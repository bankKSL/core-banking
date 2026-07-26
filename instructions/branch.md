# Branch (Office) — React Implementation Guide

Source: Apache Fineract Organisation Office Feature  
Trace Date: 2026-07-26  
Java Base: `org.apache.fineract.organisation.office`

---

## 1. Feature Overview

Branch management (called **Office** throughout Fineract) defines the organizational hierarchy — from the head office down to individual branches, areas, or sub-offices. Every client, loan, savings account, staff member, and transaction is tied to an office.

### Office Hierarchy

```
Head Office  (id: 1, hierarchy: ".")
  │
  ├── Region North  (id: 2, hierarchy: ".2.")
  │     │
  │     ├── Branch A  (id: 3, hierarchy: ".2.3.")
  │     └── Branch B  (id: 4, hierarchy: ".2.4.")
  │
  └── Region South  (id: 5, hierarchy: ".5.")
```

The hierarchy uses a **materialized path** pattern stored in the `hierarchy` column. Office names are decorated with dots (4 per level) to visually represent depth in dropdowns (e.g. `"....Branch A"`).

### Office Transactions

Money transfers between offices (e.g., a branch sending cash to the head office). Tracked in `m_office_transaction` with currency, amount, and date.

### Related Entities

| Entity  | Relationship                               | Table                         |
| ------- | ------------------------------------------ | ----------------------------- |
| Staff   | Each staff member belongs to one office    | `m_staff.office_id`           |
| Client  | Each client belongs to one office          | `m_client.office_id`          |
| Loan    | Each loan belongs to one office            | `m_loan.office_id`            |
| Savings | Each savings account belongs to one office | `m_savings_account.office_id` |
| Holiday | Holidays apply to specific offices         | `m_holiday_office.office_id`  |

### Main Java Classes

| Layer         | Classes                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- |
| Entity        | `Office`, `OfficeTransaction`                                                             |
| API           | `OfficesApiResource`, `OfficeTransactionsApiResource`                                     |
| Read Service  | `OfficeReadPlatformService` / `OfficeReadPlatformServiceImpl`                             |
| Write Service | `OfficeWritePlatformService` / `OfficeWritePlatformServiceJpaRepositoryImpl`              |
| Validation    | `OfficeCommandFromApiJsonDeserializer`, `OfficeTransactionCommandFromApiJsonDeserializer` |
| Repository    | `OfficeRepository`, `OfficeRepositoryWrapper`, `OfficeTransactionRepository`              |

---

## 2. API Inventory

### Offices (`/v1/offices`)

| Method | URL                                    | Description                                 | Permission      |
| ------ | -------------------------------------- | ------------------------------------------- | --------------- |
| GET    | `/v1/offices`                          | List offices (hierarchy-filtered)           | `READ_OFFICE`   |
| GET    | `/v1/offices/template`                 | Template with allowed parent offices        | `READ_OFFICE`   |
| GET    | `/v1/offices/{officeId}`               | Single office detail                        | `READ_OFFICE`   |
| GET    | `/v1/offices/external-id/{externalId}` | Single office by external ID                | `READ_OFFICE`   |
| GET    | `/v1/offices/{officeId}?template=true` | Office detail + allowed parents for editing | `READ_OFFICE`   |
| POST   | `/v1/offices`                          | Create office                               | `CREATE_OFFICE` |
| PUT    | `/v1/offices/{officeId}`               | Update office                               | `UPDATE_OFFICE` |
| PUT    | `/v1/offices/external-id/{externalId}` | Update office by external ID                | `UPDATE_OFFICE` |

### Query Parameters for List

| Param               | Type    | Description                                             |
| ------------------- | ------- | ------------------------------------------------------- |
| `includeAllOffices` | boolean | If true, bypass hierarchy filter and return all offices |
| `orderBy`           | String  | Sort field (e.g. `name`, `openingDate`)                 |
| `sortOrder`         | String  | ASC / DESC                                              |

### Office Transactions (`/v1/officetransactions`)

| Method | URL                                      | Description                             | Permission                 |
| ------ | ---------------------------------------- | --------------------------------------- | -------------------------- |
| GET    | `/v1/officetransactions`                 | List all office transactions            | `READ_OFFICETRANSACTION`   |
| GET    | `/v1/officetransactions/template`        | Template (allowed offices + currencies) | `READ_OFFICETRANSACTION`   |
| POST   | `/v1/officetransactions`                 | Create money transfer between offices   | `CREATE_OFFICETRANSACTION` |
| DELETE | `/v1/officetransactions/{transactionId}` | Delete a transaction                    | `DELETE_OFFICETRANSACTION` |

### Permission Mapping

| Code                                                            | Grouping     |
| --------------------------------------------------------------- | ------------ |
| `READ_OFFICE`                                                   | organisation |
| `CREATE_OFFICE` / `CREATE_OFFICE_CHECKER`                       | organisation |
| `UPDATE_OFFICE` / `UPDATE_OFFICE_CHECKER`                       | organisation |
| `READ_OFFICETRANSACTION`                                        | organisation |
| `CREATE_OFFICETRANSACTION` / `CREATE_OFFICETRANSACTION_CHECKER` | organisation |
| `DELETE_OFFICETRANSACTION`                                      | organisation |

---

## 3. CRUD Analysis

### Offices

| Operation                 | Endpoint                              | Notes                                                                 |
| ------------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| **List**                  | `GET /v1/offices`                     | Filtered by user's office hierarchy (except `includeAllOffices=true`) |
| **Detail**                | `GET /v1/offices/{id}`                | With optional `?template=true` for allowed parents                    |
| **Detail by external ID** | `GET /v1/offices/external-id/{extId}` | Using external ID lookup                                              |
| **Template**              | `GET /v1/offices/template`            | `allowedParents` list for create                                      |
| **Create**                | `POST /v1/offices`                    | Mandatory: name, openingDate, parentId                                |
| **Update**                | `PUT /v1/offices/{id}`                | Cannot update root office's parent                                    |
| **Update by external ID** | `PUT /v1/offices/external-id/{extId}` | Same as above                                                         |
| **Delete**                | ❌                                    | No delete endpoint exists                                             |

No delete operation for offices (they are permanent organizational units).

### Office Transactions

| Operation    | Endpoint                              | Notes                                                                              |
| ------------ | ------------------------------------- | ---------------------------------------------------------------------------------- |
| **List**     | `GET /v1/officetransactions`          | All transactions                                                                   |
| **Template** | `GET /v1/officetransactions/template` | `allowedOffices` + `currencyOptions`                                               |
| **Create**   | `POST /v1/officetransactions`         | Requires fromOfficeId/toOfficeId, transactionDate, currencyCode, transactionAmount |
| **Delete**   | `DELETE /v1/officetransactions/{id}`  |                                                                                    |

No update or detail operation for individual transactions.

---

## 4. Create Workflow (Highest Priority)

### Create Office

| Field         | Required | Type        | Validation                                     | Source                                     |
| ------------- | -------- | ----------- | ---------------------------------------------- | ------------------------------------------ |
| `name`        | ✅       | string(50)  | Not blank, max 50, unique                      | User                                       |
| `parentId`    | ✅       | Long        | Must reference existing office; cannot be self | `GET /offices/template` → `allowedParents` |
| `openingDate` | ✅       | date        | Not null                                       | Date picker                                |
| `externalId`  | ❌       | string(100) | Max 100, unique                                | User                                       |
| `dateFormat`  | ✅       | string      | e.g. `dd MMMM yyyy`                            | Config                                     |
| `locale`      | ✅       | string      | e.g. `en`                                      | Config                                     |

### Create Office Transaction

| Field               | Required | Type        | Validation                     | Source                                 |
| ------------------- | -------- | ----------- | ------------------------------ | -------------------------------------- |
| `fromOfficeId`      | ❌*      | Long        | Must reference existing office | `GET .../template` → `allowedOffices`  |
| `toOfficeId`        | ❌*      | Long        | Must reference existing office | `GET .../template` → `allowedOffices`  |
| `transactionDate`   | ✅       | date        | Not null                       | Date picker                            |
| `currencyCode`      | ✅       | string(3)   | Not blank, valid currency      | `GET .../template` → `currencyOptions` |
| `transactionAmount` | ✅       | decimal     | Positive                       | User                                   |
| `description`       | ❌       | string(100) | Max 100                        | User                                   |
| `dateFormat`        | ✅       | string      | Config                         |
| `locale`            | ✅       | string      | Config                         |

\* At least one of `fromOfficeId` or `toOfficeId` must be set; they cannot be the same.

### Validation Rules

| Rule                    | Logic                                              | Error                                          |
| ----------------------- | -------------------------------------------------- | ---------------------------------------------- |
| Name uniqueness         | No duplicate names                                 | `error.msg.office.duplicate.name`              |
| External ID uniqueness  | No duplicate external IDs                          | `error.msg.office.duplicate.externalId`        |
| Root office parent      | Cannot set parent on root office (parent==null)    | `RootOfficeParentCannotBeUpdated`              |
| Self-parenting          | Cannot set parentId = own ID                       | `CannotUpdateOfficeWithParentOfficeSameAsSelf` |
| User privilege          | User can only CRUD offices in their hierarchy tree | `NoAuthorizationException`                     |
| Transaction same office | fromOfficeId and toOfficeId cannot be equal        | Validation error                               |
| Transaction amount      | Must be positive                                   | Validation error                               |

---

## 5. Lookup APIs

| UI Field                 | Endpoint                                                  | Display                             | Value         | Required |
| ------------------------ | --------------------------------------------------------- | ----------------------------------- | ------------- | -------- |
| Parent Office            | `GET /v1/offices/template` → `allowedParents`             | `nameDecorated` (indented by depth) | `id`          | ✅       |
| Parent Office (update)   | `GET /v1/offices/{id}?template=true` → `allowedParents`   | `nameDecorated`                     | `id`          | ✅       |
| Source Office (txn)      | `GET /v1/officetransactions/template` → `allowedOffices`  | `nameDecorated`                     | `id`          | ❌       |
| Destination Office (txn) | `GET /v1/officetransactions/template` → `allowedOffices`  | `nameDecorated`                     | `id`          | ❌       |
| Currency (txn)           | `GET /v1/officetransactions/template` → `currencyOptions` | Currency code + name                | Currency code | ✅       |

---

## 6. API Call Order

### Create Office

```
1. GET /v1/offices/template                      → load allowedParents (parent office dropdown)
2. Fill form (name, openingDate, parentId, optional externalId)
3. POST /v1/offices                              → create
```

### Create Office Transaction

```
1. GET /v1/officetransactions/template            → load allowedOffices + currencyOptions
2. Select fromOffice and/or toOffice
3. Fill form (transactionDate, currencyCode, transactionAmount, optional description)
4. POST /v1/officetransactions                    → create
```

---

## 7. Request Payload Analysis

### Create Office (`POST /v1/offices`)

```json
{
  "name": "Downtown Branch",
  "parentId": 2,
  "openingDate": "01 January 2026",
  "externalId": "BR-001",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### Update Office (`PUT /v1/offices/{officeId}`)

```json
{
  "name": "Downtown Branch (Renamed)",
  "openingDate": "15 January 2026",
  "externalId": "BR-001-UPDATED",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### Update Office Parent (`PUT /v1/offices/{officeId}`)

```json
{
  "parentId": 3,
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

Changing parent triggers hierarchy regeneration for the office and all its children.

### Create Office Transaction (`POST /v1/officetransactions`)

```json
{
  "fromOfficeId": 3,
  "toOfficeId": 1,
  "transactionDate": "15 January 2026",
  "currencyCode": "USD",
  "transactionAmount": 50000.0,
  "description": "Monthly cash remittance to head office",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### Delete Office Transaction (`DELETE /v1/officetransactions/{transactionId}`)

No body required.

---

## 8. Validation Rules

### Create/Update Office (`OfficeCommandFromApiJsonDeserializer`)

| Field         | Create                      | Update                   |
| ------------- | --------------------------- | ------------------------ |
| `name`        | **Yes** (not blank, max 50) | No                       |
| `parentId`    | **Yes** (not null, > 0)     | No (if provided: > 0)    |
| `openingDate` | **Yes** (not null)          | No                       |
| `externalId`  | No (max 100 if provided)    | No (max 100 if provided) |

#### Business Rules

| Rule                  | Logic                                                   | Error                                          |
| --------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| Root office           | Parent cannot be set on root office                     | `RootOfficeParentCannotBeUpdated`              |
| Self-parent           | `parentId` cannot equal office's own ID                 | `CannotUpdateOfficeWithParentOfficeSameAsSelf` |
| Duplicate name        | Name must be unique across all offices                  | `error.msg.office.duplicate.name`              |
| Duplicate external ID | External ID must be unique                              | `error.msg.office.duplicate.externalId`        |
| User hierarchy        | User can only access offices within their own hierarchy | `NoAuthorizationException`                     |

### Create Office Transaction (`OfficeTransactionCommandFromApiJsonDeserializer`)

| Field               | Rule                                   |
| ------------------- | -------------------------------------- |
| `fromOfficeId`      | If present, > 0                        |
| `toOfficeId`        | If present, > 0                        |
| Both                | At least one required; cannot be equal |
| `transactionDate`   | Not null                               |
| `currencyCode`      | Not blank, max 3 chars                 |
| `transactionAmount` | Not null, positive                     |
| `description`       | Max 100 chars                          |

---

## 9. Business Flow

### Create Office

```
OfficesApiResource.createOffice(command)
  ↓
OfficeCommandFromApiJsonDeserializer.validateForCreate(json)
  ↓
CreateOfficeCommandHandler
  ↓
OfficeWritePlatformServiceJpaRepositoryImpl.createOffice(command)
  ├── validateUserPriviledgeOnOfficeAndRetrieve(command)
  ├── Office.fromJson(parentOffice, command)
  │   ├── new Office(name, parent, openingDate, externalId)
  │   └── parent.addChild(this)
  ├── OfficeRepositoryWrapper.save(office)
  ├── generateHierarchy()  ← after save (needs ID)
  │   └── hierarchy = parent.hierarchy + id + "."
  ├── OfficeRepositoryWrapper.saveAndFlush(office)
  ├── evict cache (offices, officesForDropdown, officesById)
  └── return PostOfficesResponse(officeId)
```

### Update Office (with Parent Change)

```
OfficesApiResource.updateOffice(officeId, command)
  ↓
OfficeCommandFromApiJsonDeserializer.validateForUpdate(json)
  ↓
UpdateOfficeCommandHandler
  ↓
OfficeWritePlatformServiceJpaRepositoryImpl.updateOffice(officeId, command)
  ├── validateUserPriviledgeOnOfficeAndRetrieve(officeId, command)
  ├── Load existing office
  ├── If parentId changed:
  │   ├── Cannot be root office
  │   ├── Cannot be self
  │   ├── New parent must be in user's hierarchy
  │   └── office.update(newParent)   ← triggers regenerateHierarchy()
  ├── Update other fields (name, openingDate, externalId)
  ├── OfficeRepositoryWrapper.saveAndFlush(office)
  ├── evict cache
  └── return PutOfficesOfficeIdResponse(changes)
```

### Hierarchy Generation

```
generateHierarchy()
  ├── If parent == null:
  │   └── hierarchy = "."              ← root office
  └── If parent exists:
      └── hierarchy = parent.hierarchy + id + "."
```

When an office's parent changes, `regenerateHierarchy()` is called recursively on all children via `updateChildren()`.

### Create Office Transaction

```
OfficeTransactionsApiResource.createOfficeTransaction(command)
  ↓
OfficeTransactionCommandFromApiJsonDeserializer.validateOfficeTransfer(json)
  ↓
CreateOfficeTransactionCommandHandler
  ↓
OfficeWritePlatformServiceJpaRepositoryImpl.officeTransaction(command)
  ├── Resolve fromOffice (fromOfficeId → OfficeRepository)
  ├── Resolve toOffice (toOfficeId → OfficeRepository)
  ├── Resolve currency (currencyCode → MonetaryCurrency)
  ├── Create OfficeTransaction entity
  ├── OfficeTransactionRepository.save(transaction)
  └── return CommandProcessingResult(transactionId)
```

### Office Hierarchy Filtering (Read)

```
OfficeReadPlatformServiceImpl.retrieveAllOffices(includeAllOffices, searchParams)
  ├── Get current user's office hierarchy (e.g. ".2.")
  ├── If includeAllOffices:
  │   └── WHERE o.hierarchy LIKE '.' + '%'           ← all offices
  └── If not includeAllOffices:
      └── WHERE o.hierarchy LIKE '.2.' + '%'          ← only this branch + children
  ├── Sort by hierarchy (parent before children)
  ├── Compute nameDecorated: "...." * (level - 1) + name
  └── return List<OfficeData>
```

---

## 10. Related Operations

| Operation              | Endpoint / Trigger                       | Description                               |
| ---------------------- | ---------------------------------------- | ----------------------------------------- |
| Staff list by office   | `GET /v1/staff?officeId=X`               | Staff belonging to the office             |
| Client list by office  | `GET /v1/clients?officeId=X`             | Clients registered in the office          |
| Loan list by office    | `GET /v1/loans?officeId=X`               | Loans tied to the office                  |
| Holiday list by office | `GET /v1/holidays?officeId=X`            | Holidays applicable to the office         |
| GL Closure             | `GET /v1/accounting/closure?officeId=X`  | Accounting closures for the office        |
| Opening Balances       | `POST /v1/journalentries/openingbalance` | Office opening balances (journal entries) |
| Office bulk import     | `POST /v1/offices/uploadtemplate`        | Batch create offices via Excel            |

---

## 11. Hidden Dependencies

| Dependency                                                      | Impact                                                                                          | Phase           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------- |
| **Root office must exist** (seeded in initial schema with ID=1) | No offices can be created without a root                                                        | Bootstrap       |
| **Hierarchy materialized path**                                 | Must be regenerated when parent changes; children's paths auto-update                           | Update          |
| **User hierarchy filtering**                                    | User scoped by their office; cannot see/access sibling branches unless `includeAllOffices=true` | All reads       |
| **`nameDecorated` is SQL-computed**                             | Frontend should not compute indentation — use the `nameDecorated` field                         | List            |
| **No delete endpoint**                                          | Frontend should never show delete for offices                                                   | CRUD            |
| **`allowedParents` excludes self + children**                   | UI must not allow circular parent references                                                    | Create/Update   |
| **Cache eviction**                                              | New/changed offices require cache refresh to appear in dropdowns                                | Create/Update   |
| **Office has many FK references**                               | Cannot drop table without cleaning all related entities                                         | Schema          |
| **`externalId` is optional but unique**                         | If provided, must be globally unique                                                            | Create/Update   |
| **Date handling**                                               | Uses `LocalDate` with explicit `dateFormat` + `locale`; no time component                       | All date fields |
| **Transaction currency mismatch risk**                          | Office transaction uses `currencyCode` + `currencyDigits` embedded; must match system currency  | Transaction     |

---

## 12. Implementation Checklist

### Office CRUD

- [ ] Office list (`GET /v1/offices`) — with hierarchy-filtered results, `nameDecorated` display
- [ ] Office detail (`GET /v1/offices/{id}`)
- [ ] Office detail by external ID (`GET /v1/offices/external-id/{externalId}`)
- [ ] Office template with allowed parents (`GET /v1/offices/template`)
- [ ] Office detail with template for update (`GET /v1/offices/{id}?template=true`)
- [ ] Create office (`POST /v1/offices`)
- [ ] Update office (`PUT /v1/offices/{id}`)
- [ ] Update office by external ID (`PUT /v1/offices/external-id/{externalId}`)

### Office Transactions

- [ ] Transaction list (`GET /v1/officetransactions`)
- [ ] Transaction template (`GET /v1/officetransactions/template`)
- [ ] Create transaction (`POST /v1/officetransactions`)
- [ ] Delete transaction (`DELETE /v1/officetransactions/{transactionId}`)

### UI — Office Tree/List

- [ ] Display office hierarchy as indented tree using `nameDecorated`
- [ ] Search/filter offices by name
- [ ] Sort by name, openingDate, hierarchy

### UI — Office Form

- [ ] Parent office dropdown using `allowedParents` with `nameDecorated` display
- [ ] Name field with uniqueness check
- [ ] Opening date datepicker with `dateFormat` + `locale`
- [ ] Optional externalId
- [ ] Parent change warning (affects children hierarchy)

### UI — Office Transaction Form

- [ ] From/to office dropdowns using `allowedOffices` with `nameDecorated`
- [ ] Currency dropdown from `currencyOptions`
- [ ] Transaction amount (positive decimal)
- [ ] Transaction date datepicker
- [ ] Optional description

### UI — Hierarchy-aware Components

- [ ] Office-filtered dropdowns for related entity forms (create client, loan, etc.)
- [ ] Show user's current office scope
- [ ] Indicate when `includeAllOffices` is active

### Error Handling

- [ ] Handle duplicate name/externalId errors on create/update
- [ ] Handle self-parent or circular parent reference errors
- [ ] Handle root office parent change rejection
- [ ] Handle authorization errors (user out of scope)
- [ ] Handle date format parsing errors
- [ ] Handle transaction same-office rejection
