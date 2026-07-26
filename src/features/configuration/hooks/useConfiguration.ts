import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchConfigurations,
  fetchConfiguration,
  updateConfiguration,
  updateConfigurationByName,
  fetchExternalService,
  updateExternalService,
  fetchExternalEvents,
  updateExternalEvents,
  fetchPasswordPreferences,
  fetchPasswordPolicies,
  updatePasswordPreference,
  fetchBusinessDates,
  updateBusinessDate,
  fetchCaches,
  updateCache,
} from "../api/configuration";
import type {
  UpdateConfigRequest,
  UpdateBusinessDateRequest,
  UpdateCacheRequest,
} from "../types/configuration";

export const configKeys = {
  all: ["configuration"] as const,
  global: {
    all: ["configuration", "global"] as const,
    list: ["configuration", "global", "list"] as const,
    detail: (id: number) => ["configuration", "global", id] as const,
    name: (n: string) => ["configuration", "global", "name", n] as const,
  },
  externalService: (name?: string) =>
    ["configuration", "external-service", name] as const,
  externalEvents: ["configuration", "external-events"] as const,
  passwordPreferences: ["configuration", "password-preferences"] as const,
  passwordPolicies: ["configuration", "password-policies"] as const,
  businessDates: ["configuration", "business-dates"] as const,
  caches: ["configuration", "caches"] as const,
};

export function useConfigurations() {
  return useQuery({
    queryKey: configKeys.global.list,
    queryFn: fetchConfigurations,
    staleTime: 60_000,
  });
}

export function useConfiguration(id: number | undefined) {
  return useQuery({
    queryKey: configKeys.global.detail(id!),
    queryFn: () => fetchConfiguration(id!),
    enabled: !!id,
  });
}

export function useUpdateConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateConfigRequest;
    }) => updateConfiguration(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.global.all });
    },
  });
}

export function useUpdateConfigurationByName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      payload,
    }: {
      name: string;
      payload: UpdateConfigRequest;
    }) => updateConfigurationByName(name, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.global.all });
    },
  });
}

export function useExternalService(serviceName: string | undefined) {
  return useQuery({
    queryKey: configKeys.externalService(serviceName),
    queryFn: () => fetchExternalService(serviceName!),
    enabled: !!serviceName,
    staleTime: 60_000,
  });
}

export function useUpdateExternalService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceName,
      payload,
    }: {
      serviceName: string;
      payload: Record<string, string>;
    }) => updateExternalService(serviceName, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: configKeys.externalService(variables.serviceName),
      });
    },
  });
}

export function useExternalEvents() {
  return useQuery({
    queryKey: configKeys.externalEvents,
    queryFn: fetchExternalEvents,
    staleTime: 60_000,
  });
}

export function useUpdateExternalEvents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => updateExternalEvents(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.externalEvents });
    },
  });
}

export function usePasswordPreferences() {
  return useQuery({
    queryKey: configKeys.passwordPreferences,
    queryFn: async () => {
      const result = await fetchPasswordPreferences();
      return Array.isArray(result) ? result : [result];
    },
    staleTime: 120_000,
  });
}

export function usePasswordPolicies() {
  return useQuery({
    queryKey: configKeys.passwordPolicies,
    queryFn: fetchPasswordPolicies,
    staleTime: 300_000,
  });
}

export function useUpdatePasswordPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policyId: number) => updatePasswordPreference(policyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.passwordPreferences });
    },
  });
}

export function useBusinessDates() {
  return useQuery({
    queryKey: configKeys.businessDates,
    queryFn: fetchBusinessDates,
    staleTime: 60_000,
  });
}

export function useUpdateBusinessDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBusinessDateRequest) => updateBusinessDate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.businessDates });
    },
  });
}

export function useCaches() {
  return useQuery({
    queryKey: configKeys.caches,
    queryFn: fetchCaches,
    staleTime: 120_000,
  });
}

export function useUpdateCache() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCacheRequest) => updateCache(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.caches });
    },
  });
}
