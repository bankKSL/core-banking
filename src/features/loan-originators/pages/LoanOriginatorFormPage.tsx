import { type FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, Handshake } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createLoanOriginatorSchema,
  updateLoanOriginatorSchema,
} from "../schemas/loanOriginator.schema";
import {
  useLoanOriginator,
  useLoanOriginatorTemplate,
  useCreateLoanOriginator,
  useUpdateLoanOriginator,
} from "../hooks/useLoanOriginators";
import type { CodeValueData, LoanOriginatorStatus } from "../types/loanOriginator";

type FormValues = {
  externalId?: string;
  name?: string;
  status?: LoanOriginatorStatus;
  originatorTypeId?: number | null;
  channelTypeId?: number | null;
};

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const LoanOriginatorFormPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: originator, isLoading: originatorLoading } = useLoanOriginator(isEdit ? id : undefined);
  const { data: template, isLoading: templateLoading } = useLoanOriginatorTemplate();
  const createMutation = useCreateLoanOriginator();
  const updateMutation = useUpdateLoanOriginator();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateLoanOriginatorSchema : createLoanOriginatorSchema) as never,
    defaultValues: {
      externalId: "",
      name: "",
      status: "ACTIVE",
      originatorTypeId: undefined,
      channelTypeId: undefined,
    },
  });

  useEffect(() => {
    if (isEdit) {
      if (!originator) return;
      reset({
        externalId: originator.externalId,
        name: originator.name ?? "",
        status: originator.status ?? "ACTIVE",
        originatorTypeId: originator.originatorType?.id ?? undefined,
        channelTypeId: originator.channelType?.id ?? undefined,
      });
    } else if (template?.externalId) {
      reset((prev) => ({ ...prev, externalId: template.externalId }));
    }
  }, [isEdit, originator, template, reset]);

  const statusOptions: LoanOriginatorStatus[] = template?.statusOptions ?? ["ACTIVE", "PENDING", "INACTIVE"];
  const typeOptions: CodeValueData[] = template?.originatorTypeOptions ?? [];
  const channelOptions: CodeValueData[] = template?.channelTypeOptions ?? [];

  const onSubmit = async (values: FormValues) => {
    if (isEdit && id) {
      const changed: Record<string, unknown> = {};
      if (values.name !== (originator?.name ?? "")) changed.name = values.name;
      if (values.status !== (originator?.status ?? "ACTIVE")) changed.status = values.status;
      if ((values.originatorTypeId ?? null) !== (originator?.originatorType?.id ?? null)) {
        changed.originatorTypeId = values.originatorTypeId ?? null;
      }
      if ((values.channelTypeId ?? null) !== (originator?.channelType?.id ?? null)) {
        changed.channelTypeId = values.channelTypeId ?? null;
      }
      if (Object.keys(changed).length === 0) {
        navigate("/loan-originators");
        return;
      }
      await updateMutation.mutateAsync({ id, payload: changed });
    } else {
      const payload = {
        externalId: values.externalId ?? "",
        name: values.name || undefined,
        status: values.status ?? "ACTIVE",
        originatorTypeId: values.originatorTypeId ?? undefined,
        channelTypeId: values.channelTypeId ?? undefined,
      };
      await createMutation.mutateAsync(payload);
    }
    navigate("/loan-originators");
  };

  if ((isEdit && originatorLoading) || templateLoading) {
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
        title={isEdit ? t("Edit Loan Originator") : t("Create Loan Originator")}
        description={
          isEdit ? t('Editing "{{name}}"', { name: originator?.name ?? originator?.externalId }) : t("Register an external party that sources loan applications")
        }
        actions={
          <Button variant="outline" onClick={() => navigate("/loan-originators")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Back")}
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              {t("Basic Information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("External ID (Revenue Share ID)")} *</label>
              <Input
                {...register("externalId")}
                placeholder="e.g. REV-SHARE-001"
                disabled={isEdit || isSubmitting}
                error={errors.externalId?.message}
              />
              {isEdit && <p className="text-xs text-gray-500">{t("The External ID cannot be changed.")}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Name")}</label>
              <Input {...register("name")} placeholder="e.g. Acme Merchant" disabled={isSubmitting} error={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Status")} *</label>
              <Select
                value={watch("status") ?? "ACTIVE"}
                onValueChange={(v) => setValue("status", v as LoanOriginatorStatus, { shouldValidate: true })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Classification")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Originator Type")}</label>
              <Select
                value={watch("originatorTypeId") ? String(watch("originatorTypeId")) : ""}
                onValueChange={(v) =>
                  setValue("originatorTypeId", v === "" ? null : Number(v), { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("None")}</SelectItem>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {titleCase(opt.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.originatorTypeId && <p className="text-xs text-red-500">{errors.originatorTypeId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Channel Type")}</label>
              <Select
                value={watch("channelTypeId") ? String(watch("channelTypeId")) : ""}
                onValueChange={(v) =>
                  setValue("channelTypeId", v === "" ? null : Number(v), { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select channel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("None")}</SelectItem>
                  {channelOptions.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {titleCase(opt.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.channelTypeId && <p className="text-xs text-red-500">{errors.channelTypeId.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/loan-originators")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? t("Save Changes") : t("Create Originator")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoanOriginatorFormPage;
