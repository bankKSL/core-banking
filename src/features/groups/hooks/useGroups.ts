import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchGroups } from "../api/group";
import type { GroupListParams } from "../types/group";
import { GROUPS_PAGE_SIZE } from "../constants/status";

export const groupKeys = {
  all: ["groups"] as const,
  list: (params: GroupListParams) => ["groups", "list", params] as const,
  detail: (id: number | string) => ["groups", "detail", id] as const,
};

export function useGroups(params: GroupListParams = {}) {
  const resolvedParams: GroupListParams = { limit: GROUPS_PAGE_SIZE, offset: 0, paged: true, ...params };
  return useQuery({
    queryKey: groupKeys.list(resolvedParams),
    queryFn: () => fetchGroups(resolvedParams),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
