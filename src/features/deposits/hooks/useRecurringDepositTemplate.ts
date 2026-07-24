import { useQuery } from "@tanstack/react-query";
import { fetchRecurringDepositAccountTemplate } from "../api/deposit";
import { depositKeys } from "./useSavingsAccounts";

export function useRecurringDepositTemplate(params: { clientId?: number; groupId?: number; productId?: number }) {
  const enabled = !!(params.clientId || params.groupId);
  return useQuery({
    queryKey: [...depositKeys.all, "recurring", "template", params] as const,
    queryFn: () => fetchRecurringDepositAccountTemplate(params),
    enabled,
    staleTime: 30_000,
  });
}
