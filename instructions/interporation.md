# Interoperation — React Implementation Guide

Source: Apache Fineract Interoperation Feature  
Trace Date: 2026-07-25  
Java Base: `org.apache.fineract.interoperation`

---

## 1. Feature Overview

The Interoperation feature implements the **Mojaloop/API-Enabled Digital Financial Services** interoperation standard, enabling cross-system payment and transaction capabilities. It allows external financial service providers (FSPs) to discover accounts, request payments, calculate quotes, and perform transfers against Fineract savings and loan accounts.

### Key Concepts

| Concept                 | Description                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------- |
| **Party Identifier**    | A secondary identifier (MSISDN, EMAIL, IBAN, etc.) mapped to a savings account        |
| **Transaction Request** | A payee requests a payment from a payer                                               |
| **Quote**               | Fee calculation for a proposed transaction                                            |
| **Transfer**            | The actual movement of funds (debit or credit) on a savings account                   |
| **Hold Amount**         | Funds placed on hold during transfer PREPARE phase                                    |
| **Routing Code**        | Always `INTEROPERATION` — used to track interop transactions                          |
| **Action**              | The transfer lifecycle action: `PREPARE`, `CREATE` (commit), `RELEASE` (release hold) |

### Interop Transfer Lifecycle

```
Standard Transfer Flow:
  PREPARE → hold placed on savings account
     ↓
  CREATE  → hold released; withdrawal/deposit posted
     ↓
  RELEASE → hold released without committing (cancel)

Quote Flow:
  POST /quotes → fee calculated (withdrawal fee for debits)
     ↓
  Transfer uses the quoted fee/commission amounts
```

### Enum Reference

| Enum                         | Values                                                                                        | Description                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `InteropIdentifierType`      | `MSISDN`, `EMAIL`, `PERSONAL_ID`, `BUSINESS`, `DEVICE`, `ACCOUNT_ID`, `IBAN`, `ALIAS`, `BBAN` | Types of secondary identifiers for party lookup      |
| `InteropActionState`         | `ACCEPTED`, `REJECTED`                                                                        | Response state for interop operations                |
| `InteropAmountType`          | `SEND`, `RECEIVE`                                                                             | Direction of amount                                  |
| `InteropInitiatorType`       | `CONSUMER`, `AGENT`, `BUSINESS`, `DEVICE`                                                     | Who initiated the transaction                        |
| `InteropTransactionRole`     | `PAYER`, `PAYEE`                                                                              | Role in the transaction (maps to WITHDRAWAL/DEPOSIT) |
| `InteropTransactionScenario` | `DEPOSIT`, `WITHDRAWAL`, `TRANSFER`, `PAYMENT`, `REFUND`                                      | Business scenario                                    |
| `InteropTransferActionType`  | `PREPARE`, `CREATE`, `RELEASE`                                                                | Transfer lifecycle action                            |

### Entity Relationship

```
InteropIdentifier (interop_identifier)
  ├── @ManyToOne → SavingsAccount (account_id)
  ├── type (InteropIdentifierType: MSISDN, EMAIL, IBAN, etc.)
  ├── value (the actual identifier value, unique per type)
  └── subType (optional sub-type)

SavingsAccount (m_savings_account)
  └── referenced by InteropIdentifier.account_id
```

### Key Tables

| Table                | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `interop_identifier` | Maps external party identifiers to savings accounts    |
| `m_savings_account`  | Savings accounts used for interop transfers            |
| `m_payment_type`     | Payment types (non-cash type used for interop routing) |

---

## 2. API Inventory

Base path: `/v1/interoperation`

### Health

| Method | URL                         | Description  | Permission |
| ------ | --------------------------- | ------------ | ---------- |
| GET    | `/v1/interoperation/health` | Health check | Public     |

### Account Details

| Method | URL                                                    | Description                                                   | Permission     |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------- | -------------- |
| GET    | `/v1/interoperation/accounts/{accountId}`              | Get account details by external ID                            | `INTERID` READ |
| GET    | `/v1/interoperation/accounts/{accountId}/transactions` | Get account transactions (filter by debit/credit, date range) | `INTERID` READ |
| GET    | `/v1/interoperation/accounts/{accountId}/identifiers`  | Get all secondary identifiers for an account                  | `INTERID` READ |
| GET    | `/v1/interoperation/accounts/{accountId}/kyc`          | Get KYC information for account's client                      | `INTERID` READ |

### Party/Identifier Management

| Method | URL                                                           | Description                                    | Permission     |
| ------ | ------------------------------------------------------------- | ---------------------------------------------- | -------------- |
| GET    | `/v1/interoperation/parties/{idType}/{idValue}`               | Lookup account by identifier (no sub-type)     | `INTERID` READ |
| GET    | `/v1/interoperation/parties/{idType}/{idValue}/{subIdOrType}` | Lookup account by identifier (with sub-type)   | `INTERID` READ |
| POST   | `/v1/interoperation/parties/{idType}/{idValue}`               | Register identifier on account (no sub-type)   | Command-level  |
| POST   | `/v1/interoperation/parties/{idType}/{idValue}/{subIdOrType}` | Register identifier on account (with sub-type) | Command-level  |
| DELETE | `/v1/interoperation/parties/{idType}/{idValue}`               | Delete identifier from account (no sub-type)   | Command-level  |
| DELETE | `/v1/interoperation/parties/{idType}/{idValue}/{subIdOrType}` | Delete identifier from account (with sub-type) | Command-level  |

### Transaction Requests (Payee-requested)

| Method | URL                                                                        | Description                                              | Permission          |
| ------ | -------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------- |
| GET    | `/v1/interoperation/transactions/{transactionCode}/requests/{requestCode}` | Query a transaction request                              | `INTERREQUEST` READ |
| POST   | `/v1/interoperation/requests`                                              | Create a transaction request (payee requests from payer) | Command-level       |

### Quotes

| Method | URL                                                                    | Description                      | Permission        |
| ------ | ---------------------------------------------------------------------- | -------------------------------- | ----------------- |
| GET    | `/v1/interoperation/transactions/{transactionCode}/quotes/{quoteCode}` | Query a quote                    | `INTERQUOTE` READ |
| POST   | `/v1/interoperation/quotes`                                            | Create a quote (fee calculation) | Command-level     |

### Transfers

| Method | URL                                                                          | Description      | Permission           |
| ------ | ---------------------------------------------------------------------------- | ---------------- | -------------------- |
| GET    | `/v1/interoperation/transactions/{transactionCode}/transfers/{transferCode}` | Query a transfer | `INTERTRANSFER` READ |
| POST   | `/v1/interoperation/transfers?action=PREPARE                                 | CREATE           | RELEASE`             | Perform a transfer action | Command-level |

### Loan Operations

| Method | URL                                                         | Description                                  | Permission |
| ------ | ----------------------------------------------------------- | -------------------------------------------- | ---------- |
| POST   | `/v1/interoperation/transactions/{accountId}/disburse`      | Disburse a loan by external account ID       | Delegated  |
| POST   | `/v1/interoperation/transactions/{accountId}/loanrepayment` | Make a loan repayment by external account ID | Delegated  |

### Permission Mapping

| Entity Name (constant) | Permission Group | Operations                   |
| ---------------------- | ---------------- | ---------------------------- |
| `INTERID`              | `interop`        | CREATE, READ, UPDATE, DELETE |
| `INTERREQUEST`         | `interop`        | CREATE, READ, UPDATE, DELETE |
| `INTERQUOTE`           | `interop`        | CREATE, READ, UPDATE, DELETE |
| `INTERTRANSFER`        | `interop`        | CREATE, READ, UPDATE, DELETE |

---

## 3. CRUD Analysis

### Party Identifiers

| Operation            | Endpoint                                             | Notes                                                                |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| **Lookup**           | `GET /parties/{idType}/{idValue}[/{subIdOrType}]`    | Returns account external ID linked to identifier                     |
| **Register**         | `POST /parties/{idType}/{idValue}[/{subIdOrType}]`   | Links identifier to a savings account (request body has `accountId`) |
| **Delete**           | `DELETE /parties/{idType}/{idValue}[/{subIdOrType}]` | Removes the identifier mapping                                       |
| **List for Account** | `GET /accounts/{accountId}/identifiers`              | Lists all identifiers for a given account                            |

### Transfers

| Operation   | Endpoint                                                       | Notes                                               |
| ----------- | -------------------------------------------------------------- | --------------------------------------------------- |
| **Prepare** | `POST /transfers?action=PREPARE`                               | Holds amount on savings account (debit only)        |
| **Commit**  | `POST /transfers?action=CREATE`                                | Releases hold, posts withdrawal/deposit transaction |
| **Release** | `POST /transfers?action=RELEASE`                               | Releases hold without committing                    |
| **Query**   | `GET /transactions/{transactionCode}/transfers/{transferCode}` | **Stub** — returns null currently                   |

### Missing Operations

- No `PUT`/`UPDATE` for identifiers — must delete and re-register
- Quote query (`GET /quotes`) and Transfer query (`GET /transfers`) return null/stub
- Transaction Request query always returns `REJECTED` (requests are not persisted)
- No batch operations

---

## 4. Create Workflow (Highest Priority)

### Party Registration Flow

```
Choose ID Type (MSISDN, EMAIL, IBAN, etc.)
  ↓
Enter ID Value (e.g., phone number)
  ↓
Get Account External ID (from existing account or create one)
  ↓
POST /parties/{idType}/{idValue}
  ↓  Body: { "accountId": "ext-account-id" }
Register identifier
  ↓
Verify: GET /parties/{idType}/{idValue}
```

### Transfer Flow (PREPARE → COMMIT)

```
Lookup Payer account via GET /parties/{idType}/{idValue}
  ↓  returns accountId
Create Quote: POST /quotes
  ↓  returns fee amount, ACCEPTED
Prepare Transfer: POST /transfers?action=PREPARE
  ↓  holds amount + fee on payer's account
Commit Transfer: POST /transfers?action=CREATE
  ↓  releases hold, posts withdrawal (debit) or deposit (credit)
```

### Loan Disburse Flow

```
Lookup Loan by account number
  ↓
POST /transactions/{accountId}/disburse
  ↓  Delegates to standard loan disburse API
```

### Loan Repayment Flow

```
Lookup Loan by account number
  ↓
POST /transactions/{accountId}/loanrepayment
  ↓  Delegates to standard loan repayment API
```

---

## 5. Lookup APIs

| UI Field             | Endpoint                                 | Display             | Value            | Required            |
| -------------------- | ---------------------------------------- | ------------------- | ---------------- | ------------------- |
| Party by MSISDN      | `GET /parties/MSISDN/{phone}`            | Account external ID | accountId        | For transfer create |
| Party by EMAIL       | `GET /parties/EMAIL/{email}`             | Account external ID | accountId        | Alternative         |
| Party by IBAN        | `GET /parties/IBAN/{iban}`               | Account external ID | accountId        | Alternative         |
| Account Identifiers  | `GET /accounts/{accountId}/identifiers`  | List of identifiers | Identifier list  | For management      |
| Account Transactions | `GET /accounts/{accountId}/transactions` | Transaction history | Transaction list | For history view    |
| Account KYC          | `GET /accounts/{accountId}/kyc`          | Client KYC data     | KYC data         | For customer info   |

---

## 6. API Call Order

### Transfer (Debit from Payer)

1. `GET /parties/MSISDN/254700111222` — lookup payer by MSISDN
2. `POST /quotes` — create quote to calculate fees
3. `POST /transfers?action=PREPARE` — hold amount on payer account
4. `POST /transfers?action=CREATE` — commit the transfer

### Transfer (Credit to Payee)

1. `POST /transfers?action=PREPARE` — for credit, no hold needed (skipped in impl)
2. `POST /transfers?action=CREATE` — posts deposit directly

### Release Hold (Cancel Transfer)

1. `POST /transfers?action=RELEASE` — releases hold, no transaction posted

### Party Management

1. `POST /parties/EMAIL/john@example.com` — register identifier
2. `GET /parties/EMAIL/john@example.com` — verify registration
3. `DELETE /parties/EMAIL/john@example.com` — unregister identifier

### Loan Operations

1. `POST /transactions/{accountId}/disburse` — disburse loan
2. `POST /transactions/{accountId}/loanrepayment` — repay loan

---

## 7. Request Payload Analysis

### Register Identifier (`POST /v1/interoperation/parties/{idType}/{idValue}`)

```json
{
  "accountId": "ext-uuid-account-id"
}
```

Response:

```json
{
  "resourceId": 1,
  "accountId": "ext-uuid-account-id"
}
```

### Create Transaction Request (`POST /v1/interoperation/requests`)

```json
{
  "transactionCode": "tx-001",
  "requestCode": "req-001",
  "accountId": "ext-account-id",
  "amount": {
    "amount": "100.00",
    "currency": "USD"
  },
  "transactionRole": "PAYEE",
  "transactionType": {
    "scenario": "TRANSFER",
    "initiator": "PAYEE",
    "initiatorType": "CONSUMER"
  },
  "note": "Payment for services",
  "expiration": "2026-12-31T23:59:59.999-00:00",
  "locale": "en",
  "extensionList": []
}
```

Response:

```json
{
  "transactionCode": "tx-001",
  "state": "ACCEPTED",
  "requestCode": "req-001",
  "expiration": "2026-12-31T23:59:59.999+0000",
  "extensionList": []
}
```

### Create Quote (`POST /v1/interoperation/quotes`)

```json
{
  "transactionCode": "tx-001",
  "quoteCode": "q-001",
  "accountId": "ext-payer-account",
  "amount": {
    "amount": "100.00",
    "currency": "USD"
  },
  "transactionRole": "PAYER",
  "transactionType": {
    "scenario": "TRANSFER",
    "initiator": "PAYER",
    "initiatorType": "CONSUMER"
  },
  "note": "Payment",
  "expiration": "2026-12-31T23:59:59.999-00:00",
  "locale": "en",
  "extensionList": []
}
```

Response:

```json
{
  "transactionCode": "tx-001",
  "state": "ACCEPTED",
  "quoteCode": "q-001",
  "fspFee": {
    "amount": "0.50",
    "currency": "USD"
  },
  "expiration": "2026-12-31T23:59:59.999+0000"
}
```

Note: Fee calculation uses `savingsAccount.calculateWithdrawalFee()` for debit transactions. No fee for credit transactions.

### Prepare Transfer (`POST /v1/interoperation/transfers?action=PREPARE`)

```json
{
  "transactionCode": "tx-001",
  "transferCode": "tr-001",
  "accountId": "ext-payer-account",
  "amount": {
    "amount": "100.00",
    "currency": "USD"
  },
  "transactionRole": "PAYER",
  "transactionType": {
    "scenario": "TRANSFER",
    "initiator": "PAYER",
    "initiatorType": "CONSUMER"
  },
  "fspFee": {
    "amount": "0.50",
    "currency": "USD"
  },
  "note": "Payment",
  "expiration": "2026-12-31T23:59:59.999-00:00",
  "locale": "en",
  "extensionList": []
}
```

Response:

```json
{
  "transactionCode": "tx-001",
  "state": "ACCEPTED",
  "transferCode": "tr-001",
  "completedTimestamp": "2026-07-25T10:30:00.000+0000",
  "expiration": "2026-12-31T23:59:59.999+0000"
}
```

Note: For debit (`PAYER`), amount + fspFee - fspCommission is held. For credit (`PAYEE`), no hold is placed.

### Commit Transfer (`POST /v1/interoperation/transfers?action=CREATE`)

Same payload as PREPARE (uses `transferCode` to find the hold transaction).

Response: Same structure as PREPARE, but the actual savings withdrawal/deposit is posted.

### Release Transfer (`POST /v1/interoperation/transfers?action=RELEASE`)

Same payload as PREPARE. Releases the hold without posting any transaction.

### Loan Disburse (`POST /v1/interoperation/transactions/{accountId}/disburse`)

```json
{
  "dateFormat": "dd MMMM yyyy",
  "locale": "en",
  "transactionAmount": "1000.00"
}
```

### Loan Repayment (`POST /v1/interoperation/transactions/{accountId}/loanrepayment`)

```json
{
  "dateFormat": "dd MMMM yyyy",
  "locale": "en",
  "transactionAmount": "500.00",
  "paymentTypeId": 1
}
```

---

## 8. Validation Rules

### Identifier Registration Validation

| Field                             | Required | Validation                                                               |
| --------------------------------- | -------- | ------------------------------------------------------------------------ |
| `idType`                          | **Yes**  | Path param; must be a valid `InteropIdentifierType` enum value           |
| `idValue`                         | **Yes**  | Path param; not blank                                                    |
| `accountId`                       | **Yes**  | Must reference an existing savings account by external ID                |
| Type + Value + SubType uniqueness | **Yes**  | Unique constraint `uk_interop_identifier_value`                          |
| Account + Type uniqueness         | **Yes**  | Unique constraint `uk_interop_identifier_account` (one type per account) |

### Transfer Request Validation (InteropRequestData.validateAndParse)

| Field                           | Required    | Validation                                                    |
| ------------------------------- | ----------- | ------------------------------------------------------------- |
| `transactionCode`               | **Yes**     | Not blank                                                     |
| `accountId`                     | **Yes**     | Not blank; must exist; must match savings account external ID |
| `amount`                        | **Yes**     | Not null; must be a valid MoneyData object (amount, currency) |
| `amount.amount`                 | **Yes**     | Valid BigDecimal                                              |
| `amount.currency`               | **Yes**     | Valid currency code; must match savings account currency      |
| `transactionRole`               | **Yes**     | Not null; must be `PAYER` or `PAYEE`                          |
| `transferCode`                  | **Yes**     | Not blank (for transfer requests only)                        |
| `transactionType.scenario`      | Conditional | Not blank if transactionType provided                         |
| `transactionType.initiator`     | Conditional | Not blank if transactionType provided                         |
| `transactionType.initiatorType` | Conditional | Not blank if transactionType provided                         |
| `expiration`                    | No          | Valid ISO8601 datetime                                        |
| `fspFee`                        | No          | Must match savings account currency if provided               |
| `fspCommission`                 | No          | Must match savings account currency if provided               |

### Business Rule Validations

| Rule                               | Logic                                                               | Error                                          |
| ---------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| Account exists                     | `savingsAccountRepository.findByExternalId(accountId)`              | `SavingsAccountNotFoundException`              |
| Currency match                     | `request.amount.currency == savingsAccount.currency`                | `DifferentCurrenciesException`                 |
| Transaction allowed                | `savingsAccount.isTransactionAllowed(type, expirationDate)`         | `InteropAccountTransactionNotAllowedException` |
| Sufficient balance (PREPARE debit) | `withdrawableBalance >= total (amount + fee - commission)`          | `InsufficientAccountBalanceException`          |
| No duplicate hold                  | No existing hold with same transferCode                             | `InteropTransferAlreadyOnHoldException`        |
| Hold exists (COMMIT debit)         | Find hold transaction by transferCode + routing code                | `InteropTransferMissingException`              |
| Hold amount matches (COMMIT debit) | Hold amount == (amount + fee - commission)                          | `InteropTransferMissingException`              |
| No duplicate commit                | No existing withdrawal/deposit with same transferCode               | `InteropTransferAlreadyCommittedException`     |
| Hold exists (RELEASE)              | Find hold transaction by transferCode                               | `InteropTransferMissingException`              |
| Loan exists (disburse/repayment)   | `loanRepositoryWrapper.findNonClosedLoanByAccountNumber(accountId)` | `LoanNotFoundException`                        |
| Identifier unique per type         | DB constraint `uk_interop_identifier_account`                       | `PlatformDataIntegrityException`               |
| Identifier value unique            | DB constraint `uk_interop_identifier_value`                         | `PlatformDataIntegrityException`               |

---

## 9. Business Flow

### Transfer Lifecycle (Debit / Payer)

```
Controller (InteropApiResource.performTransfer)
  ↓  ?action=PREPARE | CREATE | RELEASE
CommandHandler:
  PREPARE → PrepareInteropTransferHandler
  CREATE  → CommitInteropTransferHandler
  RELEASE → ReleaseInteropTransferHandler
  ↓
InteropServiceImpl:
  ↓
validateAndParseTransferRequest(command)
  ↓  parses and validates the entire InteropTransferRequestData
validateAndGetSavingAccount(request)
  ↓  validates: account exists, currency match, transaction allowed

[PREPARE flow]
calculateTotalTransferAmount(request, savingsAccount)
  ↓  total = amount + fspFee - fspCommission
findTransaction(savingsAccount, transferCode, AMOUNT_HOLD)
  ↓  check no duplicate hold
  SavingsAccountTransaction.holdAmount(...)  → creates hold transaction
  savingsAccount.holdAmount(total)            → reduces withdrawable balance
  savingsAccountRepository.save(savingsAccount)
  ↓
Return ACCEPTED response

[CREATE flow]
findTransaction(savingsAccount, transferCode, WITHDRAWAL|DEPOSIT)
  ↓  check no duplicate commit
  [If debit]:
    findTransaction(savingsAccount, transferCode, AMOUNT_HOLD)
      ↓  must exist, amount must match
    releaseAmount(holdTransaction)    → creates release transaction
    savingsAccount.releaseOnHoldAmount(...)
    savingsAccountService.handleWithdrawal(...)  → posts withdrawal
  [If credit]:
    savingsAccountService.handleDeposit(...)  → posts deposit directly
  ↓
noteRepository.save(Note.savingsTransactionNote(...))  → optional note
  ↓
Return ACCEPTED response

[RELEASE flow]
findTransaction(savingsAccount, transferCode, AMOUNT_HOLD)
  ↓  must exist, must not have release
releaseAmount(holdTransaction)
  ↓  creates release transaction
savingsAccount.releaseOnHoldAmount(...)
savingsAccountRepository.save(savingsAccount)
  ↓
Return ACCEPTED response
```

### Identifier Registration Flow

```
Controller (InteropApiResource.registerAccountIdentifier)
  ↓
InteropWrapperBuilder.registerAccountIdentifier(...)
  ↓  command wrapper with entity INTERID, action CREATE
CreateInteropIdentifierHandler
  ↓
InteropServiceImpl.registerAccountIdentifier(...)
  ↓
dataValidator.validateAndParseCreateIdentifier(...)
  ↓  parses JSON, validates required fields
validateAndGetSavingAccount(request.getAccountId())
  ↓  validates account exists
new InteropIdentifier(savingsAccount, idType, idValue, subType, createdBy)
  ↓
identifierRepository.saveAndFlush(identifier)
  ↓  handles uniqueness constraints
Return InteropIdentifierAccountResponseData
```

### Quote Creation Flow

```
Controller (InteropApiResource.createQuote)
  ↓
CreateInteropQuoteHandler
  ↓
InteropServiceImpl.createQuote(...)
  ↓
dataValidator.validateAndParseCreateQuote(command)
validateAndGetSavingAccount(request)
  ↓
[If debit]:
  fee = savingsAccount.calculateWithdrawalFee(amount)
  check: withdrawableBalance >= amount + fee
[If credit]:
  fee = BigDecimal.ZERO
  ↓
Return InteropQuoteResponseData with fee
```

---

## 10. Related Operations

| Operation            | Endpoint                                                         | Description                                            |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| Account Details      | `GET /v1/interoperation/accounts/{accountId}`                    | Savings account balance and status                     |
| Account Transactions | `GET /v1/interoperation/accounts/{accountId}/transactions`       | Transaction history with debit/credit/date filters     |
| Account Identifiers  | `GET /v1/interoperation/accounts/{accountId}/identifiers`        | List all linked party identifiers                      |
| KYC Query            | `GET /v1/interoperation/accounts/{accountId}/kyc`                | Client KYC data (name, address, ID docs, contact info) |
| Health Check         | `GET /v1/interoperation/health`                                  | Service availability                                   |
| Loan Disburse        | `POST /v1/interoperation/transactions/{accountId}/disburse`      | Delegates to standard loan disburse                    |
| Loan Repayment       | `POST /v1/interoperation/transactions/{accountId}/loanrepayment` | Delegates to standard loan repayment                   |

---

## 11. Hidden Dependencies

| Dependency                             | Impact                                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Savings account must exist**         | All interop operations require a savings account referenced by external ID                                |
| **Non-cash payment type required**     | Transfer operations use `findPaymentType()` which returns first non-cash payment type; must be seeded     |
| **Currency must match**                | Request currency must match savings account currency                                                      |
| **Hold amount rounding**               | `normalizeAmounts()` uses currency's digits after decimal; precision must match                           |
| **No persistence for requests/quotes** | `getTransactionRequest()` always returns REJECTED; `getQuote()` and `getTransfer()` return null           |
| **Routing code hardcoded**             | `DEFAULT_ROUTING_CODE = "INTEROPERATION"` — all transactions tracked by this code                         |
| **External ID as account reference**   | Accounts are identified by `external_id`, not internal database ID                                        |
| **Transaction allowed check**          | `savingsAccount.isTransactionAllowed()` depends on account status, group, activation date, etc.           |
| **Withdrawal fee configuration**       | Fee calculation depends on savings product withdrawal fee configuration                                   |
| **Loan operations delegate**           | Disburse and repayment delegate to standard loan command wrappers; require standard loan permissions      |
| **Payment type routing**               | Transfer code tracked in `PaymentDetail.receiptNumber`; used for hold-release matching                    |
| **No maker-checker**                   | Interop operations do not go through maker-checker workflow                                               |
| **Audit fields on identifier**         | `InteropIdentifier` tracks createdBy, createdOn, modifiedBy, modifiedOn                                   |
| **Unique constraints**                 | Two unique constraints on `interop_identifier`: (account_id, type) and (type, a_value, sub_value_or_type) |
| **Feature flag**                       | No explicit feature toggle — interop resources are always available when the provider module is loaded    |
| **KYC query is JDBC raw SQL**          | KYC data is fetched via `JdbcTemplate` with a raw SQL query across multiple joined tables                 |
| **Expiration date format**             | ISO8601 format `yyyy-MM-dd'T'HH:mm:ss.SSS[-HH:MM]` for dates; `yyyy-MM-dd` for local dates                |
| **Default locale**                     | `Locale.US` used as default when no locale provided                                                       |

---

## 12. Implementation Checklist

### Party/Identifier Management

- [ ] Health Check (`GET /v1/interoperation/health`)
- [ ] Lookup Party by Identifier (`GET /v1/interoperation/parties/{idType}/{idValue}`)
- [ ] Lookup Party by Identifier with SubType (`GET /v1/interoperation/parties/{idType}/{idValue}/{subIdOrType}`)
- [ ] Register Identifier (`POST /v1/interoperation/parties/{idType}/{idValue}`)
- [ ] Register Identifier with SubType (`POST /v1/interoperation/parties/{idType}/{idValue}/{subIdOrType}`)
- [ ] Delete Identifier (`DELETE /v1/interoperation/parties/{idType}/{idValue}`)
- [ ] Delete Identifier with SubType (`DELETE /v1/interoperation/parties/{idType}/{idValue}/{subIdOrType}`)

### Account Services

- [ ] Account Detail (`GET /v1/interoperation/accounts/{accountId}`)
- [ ] Account Transactions (`GET /v1/interoperation/accounts/{accountId}/transactions`)
- [ ] Account Identifiers (`GET /v1/interoperation/accounts/{accountId}/identifiers`)
- [ ] Account KYC (`GET /v1/interoperation/accounts/{accountId}/kyc`)

### Transaction Requests

- [ ] Query Transaction Request (`GET /v1/interoperation/transactions/{txCode}/requests/{reqCode}`)
- [ ] Create Transaction Request (`POST /v1/interoperation/requests`)

### Quotes

- [ ] Query Quote (`GET /v1/interoperation/transactions/{txCode}/quotes/{quoteCode}`)
- [ ] Create Quote (`POST /v1/interoperation/quotes`)

### Transfers

- [ ] Query Transfer (`GET /v1/interoperation/transactions/{txCode}/transfers/{transferCode}`)
- [ ] Prepare Transfer (`POST /v1/interoperation/transfers?action=PREPARE`)
- [ ] Commit Transfer (`POST /v1/interoperation/transfers?action=CREATE`)
- [ ] Release Transfer (`POST /v1/interoperation/transfers?action=RELEASE`)

### Loan Operations

- [ ] Disburse Loan (`POST /v1/interoperation/transactions/{accountId}/disburse`)
- [ ] Loan Repayment (`POST /v1/interoperation/transactions/{accountId}/loanrepayment`)

### Setup & Configuration

- [ ] Seed non-cash payment type (for interop routing)
- [ ] Create savings products with withdrawal fees configured (if fee calculation needed)
- [ ] Ensure savings accounts have external IDs assigned
- [ ] Seed permissions: `INTERID`, `INTERREQUEST`, `INTERQUOTE`, `INTERTRANSFER` (CREATE, READ, UPDATE, DELETE)
- [ ] Unique constraints must exist on `interop_identifier` table
