import client from "@/api/client";
import { currentDate } from "@/lib/utils";
import type {
  StandingInstruction,
  StandingInstructionListResponse,
  StandingInstructionTemplate,
  StandingInstructionCreateRequest,
  StandingInstructionUpdateRequest,
  StandingInstructionHistoryResponse,
  StandingInstructionListParams,
  StandingInstructionHistoryParams,
} from "../types/standing-instruction.types";

export async function fetchTemplate(params?: Record<string, number>): Promise<StandingInstructionTemplate> {
  const { data } = await client.get<StandingInstructionTemplate>("/standinginstructions/template", { params });
  return data;
}

export async function fetchStandingInstructions(
  params?: StandingInstructionListParams,
): Promise<StandingInstructionListResponse> {
  const { data } = await client.get<StandingInstructionListResponse>("/standinginstructions", { params });
  return data;
}

export async function fetchStandingInstruction(id: number): Promise<StandingInstruction> {
  const { data } = await client.get<StandingInstruction>(`/standinginstructions/${id}`);
  return data;
}

export async function fetchStandingInstructionWithAssociations(
  id: number,
  associations: "transactions" | "template" | "all",
): Promise<StandingInstruction> {
  const { data } = await client.get<StandingInstruction>(`/standinginstructions/${id}`, {
    params: { associations },
  });
  return data;
}

export async function createStandingInstruction(
  payload: StandingInstructionCreateRequest,
): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/standinginstructions", payload);
  return data;
}

export async function updateStandingInstruction(
  id: number,
  payload: StandingInstructionUpdateRequest,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(
    `/standinginstructions/${id}?command=update`,
    payload,
  );
  return data;
}

export async function deleteStandingInstruction(id: number): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(
    `/standinginstructions/${id}?command=delete`,
  );
  return data;
}

export async function fetchHistory(
  params?: StandingInstructionHistoryParams,
): Promise<StandingInstructionHistoryResponse> {
  const { data } = await client.get<StandingInstructionHistoryResponse>(
    "/standinginstructionrunhistory",
    { params },
  );
  return data;
}

export function buildCreateRequest(values: Record<string, unknown>): StandingInstructionCreateRequest {
  return {
    name: values.name as string,
    fromOfficeId: values.fromOfficeId as number,
    fromClientId: values.fromClientId as number,
    fromAccountType: values.fromAccountType as number,
    fromAccountId: values.fromAccountId as number,
    toOfficeId: values.toOfficeId as number,
    toClientId: values.toClientId as number,
    toAccountType: values.toAccountType as number,
    toAccountId: values.toAccountId as number,
    transferType: values.transferType as number,
    instructionType: values.instructionType as number,
    priority: values.priority as number,
    status: values.status as number,
    validFrom: currentDate(values.validFrom as string) ?? (values.validFrom as string),
    validTill: values.validTill
      ? (currentDate(values.validTill as string) ?? (values.validTill as string))
      : undefined,
    amount: values.amount != null && values.amount !== "" ? Number(values.amount) : undefined,
    recurrenceType: values.recurrenceType as number,
    recurrenceFrequency: values.recurrenceFrequency != null ? (values.recurrenceFrequency as number) : undefined,
    recurrenceInterval: values.recurrenceInterval != null ? (values.recurrenceInterval as number) : undefined,
    recurrenceOnMonthDay: (values.recurrenceOnMonthDay as string) || undefined,
    dateFormat: "dd MMMM yyyy",
    locale: "en",
    monthDayFormat: "dd MMMM",
  };
}

export function buildUpdateRequest(values: Record<string, unknown>): StandingInstructionUpdateRequest {
  const request: StandingInstructionUpdateRequest = {
    dateFormat: "dd MMMM yyyy",
    locale: "en",
  };

  if (values.amount != null && values.amount !== "") request.amount = Number(values.amount);
  if (values.validTill) request.validTill = currentDate(values.validTill as string) ?? (values.validTill as string);
  if (values.priority != null) request.priority = values.priority as number;
  if (values.status != null) request.status = values.status as number;
  if (values.instructionType != null) request.instructionType = values.instructionType as number;
  if (values.recurrenceType != null) request.recurrenceType = values.recurrenceType as number;
  if (values.recurrenceFrequency != null) request.recurrenceFrequency = values.recurrenceFrequency as number;
  if (values.recurrenceInterval != null) request.recurrenceInterval = values.recurrenceInterval as number;
  if (values.recurrenceOnMonthDay) request.recurrenceOnMonthDay = values.recurrenceOnMonthDay as string;

  return request;
}

export function parseFineractDate(dateVal: number[] | null | undefined): Date | null {
  if (dateVal == null) return null;
  if (Array.isArray(dateVal) && dateVal.length >= 3) {
    return new Date(dateVal[0], dateVal[1] - 1, dateVal[2]);
  }
  return null;
}
