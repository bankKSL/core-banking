import { useQuery } from "@tanstack/react-query";
import { fetchFixedDepositProducts, fetchFixedDepositProduct } from "../api/deposit";
import { depositKeys } from "./useSavingsAccounts";

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