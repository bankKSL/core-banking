import client from "./client";

// ─── Batch Request / Response Types ─────────────────────────────

export interface BatchRequest {
  requestId?: number;
  relativeUrl: string;
  method: string;
  headers?: Record<string, string>;
  reference?: string;
  body?: unknown;
}

export interface BatchResponse {
  requestId?: number;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
  reference?: string;
}

// ─── API Call: Execute Batch Request ────────────────────────────

/**
 * POST /api/v2/batches
 * Executes a batch of API requests in a single HTTP call.
 * @param body - Array of batch request objects
 * @param enclose - Whether to enclose in a transaction
 */
export async function postBatches(body: BatchRequest[], enclose: boolean): Promise<BatchResponse[]> {
  const { data } = await client.post<BatchResponse[] | BatchResponse>("/batches", body, {
    params: { enclose },
  });
  // Normalize: wrap single response in array
  return Array.isArray(data) ? data : [data];
}
