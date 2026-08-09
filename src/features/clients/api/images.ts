import client from "@/api/client";

export interface ClientImageParams {
  maxWidth?: number;
  maxHeight?: number;
  output?: "octet" | "inline_octet";
}

export interface ClientImageCreateResponse {
  resourceId: number;
  resourceIdentifier: string;
}

export interface ClientUploadTemplateResponse {
  importDocumentId: number;
}

export async function fetchClientImage(clientId: number | string, params?: ClientImageParams): Promise<string> {
  const { data } = await client.get<string>(`/clients/${clientId}/images`, {
    params,
  });
  return data;
}

export async function uploadClientImage(clientId: number | string, file: File): Promise<ClientImageCreateResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await client.post<ClientImageCreateResponse>(`/clients/${clientId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteClientImage(clientId: number | string): Promise<ClientImageCreateResponse> {
  const { data } = await client.delete<ClientImageCreateResponse>(`/clients/${clientId}/images`);
  return data;
}

export async function uploadClientTemplate(
  file: File,
  legalFormType?: "PERSON" | "ENTITY",
): Promise<ClientUploadTemplateResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("locale", "en");
  formData.append("dateFormat", "dd MMMM yyyy");
  const params: Record<string, string> = {};
  if (legalFormType) params.legalFormType = legalFormType;
  const { data } = await client.post<ClientUploadTemplateResponse>("/clients/uploadtemplate", formData, {
    params,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
