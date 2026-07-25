# Branch / Tellers — React Implementation Guide

Source: Apache Fineract Branch & Teller Management Feature  
Trace Date: 2026-07-25  
Java Base: `org.apache.fineract.organisation.teller`

---

## 1. Feature Overview

The Branch/Teller module manages physical teller counters and cashier assignments within an office hierarchy. Tellers represent physical or logical service points where cash transactions occur. Cashiers are staff members assigned to tellers for a specific date range.

### Sub-resource APIs

| Resource         | Base Path             | Description                     |
| ---------------- | --------------------- | ------------------------------- |
| Tellers          | `/v1/tellers`         | CRUD + list cashiers + journals |
| Cashiers         | `/v1/cashiers`        | Read-only list across offices   |
| Cashier Journals | `/v1/cashiersjournal` | Read-only journal entries       |

### Teller Lifecycle

```
PENDING (100) → ACTIVE (300) → CLOSED (600)
                     ↕
               INACTIVE (400)
```

### Cashier Allocation Lifecycle

```
Cashier assigned to teller (startDate → endDate)
  → Allocation
    → Cash assigned to cashier (ALLOCATE - type 101)
    → Cash operations (INWARD_CASH_TXN 103 / OUTWARD_CASH_TXN 104)
    → Cash settled from cashier (SETTLE - type 102)
```

### Key Files

| Layer      | Key Classes                                                                    |
| ---------- | ------------------------------------------------------------------------------ |
| Controller | `TellerApiResource`, `CashierApiResource`, `TellerJournalApiResource`          |
| Service    | `TellerManagementReadPlatformServiceImpl`, `TellerWritePlatformServiceJpaImpl` |
| Entity     | `Teller`, `Cashier`, `CashierTransaction`, `TellerTransaction`                 |
| Validator  | `CashierTransactionDataValidator`, `TellerCommandFromApiJsonDeserializer`      |
| Repository | `TellerRepository`, `CashierRepository`, `CashierTransactionRepository`        |

### Key Tables

| Table                    | Purpose                                        |
| ------------------------ | ---------------------------------------------- |
| `m_tellers`              | Teller counters                                |
| `m_cashiers`             | Cashier assignments (staff to teller)          |
| `m_cashier_transactions` | Cash allocation/settlement/in-out transactions |
| `m_teller_transactions`  | Teller-level transaction log                   |

---

## 2. API Inventory

### Tellers (`/v1/tellers`)

| Method | URL                                                                  | Description                                     |
| ------ | -------------------------------------------------------------------- | ----------------------------------------------- |
| GET    | `/v1/tellers`                                                        | List tellers (`?officeId=`)                     |
| GET    | `/v1/tellers/{tellerId}`                                             | Retrieve single teller                          |
| POST   | `/v1/tellers`                                                        | Create teller                                   |
| PUT    | `/v1/tellers/{tellerId}`                                             | Update teller                                   |
| DELETE | `/v1/tellers/{tellerId}`                                             | Delete teller                                   |
| GET    | `/v1/tellers/{tellerId}/cashiers`                                    | List cashiers for teller (`?fromdate=&todate=`) |
| GET    | `/v1/tellers/{tellerId}/cashiers/template`                           | Cashier creation template                       |
| GET    | `/v1/tellers/{tellerId}/cashiers/{cashierId}`                        | Retrieve single cashier                         |
| POST   | `/v1/tellers/{tellerId}/cashiers`                                    | Create cashier (allocate to teller)             |
| PUT    | `/v1/tellers/{tellerId}/cashiers/{cashierId}`                        | Update cashier allocation                       |
| DELETE | `/v1/tellers/{tellerId}/cashiers/{cashierId}`                        | Delete cashier allocation                       |
| POST   | `/v1/tellers/{tellerId}/cashiers/{cashierId}/allocate`               | Allocate cash to cashier                        |
| POST   | `/v1/tellers/{tellerId}/cashiers/{cashierId}/settle`                 | Settle cash from cashier                        |
| GET    | `/v1/tellers/{tellerId}/cashiers/{cashierId}/transactions`           | Cashier transactions (paginated)                |
| GET    | `/v1/tellers/{tellerId}/cashiers/{cashierId}/summaryandtransactions` | Transactions with summary                       |
| GET    | `/v1/tellers/{tellerId}/cashiers/{cashierId}/transactions/template`  | Transaction template                            |
| GET    | `/v1/tellers/{tellerId}/transactions`                                | List teller transactions (`?dateRange=`)        |
| GET    | `/v1/tellers/{tellerId}/transactions/{transactionId}`                | Retrieve teller transaction                     |
| GET    | `/v1/tellers/{tellerId}/journals`                                    | List teller journals (`?cashierId=&dateRange=`) |

### Cashiers (`/v1/cashiers`)

| Method | URL            | Description                                           |
| ------ | -------------- | ----------------------------------------------------- |
| GET    | `/v1/cashiers` | List cashiers (`?officeId=&tellerId=&staffId=&date=`) |

### Journals (`/v1/cashiersjournal`)

| Method | URL                   | Description                                                  |
| ------ | --------------------- | ------------------------------------------------------------ |
| GET    | `/v1/cashiersjournal` | List journals (`?officeId=&tellerId=&cashierId=&dateRange=`) |

### Permission Mapping

| Command        | Entity | Action                  | Permission                       |
| -------------- | ------ | ----------------------- | -------------------------------- |
| Create Teller  | TELLER | CREATE                  | `CREATE_TELLER`                  |
| Update Teller  | TELLER | UPDATE                  | `UPDATE_TELLER`                  |
| Delete Teller  | TELLER | DELETE                  | `DELETE_TELLER`                  |
| Create Cashier | TELLER | ALLOCATECASHIER         | `ALLOCATECASHIER_TELLER`         |
| Update Cashier | TELLER | UPDATECASHIERALLOCATION | `UPDATECASHIERALLOCATION_TELLER` |
| Delete Cashier | TELLER | DELETECASHIERALLOCATION | `DELETECASHIERALLOCATION_TELLER` |
| Allocate Cash  | TELLER | ALLOCATECASHTOCASHIER   | `ALLOCATECASHTOCASHIER_TELLER`   |
| Settle Cash    | TELLER | SETTLECASHFROMCASHIER   | `SETTLECASHFROMCASHIER_TELLER`   |

---

## 3. CRUD Analysis

### Tellers

| Operation  | Endpoint                        | Notes                                        |
| ---------- | ------------------------------- | -------------------------------------------- |
| **List**   | `GET /v1/tellers`               | Filter by `officeId`                         |
| **Detail** | `GET /v1/tellers/{tellerId}`    | Includes office/debit/credit account info    |
| **Create** | `POST /v1/tellers`              | Mandatory: officeId, name, startDate, status |
| **Update** | `PUT /v1/tellers/{tellerId}`    | Can update name, dates, status               |
| **Delete** | `DELETE /v1/tellers/{tellerId}` | Fails if cashiers still assigned             |

### Cashiers

| Operation    | Endpoint                                             | Notes                                             |
| ------------ | ---------------------------------------------------- | ------------------------------------------------- |
| **List**     | `GET /v1/tellers/{tellerId}/cashiers`                | Filter by from/todate                             |
| **Detail**   | `GET /v1/tellers/{tellerId}/cashiers/{cashierId}`    | Single cashier detail                             |
| **Template** | `GET /v1/tellers/{tellerId}/cashiers/template`       | Returns staff options for teller's office         |
| **Create**   | `POST /v1/tellers/{tellerId}/cashiers`               | Mandatory: staffId, startDate, endDate, isFullDay |
| **Update**   | `PUT /v1/tellers/{tellerId}/cashiers/{cashierId}`    | Update cashier dates/times                        |
| **Delete**   | `DELETE /v1/tellers/{tellerId}/cashiers/{cashierId}` | Remove cashier allocation                         |

### Cash Operations

| Operation             | Endpoint                                               | Notes                                |
| --------------------- | ------------------------------------------------------ | ------------------------------------ |
| **Allocate Cash**     | `POST /.../cashiers/{cashierId}/allocate`              | Debit main vault, credit teller cash |
| **Settle Cash**       | `POST /.../cashiers/{cashierId}/settle`                | Credit main vault, debit teller cash |
| **List Transactions** | `GET /.../cashiers/{cashierId}/transactions`           | Paginated                            |
| **Summary**           | `GET /.../cashiers/{cashierId}/summaryandtransactions` | Summary + paginated transactions     |

---

## 4. Create Workflow (Highest Priority)

### Pre-requisite Lookups

```
Load Offices (for teller's office)
  ↓  GET /offices
Select Office
  ↓
Create Teller
  ↓  POST /v1/tellers
Load Staff (for cashier assignment, filtered by office)
  ↓  GET /staff?officeId={officeId}
Load Teller Cashier Template
  ↓  GET /v1/tellers/{tellerId}/cashiers/template
Create Cashier (allocate staff to teller)
  ↓  POST /v1/tellers/{tellerId}/cashiers
Allocate Cash to Cashier
  ↓  POST /v1/tellers/{tellerId}/cashiers/{cashierId}/allocate
Settle Cash from Cashier
  ↓  POST /v1/tellers/{tellerId}/cashiers/{cashierId}/settle
```

### Create Teller Fields

| Field         | Type    | Required | Validation                 | Source         |
| ------------- | ------- | -------- | -------------------------- | -------------- |
| `officeId`    | Long    | **Yes**  | > 0                        | `GET /offices` |
| `name`        | String  | **Yes**  | Not blank; max 100; unique | User           |
| `description` | String  | No       | Max 500                    | User           |
| `status`      | Integer | **Yes**  | 0, 100, 300, 400, 600      | Enum           |
| `startDate`   | Date    | **Yes**  | Valid date                 | User           |
| `endDate`     | Date    | No       | Must be >= startDate       | User           |
| `locale`      | String  | **Yes**  | e.g. "en"                  | User           |
| `dateFormat`  | String  | **Yes**  | e.g. "dd MMMM yyyy"        | User           |

### Create Cashier Fields

| Field           | Type    | Required    | Validation                                | Source       |
| --------------- | ------- | ----------- | ----------------------------------------- | ------------ |
| `staffId`       | Long    | **Yes**     | > 0; must belong to teller's office       | `GET /staff` |
| `startDate`     | Date    | **Yes**     | Must be within teller date range          | User         |
| `endDate`       | Date    | **Yes**     | Must be >= startDate; within teller range | User         |
| `isFullDay`     | Boolean | **Yes**     | true/false                                | User         |
| `hourStartTime` | Integer | Conditional | Required if isFullDay=false; 0-23         | User         |
| `minStartTime`  | Integer | Conditional | Required if isFullDay=false; 0-59         | User         |
| `hourEndTime`   | Integer | Conditional | Required if isFullDay=false; 0-23         | User         |
| `minEndTime`    | Integer | Conditional | Required if isFullDay=false; 0-59         | User         |
| `description`   | String  | No          | Max 500                                   | User         |
| `locale`        | String  | **Yes**     | e.g. "en"                                 | User         |
| `dateFormat`    | String  | **Yes**     | e.g. "dd MMMM yyyy"                       | User         |

### Allocate/Settle Cash Fields

| Field          | Type       | Required | Validation          |
| -------------- | ---------- | -------- | ------------------- |
| `txnDate`      | Date       | **Yes**  | Valid date          |
| `txnAmount`    | BigDecimal | **Yes**  | > 0                 |
| `currencyCode` | String     | **Yes**  | Valid currency code |
| `txnNote`      | String     | **Yes**  | Not blank           |
| `locale`       | String     | **Yes**  | e.g. "en"           |
| `dateFormat`   | String     | **Yes**  | e.g. "dd MMMM yyyy" |

---

## 5. Lookup APIs

| UI Field         | Endpoint                              | Display                        | Value           | Required     |
| ---------------- | ------------------------------------- | ------------------------------ | --------------- | ------------ |
| Office           | `GET /offices`                        | `name`                         | `id`            | Yes          |
| Staff            | `GET /staff?officeId={id}`            | `displayName`                  | `id`            | Yes          |
| Currencies       | `GET /currencies`                     | `name`                         | `code`          | For cash txn |
| Teller Status    | —                                     | PENDING/ACTIVE/INACTIVE/CLOSED | 100/300/400/600 | Yes          |
| Cashier Template | `GET /tellers/{id}/cashiers/template` | staffOptions                   | —               | Yes          |

---

## 6. API Call Order

### Setup Teller + Cashier

1. `GET /offices` — load offices
2. `POST /v1/tellers` — create teller
3. `GET /staff?officeId={officeId}` — load staff for teller's office
4. `GET /v1/tellers/{tellerId}/cashiers/template` — load template (staff options)
5. `POST /v1/tellers/{tellerId}/cashiers` — assign staff as cashier

### Daily Cash Operations

1. `POST /v1/tellers/{tellerId}/cashiers/{cashierId}/allocate` — allocate starting cash
2. `GET /v1/tellers/{tellerId}/cashiers/{cashierId}/summaryandtransactions` — view summary
3. `POST /v1/tellers/{tellerId}/cashiers/{cashierId}/settle` — settle cash at end of day

---

## 7. Request Payload Analysis

### Create Teller (`POST /v1/tellers`)

```json
{
  "officeId": 1,
  "name": "Main Branch Teller 1",
  "description": "Primary teller counter",
  "status": 300,
  "startDate": "01 January 2026",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Create Cashier (`POST /v1/tellers/{tellerId}/cashiers`)

```json
{
  "staffId": 3,
  "startDate": "01 January 2026",
  "endDate": "31 December 2026",
  "isFullDay": true,
  "description": "Morning shift cashier",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Create Cashier (Part-time) (`POST /v1/tellers/{tellerId}/cashiers`)

```json
{
  "staffId": 4,
  "startDate": "01 January 2026",
  "endDate": "30 June 2026",
  "isFullDay": false,
  "hourStartTime": 8,
  "minStartTime": 0,
  "hourEndTime": 12,
  "minEndTime": 0,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Allocate Cash to Cashier (`POST /v1/tellers/{tellerId}/cashiers/{cashierId}/allocate`)

```json
{
  "txnDate": "01 January 2026",
  "txnAmount": 50000.0,
  "currencyCode": "USD",
  "txnNote": "Starting cash allocation",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Settle Cash from Cashier (`POST /v1/tellers/{tellerId}/cashiers/{cashierId}/settle`)

```json
{
  "txnDate": "31 January 2026",
  "txnAmount": 45000.0,
  "currencyCode": "USD",
  "txnNote": "End of month settlement",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Update Teller (`PUT /v1/tellers/{tellerId}`)

```json
{
  "name": "Main Branch Teller 1 (Updated)",
  "description": "Updated description",
  "status": 300,
  "startDate": "01 January 2026",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

---

## 8. Validation Rules

### Teller Validation (`TellerCommandFromApiJsonDeserializer`)

| Field         | Required | Validation                                     |
| ------------- | -------- | ---------------------------------------------- |
| `officeId`    | **Yes**  | Must reference existing office                 |
| `name`        | **Yes**  | Not blank; max 100; unique (`ux_tellers_name`) |
| `status`      | **Yes**  | Must be valid TellerStatus (0,100,300,400,600) |
| `startDate`   | **Yes**  | Valid date                                     |
| `endDate`     | No       | If provided, must be >= startDate              |
| `description` | No       | Max 500                                        |

### Cashier Validation

| Field           | Required    | Validation                                     |
| --------------- | ----------- | ---------------------------------------------- |
| `staffId`       | **Yes**     | > 0; must belong to same office as teller      |
| `startDate`     | **Yes**     | Must be within teller's date range (start-end) |
| `endDate`       | **Yes**     | Must be >= startDate; within teller range      |
| `isFullDay`     | **Yes**     | Boolean                                        |
| `hourStartTime` | Conditional | 0-23; required if isFullDay=false              |
| `minStartTime`  | Conditional | 0-59; required if isFullDay=false              |
| `hourEndTime`   | Conditional | 0-23; required if isFullDay=false              |
| `minEndTime`    | Conditional | 0-59; required if isFullDay=false              |

### Cashier Business Rules

| Rule                       | Logic                                                              | Error                                           |
| -------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| Date range in teller range | Cashier start/end must be within teller start/end                  | `CashierDateRangeOutOfTellerDateRangeException` |
| No double-booking          | Cashier cannot be allocated to same teller for overlapping periods | `CashierAlreadyAllocated`                       |
| Sufficient funds on settle | Cashier must have enough net cash to settle                        | `CashierInsufficientAmountException`            |
| Teller delete protection   | Cannot delete teller if cashiers are still assigned                | `CashierExistForTellerException`                |

### Cash Transaction Validation

| Field          | Required | Validation     |
| -------------- | -------- | -------------- |
| `txnAmount`    | **Yes**  | > 0            |
| `txnDate`      | **Yes**  | Valid date     |
| `txnNote`      | **Yes**  | Not blank      |
| `currencyCode` | **Yes**  | Valid currency |

---

## 9. Business Flow

### Create Teller Flow

```
Controller (TellerApiResource.createTeller)
  ↓
PortfolioCommandSourceWritePlatformService.logCommandSource()
  ↓
CommandHandler (CreateTellerCommandHandler)
  ↓  @CommandType(entity = "TELLER", action = "CREATE")
Service (TellerWritePlatformServiceJpaImpl.createTeller)
  ↓
TellerCommandFromApiJsonDeserializer.validateForCreateAndUpdateTeller(json)
  ↓  validates officeId, name, startDate, status, endDate >= startDate
Teller.fromJson(command, office, debitAccount, creditAccount)
  ↓  constructs Teller entity
TellerRepositoryWrapper.save(teller)
  ↓
Return CommandProcessingResult with tellerId
```

### Allocate Cash to Cashier Flow

```
Controller (TellerApiResource.allocateCashToCashier)
  ↓
CommandHandler (AllocateCashToCashierCommandHandler)
  ↓  @CommandType(entity = "TELLER", action = "ALLOCATECASHTOCASHIER")
Service (TellerWritePlatformServiceJpaImpl.allocateCashToCashier)
  ↓
TellerCommandFromApiJsonDeserializer.validateForCashTxnForCashier(json)
  ↓  validates txnAmount, txnDate, txnNote, currencyCode
CashierTransactionDataValidator.validateSettleCashAndCashOutTransactions(cashierId, command)
  ↓  checks cashier has sufficient funds
Create CashierTransaction entity (txnType = 101 = ALLOCATE)
  ↓
Create GL journal entries:
  ├─ Debit: CASH_AT_TELLER (financial activity account)
  └─ Credit: CASH_AT_MAINVAULT (financial activity account)
  ↓
CashierTransactionRepository.save(transaction)
  ↓
Return CommandProcessingResult with cashierTransactionId
```

---

## 10. Related Operations

| Operation            | Endpoint                                               | Description                    |
| -------------------- | ------------------------------------------------------ | ------------------------------ |
| List Tellers         | `GET /v1/tellers`                                      | View all tellers by office     |
| List All Cashiers    | `GET /v1/cashiers`                                     | Cross-office cashier list      |
| Cashier Summary      | `GET /.../cashiers/{cashierId}/summaryandtransactions` | Net cash + transaction history |
| Cashier Transactions | `GET /.../cashiers/{cashierId}/transactions`           | Paginated txn list             |
| Teller Journals      | `GET /v1/tellers/{tellerId}/journals`                  | GL journal entries for teller  |
| Teller Transactions  | `GET /v1/tellers/{tellerId}/transactions`              | Teller-level transactions      |
| Cashier Journals     | `GET /v1/cashiersjournal`                              | Global journal view            |

### Integration with Loan/Savings

Cashier transactions are also tracked from:

- `m_savings_account_transaction` — savings deposits/withdrawals linked to cashier
- `m_loan_transaction` — loan repayments/disbursements linked to cashier
- `m_client_transaction` — client payments linked to cashier

These are included in the `retrieveCashierTransactions` query via UNION.

---

## 11. Hidden Dependencies

| Dependency                      | Impact                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Office must exist**           | Teller requires an office reference                                                                                            |
| **Staff must belong to office** | Cashier's staff must be assigned to the same office as the teller                                                              |
| **GL accounts for teller cash** | Financial Activity Accounts `CASH_AT_MAINVAULT` and `CASH_AT_TELLER` must exist for cash allocation/settlement journal entries |
| **Tell-over date range**        | Cashier allocation dates must be within the teller's valid date range                                                          |
| **Unique teller name**          | Teller name has a unique constraint (`ux_tellers_name`)                                                                        |
| **Unique cashier-staff-teller** | A staff member can only be assigned once per teller                                                                            |
| **Cashier time-slot overlap**   | Cashier cannot be double-booked on the same teller for overlapping periods                                                     |
| **Read service stubs**          | Several methods in `TellerManagementReadPlatformServiceImpl` are TODO stubs (e.g., `getJournals`, `findTellerTransaction`)     |
| **Cache**                       | Teller list is cached (`@Cacheable`); changes may not appear immediately without eviction                                      |
| **Transaction mapping**         | Cashier transactions are mapped via UNION across 4 tables; this may impact query performance                                   |
| **Cashier association**         | Cashier is linked to transactions via the logged-in user's staff_id; only cashier's own transactions are visible               |
| **Delete constraints**          | Teller with active cashiers cannot be deleted                                                                                  |

---

## 12. Implementation Checklist

### Tellers

- [ ] Teller List (`GET /v1/tellers?officeId=`)
- [ ] Teller Detail (`GET /v1/tellers/{tellerId}`)
- [ ] Create Teller (`POST /v1/tellers`)
- [ ] Update Teller (`PUT /v1/tellers/{tellerId}`)
- [ ] Delete Teller (`DELETE /v1/tellers/{tellerId}`)

### Cashiers

- [ ] Cashier List by Teller (`GET /v1/tellers/{tellerId}/cashiers`)
- [ ] Global Cashier List (`GET /v1/cashiers`)
- [ ] Cashier Detail (`GET /v1/tellers/{tellerId}/cashiers/{cashierId}`)
- [ ] Cashier Template (`GET /v1/tellers/{tellerId}/cashiers/template`)
- [ ] Create Cashier (`POST /v1/tellers/{tellerId}/cashiers`)
- [ ] Update Cashier (`PUT /v1/tellers/{tellerId}/cashiers/{cashierId}`)
- [ ] Delete Cashier (`DELETE /v1/tellers/{tellerId}/cashiers/{cashierId}`)

### Cash Operations

- [ ] Allocate Cash (`POST /.../cashiers/{cashierId}/allocate`)
- [ ] Settle Cash (`POST /.../cashiers/{cashierId}/settle`)
- [ ] Cashier Transactions (`GET /.../cashiers/{cashierId}/transactions`)
- [ ] Cashier Summary + Transactions (`GET /.../cashiers/{cashierId}/summaryandtransactions`)
- [ ] Cashier Transaction Template (`GET /.../cashiers/{cashierId}/transactions/template`)

### Journals & Reports

- [ ] Teller Journals (`GET /v1/tellers/{tellerId}/journals`)
- [ ] Teller Transactions (`GET /v1/tellers/{tellerId}/transactions`)
- [ ] Teller Transaction Detail (`GET /v1/tellers/{tellerId}/transactions/{transactionId}`)
- [ ] Cashier Journals (`GET /v1/cashiersjournal`)
