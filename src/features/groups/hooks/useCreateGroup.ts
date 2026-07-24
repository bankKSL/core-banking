import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroup } from "../api/group";
import type { GroupCreateRequest } from "../types/group";
import { groupKeys } from "./useGroups";

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GroupCreateRequest) => createGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
