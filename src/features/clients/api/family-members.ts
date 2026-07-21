import client from "@/api/client";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ClientFamilyMember {
    id: number;
    clientId: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    fullname?: string;
    relationship?: { id: number; code?: string; name?: string; value?: string };
    relationshipId?: number;
    gender?: { id: number; code?: string; name?: string; value?: string };
    genderId?: number;
    maritalStatus?: { id: number; code?: string; name?: string; value?: string };
    maritalStatusId?: number;
    profession?: { id: number; code?: string; name?: string; value?: string };
    professionId?: number;
    dateOfBirth?: string | number[];
    age?: number;
    qualification?: string;
    mobileNumber?: string;
    isDependent?: boolean;
}

export interface ClientFamilyMemberRequest {
    firstName: string;
    middleName?: string;
    lastName: string;
    relationshipId: number;
    genderId: number;
    maritalStatusId?: number;
    professionId?: number;
    dateOfBirth?: string;
    age?: number;
    qualification?: string;
    mobileNumber?: string;
    isDependent?: boolean;
}

export interface ClientFamilyMemberTemplate {
    relationshipIdOptions: Array<{ id: number; name: string; position?: number }>;
    genderIdOptions: Array<{ id: number; name: string; active?: boolean }>;
    maritalStatusIdOptions: Array<{ id: number; name: string; position?: number }>;
    professionIdOptions: Array<{ id: number; name: string; position?: number }>;
}

export interface ClientFamilyMemberCommandResponse {
    clientId: number;
    resourceId: number;
}

// ─── API Functions ─────────────────────────────────────────────────────

/**
 * GET /clients/{clientId}/familymembers
 * List all family members for a client.
 */
export async function fetchClientFamilyMembers(
    clientId: number | string,
): Promise<ClientFamilyMember[]> {
    const { data } = await client.get<ClientFamilyMember[]>(
        `/clients/${clientId}/familymembers`,
    );
    return data;
}

/**
 * GET /clients/{clientId}/familymembers/template
 * Get the template for creating/editing family members.
 */
export async function fetchClientFamilyMemberTemplate(
    clientId: number | string,
): Promise<ClientFamilyMemberTemplate> {
    const { data } = await client.get<ClientFamilyMemberTemplate>(
        `/clients/${clientId}/familymembers/template`,
    );
    return data;
}

/**
 * GET /clients/{clientId}/familymembers/{familyMemberId}
 * Get a single family member by ID.
 */
export async function fetchClientFamilyMember(
    clientId: number | string,
    familyMemberId: number | string,
): Promise<ClientFamilyMember> {
    const { data } = await client.get<ClientFamilyMember>(
        `/clients/${clientId}/familymembers/${familyMemberId}`,
    );
    return data;
}

/**
 * POST /clients/{clientId}/familymembers
 * Create a new family member for a client.
 */
export async function createClientFamilyMember(
    clientId: number | string,
    payload: ClientFamilyMemberRequest,
): Promise<ClientFamilyMemberCommandResponse> {
    const { data } = await client.post<ClientFamilyMemberCommandResponse>(
        `/clients/${clientId}/familymembers`,
        payload,
    );
    return data;
}

/**
 * PUT /clients/{clientId}/familymembers/{familyMemberId}
 * Update an existing family member.
 */
export async function updateClientFamilyMember(
    clientId: number | string,
    familyMemberId: number | string,
    payload: Partial<ClientFamilyMemberRequest>,
): Promise<ClientFamilyMemberCommandResponse> {
    const { data } = await client.put<ClientFamilyMemberCommandResponse>(
        `/clients/${clientId}/familymembers/${familyMemberId}`,
        payload,
    );
    return data;
}

/**
 * DELETE /clients/{clientId}/familymembers/{familyMemberId}
 * Delete a family member.
 */
export async function deleteClientFamilyMember(
    clientId: number | string,
    familyMemberId: number | string,
): Promise<ClientFamilyMemberCommandResponse> {
    const { data } = await client.delete<ClientFamilyMemberCommandResponse>(
        `/clients/${clientId}/familymembers/${familyMemberId}`,
    );
    return data;
}
