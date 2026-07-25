import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTellers, fetchTeller, createTeller, updateTeller, deleteTeller,
  fetchCashiers, fetchCashier, fetchCashierTemplate,
  createCashier, updateCashier, deleteCashier,
  allocateCash, settleCash, fetchCashierTransactions, fetchCashierSummary,
} from "../api/tellers";
import type { TellerCreateRequest, TellerUpdateRequest, CashierCreateRequest, CashierUpdateRequest, CashTxnRequest } from "../types/teller";

export const tellerKeys = {
  all: ["tellers"] as const,
  list: (officeId?: number) => ["tellers", "list", officeId] as const,
  detail: (id: number | string) => ["tellers", "detail", id] as const,
  cashiers: (id: number | string) => ["tellers", "cashiers", id] as const,
  cashier: (tellerId: number | string, cashierId: number | string) => ["tellers", "cashiers", tellerId, cashierId] as const,
  cashierTxns: (tellerId: number | string, cashierId: number | string) => ["tellers", "cashiers", tellerId, cashierId, "transactions"] as const,
  cashierSummary: (tellerId: number | string, cashierId: number | string) => ["tellers", "cashiers", tellerId, cashierId, "summary"] as const,
};

export function useTellers(officeId?: number) {
  return useQuery({ queryKey: tellerKeys.list(officeId), queryFn: () => fetchTellers(officeId), staleTime: 60_000 });
}

export function useTeller(tellerId: number | string | undefined) {
  return useQuery({ queryKey: tellerKeys.detail(tellerId!), queryFn: () => fetchTeller(tellerId!), enabled: !!tellerId, staleTime: 60_000 });
}

export function useCreateTeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TellerCreateRequest) => createTeller(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: tellerKeys.all }),
  });
}

export function useUpdateTeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tellerId, payload }: { tellerId: number | string; payload: TellerUpdateRequest }) => updateTeller(tellerId, payload),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: tellerKeys.all }); qc.invalidateQueries({ queryKey: tellerKeys.detail(v.tellerId) }); },
  });
}

export function useDeleteTeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tellerId: number | string) => deleteTeller(tellerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tellerKeys.all }),
  });
}

export function useCashiers(tellerId: number | string | undefined) {
  return useQuery({ queryKey: tellerKeys.cashiers(tellerId!), queryFn: () => fetchCashiers(tellerId!), enabled: !!tellerId });
}

export function useCashier(tellerId: number | string | undefined, cashierId: number | string | undefined) {
  return useQuery({
    queryKey: tellerKeys.cashier(tellerId!, cashierId!),
    queryFn: () => fetchCashier(tellerId!, cashierId!),
    enabled: !!tellerId && !!cashierId,
  });
}

export function useCashierTemplate(tellerId: number | string) {
  return useQuery({ queryKey: [...tellerKeys.detail(tellerId), "cashierTemplate"], queryFn: () => fetchCashierTemplate(tellerId), staleTime: 5 * 60_000 });
}

export function useCreateCashier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tellerId, payload }: { tellerId: number | string; payload: CashierCreateRequest }) => createCashier(tellerId, payload),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: tellerKeys.cashiers(v.tellerId) }),
  });
}

export function useUpdateCashier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tellerId, cashierId, payload }: { tellerId: number | string; cashierId: number | string; payload: CashierUpdateRequest }) => updateCashier(tellerId, cashierId, payload),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: tellerKeys.cashiers(v.tellerId) }),
  });
}

export function useDeleteCashier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tellerId, cashierId }: { tellerId: number | string; cashierId: number | string }) => deleteCashier(tellerId, cashierId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: tellerKeys.cashiers(v.tellerId) }),
  });
}

export function useAllocateCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tellerId, cashierId, payload }: { tellerId: number | string; cashierId: number | string; payload: CashTxnRequest }) => allocateCash(tellerId, cashierId, payload),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: tellerKeys.cashierTxns(v.tellerId, v.cashierId) }); qc.invalidateQueries({ queryKey: tellerKeys.cashierSummary(v.tellerId, v.cashierId) }); },
  });
}

export function useSettleCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tellerId, cashierId, payload }: { tellerId: number | string; cashierId: number | string; payload: CashTxnRequest }) => settleCash(tellerId, cashierId, payload),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: tellerKeys.cashierTxns(v.tellerId, v.cashierId) }); qc.invalidateQueries({ queryKey: tellerKeys.cashierSummary(v.tellerId, v.cashierId) }); },
  });
}

export function useCashierTransactions(tellerId: number | string | undefined, cashierId: number | string | undefined) {
  return useQuery({
    queryKey: tellerKeys.cashierTxns(tellerId!, cashierId!),
    queryFn: () => fetchCashierTransactions(tellerId!, cashierId!),
    enabled: !!tellerId && !!cashierId,
  });
}

export function useCashierSummary(tellerId: number | string | undefined, cashierId: number | string | undefined) {
  return useQuery({
    queryKey: tellerKeys.cashierSummary(tellerId!, cashierId!),
    queryFn: () => fetchCashierSummary(tellerId!, cashierId!),
    enabled: !!tellerId && !!cashierId,
  });
}
