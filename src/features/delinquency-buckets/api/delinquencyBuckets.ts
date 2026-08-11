import client from "@/api/client";
import type {
  DelinquencyBucket,
  DelinquencyBucketCreateRequest,
  DelinquencyBucketTemplate,
  DelinquencyBucketUpdateRequest,
} from "../types/delinquencyBucket";

export async function fetchDelinquencyBucketTemplate(): Promise<DelinquencyBucketTemplate> {
  const { data } = await client.get<DelinquencyBucketTemplate>("/delinquency/buckets/template");
  return data;
}

export async function fetchDelinquencyBuckets(): Promise<DelinquencyBucket[]> {
  const { data } = await client.get<DelinquencyBucket[]>("/delinquency/buckets");
  return data;
}

export async function fetchDelinquencyBucket(id: number): Promise<DelinquencyBucket> {
  const { data } = await client.get<DelinquencyBucket>(`/delinquency/buckets/${id}`);
  return data;
}

export async function createDelinquencyBucket(
  payload: DelinquencyBucketCreateRequest,
): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/delinquency/buckets", payload);
  return data;
}

export async function updateDelinquencyBucket(
  id: number,
  payload: DelinquencyBucketUpdateRequest,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/delinquency/buckets/${id}`, payload);
  return data;
}

export async function deleteDelinquencyBucket(id: number): Promise<void> {
  await client.delete(`/delinquency/buckets/${id}`);
}
