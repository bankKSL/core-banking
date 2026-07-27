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
  Repeat,
  Ban,
  Undo2,
  Calculator,
  PiggyBank,
  Power,
  Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useRecurringDepositAccount,
  RECURRING_DEPOSIT_STATUS_CONFIG,
  useRecurringDepositCommand,
  calculateInterestRecurringDeposit,
  postInterestRecurringDeposit,
  rejectRecurringDeposit,
  withdrawRecurringDeposit,
  calculatePrematureAmountRecurringDeposit,
  updateDepositAmountRecurringDeposit,
  useMakeRecurringDepositTransaction,
  recurringDepositCommand,
} from "@/features/deposits";
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

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "—");

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
  const makeTxnMutation = useMakeRecurringDepositTransaction();
  const [activeTab, setActiveTab] = useState("general");

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeDate, setCloseDate] = useState(new Date().toISOString().split("T")[0]);
  const [isPremature, setIsPremature] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split("T")[0]);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split("T")[0]);
  const [updateAmountDialogOpen, setUpdateAmountDialogOpen] = useState(false);
  const [newRecurringAmount, setNewRecurringAmount] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [prematureResult, setPrematureResult] = useState<Record<string, unknown> | null>(null);
  const [prematureDialogOpen, setPrematureDialogOpen] = useState(false);

  const runCommand = useCallback(
    async (command: string, data: Record<string, unknown> = {}) => {
      if (!rd) return;
      await commandMutation.mutateAsync({ accountId: rd.id, command, data });
      refetch();
    },
    [rd, commandMutation, refetch],
  );

  const handleClose = useCallback(async () => {
    if (!rd) return;
    const cmd = isPremature ? "prematureClose" : "close";
    await recurringDepositCommand(rd.id, cmd, { closedOnDate: closeDate, locale: "en", dateFormat: "yyyy-MM-dd" });
    setCloseDialogOpen(false);
    refetch();
  }, [rd, isPremature, closeDate, refetch]);

  const handleDeposit = useCallback(async () => {
    if (!rd) return;
    await makeTxnMutation.mutateAsync({
      accountId: rd.id,
      command: "deposit",
      payload: { transactionDate: depositDate, transactionAmount: Number(depositAmount) },
    });
    setDepositDialogOpen(false);
    refetch();
  }, [rd, depositDate, depositAmount, makeTxnMutation, refetch]);

  const handleWithdrawal = useCallback(async () => {
    if (!rd) return;
    await makeTxnMutation.mutateAsync({
      accountId: rd.id,
      command: "withdrawal",
      payload: { transactionDate: withdrawalDate, transactionAmount: Number(withdrawalAmount) },
    });
    setWithdrawalDialogOpen(false);
    refetch();
  }, [rd, withdrawalDate, withdrawalAmount, makeTxnMutation, refetch]);

  const handleUpdateAmount = useCallback(async () => {
    if (!rd || !newRecurringAmount) return;
    await updateDepositAmountRecurringDeposit(rd.id, {
      mandatoryRecommendedDepositAmount: Number(newRecurringAmount),
      effectiveDate,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    });
    setUpdateAmountDialogOpen(false);
    refetch();
  }, [rd, newRecurringAmount, effectiveDate, refetch]);

  if (isLoading)
    return (
      <div className="max-w-4xl m-auto space-y-6">
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
  const isClosed = statusCode.includes("closed");
  const acting = commandMutation.isPending;

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title={`RD ${rd.accountNo}`}
        description={`${rd.depositProductName ?? "Recurring Deposit"} — ${rd.clientName ?? `Client #${rd.clientId}`}`}
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
                  onClick={() => runCommand("approve", { approvedOnDate: new Date().toISOString().split("T")[0] })}
                  disabled={acting}
                  className="text-emerald-600 border-emerald-200"
                >
                  {acting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rejectRecurringDeposit(rd.id).then(() => refetch())}
                  disabled={acting}
                  className="text-red-600"
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => withdrawRecurringDeposit(rd.id).then(() => refetch())}
                  disabled={acting}
                  className="text-amber-600"
                >
                  <Ban className="mr-1 h-4 w-4" />
                  Withdraw
                </Button>
              </>
            )}
            {isApproved && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runCommand("activate", { activatedOnDate: new Date().toISOString().split("T")[0] })}
                  disabled={acting}
                  className="text-emerald-600"
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Activate
                </Button>
                <Button variant="outline" size="sm" onClick={() => runCommand("undoapproval")} disabled={acting}>
                  <Undo2 className="mr-1 h-4 w-4" />
                  Undo Approval
                </Button>
              </>
            )}
            {isActive && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => calculateInterestRecurringDeposit(rd.id).then(() => refetch())}
                  disabled={acting}
                >
                  <Calculator className="mr-1 h-4 w-4" />
                  Calc Interest
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!rd) return;
                    const result = await calculatePrematureAmountRecurringDeposit(
                      rd.id,
                      new Date().toISOString().split("T")[0],
                    );
                    setPrematureResult(result as unknown as Record<string, unknown>);
                    setPrematureDialogOpen(true);
                  }}
                  disabled={acting}
                >
                  <Calculator className="mr-1 h-4 w-4" />
                  Premature Calc
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => postInterestRecurringDeposit(rd.id).then(() => refetch())}
                  disabled={acting}
                >
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
                <Button variant="outline" size="sm" onClick={() => setUpdateAmountDialogOpen(true)}>
                  <Repeat className="mr-1 h-4 w-4" />
                  Update Amount
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsPremature(true);
                    setCloseDialogOpen(true);
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
                    setIsPremature(false);
                    setCloseDialogOpen(true);
                  }}
                  className="text-gray-600"
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  Close
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/deposits/recurring/edit/${rd.id}`)}
              className="text-blue-600"
            >
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/deposits/recurring")}>
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
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-1" />
            Installment Schedule
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
                <InfoRow icon={<Wallet className="h-4 w-4" />} label="Product" value={rd.depositProductName ?? "—"} />
                <InfoRow
                  icon={<Repeat className="h-4 w-4" />}
                  label="Recurring Amount"
                  value={formatCurrency(rd.recurringDepositAmount ?? 0, rd.currency?.code)}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Frequency"
                  value={`Every ${rd.recurringDepositFrequency ?? 1} ${rd.recurringDepositFrequencyType?.value?.toLowerCase() ?? ""}`}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Balance"
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
                  value={formatDate(rd.timeline?.submittedOnDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Approved"
                  value={formatDate(rd.timeline?.approvedOnDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Activated"
                  value={formatDate(rd.timeline?.activatedOnDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Closed"
                  value={formatDate(rd.timeline?.closedOnDate)}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Expected Maturity"
                  value={formatDate(rd.expectedMaturityDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="First Deposit"
                  value={formatDate(rd.expectedFirstDepositOnDate)}
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
        <TabsContent value="schedule" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                Expected Installment Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(() => {
                const amount = rd.recurringDepositAmount ?? 0;
                const period = rd.depositPeriod ?? 0;
                const freqType = rd.recurringDepositFrequencyType?.value?.toLowerCase() ?? "month";
                const freq = rd.recurringDepositFrequency ?? 1;
                const installments = period > 0 && freq > 0 ? Math.floor(period / freq) : 0;
                if (installments === 0)
                  return <p className="px-6 py-8 text-center text-sm text-gray-400">No installment data available.</p>;
                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: installments }).map((_, i) => {
                        const dueDate = rd.expectedFirstDepositOnDate
                          ? new Date(rd.expectedFirstDepositOnDate)
                          : rd.timeline?.activatedOnDate
                            ? new Date(rd.timeline.activatedOnDate)
                            : new Date();
                        dueDate.setMonth(dueDate.getMonth() + i * freq);
                        const balanceAfter = amount * (i + 1);
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                            <TableCell className="text-sm">
                              {dueDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(amount, rd.currency?.code)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-emerald-600">
                              {formatCurrency(balanceAfter, rd.currency?.code)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pre-mature Amount Result Dialog */}
      <Dialog open={prematureDialogOpen} onOpenChange={setPrematureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Premature Amount Calculation</DialogTitle>
            <DialogDescription>Estimated premature closure amount for RD {rd?.accountNo}.</DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-3xl font-bold text-emerald-600">
              {prematureResult?.changes
                ? formatCurrency(
                    Number(
                      (prematureResult.changes as Record<string, unknown>)?.maturityAmount ??
                        (prematureResult.changes as Record<string, unknown>)?.transactionAmount ??
                        0,
                    ),
                    rd?.currency?.code,
                  )
                : "—"}
            </p>
            <p className="text-sm text-gray-500 mt-2">Estimated premature maturity amount</p>
            {prematureResult?.changes ? (
              <div className="mt-4 text-left text-sm space-y-1">
                {Object.entries(prematureResult.changes as Record<string, unknown>).map(([k, v]) => (
                  <p key={k} className="text-gray-500">
                    <span className="font-medium capitalize">{k.replace(/([A-Z])/g, " $1").trim()}:</span>{" "}
                    {String(v ?? "")}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
          <Button variant="outline" onClick={() => setPrematureDialogOpen(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isPremature ? "Premature Close" : "Close at Maturity"}</DialogTitle>
            <DialogDescription>Enter closure date for RD {rd.accountNo}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="closeDate">Closure Date</Label>
              <Input id="closeDate" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            </div>
            <Button onClick={handleClose} disabled={acting} variant="destructive">
              {acting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPremature ? "Premature Close" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Installment Deposit</DialogTitle>
            <DialogDescription>Deposit funds to RD {rd.accountNo}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Amount</Label>
              <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} />
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
            <DialogDescription>Withdraw funds from RD {rd.accountNo}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Amount</Label>
              <Input type="number" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={withdrawalDate} onChange={(e) => setWithdrawalDate(e.target.value)} />
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

      {/* Update Amount Dialog */}
      <Dialog open={updateAmountDialogOpen} onOpenChange={setUpdateAmountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Recurring Deposit Amount</DialogTitle>
            <DialogDescription>Change the recurring installment amount.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>New Recurring Amount</Label>
              <Input
                type="number"
                value={newRecurringAmount}
                onChange={(e) => setNewRecurringAmount(e.target.value)}
                placeholder={String(rd.recurringDepositAmount ?? 0)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Effective Date</Label>
              <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
            </div>
            <Button onClick={handleUpdateAmount} disabled={!newRecurringAmount || commandMutation.isPending}>
              {commandMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Amount
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurringDepositDetailPage;
