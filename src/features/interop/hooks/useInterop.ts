import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  healthCheck,
  lookupParty,
  registerIdentifier,
  deleteIdentifier,
  fetchAccountDetails,
  fetchAccountTransactions,
  fetchAccountIdentifiers,
  fetchAccountKYC,
  createTransactionRequest,
  createQuote,
  executeTransfer,
  disburseLoan,
  loanRepayment,
} from "../api/interop";
import type {
  RegisterIdentifierRequest,
  TransactionRequestPayload,
  QuotePayload,
  TransferPayload,
  LoanDisburseRequest,
  LoanRepaymentRequest,
  InteropIdentifierType,
} from "../types/interop";

export const interopKeys = {
  all: ["interop"] as const,
  health: ["interop", "health"] as const,
  party: (idType?: string, idValue?: string, subIdOrType?: string) =>
    ["interop", "party", idType, idValue, subIdOrType] as const,
  account: {
    detail: (accountId?: string) => ["interop", "account", accountId] as const,
    transactions: (accountId?: string) => ["interop", "account", accountId, "transactions"] as const,
    identifiers: (accountId?: string) => ["interop", "account", accountId, "identifiers"] as const,
    kyc: (accountId?: string) => ["interop", "account", accountId, "kyc"] as const,
  },
};

export function useHealthCheck() {
  return useQuery({
    queryKey: interopKeys.health,
    queryFn: healthCheck,
    staleTime: 30_000,
  });
}

export function usePartyLookup(
  idType: string | undefined,
  idValue: string | undefined,
  subIdOrType?: string,
) {
  return useQuery({
    queryKey: interopKeys.party(idType, idValue, subIdOrType),
    queryFn: () => lookupParty(idType!, idValue!, subIdOrType),
    enabled: !!idType && !!idValue,
    staleTime: 30_000,
  });
}

export function useRegisterIdentifier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      idType,
      idValue,
      payload,
      subIdOrType,
    }: {
      idType: InteropIdentifierType | string;
      idValue: string;
      payload: RegisterIdentifierRequest;
      subIdOrType?: string;
    }) => registerIdentifier(idType, idValue, payload, subIdOrType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interopKeys.all });
    },
  });
}

export function useDeleteIdentifier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      idType,
      idValue,
      subIdOrType,
    }: {
      idType: InteropIdentifierType | string;
      idValue: string;
      subIdOrType?: string;
    }) => deleteIdentifier(idType, idValue, subIdOrType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interopKeys.all });
    },
  });
}

export function useAccountDetails(accountId: string | undefined) {
  return useQuery({
    queryKey: interopKeys.account.detail(accountId),
    queryFn: () => fetchAccountDetails(accountId!),
    enabled: !!accountId,
    staleTime: 60_000,
  });
}

export function useAccountTransactions(accountId: string | undefined) {
  return useQuery({
    queryKey: interopKeys.account.transactions(accountId),
    queryFn: () => fetchAccountTransactions(accountId!),
    enabled: !!accountId,
  });
}

export function useAccountIdentifiers(accountId: string | undefined) {
  return useQuery({
    queryKey: interopKeys.account.identifiers(accountId),
    queryFn: () => fetchAccountIdentifiers(accountId!),
    enabled: !!accountId,
  });
}

export function useAccountKYC(accountId: string | undefined) {
  return useQuery({
    queryKey: interopKeys.account.kyc(accountId),
    queryFn: () => fetchAccountKYC(accountId!),
    enabled: !!accountId,
  });
}

export function useCreateTransactionRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionRequestPayload) => createTransactionRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interopKeys.all });
    },
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuotePayload) => createQuote(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interopKeys.all });
    },
  });
}

export function useExecuteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      payload,
    }: {
      action: string;
      payload: TransferPayload;
    }) => executeTransfer(action, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interopKeys.all });
    },
  });
}

export function useDisburseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: string;
      payload: LoanDisburseRequest;
    }) => disburseLoan(accountId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interopKeys.all });
    },
  });
}

export function useLoanRepayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: string;
      payload: LoanRepaymentRequest;
    }) => loanRepayment(accountId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interopKeys.all });
    },
  });
}
