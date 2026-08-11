import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchWCLoanProducts,
  fetchWCLoanProduct,
  fetchWCLoanProductTemplate,
  createWCLoanProduct,
  fetchWCLoans,
  fetchWCLoan,
  fetchWCLoanTemplate,
  createWCLoan,
  approveWCLoan,
  disburseWCLoan,
  makeWCRepayment,
  fetchAmortizationSchedule,
  fetchDelinquencyRangeSchedule,
  fetchDelinquencyTags,
  fetchWCLoanTransactions,
  createDelinquencyAction,
  updatePaymentRate,
  fetchRateChangeHistory,
  fetchDelinquencyBuckets,
} from "../api/workingCapitalLoan";
import type {
  WCLoanListParams,
  WCLoanCreateRequest,
  WCLoanCommandRequest,
  RepaymentRequest,
  DelinquencyActionRequest,
  RateChangeRequest,
} from "../types/workingCapitalLoan";

export const wcLoanKeys = {
  all: ["wc-loans"] as const,
  list: (params: WCLoanListParams) => ["wc-loans", "list", params] as const,
  detail: (id: number | string) => ["wc-loans", "detail", id] as const,
  template: ["wc-loans", "template"] as const,
  products: ["wc-loans", "products"] as const,
  product: (id: number) => ["wc-loans", "product", id] as const,
  productTemplate: ["wc-loans", "productTemplate"] as const,
  amortizationSchedule: (id: number) => ["wc-loans", "amortizationSchedule", id] as const,
  delinquencyRangeSchedule: (id: number) => ["wc-loans", "delinquencyRangeSchedule", id] as const,
  delinquencyTags: (id: number) => ["wc-loans", "delinquencyTags", id] as const,
  transactions: (id: number) => ["wc-loans", "transactions", id] as const,
  rateChanges: (id: number) => ["wc-loans", "rateChanges", id] as const,
  delinquencyBuckets: ["wc-loans", "delinquencyBuckets"] as const,
};

export function useDelinquencyBuckets() {
  return useQuery({
    queryKey: wcLoanKeys.delinquencyBuckets,
    queryFn: fetchDelinquencyBuckets,
    staleTime: 5 * 60_000,
  });
}

export function useWCLoanProducts() {
  return useQuery({
    queryKey: wcLoanKeys.products,
    queryFn: fetchWCLoanProducts,
    staleTime: 60_000,
  });
}

export function useWCLoanProduct(productId: number | undefined) {
  return useQuery({
    queryKey: wcLoanKeys.product(productId!),
    queryFn: () => fetchWCLoanProduct(productId!),
    enabled: !!productId,
    staleTime: 60_000,
  });
}

export function useWCLoanProductTemplate() {
  return useQuery({
    queryKey: wcLoanKeys.productTemplate,
    queryFn: fetchWCLoanProductTemplate,
    staleTime: 5 * 60_000,
  });
}

export function useCreateWCLoanProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createWCLoanProduct>[0]) => createWCLoanProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.products });
    },
  });
}

export function useWCLoans(params: WCLoanListParams = {}) {
  return useQuery({
    queryKey: wcLoanKeys.list(params),
    queryFn: () => fetchWCLoans(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useWCLoan(loanId: number | string | undefined) {
  return useQuery({
    queryKey: wcLoanKeys.detail(loanId!),
    queryFn: () => fetchWCLoan(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}

export function useWCLoanTemplate(clientId?: number, productId?: number) {
  return useQuery({
    queryKey: [...wcLoanKeys.template, clientId, productId],
    queryFn: () => fetchWCLoanTemplate(clientId, productId),
    enabled: !!clientId || !!productId,
    staleTime: 60_000,
  });
}

export function useCreateWCLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WCLoanCreateRequest) => createWCLoan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.all });
    },
  });
}

export function useApproveWCLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: WCLoanCommandRequest }) =>
      approveWCLoan(loanId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.list({}) });
    },
  });
}

export function useDisburseWCLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: WCLoanCommandRequest }) =>
      disburseWCLoan(loanId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.list({}) });
    },
  });
}

export function useWCRepayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: RepaymentRequest }) =>
      makeWCRepayment(loanId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.transactions(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.delinquencyRangeSchedule(variables.loanId) });
    },
  });
}

export function useAmortizationSchedule(loanId: number | undefined) {
  return useQuery({
    queryKey: wcLoanKeys.amortizationSchedule(loanId!),
    queryFn: () => fetchAmortizationSchedule(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}

export function useDelinquencyRangeSchedule(loanId: number | undefined) {
  return useQuery({
    queryKey: wcLoanKeys.delinquencyRangeSchedule(loanId!),
    queryFn: () => fetchDelinquencyRangeSchedule(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}

export function useWCDelinquencyTags(loanId: number | undefined) {
  return useQuery({
    queryKey: wcLoanKeys.delinquencyTags(loanId!),
    queryFn: () => fetchDelinquencyTags(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}

export function useWCLoanTransactions(loanId: number | undefined) {
  return useQuery({
    queryKey: wcLoanKeys.transactions(loanId!),
    queryFn: () => fetchWCLoanTransactions(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}

export function useCreateDelinquencyAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: DelinquencyActionRequest }) =>
      createDelinquencyAction(loanId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.delinquencyRangeSchedule(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.amortizationSchedule(variables.loanId) });
    },
  });
}

export function useUpdatePaymentRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: RateChangeRequest }) =>
      updatePaymentRate(loanId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.rateChanges(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.amortizationSchedule(variables.loanId) });
    },
  });
}

export function useRateChangeHistory(loanId: number | undefined) {
  return useQuery({
    queryKey: wcLoanKeys.rateChanges(loanId!),
    queryFn: () => fetchRateChangeHistory(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}
