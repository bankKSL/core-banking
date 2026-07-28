import { type FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSmsCampaignSchema, type CreateSmsCampaignFormValues } from "../schemas/campaign.schema";
import {
  useSmsCampaignTemplate,
  useSmsCampaign,
  useCreateSmsCampaign,
  useUpdateSmsCampaign,
} from "../hooks/useCampaigns";

const CampaignFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: template, isLoading: templateLoading } = useSmsCampaignTemplate();
  const { data: campaign, isLoading: campaignLoading } = useSmsCampaign(id ? Number(id) : undefined);
  const createMutation = useCreateSmsCampaign();
  const updateMutation = useUpdateSmsCampaign();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSmsCampaignFormValues>({
    resolver: zodResolver(createSmsCampaignSchema),
    defaultValues: {
      campaignName: "",
      campaignType: "1",
      triggerType: "1",
      providerId: "",
      runReportId: "",
      message: "",
      paramValue: "",
      frequency: "",
      interval: "",
      repeatsOnDay: "",
      recurrenceStartDate: "",
      isNotification: false,
    },
  });

  const triggerType = watch("triggerType");
  const campaignType = watch("campaignType");
  const isNotification = watch("isNotification");
  const isSchedule = triggerType === "2";
  const isDirectOrSchedule = triggerType !== "3";

  useEffect(() => {
    if (!campaign) return;
    reset({
      campaignName: campaign.campaignName,
      campaignType: String(campaign.campaignType),
      triggerType: String(campaign.triggerType),
      providerId: campaign.providerId ? String(campaign.providerId) : "",
      runReportId: String(campaign.runReportId),
      message: campaign.message,
      paramValue: campaign.paramValue ?? "",
      frequency: campaign.frequency ? String(campaign.frequency) : "",
      interval: campaign.interval ?? "",
      repeatsOnDay: campaign.repeatsOnDay ? String(campaign.repeatsOnDay) : "",
      recurrenceStartDate: campaign.recurrenceStartDate ?? "",
      isNotification: campaign.isNotification ?? false,
    });
  }, [campaign, reset]);

  const onSubmit = async (values: CreateSmsCampaignFormValues) => {
    const payload: Record<string, unknown> = {
      campaignName: values.campaignName,
      campaignType: Number(values.campaignType),
      triggerType: Number(values.triggerType),
      runReportId: Number(values.runReportId),
      message: values.message,
      isNotification: values.isNotification ?? false,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    };

    if (isNotification) {
      payload.providerId = null;
    } else if (values.providerId) {
      payload.providerId = Number(values.providerId);
    }

    if (isDirectOrSchedule && values.paramValue) {
      payload.paramValue = values.paramValue;
    }

    if (isSchedule) {
      payload.frequency = Number(values.frequency);
      payload.interval = values.interval;
      payload.recurrenceStartDate = values.recurrenceStartDate;
      payload.dateTimeFormat = "yyyy-MM-dd HH:mm:ss";
      if (values.repeatsOnDay) {
        payload.repeatsOnDay = Number(values.repeatsOnDay);
      }
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
      <div className="p-6 max-w-4xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit SMS Campaign" : "Create SMS Campaign"}
        description={isEdit ? `Editing "${campaign?.campaignName}"` : "Create a new SMS marketing campaign"}
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
              <Megaphone className="h-5 w-5" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Campaign Name *</label>
              <Input {...register("campaignName")} placeholder="e.g. Loan Arrears Reminder" error={errors.campaignName?.message} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Campaign Type *</Label>
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

              <div>
                <Label>Trigger Type *</Label>
                <Select
                  value={watch("triggerType")}
                  onValueChange={(v) => setValue("triggerType", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.triggerTypeOptions ?? []).map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={isNotification} onCheckedChange={(v) => setValue("isNotification", v)} />
              <Label>Is Notification (no provider needed)</Label>
            </div>

            {!isNotification && campaignType === "1" && (
              <div>
                <Label>SMS Provider</Label>
                <Select value={watch("providerId")} onValueChange={(v) => setValue("providerId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.smsProviderOptions ?? []).map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.providerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Business Rule *</Label>
              <Select
                value={watch("runReportId")}
                onValueChange={(v) => setValue("runReportId", v, { shouldValidate: true })}
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
              {errors.runReportId && <p className="text-xs text-red-500 mt-1">{errors.runReportId.message}</p>}
            </div>

            {isDirectOrSchedule && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Param Value (JSON)</label>
              <Input {...register("paramValue")} placeholder='e.g. {"officeId":1}' />
              <p className="text-xs text-gray-500 mt-1">JSON key-value pairs matching report parameters.</p>
            </div>
            )}

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                {...register("message")}
                placeholder="Dear {{clientName}}, your loan repayment is overdue."
                rows={3}
              />
              {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
              <p className="text-xs text-gray-500 mt-1">Max 480 characters. Use {`{paramName}`} placeholders.</p>
            </div>
          </CardContent>
        </Card>

        {isSchedule && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Frequency *</Label>
                  <Select value={watch("frequency")} onValueChange={(v) => setValue("frequency", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {(template?.frequencyTypeOptions ?? []).map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Interval *</label>
                  <Input {...register("interval")} placeholder="e.g. 1" />
                </div>
              </div>
              {watch("frequency") === "2" && (
                <div>
                  <Label>Repeats On Day</Label>
                  <Select value={watch("repeatsOnDay")} onValueChange={(v) => setValue("repeatsOnDay", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {(template?.weekDays ?? []).map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Recurrence Start Date *</label>
                <Input type="datetime-local" {...register("recurrenceStartDate")} />
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

export default CampaignFormPage;
