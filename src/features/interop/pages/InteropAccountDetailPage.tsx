import { type FC, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <p className="text-xs text-gray-500">{t("External ID")}</p>
        <p className="font-mono text-sm">{account.externalId}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("Account No")}</p>
        <p className="text-sm">{account.accountNo ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("Product")}</p>
        <p className="text-sm">{account.productName ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("Status")}</p>
        <Badge variant={account.status === "ACTIVE" ? "success" : "default"}>{account.status ?? "—"}</Badge>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("Currency")}</p>
        <p className="text-sm">{account.currency?.code ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("Balance")}</p>
        <p className="text-sm font-mono font-medium">{account.accountBalance?.toFixed(2) ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("Available Balance")}</p>
        <p className="text-sm font-mono">{account.availableBalance?.toFixed(2) ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("Client")}</p>
        <p className="text-sm">{account.clientName ?? `#${account.clientId ?? "—"}`}</p>
      </div>
    </div>
  );
}

function IdentifiersTab({ identifiers, loading }: { identifiers: InteropIdentifier[]; loading: boolean }) {
  const { t } = useTranslation();
  const columns: ColumnDef<InteropIdentifier>[] = [
    {
      key: "type",
      header: t("Type"),
      cell: (r) => {
        const opt = IDENTIFIER_TYPE_OPTIONS.find((o) => o.id === r.type);
        return <Badge variant="info">{opt?.label ?? r.type}</Badge>;
      },
    },
    { key: "value", header: t("Value"), cell: (r) => <span className="font-mono text-sm">{r.value}</span> },
    { key: "subType", header: t("Sub Type"), cell: (r) => r.subType ?? "—" },
    {
      key: "createdOn",
      header: t("Created"),
      cell: (r) => (r.createdOn ? new Date(r.createdOn).toLocaleDateString() : "—"),
    },
  ];

  if (loading) return <Skeleton className="h-32 w-full" />;
  return (
    <DataTable
      columns={columns}
      data={identifiers}
      emptyState={{ message: t("No identifiers registered for this account.") }}
    />
  );
}

function TransactionsTab({ transactions, loading }: { transactions: AccountTransaction[]; loading: boolean }) {
  const { t } = useTranslation();
  const columns: ColumnDef<AccountTransaction>[] = [
    { key: "id", header: t("ID"), cell: (r) => <span className="font-medium">{r.id}</span> },
    {
      key: "transactionDate",
      header: t("Date"),
      cell: (r) => (r.transactionDate ? new Date(r.transactionDate).toLocaleDateString() : "—"),
    },
    { key: "transactionType", header: t("Type"), cell: (r) => r.transactionType ?? "—" },
    {
      key: "debit",
      header: t("Debit"),
      cell: (r) => (r.debit ? <span className="font-mono text-red-600">{r.debit.toFixed(2)}</span> : "—"),
    },
    {
      key: "credit",
      header: t("Credit"),
      cell: (r) => (r.credit ? <span className="font-mono text-emerald-600">{r.credit.toFixed(2)}</span> : "—"),
    },
    {
      key: "runningBalance",
      header: t("Balance"),
      cell: (r) =>
        r.runningBalance !== undefined ? <span className="font-mono">{r.runningBalance.toFixed(2)}</span> : "—",
    },
  ];

  if (loading) return <Skeleton className="h-32 w-full" />;
  return (
    <DataTable
      columns={columns}
      data={transactions}
      emptyState={{ message: t("No transactions found.") }}
      minWidth={600}
    />
  );
}

function KYCTab({ kyc, loading }: { kyc: KYCData | null; loading: boolean }) {
  const { t } = useTranslation();
  if (loading) return <Skeleton className="h-32 w-full" />;
  if (!kyc) return <p className="text-gray-500 text-sm">{t("No KYC data available.")}</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div>
        <p className="text-xs text-gray-500">{t("Name")}</p>
        <p className="text-sm font-medium">{kyc.displayName ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("Mobile")}</p>
        <p className="text-sm">{kyc.mobileNo ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("Email")}</p>
        <p className="text-sm">{kyc.emailAddress ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("Date of Birth")}</p>
        <p className="text-sm">{kyc.dateOfBirth ? new Date(kyc.dateOfBirth).toLocaleDateString() : "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("Gender")}</p>
        <p className="text-sm">{kyc.gender ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("ID Document")}</p>
        <p className="text-sm">{kyc.idDocument ?? "—"}</p>
      </div>
    </div>
  );
}

const InteropAccountDetailPage: FC = () => {
  const { t } = useTranslation();
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
        title={t("Account Details")}
        description={t("View savings account information, identifiers, transactions, and KYC")}
        actions={
          <Button variant="outline" onClick={() => navigate("/interop/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Back")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Account Search")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label cursor-pointer htmlFor="searchAccountId">
                {t("Account External ID")}
              </label>
              <Input
                id="searchAccountId"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g. ext-uuid-account-id"
              />
            </div>
            <Button onClick={() => setAccountId(accountId)} className="bg-[#D32F2F] hover:bg-red-700">
              <Search className="mr-2 h-4 w-4" />
              {t("Search")}
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
            <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
            <TabsTrigger value="identifiers">{t("Identifiers")}</TabsTrigger>
            <TabsTrigger value="transactions">{t("Transactions")}</TabsTrigger>
            <TabsTrigger value="kyc">{t("KYC")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("Account Overview")}</CardTitle>
              </CardHeader>
              <CardContent>
                <AccountOverview account={account} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="identifiers">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("Registered Identifiers")}</CardTitle>
              </CardHeader>
              <CardContent>
                <IdentifiersTab identifiers={identifiers} loading={idLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("Transaction History")}</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionsTab transactions={transactions} loading={txLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("KYC Information")}</CardTitle>
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
            {t('No account found with external ID "{{accountId}}".', { accountId })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InteropAccountDetailPage;
