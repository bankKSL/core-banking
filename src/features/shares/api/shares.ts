import client from "@/api/client";

export interface ShareProduct {
  id: number;
  name: string;
  shortName: string;
  description: string;
  externalId: string | null;
  currency: { code: string; name: string; displaySymbol: string; decimalPlaces: number; inMultiplesOf: number };
  totalShares: number;
  sharesIssued: number;
  unitPrice: number;
  shareCapital: number;
  minimumShares: number | null;
  nominalShares: number;
  maximumShares: number | null;
  marketPricePeriods: Array<{ id: number | null; fromDate: string; shareValue: number }>;
  chargesSelected: Array<{ id: number; name: string; amount: number }>;
  allowDividendCalculationForInactiveClients: boolean;
  lockinPeriodFrequency: number | null;
  lockinPeriodFrequencyType: { id: number; code: string; value: string } | null;
  minimumActivePeriodForDividends: number | null;
  minimumactiveperiodFrequencyType: { id: number; code: string; value: string } | null;
  accountingRule: { id: number; code: string; value: string };
}

export interface ShareProductTemplate {
  currencyOptions: Array<{ code: string; name: string; displaySymbol: string }>;
  accountingRuleOptions: Array<{ id: number; code: string; value: string }>;
  lockinPeriodFrequencyTypeOptions: Array<{ id: number; code: string; value: string }>;
  minimumActivePeriodFrequencyTypeOptions: Array<{ id: number; code: string; value: string }>;
  chargeOptions: Array<{ id: number; name: string; amount: number; currency: { code: string } }>;
}

export interface ShareAccount {
  id: number;
  accountNo: string;
  externalId: string;
  clientId: number;
  clientName: string;
  productId: number;
  productName: string;
  savingsAccountId: number;
  status: {
    id: number;
    code: string;
    value: string;
    submittedAndPendingApproval: boolean;
    approved: boolean;
    active: boolean;
    rejected: boolean;
    closed: boolean;
  };
  timeline: {
    submittedOnDate: string;
    approvedDate: string | null;
    activatedDate: string | null;
    closedDate: string | null;
  };
  currency: { code: string; name: string; displaySymbol: string };
  summary: { totalApprovedShares: number; totalPendingShares: number; totalShares: number };
  purchasedShares: Array<{
    id: number;
    transactionDate: string;
    totalShares: number;
    unitPrice: number;
    amount: number;
    status: { id: number; value: string };
    type: { id: number; value: string };
  }>;
  charges: Array<{ id: number; name: string; amount: number; amountPaid: number; amountOutstanding: number }>;
  currentMarketPrice: number;
  lockinPeriod: number | null;
  lockPeriodTypeEnum: { id: number; value: string } | null;
  minimumActivePeriod: number | null;
  minimumActivePeriodTypeEnum: { id: number; value: string } | null;
  allowDividendCalculationForInactiveClients: boolean;
}

export interface ShareAccountTemplate {
  productOptions: Array<{ id: number; name: string; currency: { code: string } }>;
  chargeOptions: Array<{ id: number; name: string; amount: number; chargeTimeType: { id: number } }>;
  clientSavingsAccounts: Array<{
    id: number;
    accountNo: string;
    savingsProductName?: string;
    currency?: { code: string; displaySymbol?: string; name?: string };
    summary?: { accountBalance?: number };
  }>;
  lockinPeriodFrequencyTypeOptions: Array<{ id: number; code: string; value: string }>;
  minimumActivePeriodFrequencyTypeOptions: Array<{ id: number; code: string; value: string }>;
  currentMarketPrice: number;
}

export interface Dividend {
  id: number;
  productId: number;
  amount: number;
  dividendPeriodStartDate: string;
  dividendPeriodEndDate: string;
  status: { id: number; code: string; value: string; initiated: boolean; approved: boolean };
}

export interface ShareProductListResponse {
  totalFilteredRecords: number;
  pageItems: ShareProduct[];
}

export async function fetchShareProducts(params?: {
  offset?: number;
  limit?: number;
}): Promise<ShareProductListResponse> {
  const { data } = await client.get<ShareProductListResponse>("/products/share", { params });
  return data;
}

export async function fetchShareProduct(id: number): Promise<ShareProduct> {
  const { data } = await client.get<ShareProduct>(`/products/share/${id}`);
  return data;
}

export async function fetchShareProductTemplate(): Promise<ShareProductTemplate> {
  const { data } = await client.get<ShareProductTemplate>("/products/share/template");
  return data;
}

export async function createShareProduct(payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/products/share", payload);
  return data;
}

export async function updateShareProduct(
  id: number,
  payload: Record<string, unknown>,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/products/share/${id}`, payload);
  return data;
}

export async function fetchShareAccounts(): Promise<ShareAccount[]> {
  const { data } = await client.get<ShareAccount[]>("/accounts/share");
  return Array.isArray(data) ? data : [];
}

export async function fetchShareAccount(id: number): Promise<ShareAccount> {
  const { data } = await client.get<ShareAccount>(`/accounts/share/${id}`);
  return data;
}

export async function fetchShareAccountTemplate(clientId?: number, productId?: number): Promise<ShareAccountTemplate> {
  const params: Record<string, number> = {};
  if (clientId) params.clientId = clientId;
  if (productId) params.productId = productId;
  const { data } = await client.get<ShareAccountTemplate>("/accounts/share/template", { params });
  return data;
}

export async function createShareAccount(payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/accounts/share", payload);
  return data;
}

export async function updateShareAccount(
  id: number,
  payload: Record<string, unknown>,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/accounts/share/${id}`, payload);
  return data;
}

export async function shareAccountCommand(
  accountId: number,
  command: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await client.post(`/accounts/share/${accountId}`, payload, { params: { command } });
}

export async function fetchDividends(productId: number): Promise<Dividend[]> {
  const { data } = await client.get<Dividend[]>(`/shareproduct/${productId}/dividend`);
  return Array.isArray(data) ? data : [];
}

export async function createDividend(
  productId: number,
  payload: Record<string, unknown>,
): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>(`/shareproduct/${productId}/dividend`, payload);
  return data;
}

export async function approveDividend(productId: number, dividendId: number): Promise<void> {
  await client.put(`/shareproduct/${productId}/dividend/${dividendId}?command=approve`);
}

export async function deleteDividend(productId: number, dividendId: number): Promise<void> {
  await client.delete(`/shareproduct/${productId}/dividend/${dividendId}`);
}
