# Shares — React Implementation Guide

## 1. Overview

The Shares module manages share products and share accounts in Fineract — member-owned equity instruments in a financial cooperative or SACCO. It supports product definition, account application lifecycle, share purchases/redemptions, dividends, and charges.

| Sub-Feature     | Base Path                               | Description                                                                                       |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Share Products  | `/v1/products/share`                    | Product definitions (total shares, unit price, min/max per client, lockin periods, market prices) |
| Share Accounts  | `/v1/accounts/share`                    | Full lifecycle: submit, approve, activate, reject, close + additional shares + redeem             |
| Share Dividends | `/v1/shareproduct/{productId}/dividend` | Create, approve, delete dividend payouts per product                                              |
| Share Charges   | N/A (embedded)                          | Charges at activation, purchase, or redeem time — defined on product, applied to account          |

---

## 2. Lifecycle

### Share Account Status Flow

```
                         SUBMITTED_AND_PENDING_APPROVAL (100)
                                    |
                        ┌───────────┴───────────┐
                        ↓                       ↓
                    APPROVED (200)          REJECTED (500)
                        ↓                       ↑
                    ACTIVE (300)
                        ↓
                    CLOSED (600)
```

**Status values:**

- `INVALID` (0)
- `SUBMITTED_AND_PENDING_APPROVAL` (100)
- `APPROVED` (200)
- `ACTIVE` (300)
- `REJECTED` (500)
- `CLOSED` (600)

### Share Transaction Status / Types (PurchasedSharesStatusType)

Values 100–400 are used as `status`; 500–700 are used as `type`:

| Value | Code           | Role                       |
| ----- | -------------- | -------------------------- |
| 100   | APPLIED        | Status — pending approval  |
| 300   | APPROVED       | Status — approved purchase |
| 400   | REJECTED       | Status — rejected purchase |
| 500   | PURCHASED      | Type — share purchase      |
| 600   | REDEEMED       | Type — share redeem        |
| 700   | CHARGE_PAYMENT | Type — charge payment      |

### Share Account Lifecycle Commands

```
POST /v1/accounts/share                          → Submit (status=100)
PUT  /v1/accounts/share/{id}                      → Modify while in 100
POST /v1/accounts/share/{id}?command=approve       → 100 → 200
POST /v1/accounts/share/{id}?command=undoapproval  → 200 → 100
POST /v1/accounts/share/{id}?command=reject        → 100 → 500
POST /v1/accounts/share/{id}?command=activate      → 200 → 300
POST /v1/accounts/share/{id}?command=close         → 300 → 600
```

### Additional Shares Flow (while ACTIVE)

```
POST .../{id}?command=applyadditionalshares     → Creates APPLIED(100) purchase transaction
POST .../{id}?command=approveadditionalshares   → APPLIED(100) → APPROVED(300)
POST .../{id}?command=rejectadditionalshares    → APPLIED(100) → REJECTED(400)
POST .../{id}?command=redeemshares              → Creates REDEEMED(600) transaction
```

---

## 3. API Inventory

### 3.1 Share Products — `/v1/products/share`

| Method | Path                             | Description                                                       |
| ------ | -------------------------------- | ----------------------------------------------------------------- |
| `GET`  | `/v1/products/share/template`    | Create form template (currency, accounting options, period types) |
| `GET`  | `/v1/products/share`             | List share products (`?offset=`, `?limit=`)                       |
| `GET`  | `/v1/products/share/{productId}` | Detail (optional `?template=true`)                                |
| `POST` | `/v1/products/share`             | Create share product                                              |
| `PUT`  | `/v1/products/share/{productId}` | Update share product                                              |
| `POST` | `/v1/products/share/{productId}` | Commands: `previewdividends`, `postdividends`                     |

### 3.2 Share Accounts — `/v1/accounts/share`

| Method | Path                                  | Description                                                                                                                                                      |
| ------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/v1/accounts/share/template`         | Create form template (`?clientId=`, `?productId=`)                                                                                                               |
| `GET`  | `/v1/accounts/share`                  | List (`?offset=`, `?limit=`)                                                                                                                                     |
| `GET`  | `/v1/accounts/share/{accountId}`      | Detail                                                                                                                                                           |
| `POST` | `/v1/accounts/share`                  | Submit new share application                                                                                                                                     |
| `PUT`  | `/v1/accounts/share/{accountId}`      | Modify application (only when Submitted)                                                                                                                         |
| `POST` | `/v1/accounts/share/{accountId}`      | Commands: `approve`, `undoapproval`, `reject`, `activate`, `close`, `applyadditionalshares`, `approveadditionalshares`, `rejectadditionalshares`, `redeemshares` |
| `GET`  | `/v1/accounts/share/downloadtemplate` | Download bulk import Excel                                                                                                                                       |
| `POST` | `/v1/accounts/share/uploadtemplate`   | Upload bulk import Excel                                                                                                                                         |

### 3.3 Share Dividends — `/v1/shareproduct/{productId}/dividend`

| Method   | Path                                                                 | Description                                                                    |
| -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `GET`    | `/v1/shareproduct/{productId}/dividend`                              | List dividends (`?offset=`, `?limit=`, `?status=`, `?orderBy=`, `?sortOrder=`) |
| `GET`    | `/v1/shareproduct/{productId}/dividend/{dividendId}`                 | Dividend detail with per-account breakdown (`?accountNo=`)                     |
| `POST`   | `/v1/shareproduct/{productId}/dividend`                              | Create dividend (status=INITIATED)                                             |
| `PUT`    | `/v1/shareproduct/{productId}/dividend/{dividendId}?command=approve` | Approve dividend (INITIATED → APPROVED)                                        |
| `DELETE` | `/v1/shareproduct/{productId}/dividend/{dividendId}`                 | Delete dividend                                                                |

### 3.4 Bulk Import

| Method | Path                                  | Description                            |
| ------ | ------------------------------------- | -------------------------------------- |
| `GET`  | `/v1/accounts/share/downloadtemplate` | Download share accounts Excel template |
| `POST` | `/v1/accounts/share/uploadtemplate`   | Upload share accounts bulk import      |

---

## 4. CRUD

### 4.1 Share Product

#### Template

```
GET /v1/products/share/template
```

#### Create

```json
POST /v1/products/share
{
  "name": "Standard Shares",
  "shortName": "STD",
  "description": "Standard equity share product",
  "currencyCode": "USD",
  "digitsAfterDecimal": 2,
  "inMultiplesOf": 0,
  "locale": "en",
  "totalShares": 100000,
  "unitPrice": 10.00,
  "nominalShares": 100,
  "allowDividendCalculationForInactiveClients": false,
  "accountingRule": 2,
  "sharesIssued": 50000,
  "minimumShares": 10,
  "maximumShares": 1000,
  "lockinPeriodFrequency": 6,
  "lockinPeriodFrequencyType": 2,
  "minimumActivePeriodForDividends": 30,
  "minimumactiveperiodFrequencyType": 0,
  "marketPricePeriods": [
    { "fromDate": "01 January 2026", "shareValue": 12.00 }
  ],
  "chargesSelected": [
    { "id": 1 }
  ],
  "shareReferenceId": 1,
  "shareSuspenseId": 2,
  "shareEquityId": 3,
  "incomeFromFeeAccountId": 4,
  "dateFormat": "dd MMMM yyyy"
}
```

#### List

```
GET /v1/products/share?offset=0&limit=50
```

#### Detail

```
GET /v1/products/share/1
GET /v1/products/share/1?template=true
```

#### Update

```
PUT /v1/products/share/1
{ "unitPrice": 15.00 }
```

### 4.2 Share Account

#### Template

```
GET /v1/accounts/share/template?clientId=1
GET /v1/accounts/share/template?clientId=1&productId=2
```

Returns: `productOptions`, `chargeOptions`, `clientSavingsAccounts`, `lockinPeriodFrequencyTypeOptions`, `minimumActivePeriodFrequencyTypeOptions`, `currentMarketPrice`

#### Create

```json
POST /v1/accounts/share
{
  "clientId": 1,
  "productId": 2,
  "submittedDate": "01 July 2026",
  "applicationDate": "01 July 2026",
  "requestedShares": 100,
  "savingsAccountId": 5,
  "externalId": "EXT-SH-001",
  "allowDividendCalculationForInactiveClients": false,
  "minimumActivePeriod": 30,
  "minimumActivePeriodFrequencyType": 0,
  "lockinPeriodFrequency": 6,
  "lockinPeriodFrequencyType": 2,
  "charges": [
    { "chargeId": 1, "amount": 5.00 }
  ],
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

#### List

```
GET /v1/accounts/share?offset=0&limit=50
```

#### Detail

```
GET /v1/accounts/share/1
```

Returns: `id`, `accountNo`, `externalId`, `clientId`, `clientName`, `productId`, `productName`, `status`, `timeline`, `currency`, `summary`, `purchasedShares`, `charges`, `savingsAccountId`, `lockinPeriod`, `lockPeriodTypeEnum`, `minimumActivePeriod`, `minimumActivePeriodTypeEnum`, `allowDividendCalculationForInactiveClients`, `currentMarketPrice`

#### Approve

```json
POST /v1/accounts/share/1?command=approve
{
  "approvedDate": "05 July 2026",
  "note": "Approved",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

#### Activate

```json
POST /v1/accounts/share/1?command=activate
{
  "activatedDate": "10 July 2026",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

#### Reject

```json
POST /v1/accounts/share/1?command=reject
{
  "note": "Insufficient documentation"
}
```

#### Close

```json
POST /v1/accounts/share/1?command=close
{
  "closedDate": "31 December 2026",
  "note": "Account closed by member request",
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

#### Undo Approval

```json
POST /v1/accounts/share/1?command=undoapproval
```

#### Apply Additional Shares

```json
POST /v1/accounts/share/1?command=applyadditionalshares
{
  "requestedDate": "15 August 2026",
  "requestedShares": 50,
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

#### Approve Additional Shares

```json
POST /v1/accounts/share/1?command=approveadditionalshares
{
  "requestedShares": [
    { "id": 10 }
  ]
}
```

#### Reject Additional Shares

```json
POST /v1/accounts/share/1?command=rejectadditionalshares
{
  "requestedShares": [
    { "id": 10 }
  ]
}
```

#### Redeem Shares

```json
POST /v1/accounts/share/1?command=redeemshares
{
  "requestedDate": "01 December 2026",
  "requestedShares": 25,
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

### 4.3 Dividends

#### Create Dividend

```json
POST /v1/shareproduct/1/dividend
{
  "dividendPeriodStartDate": "01 January 2026",
  "dividendPeriodEndDate": "30 June 2026",
  "dividendAmount": 5000.00,
  "dateFormat": "dd MMMM yyyy",
  "locale": "en"
}
```

#### Approve Dividend

```
PUT /v1/shareproduct/1/dividend/1?command=approve
```

#### List Dividends

```
GET /v1/shareproduct/1/dividend
GET /v1/shareproduct/1/dividend?status=100
```

#### Dividend Detail

```
GET /v1/shareproduct/1/dividend/1
GET /v1/shareproduct/1/dividend/1?accountNo=SA-001
```

#### Delete Dividend

```
DELETE /v1/shareproduct/1/dividend/1
```

---

## 5. Lookup API Table

| UI Field               | Endpoint                                                                      | Display           | Value  | Required For                                       |
| ---------------------- | ----------------------------------------------------------------------------- | ----------------- | ------ | -------------------------------------------------- |
| Client                 | `GET /v1/clients`                                                             | `displayName`     | `id`   | Share Account Create                               |
| Share Product          | `GET /v1/products/share`                                                      | `name`            | `id`   | Share Account Create                               |
| Savings Account        | `GET /v1/accounts/share/template?clientId=X` → `clientSavingsAccounts`        | `accountNo`       | `id`   | Share Account Create (currency must match product) |
| Currency               | `GET /v1/products/share/template` → `currencyOptions`                         | `name`            | `code` | Share Product Create                               |
| Accounting Rule        | `GET /v1/products/share/template` → `accountingRuleOptions`                   | `value`           | `id`   | Share Product Create                               |
| Lockin Period Type     | `GET /v1/products/share/template` → `lockinPeriodFrequencyTypeOptions`        | `value`           | `id`   | Share Product / Account                            |
| Min Active Period Type | `GET /v1/products/share/template` → `minimumActivePeriodFrequencyTypeOptions` | `value`           | `id`   | Share Product / Account                            |
| Charges                | `GET /v1/charges?isShareCharge=true`                                          | `name`            | `id`   | Share Product / Account                            |
| GL Accounts (cash)     | `GET /v1/glaccounts`                                                          | `name` + `glCode` | `id`   | Share Product (accountingRule=2)                   |

---

## 6. API Call Order

### Share Product Create

```
1. GET /v1/products/share/template
   → currencyOptions, accountingRuleOptions, lockinPeriodFrequencyTypeOptions,
     minimumActivePeriodFrequencyTypeOptions, chargeOptions
2. Fill form (name, shortName, currency, totalShares, unitPrice, etc.)
3. POST /v1/products/share → resourceId
```

### Share Account Create

```
1. GET /v1/clients (or client search) → select client
2. GET /v1/accounts/share/template?clientId=X → productOptions, savingsAccounts
3. Select product → template updates with product defaults
4. Fill form (requestedShares, savingsAccountId, dates)
5. POST /v1/accounts/share → resourceId (status=100)
```

### Share Account Approval Flow

```
1. GET /v1/accounts/share/{id} (review details)
2. POST .../{id}?command=approve → status=200
3. POST .../{id}?command=activate → status=300
```

### Share Purchase Additional Shares

```
1. POST .../{id}?command=applyadditionalshares → creates APPLIED transaction
2. POST .../{id}?command=approveadditionalshares → APPROVED
```

### Share Redeem

```
1. POST .../{id}?command=redeemshares → creates REDEEMED transaction
   (validates lockin period, sufficient shares)
```

### Dividend Flow

```
1. POST /v1/shareproduct/{id}/dividend → creates INITIATED dividend
2. PUT .../{dividendId}?command=approve → status=APPROVED
3. (Background job) PostDividentsForShares → posts to savings accounts
```

---

## 7. Form Layout

### 7.1 Share Product Create Form

**Basic Information**

- `name` (text, required, max 200)
- `shortName` (text, required, max 4)
- `description` (textarea, required, max 500)
- `externalId` (text, optional)

**Currency**

- `currencyCode` (select, required)
- `digitsAfterDecimal` (number, required)
- `inMultiplesOf` (number, required)

**Shares Configuration**

- `totalShares` (number, required) — total shares the institution will issue
- `sharesIssued` (number, optional) — already issued; must be ≤ totalShares
- `unitPrice` (number, required) — price per share
- `shareCapital` (auto-calculated = sharesIssued × unitPrice)

**Client Limits**

- `minimumShares` (number, optional) — min per client; must be ≤ nominalShares
- `nominalShares` (number, required) — default per client
- `maximumShares` (number, optional) — max per client; must be ≥ nominalShares

**Restrictions**

- `lockinPeriodFrequency` (number, optional) + `lockinPeriodFrequencyType` (select: Days/Weeks/Months/Years)
- `minimumActivePeriodForDividends` (number, optional) — must be in DAYS
- `allowDividendCalculationForInactiveClients` (checkbox)

**Market Price Schedule**

- `marketPricePeriods` — array of `{ fromDate, shareValue }` used for valuation at transaction time

**Charges**

- `chargesSelected` — multi-select of share charges

**Accounting**

- `accountingRule` (select, required): 1=None, 2=Cash
- If Cash: `shareReferenceId`, `shareSuspenseId`, `shareEquityId`, `incomeFromFeeAccountId` (GL account selects)

**Dates**

- `dateFormat`, `locale`

### 7.2 Share Account Create Form

**Client & Product**

- `clientId` (auto/lookup, required)
- `productId` (select, required) — populates defaults

**Share Details**

- `requestedShares` (number, required) — validated against product min/max
- `applicationDate` (date, required) — used for market price derivation
- `savingsAccountId` (select, required) — linked savings account (currency must match product)

**Inherited/Override from Product**

- `minimumActivePeriod` (number, optional, default from product)
- `minimumActivePeriodFrequencyType` (select, optional, must be DAYS)
- `lockinPeriodFrequency` (number, optional, default from product)
- `lockinPeriodFrequencyType` (select, optional)

**Additional**

- `externalId` (text, optional)
- `allowDividendCalculationForInactiveClients` (checkbox)

**Charges**

- `charges` — array of `{ chargeId, amount }`

**Dates**

- `submittedDate` (date, required)
- `dateFormat`, `locale`

---

## 8. Request Payload Analysis

### Create Share Product

| Field                                        | Type       | Required | Validation                                 | Source               |
| -------------------------------------------- | ---------- | -------- | ------------------------------------------ | -------------------- |
| `name`                                       | string     | ✅       | Not blank, max 200, unique                 | User                 |
| `shortName`                                  | string     | ✅       | Not blank, max 4, unique                   | User                 |
| `description`                                | string     | ✅       | Not blank, max 500                         | User                 |
| `externalId`                                 | string     | ❌       | Unique                                     | User                 |
| `totalShares`                                | Long       | ✅       | > 0                                        | User                 |
| `sharesIssued`                               | Long       | ❌       | Must be ≤ totalShares                      | User                 |
| `currencyCode`                               | string     | ✅       | Valid ISO code                             | `GET /v1/currencies` |
| `digitsAfterDecimal`                         | int        | ✅       | Non-negative                               | Template             |
| `inMultiplesOf`                              | int        | ✅       | Non-negative                               | Template             |
| `unitPrice`                                  | BigDecimal | ✅       | Positive                                   | User                 |
| `shareCapital`                               | BigDecimal | ❌       | Auto-calculated = sharesIssued × unitPrice | Auto                 |
| `minimumShares`                              | Long       | ❌       | > 0; ≤ nominalShares                       | User                 |
| `nominalShares`                              | Long       | ✅       | > 0; ≥ minimumShares                       | User                 |
| `maximumShares`                              | Long       | ❌       | > 0; ≥ nominalShares                       | User                 |
| `marketPricePeriods`                         | array      | ❌       | `[{fromDate, shareValue}]`                 | User                 |
| `chargesSelected`                            | array      | ❌       | `[{id}]`; currency must match product      | `GET /v1/charges`    |
| `allowDividendCalculationForInactiveClients` | boolean    | ✅       | —                                          | Toggle               |
| `lockinPeriodFrequency`                      | int        | ❌       | Non-negative                               | User                 |
| `lockinPeriodFrequencyType`                  | int        | ❌       | 0=Days,1=Weeks,2=Months,3=Years            | Dropdown             |
| `minimumActivePeriodForDividends`            | int        | ❌       | Must be DAYS type                          | User                 |
| `minimumactiveperiodFrequencyType`           | int        | ❌       | Must be DAYS (0)                           | Dropdown             |
| `accountingRule`                             | int        | ✅       | 1=None, 2=Cash                             | Dropdown             |
| `shareReferenceId`                           | Long       | ✅*      | GL account                                 | `GET /v1/glaccounts` |
| `shareSuspenseId`                            | Long       | ✅*      | GL account                                 | `GET /v1/glaccounts` |
| `shareEquityId`                              | Long       | ✅*      | GL account                                 | `GET /v1/glaccounts` |
| `incomeFromFeeAccountId`                     | Long       | ✅*      | GL account                                 | `GET /v1/glaccounts` |

*Required only when accountingRule=2 (Cash)

### Create Share Account

| Field                                        | Type    | Required | Validation                                            | Source                            |
| -------------------------------------------- | ------- | -------- | ----------------------------------------------------- | --------------------------------- |
| `clientId`                                   | Long    | ✅       | Must exist                                            | `GET /v1/clients`                 |
| `productId`                                  | Long    | ✅       | Must be share product                                 | `GET /v1/products/share`          |
| `submittedDate`                              | date    | ✅       | Not null                                              | Date picker                       |
| `applicationDate`                            | date    | ✅       | Not null                                              | Date picker                       |
| `requestedShares`                            | Long    | ✅       | > 0; ≥ product.minimumShares; ≤ product.maximumShares | User                              |
| `savingsAccountId`                           | Long    | ✅       | Belongs to client, currency matches product           | `GET /v1/accounts/share/template` |
| `externalId`                                 | string  | ❌       | Unique                                                | User                              |
| `allowDividendCalculationForInactiveClients` | boolean | ❌       | Default from product                                  | Toggle                            |
| `minimumActivePeriod`                        | int     | ❌       | Must be DAYS type if provided                         | User                              |
| `minimumActivePeriodFrequencyType`           | int     | ❌       | Must be DAYS (0)                                      | Dropdown                          |
| `lockinPeriodFrequency`                      | int     | ❌       | Default from product                                  | User                              |
| `lockinPeriodFrequencyType`                  | int     | ❌       | 0=Days,1=Weeks,2=Months,3=Years                       | Dropdown                          |
| `charges`                                    | array   | ❌       | `[{chargeId, amount}]`; currency must match product   | `GET /v1/charges`                 |
| `dateFormat`                                 | string  | ✅       | Pattern string                                        | User                              |
| `locale`                                     | string  | ✅       | Locale code                                           | User                              |

### Approve Share Account

| Field          | Type   | Required | Validation              |
| -------------- | ------ | -------- | ----------------------- |
| `approvedDate` | date   | ✅       | Must be ≥ submittedDate |
| `note`         | string | ❌       | —                       |
| `dateFormat`   | string | ✅       | —                       |
| `locale`       | string | ✅       | —                       |

### Activate Share Account

| Field           | Type   | Required | Validation             |
| --------------- | ------ | -------- | ---------------------- |
| `activatedDate` | date   | ✅       | Must be ≥ approvedDate |
| `dateFormat`    | string | ✅       | —                      |
| `locale`        | string | ✅       | —                      |

### Apply Additional Shares

| Field             | Type   | Required | Validation                         |
| ----------------- | ------ | -------- | ---------------------------------- |
| `requestedDate`   | date   | ✅       | Not before existing transactions   |
| `requestedShares` | Long   | ✅       | > 0; total ≤ product.maximumShares |
| `dateFormat`      | string | ✅       | —                                  |
| `locale`          | string | ✅       | —                                  |

### Redeem Shares

| Field             | Type   | Required | Validation                                      |
| ----------------- | ------ | -------- | ----------------------------------------------- |
| `requestedDate`   | date   | ✅       | Not before existing transactions                |
| `requestedShares` | Long   | ✅       | > 0; ≤ totalApprovedShares; lockin period check |
| `dateFormat`      | string | ✅       | —                                               |
| `locale`          | string | ✅       | —                                               |

### Create Dividend

| Field                     | Type       | Required | Validation              |
| ------------------------- | ---------- | -------- | ----------------------- |
| `dividendPeriodStartDate` | date       | ✅       | Not null                |
| `dividendPeriodEndDate`   | date       | ✅       | Must be after startDate |
| `dividendAmount`          | BigDecimal | ✅       | Positive                |
| `dateFormat`              | string     | ✅       | —                       |
| `locale`                  | string     | ✅       | —                       |

---

## 9. Validation Rules

### Share Product

| Rule                      | Logic                                       | Error                                                     |
| ------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Name required             | Not blank, max 200                          | Bean Validation                                           |
| Short name required       | Not blank, max 4                            | Bean Validation                                           |
| Description required      | Not blank, max 500                          | Bean Validation                                           |
| Total shares > 0          | Long must be > 0                            | `longGreaterThanZero`                                     |
| Shares issued ≤ total     | If provided with totalShares                | `sharesIssued.cannot.be.greater.than.totalNumberOfShares` |
| Unit price positive       | Must be positive amount                     | `positiveAmount`                                          |
| Accounting rule required  | Must be > 0                                 | `integerGreaterThanZero`                                  |
| Nominal shares required   | Must be > 0                                 | `longGreaterThanZero`                                     |
| Min ≤ nominal             | minimumShares ≤ nominalShares               | `longGreaterThanNumber`                                   |
| Max ≥ nominal             | maximumShares ≥ nominalShares               | `longGreaterThanNumber`                                   |
| Min active period = DAYS  | If provided, frequencyType must be DAYS     | `integerSameAsNumber(0)`                                  |
| Same currency for charges | Charge currency must match product currency | `InvalidCurrencyException`                                |

### Share Account

| Rule                           | Logic                                         | Error                                                        |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------------ |
| Submitted date required        | Not null                                      | Validation error                                             |
| Savings account required       | Must belong to client, match product currency | `SavingsAccountNotFoundException`                            |
| Requested shares > 0           | Long > 0                                      | `longGreaterThanZero`                                        |
| Requested shares ≥ product min | Must meet product minimumShares               | `client.can.not.purchase.shares.lessthan.product.definition` |
| Requested shares ≤ product max | Must not exceed product maximumShares         | `client.can.not.purchase.shares.morethan.product.definition` |
| Same currency for charges      | Charge currency must match product currency   | `InvalidCurrencyException`                                   |
| Min active period = DAYS       | If provided, frequencyType must be DAYS       | `integerSameAsNumber(0)`                                     |

### Approve

| Rule                           | Logic                                 | Error                                                                 |
| ------------------------------ | ------------------------------------- | --------------------------------------------------------------------- |
| Status must be 100             | Only pending approval can be approved | `is.not.pending.for.approval`                                         |
| Approved date ≥ submitted date | Cannot be before submittedDate        | `approved.date.cannot.be.before.submitted.date`                       |
| Total subscribed shares        | Must not exceed sharesIssued          | `shares.requested.can.not.be.approved.exceeding.totalshares.issuable` |

### Activate

| Rule                           | Logic                          | Error                            |
| ------------------------------ | ------------------------------ | -------------------------------- |
| Status must be 200             | Only approved can be activated | `is.not.in.approved.status`      |
| Activated date ≥ approved date | Cannot be before approvedDate  | `cannot.be.before.approved.date` |
| Activated date required        | Not null                       | Validation error                 |

### Apply Additional Shares

| Rule                     | Logic                                             | Error                                                              |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------------------ |
| Status must be 300       | Only active accounts                              | `is.not.in.active.state`                                           |
| Date not before existing | requestedDate must be after existing transactions | `purchase.transaction.date.cannot.be.before.existing.transactions` |
| Max shares check         | existing + requested ≤ product.maximumShares      | `exceeding.maximum.limit.defined.in.the.shareproduct`              |

### Redeem

| Rule                     | Logic                                        | Error                                                            |
| ------------------------ | -------------------------------------------- | ---------------------------------------------------------------- |
| Sufficient shares        | requested ≤ totalApprovedShares              | `cannot.be.redeemed.due.to.insufficient.shares`                  |
| Lockin period check      | request date must be after lockin expiry     | `cannot.be.redeemed.due.to.lockinperiod`                         |
| Purchase exists          | Must have purchase transaction before redeem | `no.purchase.transaction.found.before.redeem.date`               |
| Date not before existing | Must be after existing transactions          | `redeem.transaction.date.cannot.be.before.existing.transactions` |

### Close

| Rule                    | Logic                                                | Error                                                         |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| Closed date required    | Not null                                             | Validation error                                              |
| Not before transactions | Cannot close before existing transactions            | `share.account.cannot.be.closed.before.existing.transactions` |
| Auto-redeem             | All remaining approved shares auto-redeemed on close | —                                                             |

### Dividend

| Rule                 | Logic                   | Error               |
| -------------------- | ----------------------- | ------------------- |
| Start date required  | Not null                | Validation error    |
| End date after start | Must be after startDate | `validateDateAfter` |
| Amount positive      | Must be > 0             | `positiveAmount`    |

---

## 10. Business Flow

### Create Share Product

```
ProductsApiResource.createProduct("share", json)
  ↓
CommandWrapperBuilder.createProduct("share")
  ↓
CreateShareProductCommandHandler
  ↓
ShareProductWritePlatformServiceJpaRepositoryImpl.createProduct(jsonCommand)
  ├── ShareProductDataSerializer.validateAndCreate(jsonCommand)
  │     ├── Validate all fields (name, shortName, currency, totalShares, etc.)
  │     ├── Assemble marketPricePeriods, charges
  │     └── Return ShareProduct entity
  ├── ShareProductRepository.save(product)
  └── Return CommandProcessingResult(resourceId)
```

### Create Share Account

```
AccountsApiResource.createAccount("share", accountRequest)
  ↓
CommandWrapperBuilder.createAccount("share")
  ↓
CreateShareAccountCommandHandler
  ↓
ShareAccountWritePlatformServiceJpaRepositoryImpl.createShareAccount(jsonCommand)
  ├── ShareAccountDataSerializer.validateAndCreate(jsonCommand)
  │     ├── Validate clientId, productId, requestedShares, savingsAccountId
  │     ├── Derive marketPrice from product for applicationDate
  │     ├── Assemble charges (validate currency match)
  │     ├── Create pending ShareAccountTransaction (APPLIED/PURCHASED)
  │     ├── Create charge transactions for activation charges
  │     └── Return ShareAccount entity
  ├── ShareAccountRepository.saveAndFlush(account)
  ├── Generate account number
  ├── Journal entries for share purchase (if cash accounting)
  ├── Business event: ShareAccountCreateBusinessEvent
  └── Return CommandProcessingResult(resourceId)
```

### Approve → Activate

```
Approve:
POST .../{id}?command=approve
  ↓
ApproveShareAccountCommandHandler
  ↓
ShareAccountDataSerializer.validateAndApprove(jsonCommand, account)
  ├── Validate status == 100, approvedDate >= submittedDate
  ├── Validate total subscribed shares <= issued
  ├── account.approve(approvedDate, approvedUser) → status = 200
  └── Update charge paid amounts

Activate:
POST .../{id}?command=activate
  ↓
ActivateShareAccountCommandHandler
  ↓
ShareAccountDataSerializer.validateAndActivate(jsonCommand, account)
  ├── Validate status == 200, activatedDate >= approvedDate
  ├── account.activate(activatedDate, approvedUser) → status = 300
  ├── Mark activation charges as fully paid
  └── Update charge transaction dates
```

### Apply + Approve Additional Shares

```
Apply:
POST .../{id}?command=applyadditionalshares
  ↓
ApplyAddtionalSharesCommandHandler
  ↓
ShareAccountDataSerializer.validateAndApplyAddtionalShares(jsonCommand, account)
  ├── Validate status == 300
  ├── Validate shares within max, date not before existing
  ├── Derive unitPrice from product market price
  ├── Create ShareAccountTransaction (APPLIED/PURCHASED)
  └── Handle purchase charge transactions

Approve:
POST .../{id}?command=approveadditionalshares
  ↓
ApproveAddtionalSharesCommandHandler
  ↓
ShareAccountDataSerializer.validateAndApproveAddtionalShares(jsonCommand, account)
  ├── Parse requestedShares array [{id}]
  ├── For each: validate total subscribed, approve transaction
  └── Update totalApprovedShares
```

### Redeem Shares

```
POST .../{id}?command=redeemshares
  ↓
RedeemSharesCommandHandler
  ↓
ShareAccountDataSerializer.validateAndRedeemShares(jsonCommand, account)
  ├── Validate status == 300
  ├── Validate sufficient approved shares
  ├── Validate lockin period (check each purchase date + lockin duration)
  ├── Validate date not before existing transactions
  ├── Create ShareAccountTransaction (APPROVED/REDEEMED)
  └── Handle redeem charge transactions
```

### Dividend Lifecycle

```
Create:
POST /v1/shareproduct/{id}/dividend
  ↓
CreateShareProductDividendCommandHandler
  ↓
ShareProductDividendAssembler
  ├── Validate dividend period dates and amount
  ├── For each active share account:
  │     └── Create ShareAccountDividendDetails (INITIATED)
  └── Create ShareProductDividendPayOutDetails (INITIATED)

Approve:
PUT .../{dividendId}?command=approve
  ↓
ApproveShareProductDividendCommandHandler
  ↓
Status → APPROVED (300)

Post (background job):
PostDividentsForSharesTasklet
  ├── Query all dividend details with status INITIATED
  ├── For each: post to linked savings account
  └── Status → POSTED (300)
```

---

## 11. Related Operations

| Operation        | Description                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| Share Charges    | Charges can be defined via `GET /v1/charges?isShareCharge=true` and applied at activation, purchase, or redeem time |
| Market Price     | `marketPricePeriods` on product defines valuation schedule; `deriveMarketPrice(date)` picks price for a given date  |
| Bulk Import      | Excel-based bulk create via downloadtemplate/uploadtemplate                                                         |
| Accounting       | Journal entries created for purchase/redeem/charge transactions when product uses Cash accounting                   |
| Savings Accounts | Linked savings account (currency must match) — dividends are posted to this account                                 |
| Reporting        | Adhoc queries can target `m_share_account`, `m_share_product`, `m_share_account_transactions` tables                |

---

## 12. Hidden Dependencies

| Dependency                               | Impact                                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Savings account required**             | Share accounts require a linked savings account with matching currency. Cannot create without one.                                            |
| **Market price derivation**              | Share price at transaction time is derived from product's `marketPricePeriods`. If no period matches the date, product's `unitPrice` is used. |
| **Lockin period validation on redeem**   | Each purchase transaction has its own lockin period computed individually. Redeem validates against every purchase.                           |
| **Charge currency match**                | Charges added to product or account must have the same currency code as the product. Mismatch throws `InvalidCurrencyException`.              |
| **Minimum active period is always DAYS** | The `minimumactiveperiodFrequencyType` must always be DAYS (0). No other period type is allowed.                                              |
| **Share capital auto-calculation**       | `shareCapital` is computed as `sharesIssued × unitPrice`. Changes to either field recalculate it.                                             |
| **Accounting via journal entries**       | When accountingRule=2 (Cash), all share purchase/redeem transactions create GL journal entries.                                               |
| **Dividend posting is async**            | Dividends are approved via API but posted to savings accounts by a scheduled batch job (`PostDividentsForSharesTasklet`).                     |
| **Close auto-redeems all shares**        | Closing a share account automatically creates a redeem transaction for all remaining approved shares.                                         |
| **Account number auto-generation**       | If configured, share account numbers are auto-generated based on the account number format configuration.                                     |
| **No delete for share accounts**         | Share accounts cannot be deleted — only closed. Share products also have no delete endpoint.                                                  |
| **Status-based calendar**                | Dividends may exclude inactive clients based on product setting. The `allowDividendCalculationForInactiveClients` flag controls this.         |

---

## 13. TypeScript Interfaces

```typescript
// ============================================================
// Share Account
// ============================================================
export interface ShareAccountData {
  id: number;
  accountNo: string;
  externalId: string;
  clientId: number;
  clientName: string;
  productId: number;
  productName: string;
  savingsAccountId: number;
  savingsAccountNumber: string;
  status: ShareAccountStatusEnumData;
  timeline: ShareAccountApplicationTimelineData;
  currency: CurrencyData;
  summary: ShareAccountSummaryData;
  purchasedShares: ShareAccountTransactionData[];
  charges: ShareAccountChargeData[];
  dividends: ShareAccountDividendData[];
  lockinPeriod: number | null;
  lockPeriodTypeEnum: EnumOptionData | null;
  minimumActivePeriod: number | null;
  minimumActivePeriodTypeEnum: EnumOptionData | null;
  allowDividendCalculationForInactiveClients: boolean;
  currentMarketPrice: number;

  // template
  productOptions?: ProductData[];
  chargeOptions?: ChargeData[];
  clientSavingsAccounts?: SavingsAccountData[];
  lockinPeriodFrequencyTypeOptions?: EnumOptionData[];
  minimumActivePeriodFrequencyTypeOptions?: EnumOptionData[];
}

export interface ShareAccountStatusEnumData {
  id: number;
  code: string;
  value: string;
  submittedAndPendingApproval: boolean;
  approved: boolean;
  rejected: boolean;
  active: boolean;
  closed: boolean;
}

export interface ShareAccountApplicationTimelineData {
  submittedOnDate: string;
  submittedByUsername: string;
  submittedByFirstname: string;
  submittedByLastname: string;
  approvedDate: string | null;
  approvedByUsername: string | null;
  approvedByFirstname: string | null;
  approvedByLastname: string | null;
  activatedDate: string | null;
  activatedByUsername: string | null;
  activatedByFirstname: string | null;
  activatedByLastname: string | null;
  rejectedDate: string | null;
  rejectedByUsername: string | null;
  rejectedByFirstname: string | null;
  rejectedByLastname: string | null;
  closedDate: string | null;
  closedByUsername: string | null;
  closedByFirstname: string | null;
  closedByLastname: string | null;
}

export interface ShareAccountSummaryData {
  totalApprovedShares: number;
  totalPendingShares: number;
  totalShares: number;
}

export interface ShareAccountTransactionData {
  id: number;
  transactionDate: string;
  totalShares: number;
  unitPrice: number;
  amount: number;
  amountPaid: number;
  chargeAmount: number;
  status: PurchasedSharesStatusEnumData;
  type: ShareAccountTransactionEnumData;
}

export interface PurchasedSharesStatusEnumData {
  id: number;
  code: string;
  value: string;
  applied: boolean;
  approved: boolean;
  rejected: boolean;
  purchased: boolean;
  redeemed: boolean;
  chargePayment: boolean;
}

export interface ShareAccountTransactionEnumData {
  id: number;
  code: string;
  value: string;
  purchased: boolean;
  redeemed: boolean;
  chargePayment: boolean;
}

export interface ShareAccountChargeData {
  id: number;
  chargeId: number;
  name: string;
  amount: number;
  amountPaid: number;
  amountWaived: number;
  amountWrittenOff: number;
  amountOutstanding: number;
  chargeTimeType: EnumOptionData;
  chargeCalculationType: EnumOptionData;
  isActive: boolean;
}

export interface ShareAccountDividendData {
  id: number;
  accountId: number;
  amount: number;
  status: ShareAccountDividendStatusEnumData;
  savingsTransactionId: number | null;
}

export interface ShareAccountDividendStatusEnumData {
  id: number;
  code: string;
  value: string;
  initiated: boolean;
  posted: boolean;
}

// ============================================================
// Share Product
// ============================================================
export interface ShareProductData {
  id: number;
  name: string;
  shortName: string;
  description: string;
  externalId: string;
  currency: CurrencyData;
  totalShares: number;
  sharesIssued: number;
  unitPrice: number;
  shareCapital: number;
  minimumShares: number | null;
  nominalShares: number;
  maximumShares: number | null;
  marketPricePeriods: ShareProductMarketPriceData[];
  chargesSelected: ChargeData[];
  allowDividendCalculationForInactiveClients: boolean;
  lockinPeriodFrequency: number | null;
  lockinPeriodFrequencyType: EnumOptionData | null;
  minimumActivePeriodForDividends: number | null;
  minimumactiveperiodFrequencyType: EnumOptionData | null;
  accountingRule: EnumOptionData;

  // template
  currencyOptions?: CurrencyData[];
  accountingRuleOptions?: EnumOptionData[];
  lockinPeriodFrequencyTypeOptions?: EnumOptionData[];
  minimumActivePeriodFrequencyTypeOptions?: EnumOptionData[];
  chargeOptions?: ChargeData[];
}

export interface ShareProductMarketPriceData {
  id: number | null;
  fromDate: string;
  shareValue: number;
}

// ============================================================
// Dividend
// ============================================================
export interface ShareProductDividendPayOutData {
  id: number;
  productId: number;
  amount: number;
  dividendPeriodStartDate: string;
  dividendPeriodEndDate: string;
  status: ShareProductDividendStatusEnumData;
}

export interface ShareProductDividendStatusEnumData {
  id: number;
  code: string;
  value: string;
  initiated: boolean;
  approved: boolean;
}

// ============================================================
// Enums
// ============================================================
export interface EnumOptionData {
  id: number;
  code: string;
  value: string;
}

export interface CurrencyData {
  code: string;
  name: string;
  decimalPlaces: number;
  inMultiplesOf: number;
  displaySymbol: string;
  nameCode: string;
  displayLabel: string;
}

// ============================================================
// Requests
// ============================================================
export interface CreateShareProductRequest {
  name: string;
  shortName: string;
  description: string;
  externalId?: string;
  totalShares: number;
  sharesIssued?: number;
  currencyCode: string;
  digitsAfterDecimal: number;
  inMultiplesOf: number;
  unitPrice: number;
  minimumShares?: number;
  nominalShares: number;
  maximumShares?: number;
  marketPricePeriods?: { fromDate: string; shareValue: number }[];
  chargesSelected?: { id: number }[];
  allowDividendCalculationForInactiveClients: boolean;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: number;
  minimumActivePeriodForDividends?: number;
  minimumactiveperiodFrequencyType?: number;
  accountingRule: number;
  shareReferenceId?: number;
  shareSuspenseId?: number;
  shareEquityId?: number;
  incomeFromFeeAccountId?: number;
  dateFormat: string;
  locale: string;
}

export interface CreateShareAccountRequest {
  clientId: number;
  productId: number;
  submittedDate: string;
  applicationDate: string;
  requestedShares: number;
  savingsAccountId: number;
  externalId?: string;
  allowDividendCalculationForInactiveClients?: boolean;
  minimumActivePeriod?: number;
  minimumActivePeriodFrequencyType?: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: number;
  charges?: { chargeId: number; amount: number }[];
  dateFormat: string;
  locale: string;
}

export interface ApproveShareAccountRequest {
  approvedDate: string;
  note?: string;
  dateFormat: string;
  locale: string;
}

export interface ActivateShareAccountRequest {
  activatedDate: string;
  dateFormat: string;
  locale: string;
}

export interface CloseShareAccountRequest {
  closedDate: string;
  note?: string;
  dateFormat: string;
  locale: string;
}

export interface ApplyAdditionalSharesRequest {
  requestedDate: string;
  requestedShares: number;
  dateFormat: string;
  locale: string;
}

export interface ApproveAdditionalSharesRequest {
  requestedShares: { id: number }[];
}

export interface RedeemSharesRequest {
  requestedDate: string;
  requestedShares: number;
  dateFormat: string;
  locale: string;
}

export interface CreateDividendRequest {
  dividendPeriodStartDate: string;
  dividendPeriodEndDate: string;
  dividendAmount: number;
  dateFormat: string;
  locale: string;
}
```

---

## 14. Implementation Checklist

### Share Product

- [ ] Share product list (`GET /v1/products/share`) with pagination
- [ ] Share product detail (`GET /v1/products/share/{id}`) with optional template
- [ ] Share product template (`GET /v1/products/share/template`)
- [ ] Create share product (`POST /v1/products/share`)
- [ ] Update share product (`PUT /v1/products/share/{id}`)
- [ ] Currency selector with digitsAfterDecimal and inMultiplesOf
- [ ] Accounting rule selector with conditional GL account fields
- [ ] Market price schedule editor (date + value pairs)
- [ ] Lockin period configuration (value + period type dropdown)
- [ ] Minimum active period for dividends (always DAYS)
- [ ] Charge multi-select with currency validation
- [ ] Short name (max 4 chars) validation

### Share Account

- [ ] Share account list (`GET /v1/accounts/share`) with pagination
- [ ] Share account detail (`GET /v1/accounts/share/{id}`)
- [ ] Share account template (`GET /v1/accounts/share/template?clientId=X&productId=Y`)
- [ ] Create share account (`POST /v1/accounts/share`)
- [ ] Update share account (`PUT /v1/accounts/share/{id}`)
- [ ] Status badge (Submitted/Approved/Active/Rejected/Closed)
- [ ] Timeline display (submitted/approved/activated/rejected/closed dates + users)

### State Commands

- [ ] Approve (`POST ...?command=approve`) with approvedDate validation
- [ ] Activate (`POST ...?command=activate`) with activatedDate validation
- [ ] Reject (`POST ...?command=reject`)
- [ ] Close (`POST ...?command=close`) with closedDate
- [ ] Undo approval (`POST ...?command=undoapproval`)

### Additional Shares

- [ ] Apply additional shares (`POST ...?command=applyadditionalshares`)
- [ ] Approve additional shares (`POST ...?command=approveadditionalshares`)
- [ ] Reject additional shares (`POST ...?command=rejectadditionalshares`)
- [ ] Redeem shares (`POST ...?command=redeemshares`)
- [ ] Lockin period validation on redeem
- [ ] Sufficient shares validation on redeem

### Dividends

- [ ] Dividend list (`GET /v1/shareproduct/{id}/dividend`) with status filter
- [ ] Dividend detail with per-account breakdown
- [ ] Create dividend (`POST /v1/shareproduct/{id}/dividend`)
- [ ] Approve dividend (`PUT .../{dividendId}?command=approve`)
- [ ] Delete dividend (`DELETE .../{dividendId}`)
- [ ] Dividend status badge (Initiated/Approved)

### Error Handling

- [ ] Requested shares validation against product min/max
- [ ] Approved date cannot be before submitted date
- [ ] Activated date cannot be before approved date
- [ ] Shares issuable limit exceeded on approval
- [ ] Lockin period violation on redeem
- [ ] Insufficient shares on redeem
- [ ] Transaction date before existing transactions
- [ ] Currency mismatch between charge and product
- [ ] Savings account must belong to client and match currency
- [ ] Close date cannot be before existing transactions
