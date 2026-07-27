import client from "@/api/client";

export interface SearchResult {
  entityType: string;
  entityId: number;
  entityName: string;
  entityAccountNo: string;
  entityExternalId: string;
  parentType: string;
  parentId: number;
  parentName: string;
  entityStatus: { id: number; code: string; value: string };
}

export interface SearchParams {
  query: string;
  resource?: string;
  exactMatch?: boolean;
}

export async function search(params: SearchParams): Promise<SearchResult[]> {
  const { data } = await client.get<SearchResult[]>("/search", { params });
  return Array.isArray(data) ? data : [];
}
