import { useQuery } from "@tanstack/react-query";
import { fetchGroup } from "../api/group";
import { groupKeys } from "./useGroups";

export function useGroup(groupId: number | string | undefined) {
  return useQuery({
    queryKey: groupKeys.detail(groupId ?? ""),
    queryFn: () => fetchGroup(groupId!),
    enabled: groupId !== undefined && groupId !== "",
    staleTime: 30_000,
  });
}
