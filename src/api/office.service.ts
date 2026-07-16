import api from "./client";
import type { Office, OfficeCreateRequest, OfficeUpdateRequest } from "@/types";

// ─── Office Service ───────────────────────────────────────────
const OFFICES = "/offices";

export const officeService = {
    /** List all offices */
    list: async (): Promise<Office[]> => {
        const { data } = await api.get<Office[]>(OFFICES);
        // Normalize Fineract date arrays [yyyy,mm,dd] to ISO strings
        return (Array.isArray(data) ? data : []).map(normalizeOffice);
    },

    /** Get single office by id */
    getById: async (id: number): Promise<Office> => {
        const { data } = await api.get<Office>(`${OFFICES}/${id}`);
        return normalizeOffice(data);
    },

    /** Create a new office */
    create: async (payload: OfficeCreateRequest): Promise<Office> => {
        const body = {
            ...payload,
            dateFormat: payload.dateFormat ?? "dd MMMM yyyy",
            locale: payload.locale ?? "en",
        };
        const { data } = await api.post<{ officeId: number; resourceId: number }>(OFFICES, body);
        return { id: data.officeId } as Office;
    },

    /** Update an existing office */
    update: async (id: number, payload: OfficeUpdateRequest): Promise<Office> => {
        const body = {
            ...payload,
            dateFormat: payload.dateFormat ?? "dd MMMM yyyy",
            locale: payload.locale ?? "en",
        };
        const { data } = await api.put<{ officeId: number; resourceId: number }>(`${OFFICES}/${id}`, body);
        return { id: data.officeId } as Office;
    },
};

/** Convert Fineract [yyyy,mm,dd] date arrays to ISO strings */
function normalizeOffice(raw: any): Office {
    return {
        ...raw,
        openingDate: Array.isArray(raw.openingDate)
            ? new Date(raw.openingDate[0], raw.openingDate[1] - 1, raw.openingDate[2]).toISOString().split("T")[0]
            : raw.openingDate ?? "",
    };
}
