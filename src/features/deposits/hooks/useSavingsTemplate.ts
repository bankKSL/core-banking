import { useQuery } from "@tanstack/react-query";
import { fetchSavingsAccountTemplate } from "../api/deposit";
import { depositKeys } from "./useSavingsAccounts";

export function useSavingsTemplate(clientId?: number, productId?: number) {
  return useQuery({
    queryKey: [...depositKeys.savingsTemplate, clientId, productId],
    queryFn: () => fetchSavingsAccountTemplate(clientId, productId),
    staleTime: 5 * 60_000,
  });
}
