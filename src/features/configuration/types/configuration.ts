export interface GlobalConfiguration {
  id: number;
  name: string;
  enabled: boolean;
  value?: number;
  dateValue?: string;
  stringValue?: string;
  trapDoor?: boolean;
  description?: string;
}

export interface UpdateConfigRequest {
  enabled?: boolean;
  value?: number;
  dateValue?: string;
  stringValue?: string;
  locale?: string;
  dateFormat?: string;
}

export interface ExternalServiceProperty {
  name: string;
  value: string;
}

export interface ExternalService {
  serviceName: string;
  properties: ExternalServiceProperty[];
}

export interface ExternalEventConfiguration {
  type: string;
  enabled: boolean;
}

export interface UpdateExternalEventRequest {
  type: string;
  enabled: boolean;
}

export interface PasswordPolicy {
  id: number;
  name: string;
  description: string;
  active: boolean;
  regex?: string;
}

export interface BusinessDate {
  type: string;
  date: string;
  description?: string;
}

export interface UpdateBusinessDateRequest {
  type: string;
  date: string;
  dateFormat: string;
  locale: string;
}

export interface CacheType {
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdateCacheRequest {
  name: string;
  active: boolean;
}

export interface EmailConfig {
  username?: string;
  password?: string;
  host?: string;
  port?: number;
  useTLS?: boolean;
  fromEmail?: string;
  fromName?: string;
}

export interface UpdateEmailConfigRequest {
  username?: string;
  password?: string;
  host?: string;
  port?: string;
  useTLS?: string;
  fromEmail?: string;
  fromName?: string;
}
