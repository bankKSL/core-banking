export type InteropIdentifierType =
  "MSISDN" | "EMAIL" | "PERSONAL_ID" | "BUSINESS" | "DEVICE" | "ACCOUNT_ID" | "IBAN" | "ALIAS" | "BBAN";

export const IDENTIFIER_TYPE_OPTIONS: { id: InteropIdentifierType; label: string }[] = [
  { id: "MSISDN", label: "Mobile Number (MSISDN)" },
  { id: "EMAIL", label: "Email Address" },
  { id: "PERSONAL_ID", label: "Personal ID" },
  { id: "BUSINESS", label: "Business ID" },
  { id: "DEVICE", label: "Device ID" },
  { id: "ACCOUNT_ID", label: "Account ID" },
  { id: "IBAN", label: "IBAN" },
  { id: "ALIAS", label: "Alias" },
  { id: "BBAN", label: "BBAN" },
];

export type InteropActionState = "ACCEPTED" | "REJECTED";

export type InteropAmountType = "SEND" | "RECEIVE";

export type InteropInitiatorType = "CONSUMER" | "AGENT" | "BUSINESS" | "DEVICE";

export type InteropTransactionRole = "PAYER" | "PAYEE";

export type InteropTransactionScenario = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "PAYMENT" | "REFUND";

export type InteropTransferActionType = "PREPARE" | "CREATE" | "RELEASE";

export const TRANSFER_ACTION_OPTIONS: { id: InteropTransferActionType; label: string }[] = [
  { id: "PREPARE", label: "Prepare (Hold)" },
  { id: "CREATE", label: "Commit" },
  { id: "RELEASE", label: "Release (Cancel)" },
];

export interface InteropMoneyData {
  amount: string;
  currency: string;
}

export interface InteropTransactionType {
  scenario: InteropTransactionScenario;
  initiator: InteropTransactionRole;
  initiatorType: InteropInitiatorType;
}

export interface InteropIdentifier {
  id?: number;
  accountId: string;
  type: InteropIdentifierType;
  value: string;
  subType?: string;
  createdBy?: string;
  createdOn?: string;
  modifiedBy?: string;
  modifiedOn?: string;
}

export interface PartyLookupResponse {
  accountId: string;
  displayName?: string;
  identifierType?: InteropIdentifierType;
  identifierValue?: string;
}

export interface RegisterIdentifierRequest {
  accountId: string;
}

export interface RegisterIdentifierResponse {
  resourceId: number;
  accountId: string;
}

export interface AccountDetailResponse {
  id?: number;
  externalId: string;
  accountNo?: string;
  productName?: string;
  currency?: { code: string; name: string; decimalPlaces?: number };
  status?: string;
  accountBalance?: number;
  availableBalance?: number;
  clientId?: number;
  clientName?: string;
}

export interface AccountTransaction {
  id: number;
  transactionDate: string;
  transactionType?: string;
  debit?: number;
  credit?: number;
  runningBalance?: number;
  currency?: string;
}

export interface KYCData {
  clientId?: number;
  displayName?: string;
  mobileNo?: string;
  emailAddress?: string;
  dateOfBirth?: string;
  gender?: string;
  idDocument?: string;
  idDocumentNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface TransactionRequestPayload {
  transactionCode: string;
  requestCode: string;
  accountId: string;
  amount: InteropMoneyData;
  transactionRole: InteropTransactionRole;
  transactionType: InteropTransactionType;
  note?: string;
  expiration?: string;
  locale: string;
  extensionList?: unknown[];
}

export interface TransactionRequestResponse {
  transactionCode: string;
  state: InteropActionState;
  requestCode: string;
  expiration?: string;
  extensionList?: unknown[];
}

export interface QuotePayload {
  transactionCode: string;
  quoteCode: string;
  accountId: string;
  amount: InteropMoneyData;
  transactionRole: InteropTransactionRole;
  transactionType: InteropTransactionType;
  note?: string;
  expiration?: string;
  locale: string;
  extensionList?: unknown[];
}

export interface QuoteResponse {
  transactionCode: string;
  state: InteropActionState;
  quoteCode: string;
  fspFee?: InteropMoneyData;
  fspCommission?: InteropMoneyData;
  expiration?: string;
}

export interface TransferPayload {
  transactionCode: string;
  transferCode: string;
  accountId: string;
  amount: InteropMoneyData;
  transactionRole: InteropTransactionRole;
  transactionType: InteropTransactionType;
  fspFee?: InteropMoneyData;
  fspCommission?: InteropMoneyData;
  note?: string;
  expiration?: string;
  locale: string;
  extensionList?: unknown[];
}

export interface TransferResponse {
  transactionCode: string;
  state: InteropActionState;
  transferCode: string;
  completedTimestamp?: string;
  expiration?: string;
}

export interface LoanDisburseRequest {
  transactionAmount: string;
  dateFormat: string;
  locale: string;
}

export interface LoanRepaymentRequest {
  transactionAmount: string;
  paymentTypeId: number;
  dateFormat: string;
  locale: string;
}

export interface CommandResponse {
  resourceId: number;
}
