import api from "@/api/client";
import type {
  SmsCampaign,
  SmsCampaignTemplate,
  CreateSmsCampaignRequest,
  UpdateSmsCampaignRequest,
  EmailCampaign,
  EmailCampaignTemplate,
  CreateEmailCampaignRequest,
  UpdateEmailCampaignRequest,
  ActivateCampaignRequest,
  CloseCampaignRequest,
  PreviewRequest,
  PreviewResponse,
  CommandResponse,
} from "../types/campaign";

export async function fetchSmsCampaignTemplate(): Promise<SmsCampaignTemplate> {
  const { data } = await api.get<SmsCampaignTemplate>("/smscampaigns/template");
  return data;
}

export async function fetchSmsCampaigns(
  offset = 0,
  limit = 50,
): Promise<SmsCampaign[]> {
  const { data } = await api.get<SmsCampaign[]>("/smscampaigns", {
    params: { offset, limit },
  });
  return data;
}

export async function fetchSmsCampaign(id: number): Promise<SmsCampaign> {
  const { data } = await api.get<SmsCampaign>(`/smscampaigns/${id}`);
  return data;
}

export async function createSmsCampaign(
  payload: CreateSmsCampaignRequest,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>("/smscampaigns", payload);
  return data;
}

export async function updateSmsCampaign(
  id: number,
  payload: UpdateSmsCampaignRequest,
): Promise<CommandResponse> {
  const { data } = await api.put<CommandResponse>(`/smscampaigns/${id}`, payload);
  return data;
}

export async function activateSmsCampaign(
  id: number,
  payload: ActivateCampaignRequest,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(
    `/smscampaigns/${id}`,
    payload,
    { params: { command: "activate" } },
  );
  return data;
}

export async function closeSmsCampaign(
  id: number,
  payload: CloseCampaignRequest,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(
    `/smscampaigns/${id}`,
    payload,
    { params: { command: "close" } },
  );
  return data;
}

export async function reactivateSmsCampaign(
  id: number,
  payload: ActivateCampaignRequest,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(
    `/smscampaigns/${id}`,
    payload,
    { params: { command: "reactivate" } },
  );
  return data;
}

export async function previewSmsCampaign(
  payload: PreviewRequest,
): Promise<PreviewResponse> {
  const { data } = await api.post<PreviewResponse>(
    "/smscampaigns/preview",
    payload,
  );
  return data;
}

export async function deleteSmsCampaign(id: number): Promise<void> {
  await api.delete(`/smscampaigns/${id}`);
}

export async function fetchEmailCampaignTemplate(): Promise<EmailCampaignTemplate> {
  const { data } = await api.get<EmailCampaignTemplate>("/email/campaign/template");
  return data;
}

export async function fetchEmailCampaigns(): Promise<EmailCampaign[]> {
  const { data } = await api.get<EmailCampaign[]>("/email/campaign");
  return data;
}

export async function fetchEmailCampaign(id: number): Promise<EmailCampaign> {
  const { data } = await api.get<EmailCampaign>(`/email/campaign/${id}`);
  return data;
}

export async function createEmailCampaign(
  payload: CreateEmailCampaignRequest,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>("/email/campaign", payload);
  return data;
}

export async function updateEmailCampaign(
  id: number,
  payload: UpdateEmailCampaignRequest,
): Promise<CommandResponse> {
  const { data } = await api.put<CommandResponse>(
    `/email/campaign/${id}`,
    payload,
  );
  return data;
}

export async function activateEmailCampaign(
  id: number,
  payload: ActivateCampaignRequest,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(
    `/email/campaign/${id}`,
    payload,
    { params: { command: "activate" } },
  );
  return data;
}

export async function closeEmailCampaign(
  id: number,
  payload: CloseCampaignRequest,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(
    `/email/campaign/${id}`,
    payload,
    { params: { command: "close" } },
  );
  return data;
}

export async function reactivateEmailCampaign(
  id: number,
  payload: ActivateCampaignRequest,
): Promise<CommandResponse> {
  const { data } = await api.post<CommandResponse>(
    `/email/campaign/${id}`,
    payload,
    { params: { command: "reactivate" } },
  );
  return data;
}

export async function previewEmailCampaign(
  payload: PreviewRequest,
): Promise<PreviewResponse> {
  const { data } = await api.post<PreviewResponse>(
    "/email/campaign/preview",
    payload,
  );
  return data;
}

export async function deleteEmailCampaign(id: number): Promise<void> {
  await api.delete(`/email/campaign/${id}`);
}
