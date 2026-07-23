import { useQuery } from "@tanstack/react-query";
import { fetchClientAccounts } from "../api/client";
import { clientKeys } from "./useClients";

export function useClientAccounts(clientId: number | string | undefined) {
  return useQuery({
    queryKey: [...clientKeys.detail(clientId!), "accounts"],
    queryFn: () => fetchClientAccounts(clientId!),
    enabled: !!clientId,
    staleTime: 30_000,
  });
}
