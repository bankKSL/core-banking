import { useQuery } from "@tanstack/react-query";
import { fetchGroupAccounts } from "../api/group";
import { groupKeys } from "./useGroups";

export function useGroupAccounts(groupId: number | string | undefined) {
  return useQuery({
    queryKey: [...groupKeys.detail(groupId ?? ""), "accounts"],
    queryFn: () => fetchGroupAccounts(Number(groupId!)),
    enabled: groupId !== undefined && groupId !== "",
    staleTime: 30_000,
  });
}