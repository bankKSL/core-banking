import client from "@/api/client";

export interface ProductMix {
  productId: number;
  restrictedProducts: Array<{ id: number; name: string; shortName: string }>;
}

export interface ProductMixTemplate {
  productOptions: Array<{ id: number; name: string; shortName: string }>;
}

export async function fetchProductMix(productId: number): Promise<ProductMix> {
  const { data } = await client.get<ProductMix>(`/loanproducts/${productId}/productmix`);
  return data;
}

export async function fetchProductMixTemplate(productId: number): Promise<ProductMixTemplate> {
  const { data } = await client.get<ProductMixTemplate>(`/loanproducts/${productId}/productmix?template=true`);
  return data;
}

export async function createProductMix(productId: number, restrictedProducts: number[]): Promise<void> {
  await client.post(`/loanproducts/${productId}/productmix`, { restrictedProducts });
}

export async function updateProductMix(productId: number, restrictedProducts: number[]): Promise<void> {
  await client.put(`/loanproducts/${productId}/productmix`, { restrictedProducts });
}

export async function deleteProductMix(productId: number): Promise<void> {
  await client.delete(`/loanproducts/${productId}/productmix`);
}
