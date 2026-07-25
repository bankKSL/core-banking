import client from "@/api/client";
import type { CollateralProduct, CollateralProductCreateRequest, CollateralProductUpdateRequest, CollateralProductCommandResponse, CollateralProductTemplate } from "../types/collateralProduct";

export async function fetchCollateralProducts(): Promise<CollateralProduct[]> {
  const { data } = await client.get<CollateralProduct[]>("/collateral-management");
  return data;
}

export async function fetchCollateralProduct(id: number | string): Promise<CollateralProduct> {
  const { data } = await client.get<CollateralProduct>(`/collateral-management/${id}`);
  return data;
}

export async function fetchCollateralProductTemplate(): Promise<CollateralProductTemplate> {
  const { data } = await client.get<CollateralProductTemplate>("/collateral-management/template");
  return data;
}

export async function createCollateralProduct(payload: CollateralProductCreateRequest): Promise<CollateralProductCommandResponse> {
  const { data } = await client.post<CollateralProductCommandResponse>("/collateral-management", payload);
  return data;
}

export async function updateCollateralProduct(id: number | string, payload: CollateralProductUpdateRequest): Promise<CollateralProductCommandResponse> {
  const { data } = await client.put<CollateralProductCommandResponse>(`/collateral-management/${id}`, payload);
  return data;
}

export async function deleteCollateralProduct(id: number | string): Promise<void> {
  await client.delete(`/collateral-management/${id}`);
}
