import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchLoans } from "../api/loan";
import type { LoanListParams } from "../types/loan";
import { LOANS_PAGE_SIZE } from "../constants/status";

export const loanKeys = {
    all: ["loans"] as const,
    list: (params: LoanListParams) => ["loans", "list", params] as const,
    detail: (id: number | string) => ["loans", "detail", id] as const,
    template: ["loans", "template"] as const,
    products: ["loans", "products"] as const,
    product: (id: number) => ["loans", "product", id] as const,
    schedule: (id: number) => ["loans", "schedule", id] as const,
    repaymentTemplate: (id: number) => ["loans", "repaymentTemplate", id] as const,
};

export function useLoans(params: LoanListParams = {}) {
    const resolvedParams: LoanListParams = { limit: LOANS_PAGE_SIZE, offset: 0, ...params };
    return useQuery({
        queryKey: loanKeys.list(resolvedParams),
        queryFn: () => fetchLoans(resolvedParams),
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });
}
