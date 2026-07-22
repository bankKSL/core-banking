import client from "@/api/client";

export async function fetchFunds(): Promise<Array<{ id: number; name: string }>> {
    const { data } = await client.get<Array<{ id: number; name: string }>>("/funds");
    return data;
}
