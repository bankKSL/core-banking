import { useQuery } from "@tanstack/react-query";
import { fetchFunds } from "../api/funds";

export const fundKeys = {
    all: ["funds"] as const,
};

export function useFunds() {
    return useQuery({
        queryKey: fundKeys.all,
        queryFn: () => fetchFunds(),
        staleTime: 10 * 60_000,
    });
}
