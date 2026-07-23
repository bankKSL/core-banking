import client from "@/api/client";
import { currentDate } from "@/lib/utils";

// ─── Transfer Types ─────────────────────────────────────────────

export interface MiniAccount {
  id: number;
  accountNo: string;
  productName: string;
}

export interface Transfer {
  id?: number;
  fromAccount?: { id?: number };
  toAccount?: { id?: number };
  currency?: { code?: string };
  transferAmount?: number;
  transferDate?: number[];
  transferDescription?: string;
}

export interface TransferListResponse {
  pageItems?: Transfer[];
}

export interface TransferRequest {
  fromOfficeId: string;
  fromClientId: string;
  fromAccountType: string;
  fromAccountId: string;
  toOfficeId: string;
  toClientId: string;
  toAccountType: string;
  toAccountId: string;
  transferDate: string;
  transferAmount: string;
  transferDescription: string;
  dateFormat: string;
  locale: string;
}

// ─── Standing Instruction Types ─────────────────────────────────

export interface StandingInstruction {
  id?: number;
  name?: string;
  fromClient?: { displayName?: string };
  fromAccount?: { accountNo?: string };
  toClient?: { displayName?: string };
  toAccount?: { accountNo?: string };
  amount?: number;
  status?: string;
  validFrom?: number[];
  validTill?: number[];
  transferType?: { id?: number };
  priority?: { id?: number };
  instructionType?: { id?: number };
  recurrenceType?: { id?: number };
  fromOffice?: { id?: number };
  fromClientId?: number;
  fromAccountType?: number;
  fromAccountId?: number;
  toOffice?: { id?: number };
  toClientId?: number;
  toAccountType?: number;
  toAccountId?: number;
}

export interface StandingInstructionListResponse {
  pageItems?: StandingInstruction[];
}

export interface StandingInstructionRequest {
  name: string;
  fromOfficeId: string;
  fromClientId: string;
  fromAccountType: string;
  fromAccountId: string;
  toOfficeId: string;
  toClientId: string;
  toAccountType: string;
  toAccountId: string;
  transferType: string;
  amount: string;
  instructionType: string;
  priority: string;
  recurrenceType: string;
  status: string;
  validFrom: string;
  validTill?: string;
  dateFormat: string;
  locale: string;
  monthDayFormat: string;
}

export interface StandingInstructionHistoryItem {
  name?: string;
  fromClientName?: string;
  fromAccount?: { accountNo?: string };
  toClientName?: string;
  toAccount?: { accountNo?: string };
  amount?: number;
  executionTime?: number[];
  status?: string;
  errorLog?: string;
}

export interface StandingInstructionHistoryResponse {
  pageItems?: StandingInstructionHistoryItem[];
}

// ─── Office / Client types ──────────────────────────────────────

export interface Office {
  id: number;
  name: string;
  nameDecorated: string;
}

export interface ClientSummary {
  id: number;
  displayName: string;
  officeId: number;
}

// ─── Date Helpers ───────────────────────────────────────────────

/** Parse Finfact date arrays [yyyy, mm, dd] into a Date */
export function parseDate(transferDate: unknown): Date | null {
  if (transferDate == null) return null;
  if (Array.isArray(transferDate) && transferDate.length >= 3) {
    return new Date(transferDate[0], transferDate[1] - 1, transferDate[2]);
  }
  if (typeof transferDate === "string" || typeof transferDate === "number") {
    return new Date(transferDate);
  }
  return null;
}

// ─── API Functions ──────────────────────────────────────────────

/** GET /accounttransfers — list all transfers */
export async function fetchTransfers(): Promise<TransferListResponse> {
  const { data } = await client.get<TransferListResponse>("/accounttransfers");
  return data;
}

/** POST /accounttransfers — create a new transfer */
export async function createTransfer(payload: TransferRequest): Promise<unknown> {
  const { data } = await client.post("/accounttransfers", payload);
  return data;
}

/** GET /offices — list all offices */
export async function fetchOffices(): Promise<Office[]> {
  const { data } = await client.get<Office[]>("/offices");
  return Array.isArray(data) ? data : [];
}

/** GET /clients?officeId= — list clients for a given office */
export async function fetchClientsByOffice(officeId: number): Promise<ClientSummary[]> {
  const { data } = await client.get<{ pageItems?: ClientSummary[] }>("/clients", {
    params: { officeId },
  });

  return data?.pageItems ?? [];
}

/** GET /clients/{clientId}/accounts — returns loanAccounts[] and savingsAccounts[] */
export async function fetchClientAccounts2(clientId: number): Promise<{
  loanAccounts: MiniAccount[];
  savingsAccounts: MiniAccount[];
}> {
  const { data } = await client.get<{
    loanAccounts: MiniAccount[];
    savingsAccounts: MiniAccount[];
  }>(`/clients/${clientId}/accounts`);
  return data;
}

// ─── Standing Instruction API ───────────────────────────────────

/** GET /standinginstructions — list all standing instructions */
export async function fetchStandingInstructions(): Promise<StandingInstructionListResponse> {
  const { data } = await client.get<StandingInstructionListResponse>("/standinginstructions");
  return data;
}

/** GET /standinginstructions/{id} — get single standing instruction */
export async function fetchStandingInstruction(id: number | string): Promise<StandingInstruction> {
  const { data } = await client.get<StandingInstruction>(`/standinginstructions/${id}`);
  return data;
}

/** POST /standinginstructions — create new standing instruction */
export async function createStandingInstruction(payload: StandingInstructionRequest): Promise<unknown> {
  const { data } = await client.post("/standinginstructions", payload);
  return data;
}

/** PUT /standinginstructions/{id} — update existing standing instruction */
export async function updateStandingInstruction(
  id: number | string,
  payload: StandingInstructionRequest,
): Promise<unknown> {
  const { data } = await client.put(`/standinginstructions/${id}`, payload);
  return data;
}

/** GET /standinginstructionrunhistory — list history */
export async function fetchStandingInstructionHistory(): Promise<StandingInstructionHistoryResponse> {
  const { data } = await client.get<StandingInstructionHistoryResponse>("/standinginstructionrunhistory");
  return data;
}

// ─── Request Builders ───────────────────────────────────────────

/** Build a TransferRequest from form state, converting all IDs to strings */
export function buildTransferRequest(params: {
  fromOfficeId: number;
  fromClientId: number;
  fromAccountType: number;
  fromAccountId: number;
  toOfficeId: number;
  toClientId: number;
  toAccountType: number;
  toAccountId: number;
  transferDate: string;
  transferAmount: number;
  transferDescription: string;
}): TransferRequest {
  return {
    fromOfficeId: String(params.fromOfficeId),
    fromClientId: String(params.fromClientId),
    fromAccountType: String(params.fromAccountType),
    fromAccountId: String(params.fromAccountId),
    toOfficeId: String(params.toOfficeId),
    toClientId: String(params.toClientId),
    toAccountType: String(params.toAccountType),
    toAccountId: String(params.toAccountId),
    transferDate: currentDate(params.transferDate) ?? params.transferDate,
    transferAmount: String(params.transferAmount),
    transferDescription: params.transferDescription,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  };
}

/** Build a StandingInstructionRequest from form state, converting all IDs to strings */
export function buildStandingInstructionRequest(params: {
  name: string;
  fromOfficeId: number;
  fromClientId: number;
  fromAccountType: number;
  fromAccountId: number;
  toOfficeId: number;
  toClientId: number;
  toAccountType: number;
  toAccountId: number;
  transferType: number;
  amount: number;
  instructionType: number;
  priority: number;
  recurrenceType: number;
  status: number;
  validFrom: string;
  validTill?: string;
}): StandingInstructionRequest {
  return {
    name: params.name,
    fromOfficeId: String(params.fromOfficeId),
    fromClientId: String(params.fromClientId),
    fromAccountType: String(params.fromAccountType),
    fromAccountId: String(params.fromAccountId),
    toOfficeId: String(params.toOfficeId),
    toClientId: String(params.toClientId),
    toAccountType: String(params.toAccountType),
    toAccountId: String(params.toAccountId),
    transferType: String(params.transferType),
    amount: String(params.amount),
    instructionType: String(params.instructionType),
    priority: String(params.priority),
    recurrenceType: String(params.recurrenceType),
    status: String(params.status),
    validFrom: currentDate(params.validFrom) ?? params.validFrom,
    validTill: params.validTill ? (currentDate(params.validTill) ?? params.validTill) : undefined,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
    monthDayFormat: "dd MMMM",
  };
}
