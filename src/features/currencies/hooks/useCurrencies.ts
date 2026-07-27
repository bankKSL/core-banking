import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCurrencies, updateCurrencies } from "../api/currencies";

export const currencyKeys = {
  all: ["currencies"] as const,
};

export function useCurrencies() {
  return useQuery({
    queryKey: currencyKeys.all,
    queryFn: fetchCurrencies,
  });
}

export function useUpdateCurrencies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (currencies: string[]) => updateCurrencies(currencies),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.all });
    },
  });
}
