import { type FC, useCallback } from "react";
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

const CreateClientPage: FC = () => {
    const navigate = useNavigate();
    const { data: template, isLoading: templateLoading } = useClientTemplate();
    const createMutation = useCreateClient();

    const handleSubmit = useCallback(
        async (values: CreateClientFormValues) => {
            const payload = {
                ...values,
                dateFormat: "yyyy-MM-dd",
                locale: "en",
            };
            const result = await createMutation.mutateAsync(payload as unknown as Parameters<typeof createMutation.mutateAsync>[0]);
            navigate(`/clients/${result.clientId}`);
        },
        [createMutation, navigate],
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
                description="Register a new client in Apache Fineract"
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
