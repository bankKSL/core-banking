export const CAMPAIGN_STATUS = { PENDING: 100, ACTIVE: 300, CLOSED: 600 } as const;

export const TRIGGER_TYPES = { DIRECT: 1, SCHEDULE: 2, TRIGGERED: 3 } as const;

export const CAMPAIGN_TYPES = { SMS: 1, NOTIFICATION: 2 } as const;

export const FREQUENCY_TYPES = { DAILY: 1, WEEKLY: 2, MONTHLY: 3, YEARLY: 4 } as const;

export interface CampaignStatusOption {
  id: number;
  value: string;
}

export interface TriggerTypeOption {
  id: number;
  value: string;
}

export interface CampaignTypeOption {
  id: number;
  value: string;
}

export interface SmsProviderOption {
  id: number;
  providerName: string;
  description?: string;
}

export interface BusinessRuleOption {
  reportId: number;
  reportName: string;
  reportParameters?: string;
}

export interface FrequencyTypeOption {
  id: number;
  value: string;
}

export interface WeekDayOption {
  id: number;
  value: string;
}

export interface SmsCampaignTemplate {
  smsProviderOptions: SmsProviderOption[];
  businessRulesOptions: BusinessRuleOption[];
  campaignTypeOptions: CampaignTypeOption[];
  triggerTypeOptions: TriggerTypeOption[];
  frequencyTypeOptions: FrequencyTypeOption[];
  weekDays: WeekDayOption[];
  months: { id: number; value: string }[];
}

export interface EmailCampaignTemplate {
  businessRulesOptions: BusinessRuleOption[];
  campaignTypeOptions: CampaignTypeOption[];
}

export interface SmsCampaign {
  id: number;
  campaignName: string;
  campaignType: number;
  triggerType: number;
  providerId?: number;
  providerName?: string;
  runReportId: number;
  reportName?: string;
  message: string;
  paramValue?: string;
  frequency?: number;
  interval?: string;
  repeatsOnDay?: number;
  recurrenceStartDate?: string;
  submittedOnDate?: string;
  isNotification?: boolean;
  status: number;
  statusLabel?: string;
  campaignDescription?: string;
  timeline?: SmsCampaignTimeline;
}

export interface SmsCampaignTimeline {
  createdOn?: string;
  createdBy?: string;
  submittedOn?: string;
  submittedBy?: string;
  approvedOn?: string;
  approvedBy?: string;
  closedOn?: string;
  closedBy?: string;
}

export interface EmailCampaign {
  id: number;
  campaignName: string;
  campaignType: number;
  businessRuleId: number;
  reportName?: string;
  paramValue?: string;
  emailSubject: string;
  emailMessage: string;
  recurrence?: string;
  recurrenceStartDate?: string;
  submittedOnDate?: string;
  emailAttachmentFileFormatId?: number;
  stretchyReportId?: number;
  stretchyReportParamMap?: string;
  status: number;
  statusLabel?: string;
}

export interface CreateSmsCampaignRequest {
  campaignName: string;
  campaignType: number;
  triggerType: number;
  providerId?: number;
  runReportId: number;
  message: string;
  paramValue?: string;
  frequency?: number;
  interval?: string;
  repeatsOnDay?: number;
  recurrenceStartDate?: string;
  submittedOnDate?: string;
  isNotification?: boolean;
  locale: string;
  dateFormat: string;
  dateTimeFormat?: string;
}

export type UpdateSmsCampaignRequest = Partial<CreateSmsCampaignRequest>;

export interface CreateEmailCampaignRequest {
  campaignName: string;
  campaignType: number;
  businessRuleId: number;
  paramValue: string;
  emailSubject: string;
  emailMessage: string;
  recurrence?: string;
  recurrenceStartDate?: string;
  submittedOnDate?: string;
  emailAttachmentFileFormatId?: number;
  stretchyReportId?: number;
  stretchyReportParamMap?: string;
  locale: string;
  dateFormat: string;
}

export type UpdateEmailCampaignRequest = Partial<CreateEmailCampaignRequest>;

export interface ActivateCampaignRequest {
  activationDate: string;
  locale: string;
  dateFormat: string;
}

export interface CloseCampaignRequest {
  closureDate: string;
  locale: string;
  dateFormat: string;
}

export interface PreviewRequest {
  paramValue: string;
  message: string;
}

export interface PreviewResponse {
  campaignMessage: string;
  totalNumberOfMessages: number;
}

export interface CommandResponse {
  resourceId: number;
}

export const STATUS_LABELS: Record<number, string> = {
  100: "Pending",
  300: "Active",
  600: "Closed",
};

export const TRIGGER_TYPE_LABELS: Record<number, string> = {
  1: "Direct",
  2: "Schedule",
  3: "Triggered",
};

export const CAMPAIGN_TYPE_LABELS: Record<number, string> = {
  1: "SMS",
  2: "Notification",
};
