import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSmsCampaignTemplate,
  fetchSmsCampaigns,
  fetchSmsCampaign,
  createSmsCampaign,
  updateSmsCampaign,
  activateSmsCampaign,
  closeSmsCampaign,
  reactivateSmsCampaign,
  previewSmsCampaign,
  deleteSmsCampaign,
  fetchEmailCampaignTemplate,
  fetchEmailCampaigns,
  fetchEmailCampaign,
  createEmailCampaign,
  updateEmailCampaign,
  activateEmailCampaign,
  closeEmailCampaign,
  reactivateEmailCampaign,
  previewEmailCampaign,
  deleteEmailCampaign,
} from "../api/campaigns";
import type {
  CreateSmsCampaignRequest,
  UpdateSmsCampaignRequest,
  CreateEmailCampaignRequest,
  UpdateEmailCampaignRequest,
  ActivateCampaignRequest,
  CloseCampaignRequest,
  PreviewRequest,
} from "../types/campaign";

export const campaignKeys = {
  all: ["campaigns"] as const,
  sms: {
    all: ["campaigns", "sms"] as const,
    template: ["campaigns", "sms", "template"] as const,
    list: (offset?: number, limit?: number) =>
      ["campaigns", "sms", "list", offset, limit] as const,
    detail: (id: number) => ["campaigns", "sms", id] as const,
  },
  email: {
    all: ["campaigns", "email"] as const,
    template: ["campaigns", "email", "template"] as const,
    list: ["campaigns", "email", "list"] as const,
    detail: (id: number) => ["campaigns", "email", id] as const,
  },
};

export function useSmsCampaignTemplate() {
  return useQuery({
    queryKey: campaignKeys.sms.template,
    queryFn: fetchSmsCampaignTemplate,
    staleTime: 300_000,
  });
}

export function useSmsCampaigns(offset = 0, limit = 50) {
  return useQuery({
    queryKey: campaignKeys.sms.list(offset, limit),
    queryFn: () => fetchSmsCampaigns(offset, limit),
    staleTime: 60_000,
  });
}

export function useSmsCampaign(id: number | undefined) {
  return useQuery({
    queryKey: campaignKeys.sms.detail(id!),
    queryFn: () => fetchSmsCampaign(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateSmsCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSmsCampaignRequest) => createSmsCampaign(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.sms.all }),
  });
}

export function useUpdateSmsCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateSmsCampaignRequest;
    }) => updateSmsCampaign(id, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: campaignKeys.sms.all });
      qc.invalidateQueries({ queryKey: campaignKeys.sms.detail(v.id) });
    },
  });
}

export function useActivateSmsCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ActivateCampaignRequest;
    }) => activateSmsCampaign(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.sms.all }),
  });
}

export function useCloseSmsCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: CloseCampaignRequest;
    }) => closeSmsCampaign(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.sms.all }),
  });
}

export function useReactivateSmsCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ActivateCampaignRequest;
    }) => reactivateSmsCampaign(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.sms.all }),
  });
}

export function usePreviewSmsCampaign() {
  return useMutation({
    mutationFn: (payload: PreviewRequest) => previewSmsCampaign(payload),
  });
}

export function useDeleteSmsCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSmsCampaign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.sms.all }),
  });
}

export function useEmailCampaignTemplate() {
  return useQuery({
    queryKey: campaignKeys.email.template,
    queryFn: fetchEmailCampaignTemplate,
    staleTime: 300_000,
  });
}

export function useEmailCampaigns() {
  return useQuery({
    queryKey: campaignKeys.email.list,
    queryFn: fetchEmailCampaigns,
    staleTime: 60_000,
  });
}

export function useEmailCampaign(id: number | undefined) {
  return useQuery({
    queryKey: campaignKeys.email.detail(id!),
    queryFn: () => fetchEmailCampaign(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateEmailCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmailCampaignRequest) => createEmailCampaign(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.email.all }),
  });
}

export function useUpdateEmailCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateEmailCampaignRequest;
    }) => updateEmailCampaign(id, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: campaignKeys.email.all });
      qc.invalidateQueries({ queryKey: campaignKeys.email.detail(v.id) });
    },
  });
}

export function useActivateEmailCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ActivateCampaignRequest;
    }) => activateEmailCampaign(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.email.all }),
  });
}

export function useCloseEmailCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: CloseCampaignRequest;
    }) => closeEmailCampaign(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.email.all }),
  });
}

export function useReactivateEmailCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ActivateCampaignRequest;
    }) => reactivateEmailCampaign(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.email.all }),
  });
}

export function usePreviewEmailCampaign() {
  return useMutation({
    mutationFn: (payload: PreviewRequest) => previewEmailCampaign(payload),
  });
}

export function useDeleteEmailCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEmailCampaign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: campaignKeys.email.all }),
  });
}
