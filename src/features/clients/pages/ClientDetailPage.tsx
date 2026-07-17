import { type FC, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Separator } from "@/components/ui/separator";
import { useClient } from "../hooks/useClient";
import { useActivateClient } from "../hooks/useActivateClient";
import ClientDetails from "../components/ClientDetails";
import ClientStatusBadge from "../components/ClientStatusBadge";
import { getClientStatus, getClientDisplayName } from "../utils/client";
import { useState } from "react";

const ClientDetailPage: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: client, isLoading, isError, refetch } = useClient(id);
    const activateMutation = useActivateClient();
    const [showActivateConfirm, setShowActivateConfirm] = useState(false);

    const handleActivate = useCallback(async () => {
        if (!client) return;
        await activateMutation.mutateAsync({ clientId: client.id });
        setShowActivateConfirm(false);
    }, [client, activateMutation]);

    if (isLoading) {
        return (
            <div className="p-6">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-5 w-96 mb-6" />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-3 rounded-xl border p-6">
                            <Skeleton className="h-5 w-32" />
                            {[1, 2, 3, 4].map((j) => (
                                <Skeleton key={j} className="h-8 w-full" />
                            ))}
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
                    title="Failed to load client"
                    message="Could not fetch client details. The client may have been removed or you may not have permission."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const status = getClientStatus(client);
    const displayName = getClientDisplayName(client);

    return (
        <div className="p-6">
            <PageHeader
                title={displayName}
                description={`Client #${client.id}`}
                actions={
                    <div className="flex items-center gap-2">
                        <ClientStatusBadge status={status} size="lg" />
                        {status === "pending" && (
                            <Button
                                variant="outline"
                                onClick={() => setShowActivateConfirm(true)}
                                disabled={activateMutation.isPending}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {activateMutation.isPending ? "Activating..." : "Activate"}
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => navigate(`/clients/${client.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" />Edit
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/clients")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />Back
                        </Button>
                    </div>
                }
            />

            <Separator className="my-6" />

            <ClientDetails client={client} />

            <ConfirmDialog
                open={showActivateConfirm}
                onOpenChange={setShowActivateConfirm}
                title="Activate Client"
                description={`Are you sure you want to activate ${displayName}? The client will become active and eligible for financial services.`}
                onConfirm={handleActivate}
                variant="default"
            />
        </div>
    );
};

export default ClientDetailPage;
