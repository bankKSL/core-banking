import api from "@/api/client";
import type {
  ExternalAssetOwner,
  ExternalAssetOwnerTransfer,
  CreateOwnerRequest,
  SaleTransferRequest,
  BuybackTransferRequest,
  SearchPayload,
  CommandResponse,
  ActiveTransferResponse,
  LoanProductAttribute,
  CreateLoanProductAttributeRequest,
  UpdateLoanProductAttributeRequest,
  JournalEntry,
  OwnerListResponse,
  TransferListResponse,
} from "../types/externalAssetOwner";

export async function fetchExternalAssetOwners(): Promise<ExternalAssetOwner[]> {
  const { data } = await api.get<ExternalAssetOwner[] | OwnerListResponse>("/external-asset-owners");
  if (Array.isArray(data)) return data;
  return data.pageItems ?? [];
}

export async function createExternalAssetOwner(payload: CreateOwnerRequest): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>("/external-asset-owners", payload);
  return data;
}

export async function fetchTransfers(params?: {
  transferExternalId?: string;
  loanId?: number;
  loanExternalId?: string;
}): Promise<ExternalAssetOwnerTransfer[]> {
  const { data } = await api.get<ExternalAssetOwnerTransfer[] | TransferListResponse>(
    "/external-asset-owners/transfers",
    { params },
  );
  if (Array.isArray(data)) return data;
  return data.pageItems ?? [];
}

export async function fetchActiveTransfer(loanId: number): Promise<ActiveTransferResponse | null> {
  try {
    const { data } = await api.get<ActiveTransferResponse>(
      "/external-asset-owners/transfers/active-transfer",
      { params: { loanId } },
    );
    return data;
  } catch {
    return null;
  }
}

export async function executeTransferByLoanId(
  loanId: number,
  command: string,
  payload?: SaleTransferRequest | BuybackTransferRequest,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(
    `/external-asset-owners/transfers/loans/${loanId}`,
    payload ?? {},
    { params: { command } },
  );
  return data;
}

export async function executeTransferByLoanExternalId(
  loanExternalId: string,
  command: string,
  payload?: SaleTransferRequest | BuybackTransferRequest,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(
    `/external-asset-owners/transfers/loans/external-id/${loanExternalId}`,
    payload ?? {},
    { params: { command } },
  );
  return data;
}

export async function executeTransferById(
  transferId: number,
  command: string,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(
    `/external-asset-owners/transfers/${transferId}`,
    {},
    { params: { command } },
  );
  return data;
}

export async function executeTransferByExternalId(
  externalId: string,
  command: string,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(
    `/external-asset-owners/transfers/external-id/${externalId}`,
    {},
    { params: { command } },
  );
  return data;
}

export async function searchTransfers(payload: SearchPayload): Promise<ExternalAssetOwnerTransfer[]> {
  const { data } = await api.post<TransferListResponse>("/external-asset-owners/search", payload);
  return data.pageItems ?? [];
}

export async function fetchLoanProductAttributes(
  loanProductId: number,
  attributeKey?: string,
): Promise<LoanProductAttribute[]> {
  const params: Record<string, string> = {};
  if (attributeKey) params.attributeKey = attributeKey;
  const { data } = await api.get<LoanProductAttribute[]>(
    `/external-asset-owners/loan-product/${loanProductId}/attributes`,
    { params },
  );
  return data;
}

export async function createLoanProductAttribute(
  loanProductId: number,
  payload: CreateLoanProductAttributeRequest,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(
    `/external-asset-owners/loan-product/${loanProductId}/attributes`,
    payload,
  );
  return data;
}

export async function updateLoanProductAttribute(
  loanProductId: number,
  attributeId: number,
  payload: UpdateLoanProductAttributeRequest,
): Promise<CommandResponse> {
  const { data } = await api.put<CommandResponse>(
    `/external-asset-owners/loan-product/${loanProductId}/attributes/${attributeId}`,
    payload,
  );
  return data;
}

export async function fetchJournalEntriesByTransfer(
  transferId: number,
): Promise<JournalEntry[]> {
  const { data } = await api.get<JournalEntry[]>(
    `/external-asset-owners/transfers/${transferId}/journal-entries`,
  );
  return data;
}

export async function fetchJournalEntriesByOwner(
  ownerExternalId: string,
): Promise<JournalEntry[]> {
  const { data } = await api.get<JournalEntry[]>(
    `/external-asset-owners/owners/external-id/${ownerExternalId}/journal-entries`,
  );
  return data;
}
