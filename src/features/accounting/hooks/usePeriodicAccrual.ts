import { useMutation, useQueryClient } from "@tanstack/react-query";
import { executePeriodicAccrual } from "../api/accounting";
import type { ExecutePeriodicAccrualRequest } from "../types/accounting";
import { journalEntryKeys } from "./useJournalEntries";

export function useExecutePeriodicAccrual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExecutePeriodicAccrualRequest) => executePeriodicAccrual(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: journalEntryKeys.all });
    },
  });
}
