import api from "@/api/client";
import type {
  JobNamesResponse,
  AvailableStepsResponse,
  StepConfigResponse,
  UpdateStepsRequest,
  OldestCOBClosedResponse,
  IsCatchUpRunningResponse,
  LockedLoansResponse,
  CatchUpResult,
} from "../types/cob";

export async function fetchJobNames(): Promise<JobNamesResponse> {
  const { data } = await api.get<JobNamesResponse>("/jobs/names");
  return data;
}

export async function fetchSteps(jobName: string): Promise<StepConfigResponse> {
  const { data } = await api.get<StepConfigResponse>(`/jobs/${jobName}/steps`);
  return data;
}

export async function fetchAvailableSteps(jobName: string): Promise<AvailableStepsResponse> {
  const { data } = await api.get<AvailableStepsResponse>(`/jobs/${jobName}/available-steps`);
  console.log({ data });

  return data;
}

export async function updateSteps(jobName: string, payload: UpdateStepsRequest): Promise<void> {
  await api.put(`/jobs/${jobName}/steps`, payload);
}

export async function fetchOldestCOBClosed(): Promise<OldestCOBClosedResponse | null> {
  try {
    const { data } = await api.get<OldestCOBClosedResponse>("/loans/oldest-cob-closed");
    return data;
  } catch {
    return null;
  }
}

export async function executeCatchUp(): Promise<CatchUpResult> {
  const response = await api.post("/loans/catch-up");
  return response.status as CatchUpResult;
}

export async function fetchIsCatchUpRunning(): Promise<IsCatchUpRunningResponse> {
  const { data } = await api.get<IsCatchUpRunningResponse>("/loans/is-catch-up-running");
  return data;
}

export async function fetchLockedLoans(page = 0, limit = 50): Promise<LockedLoansResponse> {
  const { data } = await api.get<LockedLoansResponse>("/loans/locked", {
    params: { page, limit },
  });
  return data;
}
