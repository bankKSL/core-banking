import { type FC, useState, useCallback } from "react";
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
  Ban,
  Undo2,
  Calculator,
  PiggyBank,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  useFixedDepositAccount,
  useDeleteFixedDepositAccount,
  FIXED_DEPOSIT_STATUS_CONFIG,
  approveFixedDeposit,
  activateFixedDeposit,
  closeFixedDeposit,
  prematureCloseFixedDeposit,
  rejectFixedDeposit,
  withdrawFixedDeposit,
  undoApprovalFixedDeposit,
  calculatePrematureAmount,
  fixedDepositCommand,
} from "@/features/deposits";
import FixedDepositTransactions from "@/features/deposits/components/FixedDepositTransactions";
import FixedDepositCharges from "@/features/deposits/components/FixedDepositCharges";
import { useMakeFixedDepositTransaction } from "@/features/deposits";

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

const MATURITY_INSTRUCTION_OPTIONS = [
  { id: 100, label: "Withdraw Deposit" },
  { id: 200, label: "Transfer to Savings" },
  { id: 300, label: "Reinvest Principal + Interest" },
  { id: 400, label: "Reinvest Principal Only" },
];

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
      <div className="text-sm text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  </div>
);

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "—");

const FixedDepositDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: fd, isLoading, isError, error, refetch } = useFixedDepositAccount(id);
  const makeTxnMutation = useMakeFixedDepositTransaction();
  const deleteMutation = useDeleteFixedDepositAccount();
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Dialog states
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeDate, setCloseDate] = useState(new Date().toISOString().split("T")[0]);
  const [onAccountClosureId, setOnAccountClosureId] = useState("100");
  const [toSavingsAccountId, setToSavingsAccountId] = useState("");

  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split("T")[0]);

  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split("T")[0]);

  const runCommand = useCallback(
    async (cmd: string, extra: Record<string, unknown> = {}) => {
      if (!fd) return;
      setActionLoading(true);
      try {
        await fixedDepositCommand(fd.id, cmd, extra);
        refetch();
      } finally {
        setActionLoading(false);
      }
    },
    [fd, refetch],
  );

  const handleApprove = useCallback(async () => {
    if (!fd) return;
    await approveFixedDeposit(fd.id);
    refetch();
  }, [fd, refetch]);

  const handleActivate = useCallback(async () => {
    if (!fd) return;
    await activateFixedDeposit(fd.id);
    refetch();
  }, [fd, refetch]);

  const handleClose = useCallback(async () => {
    if (!fd) return;
    const payload: Record<string, unknown> = {
      closedOnDate: closeDate,
      onAccountClosureId: Number(onAccountClosureId),
    };
    if (onAccountClosureId === "200") payload.toSavingsAccountId = Number(toSavingsAccountId);
    await closeFixedDeposit(fd.id, payload as any);
    setCloseDialogOpen(false);
    refetch();
  }, [fd, closeDate, onAccountClosureId, toSavingsAccountId, refetch]);

  const handlePrematureClose = useCallback(async () => {
    if (!fd) return;
    const payload: Record<string, unknown> = {
      closedOnDate: closeDate,
      onAccountClosureId: Number(onAccountClosureId),
    };
    if (onAccountClosureId === "200") payload.toSavingsAccountId = Number(toSavingsAccountId);
    await prematureCloseFixedDeposit(fd.id, payload as any);
    setCloseDialogOpen(false);
    refetch();
  }, [fd, closeDate, onAccountClosureId, toSavingsAccountId, refetch]);

  const handleCalculateInterest = useCallback(async () => {
    await runCommand("calculateInterest");
  }, [runCommand]);

  const handlePostInterest = useCallback(async () => {
    await runCommand("postInterest");
  }, [runCommand]);

  const handleCalculatePrematureAmount = useCallback(async () => {
    await calculatePrematureAmount(fd!.id, closeDate);
    refetch();
  }, [fd, closeDate, refetch]);

  const handleDeposit = useCallback(async () => {
    if (!fd) return;
    await makeTxnMutation.mutateAsync({
      accountId: fd.id,
      command: "deposit",
      payload: { transactionDate: depositDate, transactionAmount: Number(depositAmount) },
    });
    setDepositDialogOpen(false);
    refetch();
  }, [fd, depositDate, depositAmount, makeTxnMutation, refetch]);

  const handleWithdrawal = useCallback(async () => {
    if (!fd) return;
    await makeTxnMutation.mutateAsync({
      accountId: fd.id,
      command: "withdrawal",
      payload: { transactionDate: withdrawalDate, transactionAmount: Number(withdrawalAmount) },
    });
    setWithdrawalDialogOpen(false);
    refetch();
  }, [fd, withdrawalDate, withdrawalAmount, makeTxnMutation, refetch]);

  if (isLoading) {
    return (
      <div className="max-w-6xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError || !fd) {
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
  }

  const statusCode = fd.status?.code ?? "";
  const statusConfig = FIXED_DEPOSIT_STATUS_CONFIG[statusCode];
  const isPending = statusCode.includes("pending") || statusCode.includes("submitted");
  const isApproved = statusCode.includes("approved") && !statusCode.includes("active");
  const isActive = statusCode.includes("active");
  const isRejectedOrWithdrawn = statusCode.includes("rejected") || statusCode.includes("withdrawn");

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={`FD ${fd.accountNo}`}
        description={`${fd.depositProductName ?? "Fixed Deposit"} — ${fd.clientName ?? `Client #${fd.clientId}`}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="text-emerald-600 border-emerald-200"
                >
                  {actionLoading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rejectFixedDeposit(fd.id).then(() => refetch())}
                  disabled={actionLoading}
                  className="text-red-600"
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => withdrawFixedDeposit(fd.id).then(() => refetch())}
                  disabled={actionLoading}
                  className="text-amber-600"
                >
                  <Ban className="mr-1 h-4 w-4" />
                  Withdraw
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await deleteMutation.mutateAsync(fd.id);
                    navigate("/deposits/fixed");
                  }}
                  disabled={actionLoading}
                  className="text-red-600"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
            {isApproved && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleActivate}
                  disabled={actionLoading}
                  className="text-emerald-600"
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => undoApprovalFixedDeposit(fd.id).then(() => refetch())}
                  disabled={actionLoading}
                >
                  <Undo2 className="mr-1 h-4 w-4" />
                  Undo Approval
                </Button>
              </>
            )}
            {isActive && (
              <>
                <Button variant="outline" size="sm" onClick={handleCalculateInterest} disabled={actionLoading}>
                  <Calculator className="mr-1 h-4 w-4" />
                  Calc Interest
                </Button>
                <Button variant="outline" size="sm" onClick={handlePostInterest} disabled={actionLoading}>
                  <DollarSign className="mr-1 h-4 w-4" />
                  Post Interest
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDepositDialogOpen(true)}>
                  <PiggyBank className="mr-1 h-4 w-4" />
                  Deposit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWithdrawalDialogOpen(true)}>
                  <Ban className="mr-1 h-4 w-4" />
                  Withdraw
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCloseDialogOpen(true);
                    setOnAccountClosureId("200");
                  }}
                  className="text-amber-600"
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Premature Close
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCloseDialogOpen(true);
                    setOnAccountClosureId("100");
                  }}
                  className="text-gray-600"
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  Close at Maturity
                </Button>
              </>
            )}
            {isRejectedOrWithdrawn && (
              <Button variant="outline" size="sm" onClick={() => navigate("/deposits/fixed")}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/deposits/fixed")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general">
            <Info className="h-4 w-4 mr-1" />
            General
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="charges">
            <DollarSign className="h-4 w-4 mr-1" />
            Charges
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
                <InfoRow icon={<Wallet className="h-4 w-4" />} label="Product" value={fd.depositProductName ?? "—"} />
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
                  value={`${fd.nominalAnnualInterestRate ?? fd.interestRate ?? 0}%`}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Period"
                  value={`${fd.depositPeriod ?? "—"} ${fd.depositPeriodFrequencyType?.value?.toLowerCase() ?? ""}`}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Balance"
                  value={formatCurrency(fd.accountBalance ?? 0, fd.currency?.code)}
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
                  value={formatDate(fd.timeline?.submittedOnDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Approved"
                  value={formatDate(fd.timeline?.approvedOnDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Activated"
                  value={formatDate(fd.timeline?.activatedOnDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Matured"
                  value={formatDate(fd.timeline?.maturedOnDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Closed"
                  value={formatDate(fd.timeline?.closedOnDate)}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Maturity Date"
                  value={formatDate(fd.maturityDate)}
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
                  <span className="font-medium">{fd.interestCompoundingPeriodType?.value ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Posting:</span>{" "}
                  <span className="font-medium">{fd.interestPostingPeriodType?.value ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Calculation:</span>{" "}
                  <span className="font-medium">{fd.interestCalculationType?.value ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Days/Year:</span>{" "}
                  <span className="font-medium">{fd.interestCalculationDaysInYearType?.value ?? "—"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-0">
          <FixedDepositTransactions accountId={fd.id} />
        </TabsContent>
        <TabsContent value="charges" className="mt-0">
          <FixedDepositCharges accountId={fd.id} />
        </TabsContent>
      </Tabs>

      {/* Close / Premature Close Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{onAccountClosureId === "200" ? "Premature Close" : "Close at Maturity"}</DialogTitle>
            <DialogDescription>Enter closure details for FD {fd.accountNo}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="closeDate">
                Closure Date
              </label>
              <Input id="closeDate" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">Closure Action</label>
              <Select value={onAccountClosureId} onValueChange={setOnAccountClosureId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {MATURITY_INSTRUCTION_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {onAccountClosureId === "200" && (
              <div className="flex flex-col gap-1.5">
                <label className="block text-sm font-medium" htmlFor="toSavingsAccountId">
                  Transfer to Savings Account ID
                </label>
                <Input
                  id="toSavingsAccountId"
                  type="number"
                  value={toSavingsAccountId}
                  onChange={(e) => setToSavingsAccountId(e.target.value)}
                  placeholder="Savings account ID"
                />
              </div>
            )}
            <div className="flex gap-2">
              {onAccountClosureId === "200" && (
                <Button variant="outline" onClick={handleCalculatePrematureAmount} disabled={actionLoading}>
                  {actionLoading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  <Calculator className="mr-1 h-4 w-4" />
                  Preview Amount
                </Button>
              )}
              <Button
                onClick={onAccountClosureId === "200" ? handlePrematureClose : handleClose}
                disabled={actionLoading}
                variant="destructive"
              >
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {onAccountClosureId === "200" ? "Premature Close" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Deposit</DialogTitle>
            <DialogDescription>Add funds to FD {fd.accountNo}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="depositAmount">
                Amount
              </label>
              <Input
                id="depositAmount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="depositDate">
                Date
              </label>
              <Input
                id="depositDate"
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
              />
            </div>
            <Button onClick={handleDeposit} disabled={!depositAmount || makeTxnMutation.isPending}>
              {makeTxnMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deposit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Withdrawal</DialogTitle>
            <DialogDescription>Withdraw funds from FD {fd.accountNo}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="withdrawalAmount">
                Amount
              </label>
              <Input
                id="withdrawalAmount"
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="withdrawalDate">
                Date
              </label>
              <Input
                id="withdrawalDate"
                type="date"
                value={withdrawalDate}
                onChange={(e) => setWithdrawalDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleWithdrawal}
              disabled={!withdrawalAmount || makeTxnMutation.isPending}
              variant="destructive"
            >
              {makeTxnMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Withdraw
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FixedDepositDetailPage;
