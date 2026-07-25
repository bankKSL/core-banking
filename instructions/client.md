# Client — React Implementation Guide

Source: Apache Fineract Portfolio Client Feature  
Trace Date: 2026-07-25  
Java Base: `org.apache.fineract.portfolio.client`

---

## 1. Overview

The Client feature manages people (Person, `legalFormId=1`) and businesses (Entity, `legalFormId=2`) that interact with the MFI. A client can be created as Pending (inactive) or Active (with activation date). Once created, clients progress through a lifecycle: Pending → Active → Closed (or Rejected / Withdrawn from Pending). Clients can have charges, identifiers (ID documents), family members, addresses, collateral, and a default savings account.

### Sub-resource APIs

| Resource              | Base Path                              |
| --------------------- | -------------------------------------- |
| Client Charges        | `/v1/clients/{clientId}/charges`       |
| Client Identifiers    | `/v1/clients/{clientId}/identifiers`   |
| Client Transactions   | `/v1/clients/{clientId}/transactions`  |
| Client Family Members | `/v1/clients/{clientId}/familymembers` |
| Client Address        | `/v1/client/{clientId}/addresses`      |
| Client Collateral     | `/v1/clients/{clientId}/collaterals`   |
| Client Accounts       | `/v1/clients/{clientId}/accounts`      |

---

## 2. Lifecycle

```
                    ┌──────────────┐
                    │   PENDING    │  (status_enum = 100)
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
      ┌──────────┐   ┌──────────┐   ┌───────────┐
      │  ACTIVE  │   │ REJECTED │   │ WITHDRAWN │
      │  (300)   │   │  (700)   │   │  (800)    │
      └────┬─────┘   └──────────┘   └───────────┘
           │              │              │
           │              │ undoReject   │ undoWithdraw
           │              ▼              ▼
           │         ┌──────────┐   ┌──────────┐
           │         │ PENDING  │   │ PENDING  │
           │         └──────────┘   └──────────┘
           ▼
      ┌──────────┐
      │  CLOSED  │
      │  (600)   │
      └──────────┘
           │
           ▼ reactivate
      ┌──────────┐
      │  ACTIVE  │
      └──────────┘
```

State transition commands (POST `/v1/clients/{clientId}?command=`):

- `activate` — PENDING → ACTIVE (requires `activationDate`)
- `close` — ACTIVE → CLOSED (requires `closureDate`, `closureReasonId`)
- `reject` — PENDING → REJECTED (requires `rejectionDate`, `rejectionReasonId`)
- `withdraw` — PENDING → WITHDRAWN (requires `withdrawalDate`, `withdrawalReasonId`)
- `reactivate` — CLOSED → ACTIVE (requires `reactivationDate`)
- `undoRejection` — REJECTED → PENDING (requires `reopenedDate`)
- `undoWithdrawal` — WITHDRAWN → PENDING (requires `reopenedDate`)
- `assignStaff` — assigns a loan officer
- `unassignStaff` — removes staff assignment
- `updateSavingsAccount` — changes default savings account
- `proposeTransfer` / `acceptTransfer` / `rejectTransfer` / `withdrawTransfer` / `proposeAndAcceptTransfer` — office transfer

---

## 3. API Inventory

### 3.1 CRUD

#### List Clients

```
GET /v1/clients?offset=0&limit=20&orderBy=displayName&sortOrder=ASC
```

Query params:

| Param            | Type          | Description                                                    |
| ---------------- | ------------- | -------------------------------------------------------------- |
| `offset`         | Integer       | Pagination offset                                              |
| `limit`          | Integer       | Pagination limit                                               |
| `orderBy`        | String        | Sort column (e.g. `displayName`, `officeName`, `status_enum`)  |
| `sortOrder`      | `ASC`\|`DESC` | Sort direction                                                 |
| `officeId`       | Long          | Filter by office                                               |
| `externalId`     | String        | Filter by external ID (LIKE)                                   |
| `displayName`    | String        | Filter by display name (LIKE)                                  |
| `firstName`      | String        | Filter by first name (LIKE)                                    |
| `lastName`       | String        | Filter by last name (LIKE)                                     |
| `status`         | String        | Filter: `Pending`, `Active`, `Closed`, `Rejected`, `Withdrawn` |
| `legalForm`      | Integer       | `1`=Person, `2`=Entity                                         |
| `staffId`        | Long          | Filter by assigned staff                                       |
| `orphansOnly`    | Boolean       | Only clients not in any group                                  |
| `underHierarchy` | String        | Office hierarchy filter                                        |
| `fields`         | String        | Comma-separated response field filter                          |

Response: `Page<ClientData>` with totalFilteredRecords.

#### Get Client Detail

```
GET /v1/clients/{clientId}?template=true
```

Optional `?template=true` returns dropdown options alongside the client data.  
Returns `ClientData`.

#### Get by External ID

```
GET /v1/clients/external-id/{externalId}
```

#### Create Client

```
POST /v1/clients
```

Content-Type: `application/json`

#### Update Client

```
PUT /v1/clients/{clientId}
```

#### Delete Client

```
DELETE /v1/clients/{clientId}
```

Deletion is only allowed when client status = PENDING. This is a hard delete.

#### Apply Command (State Transition)

```
POST /v1/clients/{clientId}?command={command}
```

### 3.2 Client Accounts

```
GET /v1/clients/{clientId}/accounts
```

Returns: `{ loanAccounts: [], savingsAccounts: [], shareAccounts: [] }`

### 3.3 Client Charges

```
GET  /v1/clients/{clientId}/charges?chargeStatus=all
POST /v1/clients/{clientId}/charges
POST /v1/clients/{clientId}/charges/{chargeId}?command=waive
POST /v1/clients/{clientId}/charges/{chargeId}?command=paycharge
DELETE /v1/clients/{clientId}/charges/{chargeId}
```

### 3.4 Client Identifiers

```
GET    /v1/clients/{clientId}/identifiers
POST   /v1/clients/{clientId}/identifiers
PUT    /v1/clients/{clientId}/identifiers/{identifierId}
DELETE /v1/clients/{clientId}/identifiers/{identifierId}
```

### 3.5 Client Family Members

```
GET    /v1/clients/{clientId}/familymembers
POST   /v1/clients/{clientId}/familymembers
PUT    /v1/clients/{clientId}/familymembers/{familyMemberId}
DELETE /v1/clients/{clientId}/familymembers/{familyMemberId}
```

### 3.6 Client Address

```
GET    /v1/client/{clientId}/addresses
POST   /v1/client/{clientId}/addresses
PUT    /v1/client/{clientId}/addresses
```

### 3.7 Client Collateral

```
POST   /v1/clients/{clientId}/collaterals
PUT    /v1/clients/{clientId}/collaterals/{collateralId}
DELETE /v1/clients/{clientId}/collaterals/{collateralId}
```

---

## 4. Create Page Dependency Analysis

Every field on the Client Create form, what it depends on, and where the data comes from.

### 4.1 Template Data

```
GET /v1/clients/template?officeId={officeId}&staffInSelectedOfficeOnly=true/false
```

This single endpoint returns ALL dropdown options needed for the create form.

### 4.2 Field Dependency Table

| Field                         | Data Source                                                | When Loaded             | Required    | Notes                                                                                       |
| ----------------------------- | ---------------------------------------------------------- | ----------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| **Office**                    | `GET /v1/clients/template` → `officeOptions`               | Page load               | **Yes**     | First field to select; filters staff                                                        |
| **Legal Form**                | `GET /v1/clients/template` → `clientLegalFormOptions`      | Page load               | **Yes**     | `1`=Person, `2`=Entity; changes name fields                                                 |
| **First Name**                | User input                                                 | After Legal Form=Person | Conditional | Required if fullname not provided                                                           |
| **Middle Name**               | User input                                                 | After Legal Form=Person | No          |                                                                                             |
| **Last Name**                 | User input                                                 | After Legal Form=Person | Conditional | Required if fullname not provided                                                           |
| **Full Name**                 | User input                                                 | After Legal Form=Entity | Conditional | Required if firstname/lastname not provided                                                 |
| **External ID**               | User input                                                 | Always                  | No          | Max 100 chars                                                                               |
| **Mobile No**                 | User input                                                 | Always                  | No          | Regex: `^\+?[0-9]{7,15}$`, max 50                                                           |
| **Email Address**             | User input                                                 | Always                  | No          |                                                                                             |
| **Date of Birth**             | User input                                                 | Always                  | No          | Must be before today and before submittedOnDate                                             |
| **Gender**                    | `GET /v1/clients/template` → `genderOptions`               | Page load               | No          | From code "Gender"                                                                          |
| **Client Type**               | `GET /v1/clients/template` → `clientTypeOptions`           | Page load               | No          | From code "ClientType"                                                                      |
| **Client Classification**     | `GET /v1/clients/template` → `clientClassificationOptions` | Page load               | No          | From code "ClientClassification"                                                            |
| **Staff (Loan Officer)**      | `GET /v1/clients/template` → `staffOptions`                | After Office selected   | No          | Filtered by office                                                                          |
| **Active?**                   | Toggle                                                     | Always                  | **Yes**     | Must be true or false                                                                       |
| **Activation Date**           | User input                                                 | If active=true          | Conditional | Required when active=true                                                                   |
| **Submitted On Date**         | User input                                                 | Always                  | No          | Defaults to today on backend                                                                |
| **Savings Product**           | `GET /v1/clients/template` → `savingProductOptions`        | Page load               | No          | Default savings product                                                                     |
| **Group**                     | User input (groupId)                                       | Always                  | No          |                                                                                             |
| **Is Staff?**                 | Toggle                                                     | Always                  | No          | Whether client is also an employee                                                          |
| **Account No**                | User input                                                 | Always                  | No          | Max 20 chars; auto-generated if omitted                                                     |
| **Address**                   | `GET /v1/clients/template` → `address`                     | If address enabled      | Conditional | Required if `isAddressEnabled=true`                                                         |
| **Family Members**            | Template includes `familyMemberOptions`                    | Page load               | No          | Relationships, marital status, gender options                                               |
| **Client Non-Person Details** | User input                                                 | If Legal Form=Entity    | No          | `constitutionId`, `incorpNumber`, `mainBusinessLineId`, `remarks`, `incorpValidityTillDate` |

### 4.3 Code Value Mappings

| Code Name (Backend)    | API Field                                | Endpoint                                              |
| ---------------------- | ---------------------------------------- | ----------------------------------------------------- |
| `Gender`               | `genderOptions`                          | `GET /codes/codevalues?codeName=Gender`               |
| `ClientType`           | `clientTypeOptions`                      | `GET /codes/codevalues?codeName=ClientType`           |
| `ClientClassification` | `clientClassificationOptions`            | `GET /codes/codevalues?codeName=ClientClassification` |
| `Constitution`         | `clientNonPersonConstitutionOptions`     | `GET /codes/codevalues?codeName=Constitution`         |
| `Main Business Line`   | `clientNonPersonMainBusinessLineOptions` | `GET /codes/codevalues?codeName=Main Business Line`   |
| `ClientClosureReason`  | `narrations` (when command=close)        | `GET /codes/codevalues?codeName=ClientClosureReason`  |
| `ClientRejectReason`   | `narrations` (when command=reject)       | `GET /codes/codevalues?codeName=ClientRejectReason`   |
| `ClientWithdrawReason` | `narrations` (when command=withdraw)     | `GET /codes/codevalues?codeName=ClientWithdrawReason` |

---

## 5. Lookup API Table

| UI Component                 | Endpoint                                                              | Label Field                   | Value Field   | Required |
| ---------------------------- | --------------------------------------------------------------------- | ----------------------------- | ------------- | -------- |
| Office Select                | `GET /v1/offices?orderBy=name`                                        | `name`                        | `id`          | Yes      |
| Staff Select                 | `GET /v1/staff?officeId={officeId}&loanOfficersOnly=false`            | `displayName`                 | `id`          | No       |
| Gender Select                | `GET /v1/clients/template` → `genderOptions`                          | `name`                        | `id`          | No       |
| Client Type Select           | `GET /v1/clients/template` → `clientTypeOptions`                      | `name`                        | `id`          | No       |
| Client Classification Select | `GET /v1/clients/template` → `clientClassificationOptions`            | `name`                        | `id`          | No       |
| Savings Product Select       | `GET /v1/savingsproducts?orderBy=name`                                | `name`                        | `id`          | No       |
| Legal Form Select            | `GET /v1/clients/template` → `clientLegalFormOptions`                 | `value` (label like "Person") | `id` (1 or 2) | Yes      |
| Constitution Select          | `GET /v1/clients/template` → `clientNonPersonConstitutionOptions`     | `name`                        | `id`          | No       |
| Main Business Line Select    | `GET /v1/clients/template` → `clientNonPersonMainBusinessLineOptions` | `name`                        | `id`          | No       |
| Client Lookup (for groups)   | `GET /v1/clients?status=Active&fields=id,displayName,officeName`      | `displayName`                 | `id`          | No       |

---

## 6. Dependency Graph

```
Page Load
    │
    ▼
GET /v1/clients/template
    │
    ├── officeOptions       → Office dropdown (loads immediately)
    ├── staffOptions        → Staff dropdown (wait for officeId)
    ├── genderOptions       → Gender dropdown
    ├── clientTypeOptions   → Client Type dropdown
    ├── clientClassificationOptions → Classification dropdown
    ├── clientNonPersonConstitutionOptions → Constitution (Entity only)
    ├── clientNonPersonMainBusinessLineOptions → Business Line (Entity only)
    ├── clientLegalFormOptions → Person/Entity radio
    ├── savingProductOptions → Savings Product dropdown
    ├── familyMemberOptions → Family member template
    └── address             → Address fields (if address enabled)
            │
            ▼
User selects Office
    │
    ▼
Re-fetch staff: GET /v1/staff?officeId={officeId}&loanOfficersOnly=false
    │
    ▼
User selects Legal Form
    │
    ├── Person  → show firstname/middlename/lastname, gender, DOB
    └── Entity  → show fullname, constitution, incorpNumber, business line
            │
            ▼
User sets Active = true
    │
    ▼
Show activationDate (required when active=true)
    │
    ▼
User submits → POST /v1/clients
```

---

## 7. Form Layout

### Section 1: Legal Form (Radio)

- Legal Form (Person / Entity) — **Required**
- This changes the entire name section

### Section 2: Basic Information

- **Office** — dropdown, **Required**, triggers staff reload
- **Staff (Loan Officer)** — dropdown, filtered by office, Optional
- **Account No** — text, auto-generated if empty, max 20 chars
- **External ID** — text, max 100 chars
- **Client Type** — dropdown, Optional
- **Client Classification** — dropdown, Optional

### Section 3: Name (changes based on Legal Form)

**Person (legalFormId=1):**

- First Name — **Required** (max 50)
- Middle Name — Optional (max 50)
- Last Name — **Required** (max 50)

**Entity (legalFormId=2):**

- Full Name — **Required** (max 160)

> Mutual exclusivity enforced: you cannot send both fullname AND firstname/middlename/lastname.

### Section 4: Contact

- Mobile No — text, Optional, regex: `^\+?[0-9]{7,15}$`, max 50
- Email Address — text, Optional
- Date of Birth — date picker, Optional, must be before today

### Section 5: Demographics

- Gender — dropdown (from "Gender" code), Optional
- Is Staff? — toggle, Optional (default false)

### Section 6: Activation

- **Active** — toggle, **Required** (must be true or false)
- Activation Date — date picker, **Required** if active=true
- Submitted On Date — date picker, Optional (defaults to today)

### Section 7: Entity Details (only when Legal Form = Entity)

- Constitution — dropdown (from "Constitution" code)
- Incorporation Number — text, max 50
- Main Business Line — dropdown (from "Main Business Line" code)
- Remarks — text, max 150
- Incorporation Validity Till Date — date picker

### Section 8: Financial

- Savings Product — dropdown, Optional (default product for savings account)

### Section 9: Group

- Group ID — hidden/numeric, Optional

### Section 10: Address (if `isAddressEnabled=true`)

Address is a JSON array. The template provides `address` structure via `GET /v1/clients/template`.

### Section 11: Family Members (expandable section)

The template provides `familyMemberOptions` with relationship, marital status, gender options.

---

## 8. API Call Sequence

```
1. GET /v1/clients/template
     → Load all dropdowns: offices, staff, genders, types, classifications, savings products, legal forms, constitutions, business lines, family member template, address template

2. User selects Office
   ↓
   GET /v1/staff?officeId={selectedOfficeId}&loanOfficersOnly=false
     → Refresh staff dropdown

3. User fills form, selects Legal Form, enters names, toggles Active, etc.

4. Validation (client-side via Zod — see Section 9)

5. POST /v1/clients
     Body: {
       officeId: number,
       legalFormId: 1 | 2,
       firstname?: string,
       middlename?: string,
       lastname?: string,
       fullname?: string,
       active: boolean,
       activationDate?: string (yyyy-MM-dd),
       submittedOnDate?: string,
       externalId?: string,
       mobileNo?: string,
       emailAddress?: string,
       dateOfBirth?: string,
       genderId?: number,
       clientTypeId?: number,
       clientClassificationId?: number,
       staffId?: number,
       savingsProductId?: number,
       groupId?: number,
       accountNo?: string,
       isStaff?: boolean,
       clientNonPersonDetails?: { ... },  // if Entity
       address?: [ ... ],                 // if address enabled
       familyMembers?: [ ... ],
       dateFormat: "yyyy-MM-dd",
       locale: "en"
     }

6. Response: { clientId: number, resourceId: number, officeId: number, ... }
```

---

## 9. TypeScript Interfaces

```typescript
// === Core Enums ===

enum ClientStatus {
  Invalid = 0,
  Pending = 100,
  Active = 300,
  TransferInProgress = 303,
  TransferOnHold = 304,
  Closed = 600,
  Rejected = 700,
  Withdrawn = 800,
}

enum LegalForm {
  Person = 1,
  Entity = 2,
}

// === Supporting Types ===

interface EnumOptionData {
  id: number;
  code: string;
  value: string;
}

interface CodeValueData {
  id: number;
  name: string;
  position?: number;
  active?: boolean;
  mandatory?: boolean;
}

interface ClientTimelineData {
  submittedOnDate: string | null;
  submittedByUsername: string | null;
  submittedByFirstname: string | null;
  submittedByLastname: string | null;
  activatedOnDate: string | null;
  activatedByUsername: string | null;
  activatedByFirstname: string | null;
  activatedByLastname: string | null;
  closedOnDate: string | null;
  closedByUsername: string | null;
  closedByFirstname: string | null;
  closedByLastname: string | null;
}

interface OfficeData {
  id: number;
  name: string;
  nameDecorated: string;
  externalId?: string;
  openingDate?: string;
  hierarchy?: string;
  parentId?: number;
  parentName?: string;
}

interface StaffData {
  id: number;
  firstname: string;
  lastname: string;
  displayName: string;
  officeId: number;
  officeName: string;
  isLoanOfficer: boolean;
  externalId?: string;
  joiningDate?: string;
}

interface SavingsProductData {
  id: number;
  name: string;
  shortName?: string;
  currency?: CurrencyData;
}

interface CurrencyData {
  code: string;
  name: string;
  decimalPlaces: number;
  displaySymbol: string;
  nameCode: string;
  displayLabel: string;
}

interface GroupGeneralData {
  id: number;
  name: string;
  officeId: number;
  officeName: string;
  hierarchy?: string;
  status?: EnumOptionData;
  active?: boolean;
  activationDate?: string;
  staffId?: number;
  staffName?: string;
  clientCount?: number;
}

interface ClientCollateralManagementData {
  id: number;
  name: string;
  quantity: number;
  pctToBase: number;
  basePrice: number;
  total: number;
  totalCollateral: number;
}

interface ClientNonPersonData {
  constitutionId?: number;
  constitution?: CodeValueData;
  incorpNumber?: string;
  mainBusinessLineId?: number;
  mainBusinessLine?: CodeValueData;
  remarks?: string;
  incorpValidityTillDate?: string;
}

interface AddressData {
  addressId?: number;
  addressType?: string;
  addressTypeId?: number;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  townVillage?: string;
  city?: string;
  country?: string;
  stateProvinceId?: number;
  stateProvince?: string;
  countyDistrict?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

interface ClientFamilyMembersData {
  id?: number;
  clientId?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  qualification?: string;
  age?: number;
  isDependent?: boolean;
  relationshipId?: number;
  relationship?: CodeValueData;
  maritalStatusId?: number;
  maritalStatus?: CodeValueData;
  genderId?: number;
  gender?: CodeValueData;
  professionId?: number;
  profession?: CodeValueData;
  dateOfBirth?: string;
}

interface DatatableData {
  applicationTableName: string;
  registeredTableName: string;
  entitySubType?: string;
  multiRow: boolean;
  columns: DatatableColumnData[];
}

interface DatatableColumnData {
  name: string;
  type: string;
  length?: number;
  mandatory: boolean;
  code?: string;
  columnValues?: CodeValueData[];
}

// === Main Client DTO ===

interface ClientData {
  id: number;
  accountNo: string | null;
  externalId: string | null;
  status: EnumOptionData;
  subStatus: CodeValueData | null;
  active: boolean | null;
  activationDate: string | null;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  fullname: string | null;
  displayName: string | null;
  mobileNo: string | null;
  emailAddress: string | null;
  dateOfBirth: string | null;
  gender: CodeValueData | null;
  clientType: CodeValueData | null;
  clientClassification: CodeValueData | null;
  isStaff: boolean;
  officeId: number;
  officeName: string | null;
  transferToOfficeId: number | null;
  transferToOfficeName: string | null;
  imageId: number | null;
  imagePresent: boolean | null;
  staffId: number | null;
  staffName: string | null;
  timeline: ClientTimelineData | null;
  savingsProductId: number | null;
  savingsProductName: string | null;
  savingsAccountId: number | null;
  legalForm: EnumOptionData | null;
  clientCollateralManagements: ClientCollateralManagementData[] | null;
  groups: GroupGeneralData[] | null;
  clientNonPersonDetails: ClientNonPersonData | null;
  address: AddressData[] | null;
  isAddressEnabled: boolean | null;
  datatables: DatatableData[] | null;

  // Template-only fields (returned by GET /clients/template)
  officeOptions: OfficeData[] | null;
  staffOptions: StaffData[] | null;
  genderOptions: CodeValueData[] | null;
  clientTypeOptions: CodeValueData[] | null;
  clientClassificationOptions: CodeValueData[] | null;
  clientNonPersonConstitutionOptions: CodeValueData[] | null;
  clientNonPersonMainBusinessLineOptions: CodeValueData[] | null;
  clientLegalFormOptions: EnumOptionData[] | null;
  savingProductOptions: SavingsProductData[] | null;
  savingAccountOptions: SavingsProductData[] | null;
  familyMemberOptions: ClientFamilyMembersData | null;
  narrations: CodeValueData[] | null;
}

// === Create Request (POST /v1/clients) ===

interface CreateClientRequest {
  officeId: number;
  legalFormId: 1 | 2;

  // Name (Person)
  firstname?: string;
  middlename?: string;
  lastname?: string;

  // Name (Entity)
  fullname?: string;

  // Activation
  active: boolean;
  activationDate?: string; // yyyy-MM-dd, required if active=true
  submittedOnDate?: string;

  // Optional fields
  externalId?: string;
  mobileNo?: string;
  emailAddress?: string;
  dateOfBirth?: string;
  genderId?: number;
  clientTypeId?: number;
  clientClassificationId?: number;
  staffId?: number;
  savingsProductId?: number;
  groupId?: number;
  accountNo?: string;
  isStaff?: boolean;

  // Entity details
  clientNonPersonDetails?: {
    constitutionId?: number;
    incorpNumber?: string;
    mainBusinessLineId?: number;
    remarks?: string;
    incorpValidityTillDate?: string;
  };

  // Address (if address enabled)
  address?: AddressData[];

  // Family members
  familyMembers?: ClientFamilyMembersData[];

  // Required format
  dateFormat: string; // e.g. "yyyy-MM-dd"
  locale: string; // e.g. "en"
}

// === Update Request (PUT /v1/clients/{clientId}) ===

type UpdateClientRequest = Partial<
  CreateClientRequest & {
    displayname?: string;
  }
>;

// === State Transition Commands ===

interface ActivateClientRequest {
  activationDate: string;
  dateFormat: string;
  locale: string;
}

interface CloseClientRequest {
  closureDate: string;
  closureReasonId: number;
  dateFormat: string;
  locale: string;
}

interface RejectClientRequest {
  rejectionDate: string;
  rejectionReasonId: number;
  dateFormat: string;
  locale: string;
}

interface WithdrawClientRequest {
  withdrawalDate: string;
  withdrawalReasonId: number;
  dateFormat: string;
  locale: string;
}

interface ReactivateClientRequest {
  reactivationDate: string;
  dateFormat: string;
  locale: string;
}

interface UndoRejectClientRequest {
  reopenedDate: string;
  dateFormat: string;
  locale: string;
}

interface AssignStaffRequest {
  staffId: number;
}

interface UpdateSavingsAccountRequest {
  savingsAccountId: number;
}

// === Paginated Response ===

interface Page<T> {
  totalFilteredRecords: number;
  pageItems: T[];
}
```

---

## 10. Validation (Zod Schema)

Extracted from `ClientDataValidator.java`:

```typescript
import { z } from "zod";

const mobileRegex = /^\+?[0-9]{7,15}$/;

export const createClientSchema = z
  .object({
    officeId: z.number({ required_error: "officeId is required" }).int().positive(),
    legalFormId: z
      .number({ required_error: "legalFormId is required" })
      .int()
      .min(1, "Must be 1 (Person) or 2 (Entity)")
      .max(2),

    // Name — Person case
    firstname: z.string().max(50).optional(),
    middlename: z.string().max(50).optional(),
    lastname: z.string().max(50).optional(),

    // Name — Entity case
    fullname: z.string().max(160).optional(),

    active: z.boolean({ required_error: "active is required (true or false)" }),
    activationDate: z.string().optional(),

    externalId: z.string().max(100).optional(),
    mobileNo: z.string().regex(mobileRegex, "Invalid mobile number format").max(50).optional(),
    emailAddress: z.string().email().optional(),
    dateOfBirth: z.string().optional(),

    genderId: z.number().int().positive().optional(),
    clientTypeId: z.number().int().positive().optional(),
    clientClassificationId: z.number().int().positive().optional(),

    staffId: z.number().int().positive().optional(),
    savingsProductId: z.number().int().positive().optional(),
    groupId: z.number().int().positive().optional(),
    accountNo: z.string().max(20).optional(),
    isStaff: z.boolean().optional(),
    submittedOnDate: z.string().optional(),

    clientNonPersonDetails: z
      .object({
        constitutionId: z.number().int().positive().optional(),
        incorpNumber: z.string().max(50).optional(),
        mainBusinessLineId: z.number().int().positive().optional(),
        remarks: z.string().max(150).optional(),
        incorpValidityTillDate: z.string().optional(),
      })
      .optional(),

    address: z.array(z.any()).optional(),
    familyMembers: z.array(z.any()).optional(),

    dateFormat: z.string().optional(),
    locale: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Mutual exclusion: cannot send both fullname AND firstname/lastname
    const hasIndividualName = !!data.firstname || !!data.middlename || !!data.lastname;
    const hasFullname = !!data.fullname;

    if (hasFullname && hasIndividualName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot provide both fullname and firstname/middlename/lastname",
        path: ["fullname"],
      });
    }

    // If Person (legalFormId=1), require firstname + lastname
    if (data.legalFormId === 1 && !hasIndividualName && !hasFullname) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "firstname and lastname are required for Person legal form",
        path: ["firstname"],
      });
    }

    // If Entity (legalFormId=2), require fullname
    if (data.legalFormId === 2 && !hasFullname) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fullname is required for Entity legal form",
        path: ["fullname"],
      });
    }

    // If active=true, activationDate is required
    if (data.active === true && !data.activationDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "activationDate is required when active=true",
        path: ["activationDate"],
      });
    }
  });

export const activateClientSchema = z.object({
  activationDate: z.string({ required_error: "activationDate is required" }),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});

export const closeClientSchema = z.object({
  closureDate: z.string({ required_error: "closureDate is required" }),
  closureReasonId: z.number({ required_error: "closureReasonId is required" }).int().positive(),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});

export const rejectClientSchema = z.object({
  rejectionDate: z.string({ required_error: "rejectionDate is required" }),
  rejectionReasonId: z.number({ required_error: "rejectionReasonId is required" }).int().positive(),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});

export const withdrawClientSchema = z.object({
  withdrawalDate: z.string({ required_error: "withdrawalDate is required" }),
  withdrawalReasonId: z.number({ required_error: "withdrawalReasonId is required" }).int().positive(),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
```

---

## 14. Implementation Checklist

- [ ] Client List (paginated, filterable by office/status/name/staff/legalForm)
- [ ] Client Detail (with template=true to get dropdowns)
- [ ] Client Create (with full dependency management)
- [ ] Client Edit (PUT)
- [ ] Client Delete (only when Pending)
- [ ] Client Activate (POST with command=activate)
- [ ] Client Close (POST with command=close)
- [ ] Client Reject (POST with command=reject)
- [ ] Client Withdraw (POST with command=withdraw)
- [ ] Client Reactivate (POST with command=reactivate)
- [ ] Client Undo Rejection (POST with command=undoRejection)
- [ ] Client Undo Withdrawal (POST with command=undoWithdrawal)
- [ ] Client Assign/Unassign Staff
- [ ] Client Update Default Savings Account
- [ ] Client Charges (list, add, pay, waive, delete)
- [ ] Client Identifiers (list, create, update, delete)
- [ ] Client Family Members (list, create, update, delete)
- [ ] Client Address (add, update)
- [ ] Client Collateral (create, update, delete)
- [ ] Client Accounts Overview (GET /clients/{id}/accounts)
- [ ] Client Transactions (list, undo)
- [ ] Client Transfer (propose, accept, reject, withdraw)
- [ ] Template-based form initialization
- [ ] Client-side Zod validation (mirroring backend rules)
- [ ] Error handling for 400/403/404/409 responses
