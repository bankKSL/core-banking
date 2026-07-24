import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGroup } from "../api/group";
import type { GroupUpdateRequest } from "../types/group";
import { groupKeys } from "./useGroups";

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload: GroupUpdateRequest }) =>
      updateGroup(groupId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(vars.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
