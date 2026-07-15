import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { officeService } from "@/api/office.service";
import type { Office, OfficeCreateRequest, OfficeUpdateRequest } from "@/types";

const OFFICE_KEY = "offices";

// ─── useOffices ───────────────────────────────────────────────
/** Fetch all offices */
export function useOffices() {
    return useQuery<Office[]>({
        queryKey: [OFFICE_KEY],
        queryFn: officeService.list,
        staleTime: 60_000,
    });
}

// ─── useOffice ────────────────────────────────────────────────
/** Fetch a single office by id */
export function useOffice(id: number | null) {
    return useQuery<Office>({
        queryKey: [OFFICE_KEY, id],
        queryFn: () => officeService.getById(id!),
        enabled: id !== null && id > 0,
        staleTime: 60_000,
    });
}

// ─── useCreateOffice ──────────────────────────────────────────
/** Create a new office */
export function useCreateOffice() {
    const qc = useQueryClient();
    return useMutation<Office, Error, OfficeCreateRequest>({
        mutationFn: (payload) => officeService.create(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [OFFICE_KEY] });
        },
    });
}

// ─── useUpdateOffice ──────────────────────────────────────────
/** Update an existing office */
export function useUpdateOffice() {
    const qc = useQueryClient();
    return useMutation<Office, Error, { id: number; payload: OfficeUpdateRequest }>({
        mutationFn: ({ id, payload }) => officeService.update(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [OFFICE_KEY] });
        },
    });
}
