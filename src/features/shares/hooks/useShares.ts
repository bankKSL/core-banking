import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchShareProducts,
  fetchShareProduct,
  fetchShareProductTemplate,
  createShareProduct,
  updateShareProduct,
  fetchShareAccounts,
  fetchShareAccount,
  fetchShareAccountTemplate,
  createShareAccount,
  updateShareAccount,
  shareAccountCommand,
  fetchDividends,
  createDividend,
  approveDividend,
  deleteDividend,
} from "../api/shares";
import { SHARES_PAGE_SIZE } from "../constants";

export const shareKeys = {
  all: ["shares"] as const,
  productList: (params?: { offset?: number; limit?: number }) =>
    [...shareKeys.all, "product", "list", params] as const,
  productDetail: (id: number) => [...shareKeys.all, "product", "detail", id] as const,
  productTemplate: () => [...shareKeys.all, "product", "template"] as const,
  accountList: () => [...shareKeys.all, "account", "list"] as const,
  accountDetail: (id: number) => [...shareKeys.all, "account", "detail", id] as const,
  accountTemplate: () => [...shareKeys.all, "account", "template"] as const,
  dividendList: (productId: number) => [...shareKeys.all, "dividend", productId] as const,
};

export function useShareProducts(params?: { offset?: number; limit?: number }) {
  const resolvedParams = { limit: SHARES_PAGE_SIZE, offset: 0, ...params };
  return useQuery({
    queryKey: shareKeys.productList(resolvedParams),
    queryFn: () => fetchShareProducts(resolvedParams),
    placeholderData: (prev) => prev,
  });
}

export function useShareProduct(id: number | undefined) {
  return useQuery({
    queryKey: shareKeys.productDetail(id!),
    queryFn: () => fetchShareProduct(id!),
    enabled: !!id,
  });
}

export function useShareProductTemplate() {
  return useQuery({
    queryKey: shareKeys.productTemplate(),
    queryFn: fetchShareProductTemplate,
  });
}

export function useCreateShareProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createShareProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareKeys.productList() });
    },
  });
}

export function useUpdateShareProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateShareProduct(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shareKeys.productList() });
      queryClient.invalidateQueries({ queryKey: shareKeys.productDetail(id) });
    },
  });
}

export function useShareAccounts() {
  return useQuery({
    queryKey: shareKeys.accountList(),
    queryFn: fetchShareAccounts,
    placeholderData: (prev) => prev,
  });
}

export function useShareAccount(id: number | undefined) {
  return useQuery({
    queryKey: shareKeys.accountDetail(id!),
    queryFn: () => fetchShareAccount(id!),
    enabled: !!id,
  });
}

export function useShareAccountTemplate(clientId?: number, productId?: number) {
  return useQuery({
    queryKey: [...shareKeys.accountTemplate(), { clientId, productId }] as const,
    queryFn: () => fetchShareAccountTemplate(clientId, productId),
  });
}

export function useCreateShareAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createShareAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareKeys.accountList() });
    },
  });
}

export function useUpdateShareAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateShareAccount(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: shareKeys.accountList() });
      queryClient.invalidateQueries({ queryKey: shareKeys.accountDetail(id) });
    },
  });
}

export function useShareAccountCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      command,
      payload,
    }: {
      accountId: number;
      command: string;
      payload?: Record<string, unknown>;
    }) => shareAccountCommand(accountId, command, payload),
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: shareKeys.all });
      queryClient.invalidateQueries({ queryKey: shareKeys.accountDetail(accountId) });
    },
  });
}

export function useDividends(productId: number | undefined) {
  return useQuery({
    queryKey: shareKeys.dividendList(productId!),
    queryFn: () => fetchDividends(productId!),
    enabled: !!productId,
  });
}

export function useCreateDividend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: number;
      payload: Record<string, unknown>;
    }) => createDividend(productId, payload),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: shareKeys.dividendList(productId) });
    },
  });
}

export function useApproveDividend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      dividendId,
    }: {
      productId: number;
      dividendId: number;
    }) => approveDividend(productId, dividendId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: shareKeys.dividendList(productId) });
    },
  });
}

export function useDeleteDividend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      dividendId,
    }: {
      productId: number;
      dividendId: number;
    }) => deleteDividend(productId, dividendId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: shareKeys.dividendList(productId) });
    },
  });
}
