import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCollateralProducts,
  fetchCollateralProduct,
  fetchCollateralProductTemplate,
  createCollateralProduct,
  updateCollateralProduct,
  deleteCollateralProduct,
} from "../api/collateralProducts";
import type { CollateralProductCreateRequest, CollateralProductUpdateRequest } from "../types/collateralProduct";

export const collateralProductKeys = {
  all: ["collateral-products"] as const,
  list: ["collateral-products", "list"] as const,
  detail: (id: number | string) => ["collateral-products", "detail", id] as const,
  template: ["collateral-products", "template"] as const,
};

export function useCollateralProducts() {
  return useQuery({
    queryKey: collateralProductKeys.list,
    queryFn: fetchCollateralProducts,
  });
}

export function useCollateralProduct(id: number | string | undefined) {
  return useQuery({
    queryKey: collateralProductKeys.detail(id!),
    queryFn: () => fetchCollateralProduct(id!),
    enabled: !!id,
  });
}

export function useCollateralProductTemplate() {
  return useQuery({
    queryKey: collateralProductKeys.template,
    queryFn: fetchCollateralProductTemplate,
    staleTime: 10 * 60_000,
  });
}

export function useCreateCollateralProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CollateralProductCreateRequest) => createCollateralProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collateralProductKeys.all });
    },
  });
}

export function useUpdateCollateralProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: CollateralProductUpdateRequest }) =>
      updateCollateralProduct(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: collateralProductKeys.all });
      queryClient.invalidateQueries({ queryKey: collateralProductKeys.detail(variables.id) });
    },
  });
}

export function useDeleteCollateralProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteCollateralProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collateralProductKeys.all });
    },
  });
}
