import { type FC, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useClient } from "../hooks/useClient";
import { useClientTemplate } from "../hooks/useClientTemplate";
import { useUpdateClient } from "../hooks/useUpdateClient";
import ClientForm from "../components/ClientForm";
import type { CreateClientFormValues } from "../schemas/client.schema";
import { useTranslation } from "react-i18next";

const EditClientPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading: clientLoading, isError, refetch } = useClient(id);
  const { data: template, isLoading: templateLoading } = useClientTemplate();
  const updateMutation = useUpdateClient();

  const handleSubmit = useCallback(
    async (values: CreateClientFormValues) => {
      if (!client) return;
      await updateMutation.mutateAsync({
        clientId: client.id,
        payload: values as any,
      });
      navigate(`/clients/${client.id}`);
    },
    [client, updateMutation, navigate],
  );

  if (clientLoading || templateLoading) {
    return (
      <div className="p-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4 rounded-xl border p-6">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="p-6">
        <ErrorState
          title={t("Client not found")}
          message={t("Could not load client data for editing.")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto">
      <PageHeader
        title={t("Edit Client")}
        description={t("Editing client #{{id}}", { id: client.id })}
        actions={
          <Button variant="outline" onClick={() => navigate(`/clients/${client.id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Back to Details")}
          </Button>
        }
      />
      <ClientForm
        template={template}
        client={client}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        error={updateMutation.error?.message ?? null}
        mode="edit"
      />
    </div>
  );
};

export default EditClientPage;
