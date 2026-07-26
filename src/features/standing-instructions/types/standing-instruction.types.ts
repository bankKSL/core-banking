export interface StandingInstruction {
  id: number;
  name: string;
  priority: { id: number; code: string; value: string };
  instructionType: { id: number; code: string; value: string };
  status: { id: number; code: string; value: string };
  amount: number | null;
  validFrom: number[];
  validTill: number[] | null;
  recurrenceType: { id: number; code: string; value: string };
  recurrenceFrequency: { id: number; code: string; value: string } | null;
  recurrenceInterval: number | null;
  recurrenceOnMonthDay: string | null;
  recurrenceOnMonth: number | null;
  lastRunDate: number[] | null;
  transferType: { id: number; code: string; value: string };
  fromOffice: { id: number; name: string; nameDecorated: string };
  fromClient: { id: number; displayName: string };
  fromAccountType: { id: number; code: string; value: string };
  fromAccount: { id: number; accountNo: string; productName: string };
  toOffice: { id: number; name: string; nameDecorated: string };
  toClient: { id: number; displayName: string };
  toAccountType: { id: number; code: string; value: string };
  toAccount: { id: number; accountNo: string; productName: string };
}

export interface StandingInstructionListResponse {
  pageItems?: StandingInstruction[];
  totalFilteredRecords?: number;
}

export interface StandingInstructionTemplate {
  fromOfficeOptions: OfficeOption[];
  toOfficeOptions: OfficeOption[];
  fromClientOptions: ClientOption[];
  toClientOptions: ClientOption[];
  fromAccountOptions: AccountOption[];
  toAccountOptions: AccountOption[];
  transferTypeOptions: EnumOption[];
  instructionTypeOptions: EnumOption[];
  priorityOptions: EnumOption[];
  recurrenceTypeOptions: EnumOption[];
  recurrenceFrequencyOptions: EnumOption[];
  statusOptions: EnumOption[];
}

export interface OfficeOption {
  id: number;
  name: string;
  nameDecorated: string;
}

export interface ClientOption {
  id: number;
  displayName: string;
  officeId: number;
}

export interface AccountOption {
  id: number;
  accountNo: string;
  productName: string;
}

export interface EnumOption {
  id: number;
  code: string;
  value: string;
}

export interface StandingInstructionCreateRequest {
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
  instructionType: number;
  priority: number;
  status: number;
  validFrom: string;
  validTill?: string;
  amount?: number;
  recurrenceType: number;
  recurrenceFrequency?: number;
  recurrenceInterval?: number;
  recurrenceOnMonthDay?: string;
  dateFormat: string;
  locale: string;
  monthDayFormat: string;
}

export interface StandingInstructionUpdateRequest {
  amount?: number;
  validTill?: string;
  priority?: number;
  status?: number;
  instructionType?: number;
  recurrenceType?: number;
  recurrenceFrequency?: number;
  recurrenceInterval?: number;
  recurrenceOnMonthDay?: string;
  dateFormat: string;
  locale: string;
}

export interface StandingInstructionHistoryItem {
  id: number;
  name: string;
  fromClientName: string;
  fromAccount: { accountNo: string };
  toClientName: string;
  toAccount: { accountNo: string };
  amount: number;
  executionTime: number[];
  status: string;
  errorLog: string | null;
}

export interface StandingInstructionHistoryResponse {
  pageItems?: StandingInstructionHistoryItem[];
  totalFilteredRecords?: number;
}

export interface StandingInstructionListParams {
  clientId?: number;
  clientName?: string;
  fromAccountId?: number;
  fromAccountType?: number;
  transferType?: number;
  externalId?: string;
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface StandingInstructionHistoryParams {
  clientId?: number;
  fromAccountId?: number;
  fromAccountType?: number;
  transferType?: number;
  fromDate?: string;
  toDate?: string;
  offset?: number;
  limit?: number;
}
