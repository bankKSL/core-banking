import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchClients } from "../api/client";
import type { ClientListParams } from "../types/client";
import { CLIENTS_PAGE_SIZE } from "../constants/status";

/** Query key factory for client queries */
export const clientKeys = {
    all: ["clients"] as const,
    list: (params: ClientListParams) => ["clients", "list", params] as const,
    detail: (id: number | string) => ["clients", "detail", id] as const,
    template: ["clients", "template"] as const,
};

/**
 * Query hook for fetching the paginated client list.
 * Uses keepPreviousData for smooth pagination transitions.
 */
export function useClients(params: ClientListParams = {}) {
    const resolvedParams: ClientListParams = {
        limit: CLIENTS_PAGE_SIZE,
        offset: 0,
        ...params,
    };

    return useQuery({
        queryKey: clientKeys.list(resolvedParams),
        queryFn: () => fetchClients(resolvedParams),
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });
}

/**
 * Helper: compute total pages from totalFilteredRecords + limit.
 */
export function useClientPages(
    totalRecords: number | undefined,
    limit: number = CLIENTS_PAGE_SIZE,
) {
    if (!totalRecords || totalRecords <= 0) return 0;
    return Math.ceil(totalRecords / limit);
}
