import { type FC, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Wallet,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  User,
  Info,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  LogOut,
  Loader2,
  Repeat,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRecurringDepositAccount, RECURRING_DEPOSIT_STATUS_CONFIG, useRecurringDepositCommand } from "@/features/deposits";
import RecurringDepositTransactions from "@/features/deposits/components/RecurringDepositTransactions";

function Hash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  );
}

const formatCurrency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3 py-2">
    <span className="mt-0.5 text-gray-400">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const RecurringDepositDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: rd, isLoading, isError, error, refetch } = useRecurringDepositAccount(id);
  const commandMutation = useRecurringDepositCommand();
  const [activeTab, setActiveTab] = useState("general");

  const runCommand = async (command: string) => {
    if (!rd) return;
    const date = new Date().toISOString().split("T")[0];
    const data: Record<string, unknown> = {};
    if (command === "approve") data.approvedOnDate = date;
    else if (command === "activate") data.activatedOnDate = date;
    else if (command === "close" || command === "prematureClose") data.closedOnDate = date;
    await commandMutation.mutateAsync({ accountId: rd.id, command, data });
    refetch();
  };

  if (isLoading)
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  if (isError || !rd)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Failed to load: {String(error)}</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );

  const statusCode = rd.status?.code ?? "";
  const statusConfig = RECURRING_DEPOSIT_STATUS_CONFIG[statusCode];
  const isPending = statusCode.includes("pending") || statusCode.includes("submitted");
  const isApproved = statusCode.includes("approved") && !statusCode.includes("active");
  const isActive = statusCode.includes("active");
  const acting = commandMutation.isPending;

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={`RD ${rd.accountNo}`}
        description={`${rd.depositProductName ?? "Recurring Deposit"} — ${rd.clientName ?? `Client #${rd.clientId}`}`}
        actions={
          <div className="flex items-center gap-2">
            {statusConfig && (
              <Badge
                variant={
                  statusConfig.variant === "success" ? "success" : statusConfig.variant === "error" ? "error" : "info"
                }
              >
                {statusConfig.label}
              </Badge>
            )}
            {isPending && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => runCommand("approve")}
                disabled={acting}
                className="text-emerald-600 border-emerald-200"
              >
                {acting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Approve
              </Button>
            )}
            {isApproved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => runCommand("activate")}
                disabled={acting}
                className="text-emerald-600"
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Activate
              </Button>
            )}
            {isActive && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runCommand("prematureClose")}
                  disabled={acting}
                  className="text-amber-600"
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Premature Close
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runCommand("close")}
                  disabled={acting}
                  className="text-gray-600"
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  Close
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/deposits/recurring")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">
            <Info className="h-4 w-4 mr-1" />
            General
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            Transactions
          </TabsTrigger>
        </TabsList>
        <Separator className="my-4" />

        <TabsContent value="general" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  Account Info
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Account No"
                  value={<code className="text-xs">{rd.accountNo}</code>}
                />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Client"
                  value={rd.clientName ?? `#${rd.clientId}`}
                />
                <InfoRow
                  icon={<Wallet className="h-4 w-4" />}
                  label="Product"
                  value={rd.depositProductName ?? "—"}
                />
                <InfoRow
                  icon={<Repeat className="h-4 w-4" />}
                  label="Recurring Deposit Amount"
                  value={formatCurrency(rd.recurringDepositAmount ?? 0, rd.currency?.code)}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Deposit Frequency"
                  value={`Every ${rd.recurringDepositFrequency ?? 1} ${rd.recurringDepositFrequencyType?.value?.toLowerCase() ?? ""}`}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Account Balance"
                  value={formatCurrency(rd.accountBalance ?? 0, rd.currency?.code)}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                  label="Maturity Amount"
                  value={formatCurrency(rd.maturityAmount ?? 0, rd.currency?.code)}
                />
                <InfoRow
                  icon={<Percent className="h-4 w-4" />}
                  label="Interest Rate"
                  value={`${rd.interestRate ?? rd.nominalAnnualInterestRate ?? 0}%`}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Period"
                  value={`${rd.depositPeriod ?? "—"} ${rd.depositPeriodFrequencyType?.value?.toLowerCase() ?? ""}`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Submitted"
                  value={
                    rd.timeline?.submittedOnDate ? new Date(rd.timeline.submittedOnDate).toLocaleDateString() : "—"
                  }
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Approved"
                  value={rd.timeline?.approvedOnDate ? new Date(rd.timeline.approvedOnDate).toLocaleDateString() : "—"}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Activated"
                  value={
                    rd.timeline?.activatedOnDate ? new Date(rd.timeline.activatedOnDate).toLocaleDateString() : "—"
                  }
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Closed"
                  value={rd.timeline?.closedOnDate ? new Date(rd.timeline.closedOnDate).toLocaleDateString() : "—"}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Expected Maturity Date"
                  value={rd.expectedMaturityDate ? new Date(rd.expectedMaturityDate).toLocaleDateString() : "—"}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="First Deposit Expected"
                  value={
                    rd.expectedFirstDepositOnDate ? new Date(rd.expectedFirstDepositOnDate).toLocaleDateString() : "—"
                  }
                />
              </CardContent>
            </Card>

            <Card className="col-span-full">
              <CardHeader>
                <CardTitle className="text-base">
                  <DollarSign className="inline mr-2 h-4 w-4" />
                  Interest Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Compounding:</span>{" "}
                  <span className="font-medium">{rd.interestCompoundingPeriodType?.value ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Posting:</span>{" "}
                  <span className="font-medium">{rd.interestPostingPeriodType?.value ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Calculation:</span>{" "}
                  <span className="font-medium">{rd.interestCalculationType?.value ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Days/Year:</span>{" "}
                  <span className="font-medium">{rd.interestCalculationDaysInYearType?.value ?? "—"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-0">
          <RecurringDepositTransactions accountId={rd.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecurringDepositDetailPage;
