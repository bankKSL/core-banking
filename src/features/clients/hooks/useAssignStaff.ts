import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignStaff } from "../api/client";
import { clientKeys } from "./useClients";

/**
 * Mutation hook — assigns a loan officer to a client.
 * Invalidates the client's detail query on success.
 */
export function useAssignStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, staffId }: { clientId: number | string; staffId: number }) =>
      assignStaff(clientId, { staffId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.clientId) });
    },
  });
}
