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
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFixedDepositAccount,
  FIXED_DEPOSIT_STATUS_CONFIG,
  approveFixedDeposit,
  activateFixedDeposit,
  closeFixedDeposit,
  prematureCloseFixedDeposit,
} from "@/features/deposits";
import FixedDepositTransactions from "@/features/deposits/components/FixedDepositTransactions";

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

const FixedDepositDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: fd, isLoading, isError, error, refetch } = useFixedDepositAccount(id);
  const [acting, setActing] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const runCommand = async (cmd: string) => {
    if (!fd) return;
    setActing(true);
    const date = new Date().toISOString().split("T")[0];
    try {
      if (cmd === "approve") await approveFixedDeposit(fd.id, date);
      else if (cmd === "activate") await activateFixedDeposit(fd.id, date);
      else if (cmd === "close") await closeFixedDeposit(fd.id, date);
      else if (cmd === "prematureClose") await prematureCloseFixedDeposit(fd.id, date);
      refetch();
    } finally {
      setActing(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  if (isError || !fd)
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

  const statusCode = fd.status?.code ?? "";
  const statusConfig = FIXED_DEPOSIT_STATUS_CONFIG[statusCode];
  const isPending = statusCode.includes("pending") || statusCode.includes("submitted");
  const isApproved = statusCode.includes("approved") && !statusCode.includes("active");
  const isActive = statusCode.includes("active");

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={`FD ${fd.accountNo}`}
        description={`${fd.depositProductName ?? "Fixed Deposit"} \u2014 ${fd.clientName ?? `Client #${fd.clientId}`}`}
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
            <Button variant="outline" size="sm" onClick={() => navigate("/deposits/fixed")}>
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
                  value={<code className="text-xs">{fd.accountNo}</code>}
                />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Client"
                  value={fd.clientName ?? `#${fd.clientId}`}
                />
                <InfoRow
                  icon={<Wallet className="h-4 w-4" />}
                  label="Product"
                  value={fd.depositProductName ?? "\u2014"}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Deposit Amount"
                  value={formatCurrency(fd.depositAmount, fd.currency?.code)}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                  label="Maturity Amount"
                  value={formatCurrency(fd.maturityAmount ?? 0, fd.currency?.code)}
                />
                <InfoRow
                  icon={<Percent className="h-4 w-4" />}
                  label="Interest Rate"
                  value={`${fd.nominalAnnualInterestRate ?? 0}%`}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Period"
                  value={`${fd.depositPeriod ?? "\u2014"} ${fd.depositPeriodFrequencyType?.value?.toLowerCase() ?? ""}`}
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
                    fd.timeline?.submittedOnDate ? new Date(fd.timeline.submittedOnDate).toLocaleDateString() : "\u2014"
                  }
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Approved"
                  value={
                    fd.timeline?.approvedOnDate ? new Date(fd.timeline.approvedOnDate).toLocaleDateString() : "\u2014"
                  }
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Activated"
                  value={
                    fd.timeline?.activatedOnDate ? new Date(fd.timeline.activatedOnDate).toLocaleDateString() : "\u2014"
                  }
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Matured"
                  value={
                    fd.timeline?.maturedOnDate ? new Date(fd.timeline.maturedOnDate).toLocaleDateString() : "\u2014"
                  }
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Closed"
                  value={fd.timeline?.closedOnDate ? new Date(fd.timeline.closedOnDate).toLocaleDateString() : "\u2014"}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Maturity Date"
                  value={fd.maturityDate ? new Date(fd.maturityDate).toLocaleDateString() : "\u2014"}
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
                  <span className="font-medium">{fd.interestCompoundingPeriodType?.value ?? "\u2014"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Posting:</span>{" "}
                  <span className="font-medium">{fd.interestPostingPeriodType?.value ?? "\u2014"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Calculation:</span>{" "}
                  <span className="font-medium">{fd.interestCalculationType?.value ?? "\u2014"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Days/Year:</span>{" "}
                  <span className="font-medium">{fd.interestCalculationDaysInYearType?.value ?? "\u2014"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-0">
          <FixedDepositTransactions accountId={fd.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FixedDepositDetailPage;
