import { useQuery } from "@tanstack/react-query";
import { search, type SearchParams } from "../api/search";

export const searchKeys = {
  all: ["search"] as const,
  results: (params: SearchParams) => [...searchKeys.all, params] as const,
};

export function useSearch(query: string, resources?: string, exactMatch?: boolean) {
  const params: SearchParams = { query, resource: resources, exactMatch };

  return useQuery({
    queryKey: searchKeys.results(params),
    queryFn: () => search(params),
    enabled: !!query,
  });
}
