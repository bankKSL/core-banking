import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchLoans } from "../api/loan";
import type { LoanListParams } from "../types/loan";
import { LOANS_PAGE_SIZE } from "../constants/status";

export const loanKeys = {
  all: ["loans"] as const,
  list: (params: LoanListParams) => ["loans", "list", params] as const,
  detail: (id: number | string) => ["loans", "detail", id] as const,
  byExternalId: (externalId: string) => ["loans", "externalId", externalId] as const,
  template: ["loans", "template"] as const,
  products: ["loans", "products"] as const,
  product: (id: number) => ["loans", "product", id] as const,
  productTemplate: ["loans", "productTemplate"] as const,
  schedule: (id: number) => ["loans", "schedule", id] as const,
  repaymentTemplate: (id: number) => ["loans", "repaymentTemplate", id] as const,
  transactionTemplate: (id: number, command?: string) => ["loans", "transactionTemplate", id, command] as const,
  charges: (id: number) => ["loans", "charges", id] as const,
  chargesTemplate: (id: number) => ["loans", "chargesTemplate", id] as const,
  collateral: (id: number) => ["loans", "collateral", id] as const,
  collateralTemplate: ["loans", "collateralTemplate"] as const,
  originators: (id: number | string) => ["loans", "detail", id, "originators"] as const,
  guarantors: (id: number) => ["loans", "guarantors", id] as const,
  delinquencyTags: (id: number) => ["loans", "delinquencyTags", id] as const,
};

export function useLoans(params: LoanListParams = {}) {
  const resolvedParams: LoanListParams = { limit: LOANS_PAGE_SIZE, offset: 0, ...params };
  return useQuery({
    queryKey: loanKeys.list(resolvedParams),
    queryFn: () => fetchLoans(resolvedParams),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
