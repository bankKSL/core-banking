import type { Client } from "../types/client";
import { CLIENT_STATUS_LABELS } from "../constants/status";

/** Get a human-readable full name from a Client */
export function getClientDisplayName(client: Client): string {
    return client.displayName ?? client.fullname ?? formatClientName(client);
}

/** Format client name from individual fields */
export function formatClientName(client: Client): string {
    const parts = [client.firstname, client.middlename, client.lastname].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : `Client #${client.id}`;
}

/** Extract the status string from a Client object */
export function getClientStatus(client: Client): string {
    return client.status?.code ?? client.status?.value ?? "unknown";
}

/**
 * Normalize a date value from Fineract to a Date object.
 * Handles:
 *  - string in "yyyy-MM-dd" format
 *  - string in "yyyy-MM-dd" format
 *  - number array [year, month, day] (Fineract array format)
 *  - ISO date string with "T"
 */
function normalizeDate(value: unknown): Date | null {
    if (!value) return null;

    // Number array [year, month, day]
    if (Array.isArray(value) && value.length >= 3) {
        const [y, m, d] = value;
        return new Date(y, m - 1, d);
    }

    if (typeof value === "string") {
        // Already in "yyyy-MM-dd" (contains alpha month)
        const parsed = Date.parse(value);
        if (!isNaN(parsed)) return new Date(parsed);

        // Try yyyy-MM-dd or yyyy-MM-ddTHH:mm:ss
        const dashMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (dashMatch) {
            return new Date(Number(dashMatch[1]), Number(dashMatch[2]) - 1, Number(dashMatch[3]));
        }

        // Fallback
        const fallback = new Date(value);
        if (!isNaN(fallback.getTime())) return fallback;
    }

    return null;
}

/** Format date for display — handles string or Fineract number[] */
export function formatClientDate(dateStr?: unknown): string {
    const date = normalizeDate(dateStr);
    if (!date) return "—";
    try {
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return String(dateStr);
    }
}

/** Calculate age — handles string or Fineract number[] */
export function calculateAge(dateOfBirth?: unknown): number | null {
    const date = normalizeDate(dateOfBirth);
    if (!date) return null;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--;
    }
    return age;
}
