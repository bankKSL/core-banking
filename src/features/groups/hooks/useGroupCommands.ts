import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateGroup, deleteGroup } from "../api/group";
import type { GroupCommandRequest } from "../types/group";
import { groupKeys } from "./useGroups";

export function useActivateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload?: GroupCommandRequest }) =>
      activateGroup(groupId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(vars.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) => deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
