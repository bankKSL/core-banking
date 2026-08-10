import client from "@/api/client";
import { currentDate } from "@/lib/utils";
import type {
  Holiday,
  HolidayListResponse,
  HolidayTemplate,
  HolidayCreateRequest,
  HolidayUpdateRequest,
  HolidayListParams,
} from "../types/holiday.types";

export async function fetchHolidays(params?: HolidayListParams): Promise<HolidayListResponse> {
  const { data } = await client.get<HolidayListResponse>("/holidays", { params });
  return data;
}

export async function fetchHoliday(id: number): Promise<Holiday> {
  const { data } = await client.get<Holiday>(`/holidays/${id}`);
  return data;
}

export async function fetchHolidayTemplate(): Promise<HolidayTemplate> {
  const { data } = await client.get<HolidayTemplate>("/holidays/template");
  return data;
}

export async function createHoliday(payload: HolidayCreateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/holidays", payload);
  return data;
}

export async function updateHoliday(id: number, payload: HolidayUpdateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/holidays/${id}`, payload);
  return data;
}

export async function deleteHoliday(id: number): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/holidays/${id}?command=delete`);
  return data;
}

export async function activateHoliday(id: number): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>(`/holidays/${id}?command=activate`);
  return data;
}

export function buildCreateRequest(values: Record<string, unknown>): HolidayCreateRequest {
  return {
    name: values.name as string,
    description: (values.description as string) || undefined,
    fromDate: currentDate(values.fromDate as string) ?? (values.fromDate as string),
    toDate: currentDate(values.toDate as string) ?? (values.toDate as string),
    repaymentsRescheduledTo: values.repaymentsRescheduledTo
      ? (currentDate(values.repaymentsRescheduledTo as string) ?? (values.repaymentsRescheduledTo as string))
      : undefined,
    reschedulingType: values.reschedulingType as number,
    offices: values.offices as number[],
    dateFormat: "dd MMMM yyyy",
    locale: "en",
  };
}

export function buildUpdateRequest(values: Record<string, unknown>): HolidayUpdateRequest {
  const request: HolidayUpdateRequest = {
    dateFormat: "dd MMMM yyyy",
    locale: "en",
  };

  if (values.name != null) request.name = values.name as string;
  if (values.description != null) request.description = (values.description as string) || undefined;
  if (values.fromDate != null) request.fromDate = currentDate(values.fromDate as string) ?? (values.fromDate as string);
  if (values.toDate != null) request.toDate = currentDate(values.toDate as string) ?? (values.toDate as string);
  if (values.repaymentsRescheduledTo)
    request.repaymentsRescheduledTo =
      currentDate(values.repaymentsRescheduledTo as string) ?? (values.repaymentsRescheduledTo as string);
  if (values.reschedulingType != null) request.reschedulingType = values.reschedulingType as number;
  if (values.offices != null) request.offices = values.offices as number[];

  return request;
}

export function parseDate(dateVal: number[] | null | undefined): Date | null {
  if (dateVal == null) return null;
  if (Array.isArray(dateVal) && dateVal.length >= 3) {
    return new Date(dateVal[0], dateVal[1] - 1, dateVal[2]);
  }
  return null;
}
