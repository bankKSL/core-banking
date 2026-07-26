import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchExternalAssetOwners,
  createExternalAssetOwner,
  fetchTransfers,
  fetchActiveTransfer,
  executeTransferByLoanId,
  executeTransferByLoanExternalId,
  executeTransferById,
  executeTransferByExternalId,
  searchTransfers,
  fetchLoanProductAttributes,
  createLoanProductAttribute,
  updateLoanProductAttribute,
  fetchJournalEntriesByTransfer,
  fetchJournalEntriesByOwner,
} from "../api/externalAssetOwners";
import type {
  CreateOwnerRequest,
  SaleTransferRequest,
  BuybackTransferRequest,
  SearchPayload,
  CreateLoanProductAttributeRequest,
  UpdateLoanProductAttributeRequest,
} from "../types/externalAssetOwner";

export const externalAssetOwnerKeys = {
  all: ["external-asset-owners"] as const,
  owners: {
    all: ["external-asset-owners", "owners"] as const,
    list: ["external-asset-owners", "owners", "list"] as const,
  },
  transfers: {
    all: ["external-asset-owners", "transfers"] as const,
    list: (params?: Record<string, unknown>) =>
      ["external-asset-owners", "transfers", "list", params] as const,
    active: (loanId?: number) =>
      ["external-asset-owners", "transfers", "active", loanId] as const,
    search: (payload?: SearchPayload) =>
      ["external-asset-owners", "transfers", "search", payload] as const,
  },
  attributes: {
    all: (loanProductId?: number) =>
      ["external-asset-owners", "attributes", loanProductId] as const,
    list: (loanProductId?: number, attributeKey?: string) =>
      ["external-asset-owners", "attributes", "list", loanProductId, attributeKey] as const,
  },
  journalEntries: {
    byTransfer: (transferId?: number) =>
      ["external-asset-owners", "journal-entries", "transfer", transferId] as const,
    byOwner: (ownerExternalId?: string) =>
      ["external-asset-owners", "journal-entries", "owner", ownerExternalId] as const,
  },
};

export function useExternalAssetOwners() {
  return useQuery({
    queryKey: externalAssetOwnerKeys.owners.list,
    queryFn: fetchExternalAssetOwners,
    staleTime: 60_000,
  });
}

export function useCreateExternalAssetOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOwnerRequest) => createExternalAssetOwner(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: externalAssetOwnerKeys.owners.all });
    },
  });
}

export function useTransfers(params?: {
  transferExternalId?: string;
  loanId?: number;
  loanExternalId?: string;
}) {
  return useQuery({
    queryKey: externalAssetOwnerKeys.transfers.list(params as Record<string, unknown>),
    queryFn: () => fetchTransfers(params),
    staleTime: 60_000,
  });
}

export function useActiveTransfer(loanId: number | undefined) {
  return useQuery({
    queryKey: externalAssetOwnerKeys.transfers.active(loanId),
    queryFn: () => fetchActiveTransfer(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useExecuteTransferByLoanId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      command,
      payload,
    }: {
      loanId: number;
      command: string;
      payload?: SaleTransferRequest | BuybackTransferRequest;
    }) => executeTransferByLoanId(loanId, command, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: externalAssetOwnerKeys.transfers.all });
    },
  });
}

export function useExecuteTransferByLoanExternalId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanExternalId,
      command,
      payload,
    }: {
      loanExternalId: string;
      command: string;
      payload?: SaleTransferRequest | BuybackTransferRequest;
    }) => executeTransferByLoanExternalId(loanExternalId, command, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: externalAssetOwnerKeys.transfers.all });
    },
  });
}

export function useExecuteTransferById() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      transferId,
      command,
    }: {
      transferId: number;
      command: string;
    }) => executeTransferById(transferId, command),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: externalAssetOwnerKeys.transfers.all });
    },
  });
}

export function useExecuteTransferByExternalId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      externalId,
      command,
    }: {
      externalId: string;
      command: string;
    }) => executeTransferByExternalId(externalId, command),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: externalAssetOwnerKeys.transfers.all });
    },
  });
}

export function useSearchTransfers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SearchPayload) => searchTransfers(payload),
    onSuccess: (data, variables) => {
      qc.setQueryData(
        externalAssetOwnerKeys.transfers.search(variables),
        data,
      );
    },
  });
}

export function useLoanProductAttributes(
  loanProductId: number | undefined,
  attributeKey?: string,
) {
  return useQuery({
    queryKey: externalAssetOwnerKeys.attributes.list(loanProductId, attributeKey),
    queryFn: () => fetchLoanProductAttributes(loanProductId!, attributeKey),
    enabled: !!loanProductId,
    staleTime: 60_000,
  });
}

export function useCreateLoanProductAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanProductId,
      payload,
    }: {
      loanProductId: number;
      payload: CreateLoanProductAttributeRequest;
    }) => createLoanProductAttribute(loanProductId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: externalAssetOwnerKeys.attributes.all(variables.loanProductId),
      });
    },
  });
}

export function useUpdateLoanProductAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanProductId,
      attributeId,
      payload,
    }: {
      loanProductId: number;
      attributeId: number;
      payload: UpdateLoanProductAttributeRequest;
    }) => updateLoanProductAttribute(loanProductId, attributeId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: externalAssetOwnerKeys.attributes.all(variables.loanProductId),
      });
    },
  });
}

export function useJournalEntriesByTransfer(transferId: number | undefined) {
  return useQuery({
    queryKey: externalAssetOwnerKeys.journalEntries.byTransfer(transferId),
    queryFn: () => fetchJournalEntriesByTransfer(transferId!),
    enabled: !!transferId,
  });
}

export function useJournalEntriesByOwner(ownerExternalId: string | undefined) {
  return useQuery({
    queryKey: externalAssetOwnerKeys.journalEntries.byOwner(ownerExternalId),
    queryFn: () => fetchJournalEntriesByOwner(ownerExternalId!),
    enabled: !!ownerExternalId,
  });
}
