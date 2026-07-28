import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffices, useCreateOffice, useUpdateOffice } from "@/hooks/useOffices";
import OfficeForm from "@/components/organization/OfficeForm";
import type { OfficeCreateFormData } from "@/lib/validations/office";

const OfficeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: offices = [], isLoading } = useOffices();

  const createMutation = useCreateOffice();
  const updateMutation = useUpdateOffice();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const [mutationError, setMutationError] = React.useState<string | null>(null);

  const existingOffice = isEdit ? offices.find((o) => o.id === Number(id)) : undefined;

  const defaultValues: Partial<OfficeCreateFormData> | undefined = existingOffice
    ? {
        name: existingOffice.name,
        parentId: existingOffice.parentId ?? undefined,
        openingDate: existingOffice.openingDate,
        externalId: existingOffice.externalId || undefined,
      }
    : undefined;

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
          error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to save office.";
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
        title={isEdit ? "Edit Office" : "New Office"}
        description={isEdit ? "Update office details" : "Create a new office in the hierarchy"}
        actions={
          <Button variant="outline" onClick={() => navigate("/offices")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
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
            onSubmit={handleCreate}
            onCancel={() => navigate("/offices")}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default OfficeFormPage;
