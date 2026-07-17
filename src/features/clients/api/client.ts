import client from "@/api/client";
import type {
    Client,
    ClientListResponse,
    ClientListParams,
    ClientCreateRequest,
    ClientUpdateRequest,
    ClientTemplate,
    ClientActivateRequest,
} from "../types/client";

// ─── List Clients ─────────────────────────────────────────────
export async function fetchClients(params: ClientListParams = {}): Promise<ClientListResponse> {
    const { data } = await client.get<ClientListResponse>("/clients", { params });
    return data;
}

// ─── Get Single Client ────────────────────────────────────────
export async function fetchClient(clientId: number | string): Promise<Client> {
    const { data } = await client.get<Client>(`/clients/${clientId}`);
    return data;
}

// ─── Create Client ────────────────────────────────────────────
export async function createClient(payload: ClientCreateRequest): Promise<{ clientId: number; resourceId: number; officeId: number }> {
    const { data } = await client.post<{ clientId: number; resourceId: number; officeId: number }>("/clients", {
        officeId: 1,
        legalFormId: 1,
        firstname: "Petra",
        lastname: "Yton",
        externalId: "786YYH7",
        dateFormat: "dd MMMM yyyy",
        locale: "en",
        active: true,
        activationDate: "04 March 2009",
        submittedOnDate: "04 March 2009",
        savingsProductId: 1,
        datatables: [
            {
                registeredTableName: "Family Details",
                data: {
                    locale: "en",
                    "Number of members": "5",
                    "Number of dependents": "3",
                    "No of Children": "2",
                    "Date of verification": "14 December 2016",
                    dateFormat: "dd MMMM yyyy",
                },
            },
            {
                registeredTableName: "Residency Address",
                data: {
                    locale: "en",
                    "Address Line": "Basavana Gudi Road",
                    Street: "Gandhi Bazaar",
                    Landmark: "Aashrama",
                    COUNTRY_cd_Country: 17,
                    STATE_cd_State: "7",
                    DISTRICT_cd_District: "13",
                    Pincode: "560040",
                },
                clientId: 2,
                groupId: 1,
                officeId: 1,
                resourceExternalId: "123-456",
                resourceId: 2,
            },
        ],
    });
    return data;
}

// ─── Update Client ────────────────────────────────────────────
export async function updateClient(
    clientId: number | string,
    payload: ClientUpdateRequest,
): Promise<{ clientId: number; resourceId: number; officeId: number }> {
    const { data } = await client.put<{ clientId: number; resourceId: number; officeId: number }>(`/clients/${clientId}`, payload);
    return data;
}

// ─── Activate Client ──────────────────────────────────────────
export async function activateClient(
    clientId: number | string,
    payload: ClientActivateRequest = {},
): Promise<{ clientId: number; resourceId: number }> {
    const { data } = await client.post<{ clientId: number; resourceId: number }>(`/clients/${clientId}`, null, {
        params: { command: "activate", ...payload },
    });
    return data;
}

// ─── Delete Client ────────────────────────────────────────────
export async function deleteClient(clientId: number | string): Promise<{ clientId: number; resourceId: number }> {
    const { data } = await client.delete<{ clientId: number; resourceId: number }>(`/clients/${clientId}`);
    return data;
}

// ─── Client Template ──────────────────────────────────────────
export async function fetchClientTemplate(): Promise<ClientTemplate> {
    const { data } = await client.get<ClientTemplate>("/clients/template");
    return data;
}
