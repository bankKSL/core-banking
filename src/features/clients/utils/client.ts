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

/** Format date string for display */
export function formatClientDate(dateStr?: string): string {
    if (!dateStr) return "—";
    try {
        const date = dateStr.includes("T") ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return dateStr;
    }
}

/** Calculate age from date of birth */
export function calculateAge(dateOfBirth?: string): number | null {
    if (!dateOfBirth) return null;
    const [y, m, d] = dateOfBirth.split("-").map(Number);
    if (!y || !m || !d) return null;
    const birth = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}
