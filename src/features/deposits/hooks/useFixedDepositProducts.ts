import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFixedDepositProducts, fetchFixedDepositProduct, createFixedDepositProduct, updateFixedDepositProduct } from "../api/deposit";
import { depositKeys } from "./useSavingsAccounts";
import type { FixedDepositProductCreateRequest } from "../types/deposit";

export function useFixedDepositProducts() {
    return useQuery({
        queryKey: [...depositKeys.all, "fdProducts"],
        queryFn: () => fetchFixedDepositProducts(),
        staleTime: 5 * 60_000,
    });
}

export function useFixedDepositProduct(productId: number | undefined) {
    return useQuery({
        queryKey: [...depositKeys.all, "fdProduct", productId],
        queryFn: () => fetchFixedDepositProduct(productId!),
        enabled: !!productId,
        staleTime: 5 * 60_000,
    });
}

export function useCreateFixedDepositProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: FixedDepositProductCreateRequest) => createFixedDepositProduct(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...depositKeys.all, "fdProducts"] });
        },
    });
}

export function useUpdateFixedDepositProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ productId, payload }: { productId: number; payload: Partial<FixedDepositProductCreateRequest> }) =>
            updateFixedDepositProduct(productId, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...depositKeys.all, "fdProducts"] });
        },
    });
}