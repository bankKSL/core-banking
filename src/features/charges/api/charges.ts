import client from "@/api/client";

export interface EnumOption {
  id: number;
  code: string;
  value: string;
}

export interface Charge {
  id: number;
  name: string;
  chargeAppliesTo: EnumOption;
  currencyCode: string;
  chargeTimeType: EnumOption;
  chargeCalculationType: EnumOption;
  amount: number;
  chargePaymentMode: EnumOption | null;
  penalty: boolean;
  active: boolean;
  feeOnMonthDay: string | null;
  feeInterval: number | null;
  feeFrequency: EnumOption | null;
  minCap: number | null;
  maxCap: number | null;
  incomeAccountId: number | null;
  incomeOrLiabilityAccount: { id: number; name: string; glCode: string } | null;
  taxGroupId: number | null;
  paymentTypeId: number | null;
  enablePaymentType: boolean | null;
  enableFreeWithdrawalCharge: boolean | null;
  freeWithdrawalFrequency: number | null;
  restartCountFrequency: number | null;
  countFrequencyType: number | null;
}

export interface ChargeTemplate {
  chargeAppliesToOptions: EnumOption[];
  loanChargeTimeTypeOptions: EnumOption[];
  savingsChargeTimeTypeOptions: EnumOption[];
  clientChargeTimeTypeOptions: EnumOption[];
  sharesChargeTimeTypeOptions: EnumOption[];
  loanChargeCalculationTypeOptions: EnumOption[];
  savingsChargeCalculationTypeOptions: EnumOption[];
  clientChargeCalculationTypeOptions: EnumOption[];
  sharesChargeCalculationTypeOptions: EnumOption[];
  chargePaymetModeOptions: EnumOption[];
  currencyOptions: Array<{ code: string; name: string; decimalPlaces: number; displaySymbol: string }>;
  incomeOrLiabilityAccountOptions: Array<{ id: number; name: string; glCode: string }>;
  taxGroupOptions: Array<{ id: number; name: string }>;
  feeFrequencyOptions: EnumOption[];
  paymentTypeOptions: Array<{ id: number; name: string }>;
}

export interface ChargeCreateRequest {
  name: string;
  chargeAppliesTo: number;
  currencyCode: string;
  chargeTimeType: number;
  chargeCalculationType: number;
  amount: number;
  chargePaymentMode?: number;
  penalty?: boolean;
  active?: boolean;
  feeOnMonthDay?: string;
  feeInterval?: number;
  feeFrequency?: number;
  minCap?: number;
  maxCap?: number;
  incomeAccountId?: number;
  taxGroupId?: number;
  paymentTypeId?: number;
  enablePaymentType?: boolean;
  enableFreeWithdrawalCharge?: boolean;
  freeWithdrawalFrequency?: number;
  restartCountFrequency?: number;
  countFrequencyType?: number;
  locale: string;
  monthDayFormat?: string;
}

export interface ChargeUpdateRequest {
  name?: string;
  amount?: number;
  chargePaymentMode?: number;
  penalty?: boolean;
  active?: boolean;
  feeOnMonthDay?: string;
  feeInterval?: number;
  feeFrequency?: number;
  minCap?: number;
  maxCap?: number;
  incomeAccountId?: number;
  taxGroupId?: number;
  paymentTypeId?: number;
  enablePaymentType?: boolean;
  enableFreeWithdrawalCharge?: boolean;
  freeWithdrawalFrequency?: number;
  restartCountFrequency?: number;
  countFrequencyType?: number;
  locale: string;
  monthDayFormat?: string;
}

export async function fetchCharges(): Promise<Charge[]> {
  const { data } = await client.get<Charge[]>("/charges");
  return Array.isArray(data) ? data : [];
}

export async function fetchCharge(id: number): Promise<Charge> {
  const { data } = await client.get<Charge>(`/charges/${id}`);
  return data;
}

export async function fetchChargeTemplate(): Promise<ChargeTemplate> {
  const { data } = await client.get<ChargeTemplate>("/charges/template");
  return data;
}

export async function createCharge(payload: ChargeCreateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/charges", payload);
  return data;
}

export async function updateCharge(id: number, payload: ChargeUpdateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/charges/${id}`, payload);
  return data;
}

export async function deleteCharge(id: number): Promise<void> {
  await client.delete(`/charges/${id}`);
}
