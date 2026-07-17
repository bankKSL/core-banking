import { useQuery } from "@tanstack/react-query";
import { fetchClientTemplate } from "../api/client";
import { clientKeys } from "./useClients";

/**
 * Query hook for fetching client template data (offices, staff, genders, etc.).
 * Used by Create/Edit Client forms for dropdowns.
 */
export function useClientTemplate() {
    return useQuery({
        queryKey: clientKeys.template,
        queryFn: fetchClientTemplate,
        staleTime: 5 * 60_000, // Template data changes rarely
    });
}
