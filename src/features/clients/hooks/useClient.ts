import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "../api/client";
import { clientKeys } from "./useClients";

/**
 * Query hook for fetching a single client's full details.
 */
export function useClient(clientId: number | string | undefined) {
  return useQuery({
    queryKey: clientKeys.detail(clientId!),
    queryFn: () => fetchClient(clientId!),
    enabled: !!clientId,
    staleTime: 60_000,
  });
}
