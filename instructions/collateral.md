# Collateral — React Implementation Guide

Source: Apache Fineract Portfolio Collateral Feature  
Trace Date: 2026-07-25  
Java Base: `org.apache.fineract.portfolio.collateral`, `org.apache.fineract.portfolio.collateralmanagement`

---

## 1. Feature Overview

Collateral management is split across two systems:

| System                                 | Package                          | Description                                                                                                                                                  |
| -------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Loan Collaterals (Legacy)**          | `portfolio/collateral`           | Simple collateral items linked directly to loans via `m_loan_collateral`. Used during loan creation.                                                         |
| **Client Collateral Management (New)** | `portfolio/collateralmanagement` | Full collateral product catalog + client-held collateral + loan collateral linking. Uses `m_collateral_management`, `m_client_collateral_management` tables. |

### Sub-resource APIs

| Resource             | Base Path                            | Description                             | System |
| -------------------- | ------------------------------------ | --------------------------------------- | ------ |
| Loan Collaterals     | `/v1/loans/{loanId}/collaterals`     | CRUD for loan-level collateral items    | Legacy |
| Collateral Products  | `/v1/collateral-management`          | CRUD for collateral product definitions | New    |
| Client Collaterals   | `/v1/clients/{clientId}/collaterals` | Manage collateral held by a client      | New    |
| Loan Collateral Mgmt | `/v1/loan-collateral-management`     | Link/unlink client collateral to loans  | New    |

### Entity Relationship (New System)

```
CollateralManagementDomain (m_collateral_management)
  ├── name, quality, basePrice, unitType, pctToBase
  └── @OneToMany → ClientCollateralManagement (m_client_collateral_management)
                       ├── quantity
                       ├── @ManyToOne → Client (m_client)
                       └── @OneToMany → LoanCollateralManagement (link table)

Loan (m_loan)
  └── references ClientCollateralManagement via loan_collateral_management join
```

### Legacy System

```
Loan (m_loan)
  └── @OneToMany → LoanCollateral (m_loan_collateral)
                       ├── type (CodeValue - from m_code_value "LoanCollateral")
                       ├── value (BigDecimal)
                       └── description (String)
```

---

## 2. API Inventory

### Loan Collaterals (Legacy — `/v1/loans/{loanId}/collaterals`)

| Method | URL                                             | Description               | Permission        |
| ------ | ----------------------------------------------- | ------------------------- | ----------------- |
| GET    | `/v1/loans/{loanId}/collaterals/template`       | Collateral types template | `COLLATERAL` READ |
| GET    | `/v1/loans/{loanId}/collaterals`                | List loan collaterals     | `COLLATERAL` READ |
| GET    | `/v1/loans/{loanId}/collaterals/{collateralId}` | Single collateral detail  | `COLLATERAL` READ |
| POST   | `/v1/loans/{loanId}/collaterals`                | Add collateral to loan    | Command-level     |
| PUT    | `/v1/loans/{loanId}/collaterals/{collateralId}` | Update collateral         | Command-level     |
| DELETE | `/v1/loans/{loanId}/collaterals/{collateralId}` | Remove collateral         | Command-level     |

### Collateral Products (New — `/v1/collateral-management`)

| Method | URL                                        | Description                  |
| ------ | ------------------------------------------ | ---------------------------- |
| POST   | `/v1/collateral-management`                | Create collateral product    |
| GET    | `/v1/collateral-management`                | List all collateral products |
| GET    | `/v1/collateral-management/{collateralId}` | Get single product           |
| GET    | `/v1/collateral-management/template`       | Get template (currencies)    |
| PUT    | `/v1/collateral-management/{collateralId}` | Update product               |
| DELETE | `/v1/collateral-management/{collateralId}` | Delete product               |

### Client Collaterals (New — `/v1/clients/{clientId}/collaterals`)

| Method | URL                                                 | Description                          |
| ------ | --------------------------------------------------- | ------------------------------------ |
| GET    | `/v1/clients/{clientId}/collaterals`                | List client collaterals (`?prodId=`) |
| GET    | `/v1/clients/{clientId}/collaterals/template`       | Loan collateral template             |
| GET    | `/v1/clients/{clientId}/collaterals/{collateralId}` | Get collateral detail                |
| POST   | `/v1/clients/{clientId}/collaterals`                | Add collateral to client             |
| PUT    | `/v1/clients/{clientId}/collaterals/{collateralId}` | Update quantity                      |
| DELETE | `/v1/clients/{clientId}/collaterals/{collateralId}` | Remove client collateral             |

### Loan Collateral Management (New — `/v1/loan-collateral-management`)

| Method | URL                                                     | Description                 |
| ------ | ------------------------------------------------------- | --------------------------- |
| GET    | `/v1/loan-collateral-management/{collateralId}`         | Get loan collateral details |
| DELETE | `/v1/loan-collateral-management/{collateralId}?loanId=` | Release loan collateral     |

### Permission Mapping (Legacy)

| Command           | Entity     | Action |
| ----------------- | ---------- | ------ |
| Create Collateral | COLLATERAL | CREATE |
| Update Collateral | COLLATERAL | UPDATE |
| Delete Collateral | COLLATERAL | DELETE |

(New system uses inline command handlers with no `@CommandType` annotations shown.)

---

## 3. CRUD Analysis

### Loan Collaterals (Legacy)

| Operation    | Endpoint                                      | Notes                                                         |
| ------------ | --------------------------------------------- | ------------------------------------------------------------- |
| **List**     | `GET /v1/loans/{loanId}/collaterals`          | All collaterals for a loan                                    |
| **Detail**   | `GET /v1/loans/{loanId}/collaterals/{id}`     | Single collateral with type info                              |
| **Template** | `GET /v1/loans/{loanId}/collaterals/template` | Returns `allowedCollateralTypes` (from code "LoanCollateral") |
| **Create**   | `POST /v1/loans/{loanId}/collaterals`         | Only when loan is SUBMITTED_AND_PENDING_APPROVAL              |
| **Update**   | `PUT /v1/loans/{loanId}/collaterals/{id}`     | Update value/description                                      |
| **Delete**   | `DELETE /v1/loans/{loanId}/collaterals/{id}`  | Only when loan is SUBMITTED_AND_PENDING_APPROVAL              |

### Collateral Products (New)

| Operation    | Endpoint                                 | Notes                                                              |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------ |
| **List**     | `GET /v1/collateral-management`          | All collateral product definitions                                 |
| **Detail**   | `GET /v1/collateral-management/{id}`     | Single product                                                     |
| **Template** | `GET /v1/collateral-management/template` | Returns all currencies                                             |
| **Create**   | `POST /v1/collateral-management`         | Mandatory: name, quality, basePrice, pctToBase, unitType, currency |
| **Update**   | `PUT /v1/collateral-management/{id}`     | Partial update supported                                           |
| **Delete**   | `DELETE /v1/collateral-management/{id}`  | Fails if any client has this collateral                            |

### Client Collaterals (New)

| Operation    | Endpoint                                          | Notes                                          |
| ------------ | ------------------------------------------------- | ---------------------------------------------- |
| **List**     | `GET /v1/clients/{clientId}/collaterals`          | Filter by `prodId` (loan product currency)     |
| **Detail**   | `GET /v1/clients/{clientId}/collaterals/{id}`     | Returns quantity, total, loan transactions     |
| **Template** | `GET /v1/clients/{clientId}/collaterals/template` | Loan collateral creation template              |
| **Create**   | `POST /v1/clients/{clientId}/collaterals`         | Requires `collateralId` (product) + `quantity` |
| **Update**   | `PUT /v1/clients/{clientId}/collaterals/{id}`     | Only quantity can be updated                   |
| **Delete**   | `DELETE /v1/clients/{clientId}/collaterals/{id}`  | Fails if linked to any loan                    |

---

## 4. Create Workflow (Highest Priority)

### Create Collateral Product → Assign to Client → Link to Loan

```
Create Collateral Product (define the collateral type)
  ↓  POST /v1/collateral-management
List Products (for client assignment)
  ↓  GET /v1/collateral-management
Assign Collateral to Client (set quantity held)
  ↓  POST /v1/clients/{clientId}/collaterals
Create Loan (with collateral reference via LoanCollateralAssembler)
  ↓  POST /v1/loans
Release Loan Collateral (on loan closure)
  ↓  DELETE /v1/loan-collateral-management/{id}?loanId=
```

### Legacy Flow

```
Load Collateral Types (from codes)
  ↓  GET /v1/loans/{loanId}/collaterals/template
  ↓  (collateralTypeId from code value "LoanCollateral")
Create Loan with collaterals array (or add separately)
  ↓  POST /v1/loans (with collateral array)
  ↓  or POST /v1/loans/{loanId}/collaterals
```

### Create Collateral Product Fields

| Field       | Type       | Required | Validation                        | Source            |
| ----------- | ---------- | -------- | --------------------------------- | ----------------- |
| `name`      | String     | **Yes**  | Not blank; max 20 chars           | User              |
| `quality`   | String     | **Yes**  | Not blank; max 40 chars           | User              |
| `basePrice` | BigDecimal | **Yes**  | > 0                               | User              |
| `pctToBase` | BigDecimal | **Yes**  | > 0 (percentage of base value)    | User              |
| `unitType`  | String     | **Yes**  | Not blank; max 10 chars           | User              |
| `currency`  | String     | **Yes**  | Not blank; must be valid currency | `GET /currencies` |
| `locale`    | String     | **Yes**  | e.g. "en"                         | User              |

### Add Client Collateral Fields

| Field          | Type       | Required | Validation                                      | Source                       |
| -------------- | ---------- | -------- | ----------------------------------------------- | ---------------------------- |
| `collateralId` | Long       | **Yes**  | > 0; must reference existing collateral product | `GET /collateral-management` |
| `quantity`     | BigDecimal | **Yes**  | > 0                                             | User                         |
| `locale`       | String     | **Yes**  | e.g. "en"                                       | User                         |

### Add Loan Collateral (Legacy) Fields

| Field              | Type       | Required | Validation                                           | Source                               |
| ------------------ | ---------- | -------- | ---------------------------------------------------- | ------------------------------------ |
| `collateralTypeId` | Long       | **Yes**  | > 0; must reference code value from "LoanCollateral" | `GET /codes?codeName=LoanCollateral` |
| `value`            | BigDecimal | No       | >= 0                                                 | User                                 |
| `description`      | String     | No       | Max 500                                              | User                                 |
| `locale`           | String     | **Yes**  | e.g. "en"                                            | User                                 |
| `dateFormat`       | String     | **Yes**  | e.g. "dd MMMM yyyy"                                  | User                                 |

---

## 5. Lookup APIs

| UI Field                 | Endpoint                                                      | Display       | Value  | Required | System |
| ------------------------ | ------------------------------------------------------------- | ------------- | ------ | -------- | ------ |
| Collateral Product       | `GET /v1/collateral-management`                               | `name`        | `id`   | Yes      | New    |
| Currency                 | `GET /v1/collateral-management/template` or `GET /currencies` | `name`        | `code` | Yes      | New    |
| Client                   | `GET /v1/clients`                                             | `displayName` | `id`   | Yes      | New    |
| Collateral Type (Legacy) | `GET /codes?codeName=LoanCollateral`                          | `name`        | `id`   | Yes      | Legacy |

---

## 6. API Call Order

### Set up Collateral Product System

1. `GET /currencies` — load currencies
2. `POST /v1/collateral-management` — create collateral product
3. `GET /v1/collateral-management` — list products

### Assign Collateral to a Client

1. `GET /v1/clients` — select client
2. `GET /v1/collateral-management` — select collateral product
3. `POST /v1/clients/{clientId}/collaterals` — assign with quantity

### Create Loan with Legacy Collateral

1. `GET /v1/loans/{loanId}/collaterals/template` — load collateral types
2. `POST /v1/loans/{loanId}/collaterals` — add collateral items

---

## 7. Request Payload Analysis

### Create Collateral Product (`POST /v1/collateral-management`)

```json
{
  "name": "Gold Jewelry",
  "quality": "24K",
  "basePrice": 75000.0,
  "pctToBase": 80.0,
  "unitType": "gram",
  "currency": "USD",
  "locale": "en"
}
```

### Update Collateral Product (`PUT /v1/collateral-management/{collateralId}`)

```json
{
  "basePrice": 78000.0,
  "pctToBase": 75.0,
  "locale": "en"
}
```

### Add Client Collateral (`POST /v1/clients/{clientId}/collaterals`)

```json
{
  "collateralId": 1,
  "quantity": 10.5,
  "locale": "en"
}
```

### Update Client Collateral Quantity (`PUT /v1/clients/{clientId}/collaterals/{collateralId}`)

```json
{
  "quantity": 12.0,
  "locale": "en"
}
```

### Add Loan Collateral (Legacy) (`POST /v1/loans/{loanId}/collaterals`)

```json
{
  "collateralTypeId": 25,
  "value": 500000.0,
  "description": "Property deed for land at Plot 123",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Update Loan Collateral (Legacy) (`PUT /v1/loans/{loanId}/collaterals/{collateralId}`)

```json
{
  "value": 550000.0,
  "description": "Updated property valuation",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Delete Client Collateral (`DELETE /v1/clients/{clientId}/collaterals/{collateralId}`)

No body required. Validates no active loan links.

### Delete Loan Collateral (Legacy) (`DELETE /v1/loans/{loanId}/collaterals/{collateralId}`)

No body required. Only allowed when loan is SUBMITTED_AND_PENDING_APPROVAL.

---

## 8. Validation Rules

### Legacy Loan Collateral (`CollateralCommand.validateForCreate/Update`)

| Field              | Create        | Update        |
| ------------------ | ------------- | ------------- |
| `collateralTypeId` | **Yes** (> 0) | **Yes** (> 0) |
| `value`            | No            | No            |
| `description`      | No            | No            |

#### Business Rules

| Rule                          | Logic                                                                                        | Error                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Loan must be pending approval | Create/update/delete only allowed when `loan.status == SUBMITTED_AND_PENDING_APPROVAL (100)` | `CollateralCannotBeCreatedException`, `CollateralCannotBeUpdatedException`, `CollateralCannotBeDeletedException` |

### Collateral Product (New — Bean Validation)

| Field       | Create                       | Update                     |
| ----------- | ---------------------------- | -------------------------- |
| `name`      | **Yes** (@NotBlank, max 20)  | No (optional)              |
| `quality`   | **Yes** (@NotBlank, max 40)  | No (optional)              |
| `basePrice` | **Yes** (@NotNull @Positive) | No (@Positive if provided) |
| `pctToBase` | **Yes** (@NotNull @Positive) | No (@Positive if provided) |
| `unitType`  | **Yes** (@NotBlank, max 10)  | No (optional)              |
| `currency`  | **Yes** (@NotBlank)          | No (optional)              |
| `locale`    | **Yes** (@NotBlank)          | No (optional)              |

#### Business Rules

| Rule             | Logic                                                            | Error                                |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------ |
| Delete protected | Cannot delete product if any client has this collateral assigned | `CollateralCannotBeDeletedException` |

### Client Collateral (New — service-level)

| Field          | Create        | Update             |
| -------------- | ------------- | ------------------ |
| `collateralId` | **Yes** (> 0) | Hidden (from path) |
| `quantity`     | **Yes** (> 0) | **Yes** (> 0)      |

#### Business Rules

| Rule               | Logic                                                                 | Error                                      |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------ |
| Quantity reduction | New quantity must be >= total quantity currently used in active loans | `ClientCollateralCannotBeDeletedException` |
| Delete protected   | Cannot delete if any loan collateral is linked                        | `ClientCollateralCannotBeDeletedException` |

### Loan Collateral Management (New)

| Rule                  | Logic                                                             | Error                                        |
| --------------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| Sufficient collateral | When linking to loan, client must have enough unassigned quantity | `LoanCollateralAmountNotSufficientException` |

---

## 9. Business Flow

### Legacy: Add Collateral to Loan

```
Controller (CollateralsApiResource.createCollateral)
  ↓
PortfolioCommandSourceWritePlatformService.logCommandSource()
  ↓
CommandHandler (CreateCollateralCommandHandler)
  ↓  @CommandType(entity = "COLLATERAL", action = "CREATE")
Service (CollateralWritePlatformServiceJpaRepositoryImpl.addCollateral)
  ↓
Validate loan is in SUBMITTED_AND_PENDING_APPROVAL status
  ↓
CollateralCommandFromApiJsonDeserializer.validateForCreate(json)
  ↓  parses collateralTypeId, value, description
LoanCollateral.fromJson(loan, command)
  ↓  constructs LoanCollateral entity
LoanCollateralRepository.save(collateral)
  ↓
Return CommandProcessingResult with collateralId
```

### New: Create Collateral Product

```
Controller (CollateralManagementApiResource.createCollateral)
  ↓
CommandHandler (CollateralProductCreateCommandHandler)
  ↓  @Retry resilience
Service (CollateralManagementWriteServiceImpl.createCollateralProduct)
  ↓
Bean Validation on CollateralProductCreateRequest
  ↓  name, quality, basePrice, pctToBase, unitType, currency, locale
CollateralManagementDomain.builder()
  ↓  .name().quality().basePrice().unitType().pctToBase().currency()
CollateralManagementRepositoryWrapper.create(product)
  ↓
Return CollateralProductCreateResponse(resourceId)
```

### New: Assign Collateral to Client

```
Controller (ClientCollateralManagementApiResource.addClientCollateral)
  ↓
CommandHandler (ClientCollateralCreateCommandHandler)
  ↓  @Retry resilience
Service (ClientCollateralManagementWriteServiceImpl.createClientCollateralProduct)
  ↓
Load CollateralManagementDomain by collateralId
Load Client by clientId
  ↓
ClientCollateralManagement.createNew(client, collateral, quantity)
  ↓
Validate no existing duplicate for same client+collateral product
  ↓
ClientCollateralManagementRepositoryWrapper.save(clientCollateral)
  ↓
Return ClientCollateralCreateResponse(resourceId, clientId)
```

---

## 10. Related Operations

| Operation                     | Endpoint                                              | System | Description                                         |
| ----------------------------- | ----------------------------------------------------- | ------ | --------------------------------------------------- |
| Create Loan with Collateral   | `POST /v1/loans` (with collaterals array)             | Legacy | Collateral can be included in loan creation payload |
| List Collateral Types         | `GET /codes?codeName=LoanCollateral` with code values | Legacy | Get available collateral types                      |
| Get Client Collateral Summary | `GET /v1/clients/{clientId}/collaterals`              | New    | List with total values                              |
| Get Loan Collateral Details   | `GET /v1/loan-collateral-management/{id}`             | New    | View loan-collateral link                           |
| Release Loan Collateral       | `DELETE /v1/loan-collateral-management/{id}?loanId=`  | New    | Unlink and free up quantity                         |
| Register Datatable            | Creating additional collateral fields via datatables  | Both   | Custom fields per entity                            |

---

## 11. Hidden Dependencies

| Dependency                                     | Impact                                                                                                  | System |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------ |
| **Code "LoanCollateral" must exist**           | Legacy collateral types come from `m_code_value` under code "LoanCollateral"; template fails without it | Legacy |
| **Collateral product delete constraint**       | Cannot delete product if any client has it assigned                                                     | New    |
| **Client collateral delete constraint**        | Cannot delete client collateral if linked to any active loan                                            | New    |
| **Quantity cannot decrease below used amount** | Update quantity validation checks total used in active loans                                            | New    |
| **Loan status constraint**                     | Legacy collateral only mutable in SUBMITTED_AND_PENDING_APPROVAL                                        | Legacy |
| **Dual system coexistence**                    | Two collateral systems exist; frontend must decide which to use                                         | Both   |
| **Currency matching**                          | Client collateral template (`?prodId=`) filters by loan product currency                                | New    |
| **Legacy collateral created with loan**        | `CollateralAssembler.fromParsedJson()` parses collaterals array during loan creation                    | Legacy |
| **New collateral linked during loan create**   | `LoanCollateralAssembler.fromParsedJson()` parses during loan creation                                  | New    |
| **Lombok @Builder**                            | CollateralManagementDomain uses Lombok builder pattern for construction                                 | New    |

---

## 12. Implementation Checklist

### Collateral Products (New System)

- [ ] Collateral Product List (`GET /v1/collateral-management`)
- [ ] Collateral Product Detail (`GET /v1/collateral-management/{id}`)
- [ ] Create Collateral Product (`POST /v1/collateral-management`)
- [ ] Update Collateral Product (`PUT /v1/collateral-management/{id}`)
- [ ] Delete Collateral Product (`DELETE /v1/collateral-management/{id}`)
- [ ] Product Template (Currencies) (`GET /v1/collateral-management/template`)

### Client Collateral (New System)

- [ ] Client Collateral List (`GET /v1/clients/{clientId}/collaterals`)
- [ ] Client Collateral Detail (`GET /v1/clients/{clientId}/collaterals/{id}`)
- [ ] Client Collateral Template (`GET /v1/clients/{clientId}/collaterals/template`)
- [ ] Add Client Collateral (`POST /v1/clients/{clientId}/collaterals`)
- [ ] Update Client Collateral Quantity (`PUT /v1/clients/{clientId}/collaterals/{id}`)
- [ ] Delete Client Collateral (`DELETE /v1/clients/{clientId}/collaterals/{id}`)

### Loan Collateral Management (New System)

- [ ] Get Loan Collateral Details (`GET /v1/loan-collateral-management/{id}`)
- [ ] Release Loan Collateral (`DELETE /v1/loan-collateral-management/{id}?loanId=`)

### Loan Collaterals (Legacy System)

- [ ] Collateral Types Template (`GET /v1/loans/{loanId}/collaterals/template`)
- [ ] Loan Collateral List (`GET /v1/loans/{loanId}/collaterals`)
- [ ] Loan Collateral Detail (`GET /v1/loans/{loanId}/collaterals/{id}`)
- [ ] Add Loan Collateral (`POST /v1/loans/{loanId}/collaterals`)
- [ ] Update Loan Collateral (`PUT /v1/loans/{loanId}/collaterals/{id}`)
- [ ] Delete Loan Collateral (`DELETE /v1/loans/{loanId}/collaterals/{id}`)
