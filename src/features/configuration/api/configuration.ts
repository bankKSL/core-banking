import api from "@/api/client";
import type {
  GlobalConfiguration,
  UpdateConfigRequest,
  ExternalService,
  ExternalEventConfiguration,
  UpdateExternalEventRequest,
  PasswordPolicy,
  BusinessDate,
  UpdateBusinessDateRequest,
  CacheType,
  UpdateCacheRequest,
} from "../types/configuration";

export async function fetchConfigurations(): Promise<GlobalConfiguration[]> {
  const { data } = await api.get<GlobalConfiguration[]>("/configurations");
  return data;
}

export async function fetchConfiguration(id: number): Promise<GlobalConfiguration> {
  const { data } = await api.get<GlobalConfiguration>(`/configurations/${id}`);
  return data;
}

export async function fetchConfigurationByName(name: string): Promise<GlobalConfiguration> {
  const { data } = await api.get<GlobalConfiguration>(`/configurations/name/${name}`);
  return data;
}

export async function updateConfiguration(
  id: number,
  payload: UpdateConfigRequest,
): Promise<void> {
  await api.put(`/configurations/${id}`, payload);
}

export async function updateConfigurationByName(
  name: string,
  payload: UpdateConfigRequest,
): Promise<void> {
  await api.put(`/configurations/name/${name}`, payload);
}

export async function fetchExternalService(
  serviceName: string,
): Promise<ExternalService> {
  const { data } = await api.get<ExternalService>(`/externalservice/${serviceName}`);
  return data;
}

export async function updateExternalService(
  serviceName: string,
  payload: Record<string, string>,
): Promise<void> {
  await api.put(`/externalservice/${serviceName}`, payload);
}

export async function fetchExternalEvents(): Promise<ExternalEventConfiguration[]> {
  const { data } = await api.get<ExternalEventConfiguration[]>(
    "/externalevents/configuration",
  );
  return data;
}

export async function updateExternalEvents(
  payload: UpdateExternalEventRequest[],
): Promise<void> {
  await api.put("/externalevents/configuration", payload);
}

export async function fetchPasswordPreferences(): Promise<PasswordPolicy | PasswordPolicy[]> {
  const { data } = await api.get<PasswordPolicy | PasswordPolicy[]>("/passwordpreferences");
  return data;
}

export async function fetchPasswordPolicies(): Promise<PasswordPolicy[]> {
  const { data } = await api.get<PasswordPolicy[]>("/passwordpreferences/template");
  return data;
}

export async function updatePasswordPreference(policyId: number): Promise<void> {
  await api.put("/passwordpreferences", { id: policyId });
}

export async function fetchBusinessDates(): Promise<BusinessDate[]> {
  const { data } = await api.get<BusinessDate[]>("/businessdate");
  return data;
}

export async function updateBusinessDate(
  payload: UpdateBusinessDateRequest,
): Promise<void> {
  await api.post("/businessdate", payload);
}

export async function fetchCaches(): Promise<CacheType[]> {
  const { data } = await api.get<CacheType[]>("/caches");
  return data;
}

export async function updateCache(payload: UpdateCacheRequest): Promise<void> {
  await api.put("/caches", payload);
}
