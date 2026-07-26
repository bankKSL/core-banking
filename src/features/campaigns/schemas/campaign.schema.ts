import { z } from "zod";

export const createSmsCampaignSchema = z.object({
  campaignName: z.string().min(1, "Campaign name is required").max(100),
  campaignType: z.string().min(1, "Campaign type is required"),
  triggerType: z.string().min(1, "Trigger type is required"),
  providerId: z.string().optional().or(z.literal("")),
  runReportId: z.string().min(1, "Business rule is required"),
  message: z.string().min(1, "Message is required").max(480),
  paramValue: z.string().optional().or(z.literal("")),
  frequency: z.string().optional().or(z.literal("")),
  interval: z.string().optional().or(z.literal("")),
  repeatsOnDay: z.string().optional().or(z.literal("")),
  recurrenceStartDate: z.string().optional().or(z.literal("")),
  isNotification: z.boolean().optional(),
});

export type CreateSmsCampaignFormValues = z.infer<typeof createSmsCampaignSchema>;

export const createEmailCampaignSchema = z.object({
  campaignName: z.string().min(1, "Campaign name is required").max(100),
  campaignType: z.string().min(1, "Campaign type is required"),
  businessRuleId: z.string().min(1, "Business rule is required"),
  paramValue: z.string().min(1, "Param value is required"),
  emailSubject: z.string().min(1, "Subject is required").max(50),
  emailMessage: z.string().min(1, "Message is required").max(480),
  recurrence: z.string().optional().or(z.literal("")),
  recurrenceStartDate: z.string().optional().or(z.literal("")),
  emailAttachmentFileFormatId: z.string().optional().or(z.literal("")),
});

export type CreateEmailCampaignFormValues = z.infer<typeof createEmailCampaignSchema>;

export const activateCampaignSchema = z.object({
  activationDate: z.string().min(1, "Activation date is required"),
});

export type ActivateCampaignFormValues = z.infer<typeof activateCampaignSchema>;

export const previewSchema = z.object({
  paramValue: z.string().min(1, "Param value is required"),
  message: z.string().min(1, "Message is required").max(480),
});

export type PreviewFormValues = z.infer<typeof previewSchema>;
