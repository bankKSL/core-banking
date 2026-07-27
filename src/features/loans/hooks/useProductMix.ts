import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProductMix,
  fetchProductMixTemplate,
  createProductMix,
  updateProductMix,
  deleteProductMix,
} from "../api/productMix";

export const mixKeys = {
  all: ["productMix"] as const,
  detail: (productId: number) => ["productMix", "detail", productId] as const,
  template: (productId: number) => ["productMix", "template", productId] as const,
};

export function useProductMix(productId: number | undefined) {
  return useQuery({
    queryKey: mixKeys.detail(productId!),
    queryFn: () => fetchProductMix(productId!),
    enabled: !!productId,
    staleTime: 30_000,
  });
}

export function useProductMixTemplate(productId: number | undefined) {
  return useQuery({
    queryKey: mixKeys.template(productId!),
    queryFn: () => fetchProductMixTemplate(productId!),
    enabled: !!productId,
    staleTime: 5 * 60_000,
  });
}

export function useCreateProductMix() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      restrictedProducts,
    }: {
      productId: number;
      restrictedProducts: number[];
    }) => createProductMix(productId, restrictedProducts),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: mixKeys.detail(vars.productId) });
    },
  });
}

export function useUpdateProductMix() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      restrictedProducts,
    }: {
      productId: number;
      restrictedProducts: number[];
    }) => updateProductMix(productId, restrictedProducts),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: mixKeys.detail(vars.productId) });
    },
  });
}

export function useDeleteProductMix() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId }: { productId: number }) => deleteProductMix(productId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: mixKeys.detail(vars.productId) });
    },
  });
}
