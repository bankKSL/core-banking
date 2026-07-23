import { type FC, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useClientTemplate } from "../hooks/useClientTemplate";
import { useCreateClient } from "../hooks/useCreateClient";
import ClientForm from "../components/ClientForm";
import type { CreateClientFormValues } from "../schemas/client.schema";
import { useAuthStore } from "@/store";
import { currentDate } from "@/lib/utils";

const CreateClientPage: FC = () => {
  const navigate = useNavigate();
  const officeId = useAuthStore((s) => s.user?.officeId);
  const staffId = useAuthStore((s) => s.user?.userId);
  const { data: template, isLoading: templateLoading } = useClientTemplate();
  const createMutation = useCreateClient();

  const handleSubmit = useCallback(
    async (values: CreateClientFormValues) => {
      const payload = {
        officeId: officeId ?? 1,
        firstname: values.firstname || undefined,
        lastname: values.lastname || undefined,
        fullname: values.fullname || undefined,
        externalId: values.externalId || undefined,
        dateFormat: "yyyy-MM-dd",
        locale: "en",
        active: values.active ?? true,
        activationDate: values.activationDate ? currentDate(values.activationDate) : undefined,
        submittedOnDate: values.submittedOnDate ? currentDate(values.submittedOnDate) : undefined,
        savingsProductId: values.savingsProductId ?? undefined,
        legalFormId: values.legalFormId ?? 1,
        mobileNo: values.mobileNo || undefined,
        emailAddress: values.emailAddress || undefined,
        dateOfBirth: values.dateOfBirth ? currentDate(values.dateOfBirth) : undefined,
        genderId: values.genderId ?? undefined,
        staffId: values.staffId ?? undefined,
      };

      const result = await createMutation.mutateAsync(payload as any);
      navigate(`/clients/${result.clientId}`);
    },
    [createMutation, navigate, officeId],
  );

  if (templateLoading) {
    return (
      <div className="p-6 max-w-3xl">
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

  if (createMutation.isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to create client"
          message={createMutation.error?.message ?? "An unexpected error occurred."}
          onRetry={() => createMutation.reset()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto">
      <PageHeader
        title="Create Client"
        description="Register a new client in Finfact"
        actions={
          <Button variant="outline" onClick={() => navigate("/clients")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        }
      />
      <ClientForm
        template={template}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        error={createMutation.error ?? null}
        mode="create"
      />
    </div>
  );
};

export default CreateClientPage;
