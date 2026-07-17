import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSavingsAccount } from "../api/deposit";
import type { SavingsAccountCreateRequest } from "../types/deposit";
import { depositKeys } from "./useSavingsAccounts";

export function useCreateSavingsAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: SavingsAccountCreateRequest) => createSavingsAccount(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: depositKeys.all });
        },
    });
}
