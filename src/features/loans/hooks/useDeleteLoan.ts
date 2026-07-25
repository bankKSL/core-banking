import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteLoan } from "../api/loan";
import { loanKeys } from "./useLoans";

export function useDeleteLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (loanId: number) => deleteLoan(loanId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}
