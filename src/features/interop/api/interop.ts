import api from "@/api/client";
import type {
  PartyLookupResponse,
  RegisterIdentifierRequest,
  RegisterIdentifierResponse,
  AccountDetailResponse,
  AccountTransaction,
  InteropIdentifier,
  KYCData,
  TransactionRequestPayload,
  TransactionRequestResponse,
  QuotePayload,
  QuoteResponse,
  TransferPayload,
  TransferResponse,
  LoanDisburseRequest,
  LoanRepaymentRequest,
  CommandResponse,
  InteropIdentifierType,
} from "../types/interop";

const BASE = "/interoperation";

export async function healthCheck(): Promise<String> {
  const { data } = await api.get<String>(`${BASE}/health`);
  return data;
}

export async function lookupParty(
  idType: InteropIdentifierType | string,
  idValue: string,
  subIdOrType?: string,
): Promise<PartyLookupResponse> {
  const path = subIdOrType
    ? `${BASE}/parties/${idType}/${idValue}/${subIdOrType}`
    : `${BASE}/parties/${idType}/${idValue}`;
  const { data } = await api.get<PartyLookupResponse>(path);
  return data;
}

export async function registerIdentifier(
  idType: InteropIdentifierType | string,
  idValue: string,
  payload: RegisterIdentifierRequest,
  subIdOrType?: string,
): Promise<RegisterIdentifierResponse> {
  const path = subIdOrType
    ? `${BASE}/parties/${idType}/${idValue}/${subIdOrType}`
    : `${BASE}/parties/${idType}/${idValue}`;
  const { data } = await api.post<RegisterIdentifierResponse>(path, payload);
  return data;
}

export async function deleteIdentifier(
  idType: InteropIdentifierType | string,
  idValue: string,
  subIdOrType?: string,
): Promise<void> {
  const path = subIdOrType
    ? `${BASE}/parties/${idType}/${idValue}/${subIdOrType}`
    : `${BASE}/parties/${idType}/${idValue}`;
  await api.delete(path);
}

export async function fetchAccountDetails(accountId: string): Promise<AccountDetailResponse> {
  const { data } = await api.get<AccountDetailResponse>(`${BASE}/accounts/${accountId}`);
  return data;
}

export async function fetchAccountTransactions(
  accountId: string,
  params?: { debit?: string; credit?: string; fromDate?: string; toDate?: string },
): Promise<AccountTransaction[]> {
  const { data } = await api.get<AccountTransaction[]>(`${BASE}/accounts/${accountId}/transactions`, { params });
  return data;
}

export async function fetchAccountIdentifiers(accountId: string): Promise<InteropIdentifier[]> {
  const { data } = await api.get<InteropIdentifier[]>(`${BASE}/accounts/${accountId}/identifiers`);
  return data;
}

export async function fetchAccountKYC(accountId: string): Promise<KYCData> {
  const { data } = await api.get<KYCData>(`${BASE}/accounts/${accountId}/kyc`);
  return data;
}

export async function createTransactionRequest(
  payload: TransactionRequestPayload,
): Promise<TransactionRequestResponse> {
  const { data } = await api.post<TransactionRequestResponse>(`${BASE}/requests`, payload);
  return data;
}

export async function createQuote(payload: QuotePayload): Promise<QuoteResponse> {
  const { data } = await api.post<QuoteResponse>(`${BASE}/quotes`, payload);
  return data;
}

export async function executeTransfer(action: string, payload: TransferPayload): Promise<TransferResponse> {
  const { data } = await api.post<TransferResponse>(`${BASE}/transfers`, payload, {
    params: { action },
  });
  return data;
}

export async function disburseLoan(accountId: string, payload: LoanDisburseRequest): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(`${BASE}/transactions/${accountId}/disburse`, payload);
  return data;
}

export async function loanRepayment(accountId: string, payload: LoanRepaymentRequest): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(`${BASE}/transactions/${accountId}/loanrepayment`, payload);
  return data;
}
