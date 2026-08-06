import { type FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useFund, useCreateFund, useUpdateFund } from "../hooks/useFunds";

const fundSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  externalId: z.string().max(100).optional().or(z.literal("")),
});

type FundFormValues = z.infer<typeof fundSchema>;

const FundFormPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: fund, isLoading: fundLoading } = useFund(id ? Number(id) : undefined);
  const createMutation = useCreateFund();
  const updateMutation = useUpdateFund();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      name: "",
      externalId: "",
    },
  });

  useEffect(() => {
    if (!fund) return;
    reset({
      name: fund.name,
      externalId: fund.externalId ?? "",
    });
  }, [fund, reset]);

  const onSubmit = async (values: FundFormValues) => {
    const payload = {
      name: values.name,
      externalId: values.externalId || undefined,
    };
    if (isEdit) {
      await updateMutation.mutateAsync({ id: Number(id), payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate("/funds");
  };

  if (isEdit && fundLoading) {
    return (
      <div className="p-6 max-w-lg m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Fund") : t("Create Fund")}
        description={isEdit ? t("Editing fund") + ` #${id}` : t("Create a new fund")}
        actions={
          <Button variant="outline" onClick={() => navigate("/funds")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Back")}
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Fund Details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Name")} *</label>
              <Input {...register("name")} placeholder={t("e.g. Mortgage Fund 2026")} error={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("External ID")}</label>
              <Input {...register("externalId")} placeholder={t("Optional external identifier")} />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/funds")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? t("Save Changes") : t("Create Fund")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FundFormPage;
