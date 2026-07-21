import client from "@/api/client";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ClientCollateral {
    id: number;
    clientId: number;
    collateralId: number;
    name?: string;
    quantity: number;
    unitPrice?: number;
    totalCollateral?: number;
    total?: number;
    type?: string;
    description?: string;
}

export interface ClientCollateralRequest {
    collateralId: number;
    quantity: number;
    locale?: string;
}

export interface ClientCollateralUpdateRequest {
    quantity: number;
    locale?: string;
}

export interface ClientCollateralTemplate {
    collateralOptions: Array<{
        id: number;
        name: string;
        description?: string;
        position?: number;
    }>;
}

export interface ClientCollateralCommandResponse {
    clientId: number;
    resourceId: number;
}

// ─── API Functions ─────────────────────────────────────────────────────

/**
 * GET /clients/{clientId}/collaterals
 * List all collaterals for a client.
 */
export async function fetchClientCollaterals(
    clientId: number | string,
): Promise<ClientCollateral[]> {
    const { data } = await client.get<ClientCollateral[]>(
        `/clients/${clientId}/collaterals`,
    );
    return data;
}

/**
 * GET /clients/{clientId}/collaterals/template
 * Get the template for creating a collateral (loads collateral options).
 */
export async function fetchClientCollateralTemplate(
    clientId: number | string,
): Promise<ClientCollateralTemplate> {
    const { data } = await client.get<ClientCollateralTemplate>(
        `/clients/${clientId}/collaterals/template`,
    );
    return data;
}

/**
 * GET /clients/{clientId}/collaterals/{collateralId}
 * Get a single collateral by ID.
 */
export async function fetchClientCollateral(
    clientId: number | string,
    collateralId: number | string,
): Promise<ClientCollateral> {
    const { data } = await client.get<ClientCollateral>(
        `/clients/${clientId}/collaterals/${collateralId}`,
    );
    return data;
}

/**
 * POST /clients/{clientId}/collaterals
 * Create a new collateral for a client.
 */
export async function createClientCollateral(
    clientId: number | string,
    payload: ClientCollateralRequest,
): Promise<ClientCollateralCommandResponse> {
    const { data } = await client.post<ClientCollateralCommandResponse>(
        `/clients/${clientId}/collaterals`,
        payload,
    );
    return data;
}

/**
 * PUT /clients/{clientId}/collaterals/{collateralId}
 * Update an existing collateral (cannot change collateral type/product in edit mode).
 */
export async function updateClientCollateral(
    clientId: number | string,
    collateralId: number | string,
    payload: ClientCollateralUpdateRequest,
): Promise<ClientCollateralCommandResponse> {
    const { data } = await client.put<ClientCollateralCommandResponse>(
        `/clients/${clientId}/collaterals/${collateralId}`,
        payload,
    );
    return data;
}

/**
 * DELETE /clients/{clientId}/collaterals/{collateralId}
 * Delete a collateral.
 */
export async function deleteClientCollateral(
    clientId: number | string,
    collateralId: number | string,
): Promise<ClientCollateralCommandResponse> {
    const { data } = await client.delete<ClientCollateralCommandResponse>(
        `/clients/${clientId}/collaterals/${collateralId}`,
    );
    return data;
}
