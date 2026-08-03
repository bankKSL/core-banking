import { type FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, Mail } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEmailCampaignSchema, type CreateEmailCampaignFormValues } from "../schemas/campaign.schema";
import {
  useEmailCampaignTemplate,
  useEmailCampaign,
  useCreateEmailCampaign,
  useUpdateEmailCampaign,
} from "../hooks/useCampaigns";

const ATTACHMENT_FORMATS = [
  { id: 1, label: "XLS" },
  { id: 2, label: "PDF" },
  { id: 3, label: "CSV" },
];

const EmailCampaignFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: template, isLoading: templateLoading } = useEmailCampaignTemplate();
  const { data: campaign, isLoading: campaignLoading } = useEmailCampaign(id ? Number(id) : undefined);
  const createMutation = useCreateEmailCampaign();
  const updateMutation = useUpdateEmailCampaign();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmailCampaignFormValues>({
    resolver: zodResolver(createEmailCampaignSchema),
    defaultValues: {
      campaignName: "",
      campaignType: "1",
      businessRuleId: "",
      paramValue: "",
      emailSubject: "",
      emailMessage: "",
      recurrence: "",
      recurrenceStartDate: "",
      emailAttachmentFileFormatId: "",
    },
  });

  const campaignType = watch("campaignType");
  const isSchedule = campaignType === "2";

  useEffect(() => {
    if (!campaign) return;
    reset({
      campaignName: campaign.campaignName,
      campaignType: String(campaign.campaignType),
      businessRuleId: String(campaign.businessRuleId),
      paramValue: campaign.paramValue,
      emailSubject: campaign.emailSubject,
      emailMessage: campaign.emailMessage,
      recurrence: campaign.recurrence ?? "",
      recurrenceStartDate: campaign.recurrenceStartDate ?? "",
      emailAttachmentFileFormatId: campaign.emailAttachmentFileFormatId
        ? String(campaign.emailAttachmentFileFormatId)
        : "",
    });
  }, [campaign, reset]);

  const onSubmit = async (values: CreateEmailCampaignFormValues) => {
    const payload: Record<string, unknown> = {
      campaignName: values.campaignName,
      campaignType: Number(values.campaignType),
      businessRuleId: Number(values.businessRuleId),
      paramValue: values.paramValue,
      emailSubject: values.emailSubject,
      emailMessage: values.emailMessage,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    };

    if (isSchedule) {
      payload.recurrence = values.recurrence;
      payload.recurrenceStartDate = values.recurrenceStartDate;
    }

    if (values.emailAttachmentFileFormatId) {
      payload.emailAttachmentFileFormatId = Number(values.emailAttachmentFileFormatId);
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ id: Number(id), payload });
    } else {
      await createMutation.mutateAsync(payload as any);
    }
    navigate("/campaigns");
  };

  const loading = (isEdit && campaignLoading) || templateLoading;

  if (loading) {
    return (
      <div className="p-6 max-w-6xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Email Campaign" : "Create Email Campaign"}
        description={isEdit ? `Editing "${campaign?.campaignName}"` : "Create a new email marketing campaign"}
        actions={
          <Button variant="outline" onClick={() => navigate("/campaigns")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Campaign Name *</label>
              <Input
                {...register("campaignName")}
                placeholder="e.g. Monthly Statement"
                error={errors.campaignName?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Campaign Type *</label>
                <Select
                  value={watch("campaignType")}
                  onValueChange={(v) => setValue("campaignType", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.campaignTypeOptions ?? []).map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Business Rule *</label>
                <Select
                  value={watch("businessRuleId")}
                  onValueChange={(v) => setValue("businessRuleId", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business rule" />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.businessRulesOptions ?? []).map((o) => (
                      <SelectItem key={o.reportId} value={String(o.reportId)}>
                        {o.reportName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.businessRuleId && <p className="text-xs text-red-500 mt-1">{errors.businessRuleId.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Param Value (JSON) *</label>
              <Input {...register("paramValue")} placeholder='e.g. {"officeId":1}' error={errors.paramValue?.message} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Subject *</label>
              <Input
                {...register("emailSubject")}
                placeholder="e.g. Your Monthly Statement"
                error={errors.emailSubject?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium" htmlFor="emailMessage">
                Message *
              </label>
              <Textarea
                id="emailMessage"
                {...register("emailMessage")}
                placeholder="Dear {{clientName}}, please find attached your statement."
                rows={4}
              />
              {errors.emailMessage && <p className="text-xs text-red-500 mt-1">{errors.emailMessage.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Attachment Format</label>
              <Select
                value={watch("emailAttachmentFileFormatId")}
                onValueChange={(v) => setValue("emailAttachmentFileFormatId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No attachment" />
                </SelectTrigger>
                <SelectContent>
                  {ATTACHMENT_FORMATS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isSchedule && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Recurrence Rule *</label>
                <Input {...register("recurrence")} placeholder="e.g. FREQ=MONTHLY;INTERVAL=1" />
                <p className="text-xs text-gray-500 mt-1">RFC 5545 recurrence rule format.</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Recurrence Start Date *</label>
                <Input type="date" {...register("recurrenceStartDate")} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/campaigns")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Save Changes" : "Create Campaign"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmailCampaignFormPage;
