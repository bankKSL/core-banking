import { type FC, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, Search, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccountDetails, useAccountTransactions, useAccountIdentifiers, useAccountKYC } from "../hooks/useInterop";
import { IDENTIFIER_TYPE_OPTIONS } from "../types/interop";
import type { InteropIdentifier, AccountTransaction, KYCData, AccountDetailResponse } from "../types/interop";

function AccountOverview({ account }: { account: AccountDetailResponse }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <p className="text-xs text-gray-500">External ID</p>
        <p className="font-mono text-sm">{account.externalId}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Account No</p>
        <p className="text-sm">{account.accountNo ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Product</p>
        <p className="text-sm">{account.productName ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Status</p>
        <Badge variant={account.status === "ACTIVE" ? "success" : "default"}>{account.status ?? "—"}</Badge>
      </div>
      <div>
        <p className="text-xs text-gray-500">Currency</p>
        <p className="text-sm">{account.currency?.code ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Balance</p>
        <p className="text-sm font-mono font-medium">{account.accountBalance?.toFixed(2) ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Available Balance</p>
        <p className="text-sm font-mono">{account.availableBalance?.toFixed(2) ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Client</p>
        <p className="text-sm">{account.clientName ?? `#${account.clientId ?? "—"}`}</p>
      </div>
    </div>
  );
}

function IdentifiersTab({ identifiers, loading }: { identifiers: InteropIdentifier[]; loading: boolean }) {
  const columns: ColumnDef<InteropIdentifier>[] = [
    {
      key: "type",
      header: "Type",
      cell: (r) => {
        const opt = IDENTIFIER_TYPE_OPTIONS.find((o) => o.id === r.type);
        return <Badge variant="info">{opt?.label ?? r.type}</Badge>;
      },
    },
    { key: "value", header: "Value", cell: (r) => <span className="font-mono text-sm">{r.value}</span> },
    { key: "subType", header: "Sub Type", cell: (r) => r.subType ?? "—" },
    {
      key: "createdOn",
      header: "Created",
      cell: (r) => (r.createdOn ? new Date(r.createdOn).toLocaleDateString() : "—"),
    },
  ];

  if (loading) return <Skeleton className="h-32 w-full" />;
  return (
    <DataTable
      columns={columns}
      data={identifiers}
      emptyState={{ message: "No identifiers registered for this account." }}
    />
  );
}

function TransactionsTab({ transactions, loading }: { transactions: AccountTransaction[]; loading: boolean }) {
  const columns: ColumnDef<AccountTransaction>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-medium">{r.id}</span> },
    {
      key: "transactionDate",
      header: "Date",
      cell: (r) => (r.transactionDate ? new Date(r.transactionDate).toLocaleDateString() : "—"),
    },
    { key: "transactionType", header: "Type", cell: (r) => r.transactionType ?? "—" },
    {
      key: "debit",
      header: "Debit",
      cell: (r) => (r.debit ? <span className="font-mono text-red-600">{r.debit.toFixed(2)}</span> : "—"),
    },
    {
      key: "credit",
      header: "Credit",
      cell: (r) => (r.credit ? <span className="font-mono text-emerald-600">{r.credit.toFixed(2)}</span> : "—"),
    },
    {
      key: "runningBalance",
      header: "Balance",
      cell: (r) =>
        r.runningBalance !== undefined ? <span className="font-mono">{r.runningBalance.toFixed(2)}</span> : "—",
    },
  ];

  if (loading) return <Skeleton className="h-32 w-full" />;
  return (
    <DataTable
      columns={columns}
      data={transactions}
      emptyState={{ message: "No transactions found." }}
      minWidth={600}
    />
  );
}

function KYCTab({ kyc, loading }: { kyc: KYCData | null; loading: boolean }) {
  if (loading) return <Skeleton className="h-32 w-full" />;
  if (!kyc) return <p className="text-gray-500 text-sm">No KYC data available.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div>
        <p className="text-xs text-gray-500">Name</p>
        <p className="text-sm font-medium">{kyc.displayName ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Mobile</p>
        <p className="text-sm">{kyc.mobileNo ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Email</p>
        <p className="text-sm">{kyc.emailAddress ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Date of Birth</p>
        <p className="text-sm">{kyc.dateOfBirth ? new Date(kyc.dateOfBirth).toLocaleDateString() : "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Gender</p>
        <p className="text-sm">{kyc.gender ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">ID Document</p>
        <p className="text-sm">{kyc.idDocument ?? "—"}</p>
      </div>
    </div>
  );
}

const InteropAccountDetailPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [accountId, setAccountId] = useState(searchParams.get("id") ?? "");

  const { data: account, isLoading: accountLoading } = useAccountDetails(accountId || undefined);
  const { data: transactions = [], isLoading: txLoading } = useAccountTransactions(accountId || undefined);
  const { data: identifiers = [], isLoading: idLoading } = useAccountIdentifiers(accountId || undefined);
  const { data: kyc, isLoading: kycLoading } = useAccountKYC(accountId || undefined);

  return (
    <div className="p-6 max-w-6xl m-auto space-y-6">
      <PageHeader
        title="Account Details"
        description="View savings account information, identifiers, transactions, and KYC"
        actions={
          <Button variant="outline" onClick={() => navigate("/interop/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="searchAccountId">Account External ID</Label>
              <Input
                id="searchAccountId"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g. ext-uuid-account-id"
              />
            </div>
            <Button onClick={() => setAccountId(accountId)} className="bg-[#D32F2F] hover:bg-red-700">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {accountId && accountLoading && (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      )}

      {accountId && !accountLoading && account && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="identifiers">Identifiers</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <AccountOverview account={account} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="identifiers">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registered Identifiers</CardTitle>
              </CardHeader>
              <CardContent>
                <IdentifiersTab identifiers={identifiers} loading={idLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionsTab transactions={transactions} loading={txLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">KYC Information</CardTitle>
              </CardHeader>
              <CardContent>
                <KYCTab kyc={kyc ?? null} loading={kycLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {accountId && !accountLoading && !account && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No account found with external ID &quot;{accountId}&quot;.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InteropAccountDetailPage;
