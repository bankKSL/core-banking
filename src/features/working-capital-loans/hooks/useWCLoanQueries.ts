import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchWCLoanProducts,
  fetchWCLoanProduct,
  fetchWCLoanProductTemplate,
  createWCLoanProduct,
  updateWCLoanProduct,
  deleteWCLoanProduct,
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
  executeStateTransition,
  updateWCLoan,
  deleteWCLoan,
  markWCLoanAsFraud,
  updateWCDiscount,
  executeWCTransactionCommand,
  undoWCTransaction,
  fetchWCLoanCommandTemplate,
  fetchWCLoanCharges,
  createWCLoanCharge,
  adjustWCLoanCharge,
  createBreachAction,
  createNearBreachAction,
  fetchBreachActions,
  fetchNearBreachActions,
  fetchBreachSchedule,
  fetchBreachConfigs,
  createBreachConfig,
  updateBreachConfig,
  deleteBreachConfig,
  fetchNearBreachConfigs,
  createNearBreachConfig,
  updateNearBreachConfig,
  deleteNearBreachConfig,
} from "../api/workingCapitalLoan";
import type {
  WCLoanListParams,
  WCLoanProductCreateRequest,
  WCLoanCreateRequest,
  WCLoanCommandRequest,
  RepaymentRequest,
  DelinquencyActionRequest,
  RateChangeRequest,
  MarkAsFraudRequest,
  UpdateDiscountRequest,
  WCTransactionCommand,
  UndoTransactionRequest,
  WCTemplateType,
  CreateLoanChargeRequest,
  ChargeAdjustmentRequest,
  BreachActionRequest,
  NearBreachActionRequest,
  WCBreachConfigRequest,
  WCNearBreachConfigRequest,
} from "../types/workingCapitalLoan";

export const wcLoanKeys = {
  all: ["wc-loans"] as const,
  list: (params: WCLoanListParams) => ["wc-loans", "list", params] as const,
  lists: () => ["wc-loans", "list"] as const,
  detail: (id: number | string) => ["wc-loans", "detail", id] as const,
  template: ["wc-loans", "template"] as const,
  products: ["wc-loans", "products"] as const,
  product: (id: number) => ["wc-loans", "product", id] as const,
  productTemplate: ["wc-loans", "productTemplate"] as const,
  amortizationSchedule: (id: number) => ["wc-loans", "amortizationSchedule", id] as const,
  delinquencyRangeSchedule: (id: number) => ["wc-loans", "delinquencyRangeSchedule", id] as const,
  breachSchedule: (id: number) => ["wc-loans", "breachSchedule", id] as const,
  delinquencyTags: (id: number) => ["wc-loans", "delinquencyTags", id] as const,
  transactions: (id: number) => ["wc-loans", "transactions", id] as const,
  rateChanges: (id: number) => ["wc-loans", "rateChanges", id] as const,
  delinquencyBuckets: ["wc-loans", "delinquencyBuckets"] as const,
  charges: (id: number) => ["wc-loans", "charges", id] as const,
  commandTemplate: (id: number, templateType: string) =>
    ["wc-loans", "commandTemplate", id, templateType] as const,
  breachActions: (id: number) => ["wc-loans", "breachActions", id] as const,
  nearBreachActions: (id: number) => ["wc-loans", "nearBreachActions", id] as const,
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

export function useUpdateWCLoanProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: Partial<WCLoanProductCreateRequest> }) =>
      updateWCLoanProduct(productId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.products });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.product(variables.productId) });
    },
  });
}

export function useDeleteWCLoanProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => deleteWCLoanProduct(productId),
    onSuccess: (_data, productId) => {
      queryClient.removeQueries({ queryKey: wcLoanKeys.product(productId) });
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

// ─── Hooks below derived from docs/WCLoan.md §10 (targeted invalidation) ───

function useInvalidateLoanDetail() {
  const queryClient = useQueryClient();
  return (loanId: number, extra: "transactions" | "amortization" | "charges" | null = null) => {
    // Monetary mutations can flip status via balance-driven transitions: refetch whole detail.
    queryClient.invalidateQueries({ queryKey: wcLoanKeys.detail(loanId) });
    queryClient.invalidateQueries({ queryKey: wcLoanKeys.lists() });
    if (extra === "transactions") {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.transactions(loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.delinquencyRangeSchedule(loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.breachSchedule(loanId) });
    }
    if (extra === "amortization") {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.amortizationSchedule(loanId) });
    }
    if (extra === "charges") {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.charges(loanId) });
    }
  };
}

export function useStateTransitionMutation() {
  const invalidate = useInvalidateLoanDetail();
  return useMutation({
    mutationFn: ({
      loanId,
      command,
      payload,
    }: {
      loanId: number;
      command: "approve" | "reject" | "undoapproval" | "disburse" | "undodisbursal";
      payload?: object;
    }) => executeStateTransition(loanId, command, payload ?? {}),
    onSuccess: (_data, variables) => invalidate(variables.loanId),
  });
}

export function useRejectWCLoan() {
  return useStateTransitionMutation();
}

export function useUndoApprovalWCLoan() {
  return useStateTransitionMutation();
}

export function useUndoDisbursalWCLoan() {
  return useStateTransitionMutation();
}

export function useUpdateWCLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: Partial<WCLoanCreateRequest> }) =>
      updateWCLoan(loanId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.lists() });
    },
  });
}

export function useDeleteWCLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (loanId: number) => deleteWCLoan(loanId),
    onSuccess: (_data, loanId) => {
      queryClient.removeQueries({ queryKey: wcLoanKeys.detail(loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.lists() });
    },
  });
}

export function useMarkAsFraudMutation() {
  const invalidate = useInvalidateLoanDetail();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: MarkAsFraudRequest }) =>
      markWCLoanAsFraud(loanId, payload),
    onSuccess: (_data, variables) => invalidate(variables.loanId),
  });
}

export function useUpdateDiscountMutation() {
  const invalidate = useInvalidateLoanDetail();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: UpdateDiscountRequest }) =>
      updateWCDiscount(loanId, payload),
    onSuccess: (_data, variables) => invalidate(variables.loanId),
  });
}

type TransactionCommandPayload = Record<string, unknown>;

export function useWCTransactionCommandMutation() {
  const invalidate = useInvalidateLoanDetail();
  return useMutation({
    mutationFn: ({
      loanId,
      command,
      payload,
    }: {
      loanId: number;
      command: WCTransactionCommand;
      payload?: TransactionCommandPayload;
    }) => executeWCTransactionCommand(loanId, command, payload ?? {}),
    onSuccess: (_data, variables) => {
      invalidate(variables.loanId, "transactions");
      invalidate(variables.loanId, "amortization");
    },
  });
}

export function useUndoWCTransactionMutation() {
  const invalidate = useInvalidateLoanDetail();
  return useMutation({
    mutationFn: ({ loanId, transactionId, payload }: { loanId: number; transactionId: number; payload?: UndoTransactionRequest }) =>
      undoWCTransaction(loanId, transactionId, payload ?? {}),
    onSuccess: (_data, variables) => {
      invalidate(variables.loanId, "transactions");
      invalidate(variables.loanId, "amortization");
    },
  });
}

export function useWCCommandTemplateQuery(loanId: number | undefined, templateType: WCTemplateType) {
  return useQuery({
    queryKey: wcLoanKeys.commandTemplate(loanId!, templateType),
    queryFn: () => fetchWCLoanCommandTemplate(loanId!, templateType),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useWCLoanChargesQuery(loanId: number | undefined) {
  return useQuery({
    queryKey: wcLoanKeys.charges(loanId!),
    queryFn: () => fetchWCLoanCharges(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}

export function useCreateLoanChargeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: CreateLoanChargeRequest }) =>
      createWCLoanCharge(loanId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.charges(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.detail(variables.loanId) });
    },
  });
}

export function useAdjustLoanChargeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      loanChargeId,
      payload,
    }: {
      loanId: number;
      loanChargeId: number;
      payload: ChargeAdjustmentRequest;
    }) => adjustWCLoanCharge(loanId, loanChargeId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.charges(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: wcLoanKeys.detail(variables.loanId) });
    },
  });
}

export function useBreachActionsQuery(loanId: number | undefined) {
  return useQuery({
    queryKey: wcLoanKeys.breachActions(loanId!),
    queryFn: () => fetchBreachActions(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}

export function useNearBreachActionsQuery(loanId: number | undefined) {
  return useQuery({
    queryKey: wcLoanKeys.nearBreachActions(loanId!),
    queryFn: () => fetchNearBreachActions(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}

export function useBreachScheduleQuery(loanId: number | undefined) {
  return useQuery({
    queryKey: wcLoanKeys.breachSchedule(loanId!),
    queryFn: () => fetchBreachSchedule(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}

export function useBreachActionMutation() {
  const invalidate = useInvalidateLoanDetail();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: BreachActionRequest }) =>
      createBreachAction(loanId, payload),
    onSuccess: (_data, variables) => {
      invalidate(variables.loanId);
      invalidate(variables.loanId, "amortization");
    },
  });
}

export function useNearBreachActionMutation() {
  const invalidate = useInvalidateLoanDetail();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: NearBreachActionRequest }) =>
      createNearBreachAction(loanId, payload),
    onSuccess: (_data, variables) => invalidate(variables.loanId),
  });
}

// ─── Configuration CRUD hooks (docs/WCLoan.md §3.5) ───

const breachConfigKeys = {
  all: ["wc-breach-configs"] as const,
};
const nearBreachConfigKeys = {
  all: ["wc-near-breach-configs"] as const,
};

export function useBreachConfigs() {
  return useQuery({
    queryKey: breachConfigKeys.all,
    queryFn: fetchBreachConfigs,
    staleTime: 60_000,
  });
}

export function useCreateBreachConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WCBreachConfigRequest) => createBreachConfig(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: breachConfigKeys.all }),
  });
}

export function useUpdateBreachConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ breachId, payload }: { breachId: number; payload: Partial<WCBreachConfigRequest> }) =>
      updateBreachConfig(breachId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: breachConfigKeys.all }),
  });
}

export function useDeleteBreachConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (breachId: number) => deleteBreachConfig(breachId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: breachConfigKeys.all }),
  });
}

export function useNearBreachConfigs() {
  return useQuery({
    queryKey: nearBreachConfigKeys.all,
    queryFn: fetchNearBreachConfigs,
    staleTime: 60_000,
  });
}

export function useCreateNearBreachConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WCNearBreachConfigRequest) => createNearBreachConfig(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: nearBreachConfigKeys.all }),
  });
}

export function useUpdateNearBreachConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nearBreachId, payload }: { nearBreachId: number; payload: Partial<WCNearBreachConfigRequest> }) =>
      updateNearBreachConfig(nearBreachId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: nearBreachConfigKeys.all }),
  });
}

export function useDeleteNearBreachConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nearBreachId: number) => deleteNearBreachConfig(nearBreachId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: nearBreachConfigKeys.all }),
  });
}
