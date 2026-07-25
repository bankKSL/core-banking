import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unassignStaff } from "../api/client";
import { clientKeys } from "./useClients";

/**
 * Mutation hook — removes the currently assigned staff from a client.
 * Invalidates the client's detail query on success.
 */
export function useUnassignStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, staffId }: { clientId: number | string; staffId: number }) =>
      unassignStaff(clientId, { staffId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.clientId) });
    },
  });
}
