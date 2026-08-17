import client from "@/api/client";
import type {
  GLAccountData,
  GLAccountListParams,
  CreateGLAccountRequest,
  UpdateGLAccountRequest,
  JournalEntryData,
  JournalEntryListParams,
  CreateJournalEntryRequest,
  AccountingRuleData,
  CreateAccountingRuleRequest,
  FinancialActivityAccountData,
  CreateFinancialActivityMappingRequest,
  GLClosureData,
  CreateGLClosureRequest,
  ExecutePeriodicAccrualRequest,
  ProvisioningEntryData,
  CreateProvisioningEntryRequest,
  CommandProcessingResult,
  Page,
} from "../types/accounting";

// ─── GL Accounts ─────────────────────────────────────────────────

export async function fetchGLAccounts(params: GLAccountListParams = {}): Promise<GLAccountData[]> {
  const { data } = await client.get<GLAccountData[]>("/glaccounts", { params });
  return data ?? [];
}

export async function fetchGLAccount(id: number | string, template = false): Promise<GLAccountData> {
  const { data } = await client.get<GLAccountData>(`/glaccounts/${id}`, {
    params: template ? { template: true } : {},
  });
  return data;
}

export async function fetchGLAccountTemplate(type?: number): Promise<GLAccountData> {
  const { data } = await client.get<GLAccountData>("/glaccounts/template", {
    params: type ? { type } : {},
  });
  return data;
}

export async function createGLAccount(payload: CreateGLAccountRequest): Promise<CommandProcessingResult> {
  const { data } = await client.post<CommandProcessingResult>("/glaccounts", payload);
  return data;
}

export async function updateGLAccount(
  id: number | string,
  payload: UpdateGLAccountRequest,
): Promise<CommandProcessingResult> {
  const { data } = await client.put<CommandProcessingResult>(`/glaccounts/${id}`, payload);
  return data;
}

export async function deleteGLAccount(id: number | string): Promise<CommandProcessingResult> {
  const { data } = await client.delete<CommandProcessingResult>(`/glaccounts/${id}`);
  return data;
}

// ─── Journal Entries ─────────────────────────────────────────────

export async function fetchJournalEntries(params: JournalEntryListParams = {}): Promise<Page<JournalEntryData>> {
  const { data } = await client.get<Page<JournalEntryData>>("/journalentries", {
    params: { orderBy: "transactionDate", sortOrder: "DESC", ...params },
  });
  return data;
}

export async function fetchJournalEntry(id: number | string): Promise<JournalEntryData> {
  const { data } = await client.get<JournalEntryData>(`/journalentries/${id}`);
  return data;
}

export async function createJournalEntry(payload: CreateJournalEntryRequest): Promise<CommandProcessingResult> {
  const { data } = await client.post<CommandProcessingResult>("/journalentries", {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function reverseJournalEntry(
  transactionId: string,
  officeId: number,
): Promise<CommandProcessingResult> {
  const { data } = await client.post<CommandProcessingResult>(
    `/journalentries/${transactionId}`,
    { officeId },
    { params: { command: "reverse" } },
  );
  return data;
}

// ─── Accounting Rules ────────────────────────────────────────────

export async function fetchAccountingRules(associations = true): Promise<AccountingRuleData[]> {
  const { data } = await client.get<AccountingRuleData[]>("/accountingrules", {
    params: associations ? { associations: "all" } : {},
  });
  return data ?? [];
}

export async function fetchAccountingRule(id: number | string, template = false): Promise<AccountingRuleData> {
  const { data } = await client.get<AccountingRuleData>(`/accountingrules/${id}`, {
    params: template ? { template: true } : {},
  });
  return data;
}

export async function fetchAccountingRuleTemplate(): Promise<AccountingRuleData> {
  const { data } = await client.get<AccountingRuleData>("/accountingrules/template");
  return data;
}

export async function createAccountingRule(payload: CreateAccountingRuleRequest): Promise<CommandProcessingResult> {
  const { data } = await client.post<CommandProcessingResult>("/accountingrules", payload);
  return data;
}

export async function updateAccountingRule(
  id: number | string,
  payload: Partial<CreateAccountingRuleRequest>,
): Promise<CommandProcessingResult> {
  const { data } = await client.put<CommandProcessingResult>(`/accountingrules/${id}`, payload);
  return data;
}

export async function deleteAccountingRule(id: number | string): Promise<CommandProcessingResult> {
  const { data } = await client.delete<CommandProcessingResult>(`/accountingrules/${id}`);
  return data;
}

// ─── Financial Activity Account Mappings ─────────────────────────

export async function fetchFinancialActivityAccounts(): Promise<FinancialActivityAccountData[]> {
  const { data } = await client.get<FinancialActivityAccountData[]>("/financialactivityaccounts");
  return data ?? [];
}

export async function fetchFinancialActivityAccount(id: number | string): Promise<FinancialActivityAccountData> {
  const { data } = await client.get<FinancialActivityAccountData>(`/financialactivityaccounts/${id}`);
  return data;
}

export async function fetchFinancialActivityAccountTemplate(): Promise<FinancialActivityAccountData> {
  const { data } = await client.get<FinancialActivityAccountData>("/financialactivityaccounts/template");
  return data;
}

export async function createFinancialActivityMapping(
  payload: CreateFinancialActivityMappingRequest,
): Promise<CommandProcessingResult> {
  const { data } = await client.post<CommandProcessingResult>("/financialactivityaccounts", payload);
  return data;
}

export async function updateFinancialActivityMapping(
  id: number | string,
  payload: Partial<CreateFinancialActivityMappingRequest>,
): Promise<CommandProcessingResult> {
  const { data } = await client.put<CommandProcessingResult>(`/financialactivityaccounts/${id}`, payload);
  return data;
}

export async function deleteFinancialActivityMapping(id: number | string): Promise<CommandProcessingResult> {
  const { data } = await client.delete<CommandProcessingResult>(`/financialactivityaccounts/${id}`);
  return data;
}

// ─── Accounting Closures (GL Closures) ───────────────────────────

export async function fetchGLClosures(officeId?: number): Promise<GLClosureData[]> {
  const { data } = await client.get<GLClosureData[]>("/glclosures", {
    params: officeId ? { officeId } : {},
  });
  return data ?? [];
}

export async function fetchGLClosure(id: number | string, template = false): Promise<GLClosureData> {
  const { data } = await client.get<GLClosureData>(`/glclosures/${id}`, {
    params: template ? { template: true } : {},
  });
  return data;
}

export async function createGLClosure(payload: CreateGLClosureRequest): Promise<CommandProcessingResult> {
  const { data } = await client.post<CommandProcessingResult>("/glclosures", {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function updateGLClosure(
  id: number | string,
  payload: { comments: string },
): Promise<CommandProcessingResult> {
  const { data } = await client.put<CommandProcessingResult>(`/glclosures/${id}`, payload);
  return data;
}

export async function deleteGLClosure(id: number | string): Promise<CommandProcessingResult> {
  const { data } = await client.delete<CommandProcessingResult>(`/glclosures/${id}`);
  return data;
}

// ─── Periodic Accrual ────────────────────────────────────────────

export async function executePeriodicAccrual(payload: ExecutePeriodicAccrualRequest): Promise<CommandProcessingResult> {
  const { data } = await client.post<CommandProcessingResult>("/runaccruals", {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

// ─── Provisioning Entries ────────────────────────────────────────

type RawProvisioningEntryData = {
  id: number;
  journalEntry?: boolean;
  createdById?: number;
  createdUser?: string;
  createdDate?: string;
};

function toProvisioningEntryData(raw: RawProvisioningEntryData): ProvisioningEntryData {
  return {
    id: raw.id,
    date: raw.createdDate ?? "",
    createdBy: (raw.createdUser ?? raw.createdById?.toString()) ?? "",
    createdDate: raw.createdDate ?? "",
    journalEntriesCreated: !!raw.journalEntry,
  };
}

export async function fetchProvisioningEntries(params: {
  offset?: number;
  limit?: number;
} = {}): Promise<Page<ProvisioningEntryData>> {
  const { data } = await client.get<Page<RawProvisioningEntryData>>("/provisioningentries", { params });
  return {
    totalFilteredRecords: data?.totalFilteredRecords ?? 0,
    pageItems: (data?.pageItems ?? []).map(toProvisioningEntryData),
  };
}

export async function fetchProvisioningEntry(id: number | string): Promise<ProvisioningEntryData> {
  const { data } = await client.get<RawProvisioningEntryData>(`/provisioningentries/${id}`);
  return toProvisioningEntryData(data);
}

export async function createProvisioningEntry(
  payload: CreateProvisioningEntryRequest,
): Promise<CommandProcessingResult> {
  const { data } = await client.post<CommandProcessingResult>("/provisioningentries", {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function provisioningEntryCommand(
  entryId: number | string,
  command: "createjournalentry" | "recreateprovisioningentry",
): Promise<CommandProcessingResult> {
  const { data } = await client.post<CommandProcessingResult>(
    `/provisioningentries/${entryId}`,
    {},
    { params: { command } },
  );
  return data;
}
