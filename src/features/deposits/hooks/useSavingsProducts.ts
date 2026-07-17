import { useQuery } from "@tanstack/react-query";
import { fetchSavingsProducts, fetchSavingsProduct } from "../api/deposit";
import { depositKeys } from "./useSavingsAccounts";

export function useSavingsProducts() {
    return useQuery({
        queryKey: depositKeys.savingsProducts,
        queryFn: () => fetchSavingsProducts(),
        staleTime: 5 * 60_000,
    });
}

export function useSavingsProduct(productId: number | undefined) {
    return useQuery({
        queryKey: depositKeys.savingsProduct(productId!),
        queryFn: () => fetchSavingsProduct(productId!),
        enabled: !!productId,
        staleTime: 5 * 60_000,
    });
}
