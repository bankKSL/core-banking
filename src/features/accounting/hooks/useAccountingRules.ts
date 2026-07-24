import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAccountingRules,
  fetchAccountingRule,
  fetchAccountingRuleTemplate,
  createAccountingRule,
  updateAccountingRule,
  deleteAccountingRule,
} from "../api/accounting";
import type { CreateAccountingRuleRequest } from "../types/accounting";

export const accountingRuleKeys = {
  all: ["accountingrules"] as const,
  list: ["accountingrules", "list"] as const,
  detail: (id: number | string) => ["accountingrules", "detail", id] as const,
  template: ["accountingrules", "template"] as const,
};

export function useAccountingRules() {
  return useQuery({
    queryKey: accountingRuleKeys.list,
    queryFn: () => fetchAccountingRules(),
    staleTime: 60_000,
  });
}

export function useAccountingRule(id: number | string | undefined, template = false) {
  return useQuery({
    queryKey: [...accountingRuleKeys.detail(id!), { template }],
    queryFn: () => fetchAccountingRule(id!, template),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useAccountingRuleTemplate() {
  return useQuery({
    queryKey: accountingRuleKeys.template,
    queryFn: () => fetchAccountingRuleTemplate(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateAccountingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountingRuleRequest) => createAccountingRule(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountingRuleKeys.all });
    },
  });
}

export function useUpdateAccountingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Partial<CreateAccountingRuleRequest> }) =>
      updateAccountingRule(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountingRuleKeys.all });
    },
  });
}

export function useDeleteAccountingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteAccountingRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountingRuleKeys.all });
    },
  });
}
