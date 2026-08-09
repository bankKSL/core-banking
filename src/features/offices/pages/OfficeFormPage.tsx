import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffice, useOfficeTemplate, useCreateOffice, useUpdateOffice } from "@/hooks/useOffices";
import OfficeForm from "@/components/organization/OfficeForm";
import type { OfficeCreateFormData } from "@/lib/validations/office";

const OfficeFormPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: office, isLoading: isLoadingOffice } = useOffice(isEdit ? Number(id) : null);
  const { data: template, isLoading: isLoadingTemplate } = useOfficeTemplate();

  const createMutation = useCreateOffice();
  const updateMutation = useUpdateOffice();
  const [mutationError, setMutationError] = React.useState<string | null>(null);

  const existingOffice = isEdit ? office : undefined;

  const defaultValues: Partial<OfficeCreateFormData> | undefined = existingOffice
    ? {
        name: existingOffice.name,
        parentId: existingOffice.parentId ?? undefined,
        openingDate: existingOffice.openingDate,
        externalId: existingOffice.externalId || undefined,
      }
    : template
      ? {
          name: "",
          parentId: undefined,
          openingDate: template.openingDate,
          externalId: "",
        }
      : undefined;

  const allowedParents = template?.allowedParents ?? [];

  const isLoading = isEdit ? isLoadingOffice : isLoadingTemplate;

  const handleSubmit = useCallback(
    async (data: OfficeCreateFormData) => {
      setMutationError(null);
      try {
        if (isEdit) {
          await updateMutation.mutateAsync({
            id: Number(id),
            payload: {
              ...data,
              dateFormat: "yyyy-MM-dd",
              locale: "en",
            },
          });
        } else {
          await createMutation.mutateAsync({
            ...data,
            dateFormat: "yyyy-MM-dd",
            locale: "en",
          });
        }
        navigate("/offices");
      } catch (err: unknown) {
        const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
        const msg =
          error?.response?.data?.errors?.[0]?.defaultUserMessage ?? t("Failed to save office.");
        setMutationError(msg);
      }
    },
    [isEdit, id, createMutation, updateMutation, navigate],
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl m-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Office") : t("New Office")}
        description={isEdit ? t("Update office details") : t("Create a new office in the hierarchy")}
        actions={
          <Button variant="outline" onClick={() => navigate("/offices")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      {mutationError && (
        <ErrorState message={mutationError} />
      )}

      <Card>
        <CardContent className="pt-6">
          <OfficeForm
            defaultValues={defaultValues}
            allowedParents={allowedParents}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/offices")}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OfficeFormPage;
