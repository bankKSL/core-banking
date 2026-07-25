import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSavingsAccount } from "../api/client";
import { clientKeys } from "./useClients";

/**
 * Mutation hook — updates the default savings account for a client.
 * Invalidates the client's detail query on success.
 */
export function useUpdateSavingsAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, savingsAccountId }: { clientId: number | string; savingsAccountId: number }) =>
      updateSavingsAccount(clientId, { savingsAccountId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.clientId) });
      queryClient.invalidateQueries({
        queryKey: [...clientKeys.detail(variables.clientId), "accounts"],
      });
    },
  });
}
