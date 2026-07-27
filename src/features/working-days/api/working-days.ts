import client from "@/api/client";

export interface WorkingDaysConfig {
  id: number;
  recurrence: string;
  repaymentRescheduleType: { id: number; code: string; value: string } | null;
  repaymentRescheduleTypeId?: number;
  repaymentRescheduleOptions?: RescheduleOption[];
  extendTermForDailyRepayments: boolean;
  extendTermForRepaymentsOnHolidays: boolean;
}

export interface RescheduleOption {
  id: number;
  code: string;
  value: string;
}

export interface WorkingDaysTemplate {
  repaymentRescheduleOptions: RescheduleOption[];
}

export interface WorkingDaysUpdateRequest {
  recurrence: string;
  repaymentRescheduleType: number;
  extendTermForDailyRepayments?: boolean;
  extendTermForRepaymentsOnHolidays?: boolean;
}

export async function fetchWorkingDays(): Promise<WorkingDaysConfig> {
  const { data } = await client.get<WorkingDaysConfig>("/workingdays");
  return data;
}

export async function fetchWorkingDaysTemplate(): Promise<WorkingDaysTemplate> {
  const { data } = await client.get<WorkingDaysTemplate>("/workingdays/template");
  return data;
}

export async function updateWorkingDays(payload: WorkingDaysUpdateRequest): Promise<void> {
  await client.put("/workingdays", payload);
}
