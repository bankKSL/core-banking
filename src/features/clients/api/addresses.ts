import client from "@/api/client";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ClientAddress {
  addressId: number;
  addressType?: string;
  addressTypeId?: number;
  street?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  townVillage?: string;
  city?: string;
  countyDistrict?: string;
  stateProvinceId?: number;
  stateProvinceName?: string;
  countryId?: number;
  countryName?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  createdBy?: string;
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
  isActive?: boolean;
}

export interface ClientAddressRequest {
  addressTypeId?: number;
  street?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  townVillage?: string;
  city?: string;
  countyDistrict?: string;
  stateProvinceId?: number;
  countryId?: number;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

export interface ClientAddressTemplate {
  addressTypeIdOptions: Array<{ id: number; name: string; position?: number }>;
  stateProvinceIdOptions: Array<{ id: number; name: string }>;
  countryIdOptions: Array<{ id: number; name: string }>;
}

export interface ClientAddressCommandResponse {
  clientId: number;
  resourceId: number;
}

// ─── API Functions ─────────────────────────────────────────────────────

/**
 * GET /clients/{clientId}/addresses
 * List all addresses for a client.
 */
export async function fetchClientAddresses(clientId: number | string): Promise<ClientAddress[]> {
  const { data } = await client.get<ClientAddress[]>(`/clients/${clientId}/addresses`);
  return data;
}

/**
 * GET /clients/addresses/template
 * Get the template for creating/editing addresses (loads address types, states, countries).
 */
export async function fetchClientAddressTemplate(): Promise<ClientAddressTemplate> {
  const { data } = await client.get<ClientAddressTemplate>("/clients/addresses/template");
  return data;
}

/**
 * POST /clients/{clientId}/addresses?type={addressTypeId}
 * Create a new address for a client.
 */
export async function createClientAddress(
  clientId: number | string,
  addressTypeId: number,
  payload: ClientAddressRequest,
): Promise<ClientAddressCommandResponse> {
  const { data } = await client.post<ClientAddressCommandResponse>(`/clients/${clientId}/addresses`, payload, {
    params: { type: addressTypeId },
  });
  return data;
}

/**
 * PUT /clients/{clientId}/addresses
 * Update an existing address for a client.
 */
export async function updateClientAddress(
  clientId: number | string,
  addressId: number | string,
  payload: ClientAddressRequest,
): Promise<ClientAddressCommandResponse> {
  const { data } = await client.put<ClientAddressCommandResponse>(
    `/clients/${clientId}/addresses/${addressId}`,
    payload,
  );
  return data;
}

/**
 * DELETE /clients/{clientId}/addresses/{addressId}
 * Delete a client address.
 */
export async function deleteClientAddress(
  clientId: number | string,
  addressId: number | string,
): Promise<ClientAddressCommandResponse> {
  const { data } = await client.delete<ClientAddressCommandResponse>(`/clients/${clientId}/addresses/${addressId}`);
  return data;
}
