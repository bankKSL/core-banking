import { type FC, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  CheckCircle2,
  Trash2,
  Landmark,
  PiggyBank,
  Info,
  LayoutGrid,
  Receipt,
  Gem,
  Fingerprint,
  Users,
  FileText,
  StickyNote,
  ArrowLeftRight,
  MapPinIcon,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient } from "../hooks/useClient";
import { useActivateClient } from "../hooks/useActivateClient";
import { useDeleteClient } from "../hooks/useDeleteClient";
import { useClientAccounts } from "../hooks/useClientAccounts";
import ClientDetails from "../components/ClientDetails";
import ClientStatusBadge from "../components/ClientStatusBadge";
import ClientCommands from "../components/ClientCommands";
import ClientIdentifiers from "../components/ClientIdentifiers";
import ClientAddresses from "../components/ClientAddresses";
import ClientFamilyMembers from "../components/ClientFamilyMembers";
import ClientCharges from "../components/ClientCharges";
import ClientDocuments from "../components/ClientDocuments";
import ClientNotes from "../components/ClientNotes";
import ClientCollaterals from "../components/ClientCollaterals";
import ClientTransactions from "../components/ClientTransactions";
import { getClientStatus, getClientDisplayName } from "../utils/client";
import type { ClientLoanAccount, ClientSavingsAccount } from "../api/client";

const formatCurrency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

const ClientDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading, isError, refetch } = useClient(id);
  const { data: accounts, isLoading: accountsLoading } = useClientAccounts(id);
  const activateMutation = useActivateClient();
  const deleteMutation = useDeleteClient();
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const handleActivate = useCallback(async () => {
    if (!client) return;
    await activateMutation.mutateAsync({ clientId: client.id });
    setShowActivateConfirm(false);
    refetch();
  }, [client, activateMutation, refetch]);

  const handleDelete = useCallback(async () => {
    if (!client) return;
    try {
      await deleteMutation.mutateAsync(client.id);
      navigate("/clients");
    } catch {
      /* error shown via mutation state */
    }
  }, [client, deleteMutation, navigate]);

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-6" />
        <Skeleton className="h-10 w-full mb-6" />
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
        <ErrorState title="Failed to load client" message="Could not fetch client details." onRetry={() => refetch()} />
      </div>
    );
  }

  const status = getClientStatus(client);
  const displayName = getClientDisplayName(client);
  const isPending = status === "pending";

  return (
    <div className="p-6">
      <PageHeader
        title={displayName}
        description={`Client #${client.id}`}
        actions={
          <div className="flex items-center gap-2">
            <ClientStatusBadge status={status} size="lg" />
            <ClientCommands
              clientId={client.id}
              status={status}
              displayName={displayName}
              onSuccess={() => refetch()}
            />
            {isPending && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActivateConfirm(true)}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Activate
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${client.id}/edit`)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
            {isPending && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-1.5">
            <Info className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="charges" className="gap-1.5">
            <Receipt className="h-4 w-4" />
            Charges
          </TabsTrigger>
          <TabsTrigger value="collaterals" className="gap-1.5">
            <Gem className="h-4 w-4" />
            Collaterals
          </TabsTrigger>
          <TabsTrigger value="identifiers" className="gap-1.5">
            <Fingerprint className="h-4 w-4" />
            Identifiers
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-1.5">
            <MapPinIcon className="h-4 w-4" />
            Addresses
          </TabsTrigger>
          <TabsTrigger value="family" className="gap-1.5">
            <Users className="h-4 w-4" />
            Family
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <StickyNote className="h-4 w-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5">
            <ArrowLeftRight className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>
        <Separator className="mb-6" />

        <TabsContent value="general" className="mt-0">
          <ClientDetails client={client} />
        </TabsContent>

        <TabsContent value="accounts" className="mt-0 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/lending/applications/new?clientId=${client.id}`)}
            >
              <Plus className="mr-1 h-4 w-4" />
              New Loan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/deposits/saving-accounts/new?clientId=${client.id}`)}
            >
              <Plus className="mr-1 h-4 w-4" />
              New Savings
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/deposits/fixed/new?clientId=${client.id}`)}>
              <Plus className="mr-1 h-4 w-4" />
              New Fixed Deposit
            </Button>
          </div>
          {accountsLoading ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Landmark className="h-4 w-4" />
                    Loan Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 w-full mb-3" />
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PiggyBank className="h-4 w-4 text-emerald-500" />
                    Savings Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 w-full mb-3" />
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : accounts ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Landmark className="h-4 w-4" />
                    Loan Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {accounts?.loanAccounts?.length === 0 ? (
                    <p className="text-sm text-gray-400">No loan accounts</p>
                  ) : (
                    <div className="space-y-3">
                      {accounts?.loanAccounts?.map((loan: ClientLoanAccount) => (
                        <div
                          key={loan.id}
                          className="rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => navigate(`/lending/applications/${loan.id}`)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs font-semibold">{loan.accountNo}</span>
                            <Badge
                              variant={loan.status.active ? "success" : loan.status.closed ? "default" : "info"}
                              size="sm"
                            >
                              {loan.status.description}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{loan.productName}</p>
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Balance: {formatCurrency(loan.accountBalance ?? 0, loan.currency.code)}</span>
                            <span>Out: {formatCurrency(loan.amountOutstanding ?? 0, loan.currency.code)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PiggyBank className="h-4 w-4 text-emerald-500" />
                    Savings Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {accounts?.savingsAccounts?.length === 0 ? (
                    <p className="text-sm text-gray-400">No savings accounts</p>
                  ) : (
                    <div className="space-y-3">
                      {accounts?.savingsAccounts?.map((sav: ClientSavingsAccount) => (
                        <div
                          key={sav.id}
                          className="rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => navigate(`/deposits/saving-accounts/${sav.id}`)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs font-semibold">{sav.accountNo}</span>
                            <Badge
                              variant={sav.status.active ? "success" : sav.status.closed ? "default" : "warning"}
                              size="sm"
                            >
                              {sav.status.description ?? sav.status.code}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{sav.productName}</p>
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Balance: {formatCurrency(sav.accountBalance, sav.currency.code)}</span>
                            <span>Deposits: {formatCurrency(sav.totalDeposits ?? 0, sav.currency.code)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Could not load accounts.</p>
          )}
        </TabsContent>

        <TabsContent value="charges" className="mt-0">
          <ClientCharges clientId={client.id} />
        </TabsContent>

        <TabsContent value="collaterals" className="mt-0">
          <ClientCollaterals clientId={client.id} />
        </TabsContent>

        <TabsContent value="identifiers" className="mt-0">
          <ClientIdentifiers clientId={client.id} />
        </TabsContent>

        <TabsContent value="addresses" className="mt-0">
          <ClientAddresses clientId={client.id} />
        </TabsContent>

        <TabsContent value="family" className="mt-0">
          <ClientFamilyMembers clientId={client.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <ClientDocuments clientId={client.id} />
        </TabsContent>

        <TabsContent value="notes" className="mt-0">
          <ClientNotes clientId={client.id} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-0">
          <ClientTransactions clientId={client.id} />
        </TabsContent>
      </Tabs>

      {deleteMutation.isError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : "Failed to delete client. Only pending clients can be deleted."}
        </div>
      )}

      <ConfirmDialog
        open={showActivateConfirm}
        onOpenChange={setShowActivateConfirm}
        title="Activate Client"
        description={`Activate ${displayName}? The client will become active and eligible for financial services.`}
        onConfirm={handleActivate}
        variant="default"
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Client"
        description={`⚠️ Delete ${displayName}? Only pending clients with no active loans or savings can be deleted. This cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
};

export default ClientDetailPage;
