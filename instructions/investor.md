# External Asset Owners (Investor Base) — React Implementation Guide

Source: Apache Fineract Investor Base Feature  
Trace Date: 2026-07-25  
Java Base: `org.apache.fineract.investor`

---

## 1. Feature Overview

The External Asset Owners feature (also referred to as the **Investor Base**) enables loan asset externalization — the ability to sell loans to external investors (external asset owners) and buy them back. It provides the lifecycle for transferring loan ownership between the bank and external investors.

### Key Concepts

| Concept                  | Description                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ |
| **External Asset Owner** | An external investor identified by a unique external ID                        |
| **Transfer**             | A sale or buyback transaction of a loan to/from an external owner              |
| **Settlement Date**      | The date when the transfer financially settles                                 |
| **Purchase Price Ratio** | The ratio determining the purchase price of the loan                           |
| **Delayed Settlement**   | A settlement model where the financial transfer happens asynchronously via COB |
| **Intermediary Sale**    | A sale through an intermediary (requires delayed settlement)                   |

### Transfer Status Lifecycle

```
Sale Flow (Default Settlement):
  PENDING ──→ ACTIVE (via COB)
       └──→ CANCELLED

Sale Flow (Delayed Settlement):
  PENDING_INTERMEDIATE ──→ ACTIVE_INTERMEDIATE (via COB) ──→ ACTIVE (via COB)
                                                   └──→ CANCELLED

Buyback Flow:
  BUYBACK ──→ (loan returns to bank via COB)
  BUYBACK_INTERMEDIATE ──→ (buyback with delayed settlement)

Cancel:
  Any PENDING / BUYBACK status → CANCELLED
```

### Full Status Enum

| Status                 | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `ACTIVE`               | Transfer is active and effective                                   |
| `ACTIVE_INTERMEDIATE`  | Active with intermediary (delayed settlement pending finalization) |
| `DECLINED`             | Transfer was declined                                              |
| `PENDING`              | Sale initiated, pending processing via COB                         |
| `PENDING_INTERMEDIATE` | Intermediary sale pending                                          |
| `BUYBACK`              | Buyback initiated, pending processing                              |
| `BUYBACK_INTERMEDIATE` | Buyback with intermediary pending                                  |
| `CANCELLED`            | Transfer cancelled                                                 |

### Sub-Status Enum

| Sub-Status          | Description                            |
| ------------------- | -------------------------------------- |
| `BALANCE_ZERO`      | Transfer with zero outstanding balance |
| `BALANCE_NEGATIVE`  | Transfer with negative outstanding     |
| `SAMEDAY_TRANSFERS` | Same-day transfers                     |
| `USER_REQUESTED`    | Cancelled by user request              |
| `UNSOLD`            | Transfer not sold                      |

### Feature Toggle

The entire module is gated by `fineract.module.investor.enabled` (Spring `@Conditional`). If disabled, all endpoints return 404.

---

### Entity Relationship

```
ExternalAssetOwner (m_external_asset_owner)
  └── id, external_id (unique)

ExternalAssetOwnerTransfer (m_external_asset_owner_transfer)
  ├── @ManyToOne → ExternalAssetOwner (owner_id)
  ├── @ManyToOne → ExternalAssetOwner (previous_owner_id, nullable)
  ├── @OneToOne → ExternalAssetOwnerTransferDetails (transfer details)
  ├── loan_id
  ├── external_id, external_loan_id, external_group_id
  ├── status (ExternalTransferStatus)
  ├── sub_status (ExternalTransferSubStatus, nullable)
  ├── purchase_price_ratio
  ├── settlement_date
  ├── effective_date_from
  └── effective_date_to

ExternalAssetOwnerTransferDetails (m_external_asset_owner_transfer_details)
  ├── @OneToOne → ExternalAssetOwnerTransfer
  ├── total_outstanding_derived
  ├── principal_outstanding_derived
  ├── interest_outstanding_derived
  ├── fee_charges_outstanding_derived
  ├── penalty_charges_outstanding_derived
  └── total_overpaid_derived

ExternalAssetOwnerTransferLoanMapping (m_external_asset_owner_transfer_loan_mapping)
  └── Maps loan to its active owner transfer

ExternalAssetOwnerJournalEntryMapping (m_external_asset_owner_journal_entry_mapping)
  └── Maps journal entry to an external asset owner

ExternalAssetOwnerTransferJournalEntryMapping (m_external_asset_owner_transfer_journal_entry_mapping)
  └── Maps journal entry to a transfer

ExternalAssetOwnerLoanProductAttributes (m_external_asset_owner_loan_product_configurable_attributes)
  ├── @ManyToOne → LoanProduct
  ├── attribute_key
  └── attribute_value
```

---

### Key Tables

| Table                                                         | Purpose                                     |
| ------------------------------------------------------------- | ------------------------------------------- |
| `m_external_asset_owner`                                      | External investors                          |
| `m_external_asset_owner_transfer`                             | Loan transfer records (sale/buyback)        |
| `m_external_asset_owner_transfer_details`                     | Financial details of each transfer          |
| `m_external_asset_owner_transfer_loan_mapping`                | Active transfer-to-loan mapping             |
| `m_external_asset_owner_journal_entry_mapping`                | Journal entry-to-owner mapping              |
| `m_external_asset_owner_transfer_journal_entry_mapping`       | Journal entry-to-transfer mapping           |
| `m_external_asset_owner_loan_product_configurable_attributes` | Per-loan-product investor config attributes |

---

## 2. API Inventory

### External Asset Owners (`/v1/external-asset-owners`)

| Method | URL                                                                              | Description                                                                                      | Permission                  |
| ------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------- |
| GET    | `/v1/external-asset-owners`                                                      | List all external asset owners                                                                   | `EXTERNAL_ASSET_OWNER` READ |
| POST   | `/v1/external-asset-owners`                                                      | Create a new external asset owner                                                                | Command-level `CREATE`      |
| GET    | `/v1/external-asset-owners/transfers`                                            | List transfers (filter by `transferExternalId`, `loanId`, `loanExternalId`)                      | `EXTERNAL_ASSET_OWNER` READ |
| GET    | `/v1/external-asset-owners/transfers/active-transfer`                            | Get active transfer for a loan                                                                   | `EXTERNAL_ASSET_OWNER` READ |
| POST   | `/v1/external-asset-owners/transfers/loans/{loanId}`                             | Execute transfer on loan by loan ID (`?command=sale\|buyback\|intermediarySale\|cancel\|create`) | Command-level               |
| POST   | `/v1/external-asset-owners/transfers/loans/external-id/{loanExternalId}`         | Execute transfer by loan external ID                                                             | Command-level               |
| POST   | `/v1/external-asset-owners/transfers/{id}`                                       | Execute transfer by transfer ID                                                                  | Command-level               |
| POST   | `/v1/external-asset-owners/transfers/external-id/{externalId}`                   | Execute transfer by transfer external ID                                                         | Command-level               |
| GET    | `/v1/external-asset-owners/transfers/{transferId}/journal-entries`               | Get journal entries for a transfer                                                               | `EXTERNAL_ASSET_OWNER` READ |
| GET    | `/v1/external-asset-owners/owners/external-id/{ownerExternalId}/journal-entries` | Get journal entries for an owner                                                                 | `EXTERNAL_ASSET_OWNER` READ |
| POST   | `/v1/external-asset-owners/search`                                               | Search transfers by text/date ranges                                                             | `EXTERNAL_ASSET_OWNER` READ |

### Loan Product Attributes (`/v1/external-asset-owners/loan-product`)

| Method | URL                                                                      | Description                      | Permission                  |
| ------ | ------------------------------------------------------------------------ | -------------------------------- | --------------------------- |
| POST   | `/v1/external-asset-owners/loan-product/{loanProductId}/attributes`      | Create loan product attribute    | Command-level               |
| GET    | `/v1/external-asset-owners/loan-product/{loanProductId}/attributes`      | List attributes for loan product | `EXTERNAL_ASSET_OWNER` READ |
| PUT    | `/v1/external-asset-owners/loan-product/{loanProductId}/attributes/{id}` | Update loan product attribute    | Command-level               |

### Supported `?command=` Values

| Command            | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `sale`             | Sell a loan to an external asset owner                  |
| `buyback`          | Buy back a loan from an external asset owner            |
| `intermediarySale` | Intermediary sale (requires delayed settlement enabled) |
| `cancel`           | Cancel a pending/buyback transfer                       |
| `create`           | Create a new external asset owner                       |

---

## 3. CRUD Analysis

### External Asset Owners

| Operation  | Endpoint                         | Notes                                                                         |
| ---------- | -------------------------------- | ----------------------------------------------------------------------------- |
| **List**   | `GET /v1/external-asset-owners`  | Returns all owners with their IDs                                             |
| **Create** | `POST /v1/external-asset-owners` | Mandatory: `ownerExternalId`; auto-creates if owner doesn't exist during sale |
| **Detail** | (none)                           | Owners are lightweight (only external ID); detail obtained via transfer data  |
| **Update** | (none)                           | Owners cannot be updated after creation                                       |
| **Delete** | (none)                           | No delete endpoint for owners                                                 |

### Transfers

| Operation                      | Endpoint                                                     | Notes                                                                  |
| ------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **List**                       | `GET /v1/external-asset-owners/transfers`                    | Supports filtering by `transferExternalId`, `loanId`, `loanExternalId` |
| **Active Transfer**            | `GET /v1/external-asset-owners/transfers/active-transfer`    | Returns currently active transfer for a loan                           |
| **Create (Sale)**              | `POST .../transfers/loans/{loanId}?command=sale`             | Creates PENDING transfer; asset owner auto-created if not found        |
| **Create (Buyback)**           | `POST .../transfers/loans/{loanId}?command=buyback`          | Creates BUYBACK transfer                                               |
| **Create (Intermediary Sale)** | `POST .../transfers/loans/{loanId}?command=intermediarySale` | Creates PENDING_INTERMEDIATE transfer                                  |
| **Cancel**                     | `POST .../transfers/{id}?command=cancel`                     | Cancels a PENDING or BUYBACK transfer                                  |
| **Search**                     | `POST /v1/external-asset-owners/search`                      | Full-text search with date ranges                                      |

### Loan Product Attributes

| Operation  | Endpoint                                                                     | Notes                                         |
| ---------- | ---------------------------------------------------------------------------- | --------------------------------------------- |
| **Create** | `POST /v1/external-asset-owners/loan-product/{loanProductId}/attributes`     | Sets attribute key/value for a loan product   |
| **List**   | `GET /v1/external-asset-owners/loan-product/{loanProductId}/attributes`      | Optional `attributeKey` query param to filter |
| **Update** | `PUT /v1/external-asset-owners/loan-product/{loanProductId}/attributes/{id}` | Updates value of existing attribute           |

### Missing Operations

- No `DELETE` for external asset owners
- No `PUT`/`UPDATE` for external asset owners
- No `DELETE` for transfers (only cancel via state transition)
- No `GET /v1/external-asset-owners/{id}` single owner endpoint
- No bulk operations

---

## 4. Create Workflow (Highest Priority)

### Pre-requisite Lookups

```
Verify feature is enabled (fineract.module.investor.enabled)
  ↓
Load Loans (to select a loan for transfer)
  ↓  GET /loans
Select Loan
  ↓
Check Loan Product Attributes (optional: check settlement model)
  ↓  GET /external-asset-owners/loan-product/{loanProductId}/attributes
Load External Asset Owners (optional: view existing owners)
  ↓  GET /external-asset-owners
Select or Create Owner
  ↓
Load Active Transfer (to check current ownership)
  ↓  GET /external-asset-owners/transfers/active-transfer?loanId={id}
Submit Sale Transfer
  ↓  POST /external-asset-owners/transfers/loans/{loanId}?command=sale
```

### Create External Asset Owner Request

| Field             | Type   | Required | Validation                         | Source     |
| ----------------- | ------ | -------- | ---------------------------------- | ---------- |
| `ownerExternalId` | String | **Yes**  | Not blank; max 100; must be unique | User input |

### Sale Transfer Request

| Field                     | Type          | Required    | Validation                              | Source                |
| ------------------------- | ------------- | ----------- | --------------------------------------- | --------------------- |
| `ownerExternalId`         | String        | **Yes**     | Not blank; max 100                      | User / Existing owner |
| `settlementDate`          | String (date) | **Yes**     | Not null; cannot be in the past         | User input            |
| `purchasePriceRatio`      | String        | **Yes**     | Not blank; max 50 chars                 | User input            |
| `transferExternalId`      | String        | No          | Max 100; auto-generated if not provided | User or auto          |
| `transferExternalGroupId` | String        | No          | Max 100                                 | User input            |
| `dateFormat`              | String        | Conditional | Required if locale is provided          | User input            |
| `locale`                  | String        | Conditional | e.g. "en"                               | User input            |

### Buyback Transfer Request

| Field                | Type          | Required    | Validation                                                             | Source       |
| -------------------- | ------------- | ----------- | ---------------------------------------------------------------------- | ------------ |
| `settlementDate`     | String (date) | **Yes**     | Not null; >= current transfer's settlement date; cannot be in the past | User input   |
| `transferExternalId` | String        | No          | Max 100; auto-generated if not provided                                | User or auto |
| `dateFormat`         | String        | Conditional | Required if locale is provided                                         | User input   |
| `locale`             | String        | Conditional | e.g. "en"                                                              | User input   |

Note: Buyback does NOT require `ownerExternalId` or `purchasePriceRatio` — these are inherited from the effective transfer.

### Cancel Transfer Request

No request body needed for cancel (operates by transfer ID).

---

## 5. Lookup APIs

| UI Field                | Endpoint                                                             | Display                           | Value           | Required                |
| ----------------------- | -------------------------------------------------------------------- | --------------------------------- | --------------- | ----------------------- |
| Loan                    | `GET /loans`                                                         | `accountNo` / `id`                | `id`            | Yes                     |
| Loan External ID        | `GET /loans?externalId={extId}`                                      | `accountNo`                       | `id`            | Alternative             |
| Loan Product Attributes | `GET /external-asset-owners/loan-product/{loanProductId}/attributes` | `attributeKey` + `attributeValue` | attribute value | For settlement config   |
| External Asset Owners   | `GET /external-asset-owners`                                         | `externalId`                      | `externalId`    | Yes (for sale)          |
| Active Transfer         | `GET /external-asset-owners/transfers/active-transfer?loanId={id}`   | transfer status/owner             | Transfer data   | For buyback eligibility |
| Transfers               | `GET /external-asset-owners/transfers?loanId={id}`                   | transfer details                  | Transfer list   | History view            |

---

## 6. API Call Order

### Sale Flow

1. `GET /loans/{loanId}` — verify loan exists and status
2. `GET /external-asset-owners/transfers/active-transfer?loanId={id}` — check no active transfer
3. `GET /external-asset-owners/loan-product/{loanProductId}/attributes` — check settlement model
4. `GET /external-asset-owners` — browse existing owners (optional)
5. `POST /external-asset-owners/transfers/loans/{loanId}?command=sale` — submit sale

### Buyback Flow

1. `GET /external-asset-owners/transfers/active-transfer?loanId={id}` — verify owner and get current settlement date
2. `POST /external-asset-owners/transfers/loans/{loanId}?command=buyback` — submit buyback

### Create Owner Flow

1. `POST /external-asset-owners` — create with `ownerExternalId`
2. `GET /external-asset-owners` — view all owners (verify)

---

## 7. Request Payload Analysis

### Create External Asset Owner (`POST /v1/external-asset-owners`)

```json
{
  "ownerExternalId": "36efeb06-d835-48a1-99eb-09bd1d348c1e"
}
```

Response:

```json
{
  "resourceId": 1
}
```

### Sale Transfer (`POST /v1/external-asset-owners/transfers/loans/{loanId}?command=sale`)

```json
{
  "ownerExternalId": "36efeb06-d835-48a1-99eb-09bd1d348c1e",
  "settlementDate": "2026-07-30",
  "purchasePriceRatio": "1.23456789",
  "transferExternalId": "550e8400-e29b-41d4-a716-446655440000",
  "transferExternalGroupId": "group-uuid-1234",
  "dateFormat": "yyyy-MM-dd",
  "locale": "en"
}
```

Response:

```json
{
  "resourceId": 1,
  "resourceExternalId": "550e8400-e29b-41d4-a716-446655440000",
  "subResourceId": 2,
  "subResourceExternalId": "36efeb06-d835-48a1-99eb-09bd1d348c2e",
  "changes": {
    "settlementDate": [2023, 5, 23],
    "ownerExternalId": "1234567890987654321abc",
    "transferExternalId": "550e8400-e29b-41d4-a716-446655440000",
    "purchasePriceRatio": "1.23456789"
  }
}
```

### Buyback Transfer (`POST /v1/external-asset-owners/transfers/loans/{loanId}?command=buyback`)

```json
{
  "settlementDate": "2026-08-15",
  "transferExternalId": "660e8400-e29b-41d4-a716-446655440001",
  "dateFormat": "yyyy-MM-dd",
  "locale": "en"
}
```

### Intermediary Sale (`POST /v1/external-asset-owners/transfers/loans/{loanId}?command=intermediarySale`)

Same payload as sale — requires `ownerExternalId`, `settlementDate`, `purchasePriceRatio`.

### Cancel Transfer (`POST /v1/external-asset-owners/transfers/{id}?command=cancel`)

No request body. Operates directly on transfer ID.

### Search (`POST /v1/external-asset-owners/search`)

```json
{
  "page": 0,
  "size": 20,
  "request": {
    "text": "partial search text",
    "settlementDateFrom": "2026-01-01",
    "settlementDateTo": "2026-12-31",
    "effectiveDateFrom": "2026-01-01",
    "effectiveDateTo": "2026-12-31"
  }
}
```

---

## 8. Validation Rules

### Sale Transfer Validation

| Field                           | Required | Validation                                                     |
| ------------------------------- | -------- | -------------------------------------------------------------- |
| `ownerExternalId`               | **Yes**  | Not blank; max 100; owner is found or auto-created             |
| `settlementDate`                | **Yes**  | Not null; cannot be in the past                                |
| `purchasePriceRatio`            | **Yes**  | Not blank; max 50                                              |
| `transferExternalId`            | No       | Max 100; must be unique if provided; auto-generated if omitted |
| `transferExternalGroupId`       | No       | Max 100                                                        |
| `transferExternalId` uniqueness | —        | Checked against existing transfers; duplicate throws error     |

### Buyback Transfer Validation

| Field                | Required | Validation                                                       |
| -------------------- | -------- | ---------------------------------------------------------------- |
| `settlementDate`     | **Yes**  | Not null; not in the past; >= current transfer's settlement date |
| `transferExternalId` | No       | Max 100; must be unique if provided                              |

### Cancel Transfer Validation

| Rule                    | Logic                                                   | Error                              |
| ----------------------- | ------------------------------------------------------- | ---------------------------------- |
| Transfer exists         | `findById(transferId)`                                  | Transfer not found                 |
| Transfer is latest      | Must be the most recent effective transfer for the loan | Cannot cancel outdated transfer    |
| Transfer is cancellable | Status must be `PENDING` or `BUYBACK`                   | Cannot cancel non-pending transfer |

### Loan Status Validation (Sale)

Allowed loan statuses are configurable via `ConfigurationDomainService`. Default allowed statuses are fetched from system configuration. Delayed settlement may have a different set of allowed loan statuses than default settlement.

| Rule                 | Logic                                             | Error                                                       |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Loan exists          | `findLoanDataForExternalTransferByLoanId(loanId)` | `LoanNotFoundException`                                     |
| Loan status valid    | Status in configured allowed list                 | "Loan status is not valid for transfer"                     |
| No duplicate pending | Only 1 pending transfer per loan                  | "External asset owner transfer is already in PENDING state" |

### Business Rule Validations (Write Services)

| Rule                                           | Logic                                                                                | Error                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Settlement date not in past                    | `DateUtils.isBeforeBusinessDate(settlementDate)`                                     | "Settlement date cannot be in the past"                                       |
| Sale: effective transfer check                 | Only 0 or 1 effective transfers; existing must be ACTIVE                             | "This loan cannot be sold, there is already an in progress transfer"          |
| Intermediary Sale: delayed settlement required | `delayedSettlementAttributeService.isEnabled(productId)`                             | "Delayed Settlement Configuration is not enabled"                             |
| Intermediary Sale: current state               | Only 0 or 1 effective transfers; existing must be ACTIVE                             | "This loan cannot be sold..."                                                 |
| Buyback: effective transfer exists             | Must have an active transfer                                                         | "This loan cannot be bought back, it is not owned by an external asset owner" |
| Buyback: buyback-ready status                  | Status must be PENDING or ACTIVE (default) / ACTIVE_INTERMEDIATE or ACTIVE (delayed) | "effective transfer is not in right state"                                    |
| Buyback: settlement date >= current            | `settlementDate >= effectiveTransfer.settlementDate`                                 | "settlement date is earlier than effective transfer settlement date"          |
| Duplicate external ID                          | Check `ExternalAssetOwnerTransferRepository.exists()`                                | "Already existing an asset transfer with the provided transfer external id"   |
| Owner duplicate on create                      | Check `ExternalAssetOwnerRepository.findByExternalId()`                              | `ExternalAssetOwnerDuplicateException`                                        |

### Loan Product Attribute Validation

| Field            | Required | Validation                                                     |
| ---------------- | -------- | -------------------------------------------------------------- |
| `attributeKey`   | **Yes**  | Must be a known key (e.g. settlement model, interest strategy) |
| `attributeValue` | **Yes**  | Must be valid for the key type                                 |

### Attribute Keys

| Key                           | Value Options                              | Description                                             |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------------- |
| `settlementModel`             | `DEFAULT_SETTLEMENT`, `DELAYED_SETTLEMENT` | Determines settlement processing model                  |
| Outstanding interest strategy | `TOTAL_OUTSTANDING`, `PAYABLE_OUTSTANDING` | How outstanding interest is calculated during transfers |

---

## 9. Business Flow

### Sale Flow

```
Controller (ExternalAssetOwnersApiResource.transferRequestWithLoanId)
  ↓  ?command=sale
PortfolioCommandSourceWritePlatformService.logCommandSource()
  ↓
CommandHandler (SaleLoanToExternalAssetOwnerHandler)
  ↓  @CommandType(entity = "LOAN", action = "SALE")
Service (ExternalAssetOwnersWriteServiceImpl.saleLoanByLoanId)
  ↓
fetchAndValidateLoanDataForExternalTransfer(loanId)
  ↓  validates loan exists
validateSaleRequestBody(json)
  ↓  validates: ownerExternalId, settlementDate, purchasePriceRatio, transferExternalId
getOwner(json)
  ↓  findOrCreate ExternalAssetOwner by externalId (with REQUIRES_NEW propagation)
validateLoanStatus(loanData, isDelayedSettlement)
  ↓  checks loan status against configured allowed statuses
validateSale(transfer, isDelayedSettlement)
  ↓  validates settlementDate not in past + effective transfer state
createSaleTransfer(loanId, json, externalLoanId)
  ↓  creates transfer with status PENDING, sets owner/price/date
externalAssetOwnerTransferRepository.saveAndFlush(transfer)
  ↓
Return CommandProcessingResult with transferId, loanId
  ↓
[COB] LoanAccountOwnerTransferBusinessStep processes PENDING → ACTIVE
```

### Buyback Flow

```
Controller (ExternalAssetOwnersApiResource.transferRequestWithLoanId)
  ↓  ?command=buyback
CommandHandler (BuybackLoanFromExternalAssetOwnerHandler)
  ↓  @CommandType(entity = "LOAN", action = "BUYBACK")
Service (ExternalAssetOwnersWriteServiceImpl.buybackLoanByLoanId)
  ↓
validateBuybackRequestBody(json)
  ↓  validates: settlementDate, transferExternalId
fetchAndValidateLoanDataForExternalTransfer(loanId)
  ↓  validates loan exists
fetchAndValidateEffectiveTransferForBuyback(loanData, settlementDate)
  ↓  validates: effective transfer exists, status is buyback-ready, settlement date valid
createBuybackTransfer(effectiveTransfer, settlementDate, externalId)
  ↓  creates transfer with status BUYBACK, inherits owner/price from effective transfer
externalAssetOwnerTransferRepository.saveAndFlush(transfer)
  ↓
Return CommandProcessingResult
  ↓
[COB] LoanAccountOwnerTransferBusinessStep processes BUYBACK → loan returned
```

### Cancel Flow

```
Controller (ExternalAssetOwnersApiResource.transferRequestWithId)
  ↓  ?command=cancel
CommandHandler (CancelLoanFromExternalAssetOwnerHandler)
  ↓  @CommandType(entity = "ASSET_OWNER_TRANSACTION", action = "CANCEL")
Service (ExternalAssetOwnersWriteServiceImpl.cancelTransactionById)
  ↓
fetchAndValidateEffectiveTransferForCancel(transferId)
  ↓  validates: transfer exists, is latest, status is PENDING or BUYBACK
Set effective_transfer.effective_date_to = now
  ↓
Create cancel transfer with status CANCELLED, subStatus = USER_REQUESTED
  ↓
externalAssetOwnerTransferRepository.save(cancelTransfer)
externalAssetOwnerTransferRepository.save(effectiveTransfer)
  ↓
Return CommandProcessingResult
```

### COB Processing (Close of Business)

```
LoanAccountOwnerTransferBusinessStep.execute(loanId)
  ↓
Find active transfer for loan
  ↓
Switch on status:
  PENDING → ACTIVE (ownership transferred)
  PENDING_INTERMEDIATE → ACTIVE_INTERMEDIATE (intermediary step)
  ACTIVE_INTERMEDIATE → ACTIVE (finalize delayed settlement)
  BUYBACK → (loan returned to bank, transfer finalized)
  BUYBACK_INTERMEDIATE → (buyback with intermediary)
```

---

## 10. Related Operations

| Operation                          | Endpoint                                                                             | Description                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------- |
| Create Loan Product Attribute      | `POST /v1/external-asset-owners/loan-product/{loanProductId}/attributes`             | Configure settlement model for a loan product |
| List Loan Product Attributes       | `GET /v1/external-asset-owners/loan-product/{loanProductId}/attributes`              | View configurable attributes                  |
| Update Loan Product Attribute      | `PUT /v1/external-asset-owners/loan-product/{loanProductId}/attributes/{id}`         | Change attribute value                        |
| View Journal Entries (by transfer) | `GET /v1/external-asset-owners/transfers/{transferId}/journal-entries`               | Accounting entries for a specific transfer    |
| View Journal Entries (by owner)    | `GET /v1/external-asset-owners/owners/external-id/{ownerExternalId}/journal-entries` | Accounting entries for an owner               |
| Search Transfers                   | `POST /v1/external-asset-owners/search`                                              | Full-text + date range search                 |
| Loan List                          | `GET /v1/loans`                                                                      | Find loans to transfer                        |
| Loan Detail                        | `GET /v1/loans/{loanId}`                                                             | Verify loan status and details                |

---

## 11. Hidden Dependencies

| Dependency                          | Impact                                                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Feature toggle**                  | Module disabled by default; must set `fineract.module.investor.enabled=true`                                                                            |
| **Loan must exist**                 | Transfer cannot be created without a valid active loan                                                                                                  |
| **Loan status config**              | Allowed loan statuses for transfer are configurable via system configuration; may be empty                                                              |
| **Delayed settlement config**       | `intermediarySale` requires delayed settlement enabled on the loan product                                                                              |
| **Owner auto-creation**             | Owner is auto-created if not found during sale (ownerExternalId becomes permanent reference)                                                            |
| **COB batch job**                   | PENDING transfers are processed asynchronously by `LoanAccountOwnerTransferBusinessStep` during Close of Business; transfers are not immediately active |
| **Settlement date constraint**      | Settlement date cannot be in the past; for buyback it must be >= current transfer's settlement date                                                     |
| **Transfer external ID uniqueness** | If provided, `transferExternalId` must be globally unique; auto-generated if omitted                                                                    |
| **Accounting integration**          | Journal entries are created during COB processing; requires proper GL account mapping                                                                   |
| **Permissions pre-installed**       | Permission codes like `SALE`, `BUYBACK`, `INTERMEDIARYSALE`, `CANCEL` are seeded via database migrations                                                |
| **Concurrent owner creation**       | Uses `REQUIRES_NEW` propagation + retry with constraint violation handling for concurrent owner creation                                                |
| **Owner-to-owner transfers**        | Transfer can automatically detect previous owner and set `previousOwner` reference                                                                      |
| **Configuration dependencies**      | `allowedLoanStatusesForExternalAssetTransfer` and `allowedLoanStatusesOfDelayedSettlementForExternalAssetTransfer` must be configured                   |
| **External events**                 | Fires `LoanOwnershipTransferBusinessEvent` via Avro serialization for system integration                                                                |
| **Cache**                           | No explicit cache noted, but COB processing may have caching implications                                                                               |
| **Effective date range**            | Transfers use `effective_date_from` / `effective_date_to` (default: 9999-12-31) for temporal tracking                                                   |
| **Transfer details snapshot**       | Financial details (outstanding amounts) are snapshotted at time of transfer creation                                                                    |

---

## 12. Implementation Checklist

### External Asset Owners

- [ ] List External Asset Owners (`GET /v1/external-asset-owners`)
- [ ] Create External Asset Owner (`POST /v1/external-asset-owners`)

### Transfers

- [ ] List Transfers (`GET /v1/external-asset-owners/transfers`)
- [ ] Get Active Transfer (`GET /v1/external-asset-owners/transfers/active-transfer`)
- [ ] Sale Transfer (`POST .../transfers/loans/{loanId}?command=sale`)
- [ ] Sale Transfer by Loan External ID (`POST .../transfers/loans/external-id/{loanExternalId}?command=sale`)
- [ ] Buyback Transfer (`POST .../transfers/loans/{loanId}?command=buyback`)
- [ ] Intermediary Sale (`POST .../transfers/loans/{loanId}?command=intermediarySale`)
- [ ] Cancel Transfer (`POST .../transfers/{id}?command=cancel`)
- [ ] Cancel Transfer by External ID (`POST .../transfers/external-id/{externalId}?command=cancel`)
- [ ] Process Transfer by Transfer ID (`POST .../transfers/{id}`)
- [ ] Search Transfers (`POST /v1/external-asset-owners/search`)

### Loan Product Attributes

- [ ] Create Loan Product Attribute (`POST /v1/external-asset-owners/loan-product/{loanProductId}/attributes`)
- [ ] List Loan Product Attributes (`GET /v1/external-asset-owners/loan-product/{loanProductId}/attributes`)
- [ ] Update Loan Product Attribute (`PUT /v1/external-asset-owners/loan-product/{loanProductId}/attributes/{id}`)

### Journal Entries

- [ ] View Journal Entries by Transfer (`GET .../transfers/{transferId}/journal-entries`)
- [ ] View Journal Entries by Owner (`GET .../owners/external-id/{ownerExternalId}/journal-entries`)

### Configuration & Setup

- [ ] Enable module: `fineract.module.investor.enabled=true`
- [ ] Configure allowed loan statuses for external asset transfer
- [ ] Configure allowed loan statuses for delayed settlement (if used)
- [ ] Set up loan product attributes (settlement model, interest strategy)
- [ ] Ensure COB batch job is running (processes pending transfers)
- [ ] Seed permissions: `SALE`, `BUYBACK`, `INTERMEDIARYSALE`, `CANCEL`, `CREATE`
