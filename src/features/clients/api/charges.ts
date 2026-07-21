import client from "@/api/client";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ClientCharge {
    id: number;
    chargeId: number;
    clientId: number;
    name?: string;
    chargeTimeType?: { id: number; code: string; value: string };
    chargeCalculationType?: { id: number; code: string; value: string };
    currency?: {
        code: string;
        name: string;
        decimalPlaces: number;
        displaySymbol?: string;
        nameCode?: string;
        displayLabel?: string;
    };
    amount: number;
    amountPaid?: number;
    amountOutstanding?: number;
    amountWaived?: number;
    amountWrittenOff?: number;
    dueDate?: string;
    isActive?: boolean;
    isPaid?: boolean;
    isWaived?: boolean;
    waiverable?: boolean;
    penalty?: boolean;
}

export interface ClientChargeListResponse {
    totalFilteredRecords?: number;
    pageItems?: ClientCharge[];
}

export interface PostClientChargeRequest {
    chargeId: number;
    amount: number;
    dueDate?: string;
    dateFormat?: string;
    locale?: string;
}

export interface ClientChargesTemplate {
    chargeOptions?: Array<{
        id: number;
        name: string;
        amount?: number;
        chargeTimeType?: { id: number; code: string; value: string };
        chargeCalculationType?: { id: number; code: string; value: string };
        currency?: { code: string; name: string; decimalPlaces: number };
    }>;
}

export interface ClientChargeCommandResponse {
    clientId: number;
    resourceId: number;
    officeId?: number;
}

// ─── API Functions ─────────────────────────────────────────────────────

/**
 * GET /clients/{clientId}/charges
 * List all charges for a client.
 */
export async function fetchClientCharges(
    clientId: number | string,
    params?: {
        offset?: number;
        limit?: number;
        chargeStatus?: "all" | "active" | "inactive";
    },
): Promise<ClientChargeListResponse> {
    const { data } = await client.get<ClientChargeListResponse>(
        `/clients/${clientId}/charges`,
        { params },
    );
    return data;
}

/**
 * GET /clients/{clientId}/charges/template
 * Get the template for creating a charge (loads charge options).
 */
export async function fetchClientChargesTemplate(
    clientId: number | string,
): Promise<ClientChargesTemplate> {
    const { data } = await client.get<ClientChargesTemplate>(
        `/clients/${clientId}/charges/template`,
    );
    return data;
}

/**
 * POST /clients/{clientId}/charges
 * Create/pay a charge for a client.
 */
export async function createClientCharge(
    clientId: number | string,
    payload: PostClientChargeRequest,
): Promise<ClientChargeCommandResponse> {
    const { data } = await client.post<ClientChargeCommandResponse>(
        `/clients/${clientId}/charges`,
        payload,
    );
    return data;
}

/**
 * POST /clients/{clientId}/charges/{chargeId}?command=waive
 * Waive a charge for a client.
 */
export async function waiveClientCharge(
    clientId: number | string,
    chargeId: number | string,
): Promise<ClientChargeCommandResponse> {
    const { data } = await client.post<ClientChargeCommandResponse>(
        `/clients/${clientId}/charges/${chargeId}`,
        {},
        { params: { command: "waive" } },
    );
    return data;
}

/**
 * DELETE /clients/{clientId}/charges/{chargeId}
 * Delete a charge from a client.
 */
export async function deleteClientCharge(
    clientId: number | string,
    chargeId: number | string,
): Promise<ClientChargeCommandResponse> {
    const { data } = await client.delete<ClientChargeCommandResponse>(
        `/clients/${clientId}/charges/${chargeId}`,
    );
    return data;
}
