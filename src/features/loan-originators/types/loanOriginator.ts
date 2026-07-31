export type LoanOriginatorStatus = "ACTIVE" | "PENDING" | "INACTIVE";

export interface CodeValueData {
  id: number;
  name: string;
  position?: number | null;
  description?: string | null;
  active?: boolean | null;
  mandatory?: boolean | null;
}

export interface LoanOriginator {
  id: number;
  externalId: string;
  name?: string | null;
  status: LoanOriginatorStatus;
  originatorType?: CodeValueData | null;
  channelType?: CodeValueData | null;
}

export interface LoanOriginatorTemplate {
  externalId: string;
  statusOptions: LoanOriginatorStatus[];
  originatorTypeOptions: CodeValueData[];
  channelTypeOptions: CodeValueData[];
}

export interface LoanOriginatorRequest {
  externalId?: string;
  name?: string | null;
  status?: LoanOriginatorStatus;
  originatorTypeId?: number | null;
  channelTypeId?: number | null;
}

export interface LoanOriginatorUpdateRequest {
  name?: string | null;
  status?: LoanOriginatorStatus;
  originatorTypeId?: number | null;
  channelTypeId?: number | null;
}

export interface LoanOriginatorsResponse {
  originators: LoanOriginator[];
}

export interface LoanOriginatorMappingResponse {
  loanId: number;
  loanExternalId?: string | null;
  originatorId: number;
  originatorExternalId?: string | null;
}

export interface LoanApplicationOriginator {
  id?: number | null;
  externalId?: string | null;
  name?: string | null;
  originatorTypeId?: number | null;
  channelTypeId?: number | null;
}

export interface LoanOriginatorCommandResponse {
  resourceId?: number;
  resourceExternalId?: string | null;
  subResourceId?: number;
  subResourceExternalId?: string | null;
  changes?: Record<string, unknown>;
}
