import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  PiggyBank,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  Building2,
  User,
  Info,
  Receipt,
  ArrowLeftRight,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Hash,
  Trash2,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  useSavingsAccount,
  useRejectSavingsAccount,
  useWithdrawSavingsAccount,
  useUndoRejectSavingsAccount,
  useApproveSavingsAccount,
  useActivateSavingsAccount,
  useCloseSavingsAccount,
  useDeleteSavingsAccount,
  useUndoApproveSavingsAccount,
  useForceWithdrawalSavings,
  useApplyAnnualFeesSavings,
  useAssignSavingsOfficer,
  useUnassignSavingsOfficer,
  SAVINGS_STATUS_CONFIG,
  calculateInterestSavings,
  postInterestSavings,
  blockSavingsAccount,
  unblockSavingsAccount,
  blockCreditSavingsAccount,
  unblockCreditSavingsAccount,
  blockDebitSavingsAccount,
  unblockDebitSavingsAccount,
  searchTransactions,
  useUndoSavingsTransaction,
  useReverseSavingsTransaction,
  holdAmountSchema,
} from "@/features/deposits";
import type { HoldAmountFormValues } from "@/features/deposits";
import { useHoldAmountSavings, useReleaseAmountSavings, useOnHoldTransactions } from "../hooks/useSavingsTransactions";
import { useSavingsPermissions } from "../hooks/useSavingsPermissions";
import { useStaffList } from "@/features/staff";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SavingsCharges from "@/features/deposits/components/SavingsCharges";
import DepositWithdrawDialog from "@/features/deposits/components/DepositWithdrawDialog";
import SavingsTransactions from "@/features/deposits/components/SavingsTransactions";

/** Normalize a date value from Finfact (string or number[]) to display string */
function fmtDate(v: unknown): string {
  if (!v) return "—";
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d] = v;
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  const s = String(v).split("T")[0];
  try {
    return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return s;
  }
}

const formatCurrency = (n?: number, code = "USD") =>
  n != null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n)
    : "—";

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

const DepositAccountDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: account, isLoading, isError, error, refetch } = useSavingsAccount(id);
  const rejectMutation = useRejectSavingsAccount();
  const withdrawMutation = useWithdrawSavingsAccount();
  const undoRejectMutation = useUndoRejectSavingsAccount();
  const approveMutation = useApproveSavingsAccount();
  const activateMutation = useActivateSavingsAccount();
  const closeMutation = useCloseSavingsAccount();
  const deleteMutation = useDeleteSavingsAccount();
  const undoApproveMutation = useUndoApproveSavingsAccount();
  const [activeTab, setActiveTab] = useState("general");
  const [txnDialog, setTxnDialog] = useState<"deposit" | "withdrawal" | null>(null);
  const [acting, setActing] = useState(false);
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const { data: onHoldData } = useOnHoldTransactions(id);
  const [showOnHold, setShowOnHold] = useState(false);
  const forceWithdrawalMutation = useForceWithdrawalSavings();
  const applyAnnualFeesMutation = useApplyAnnualFeesSavings();
  const assignOfficerMutation = useAssignSavingsOfficer();
  const unassignOfficerMutation = useUnassignSavingsOfficer();
  const undoTransactionMutation = useUndoSavingsTransaction();
  const reverseTransactionMutation = useReverseSavingsTransaction();
  const [forceWithdrawalDialogOpen, setForceWithdrawalDialogOpen] = useState(false);
  const [fwAmount, setFwAmount] = useState("");
  const [fwDate, setFwDate] = useState(new Date().toISOString().split("T")[0]);
  const [assignOfficerDialogOpen, setAssignOfficerDialogOpen] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const { data: staffList } = useStaffList({ loanOfficersOnly: true, status: "active" });
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [blockReasonDialog, setBlockReasonDialog] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [releaseConfirmId, setReleaseConfirmId] = useState<number | null>(null);

  const holdAmountMutation = useHoldAmountSavings();
  const releaseAmountMutation = useReleaseAmountSavings();
  const { hasPermission } = useSavingsPermissions();
  const { success: toastSuccess } = useToast();

  const holdForm = useForm<HoldAmountFormValues>({
    resolver: zodResolver(holdAmountSchema),
    defaultValues: {
      transactionDate: new Date().toISOString().split("T")[0],
      transactionAmount: 0,
      reasonForBlock: "",
      lienAllowed: false,
      externalId: "",
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    },
  });

  const summary = (account as any)?.summary ?? {};

  const handleCommand = useCallback(
    async (cmd: string, extra?: Record<string, unknown>) => {
      if (!account) return;
      setActing(true);
      const date = new Date().toISOString().split("T")[0];
      try {
        if (cmd === "approve")
          await approveMutation.mutateAsync({
            accountId: account.id,
            payload: { approvedOnDate: date, dateFormat: "yyyy-MM-dd", locale: "en" },
          });
        else if (cmd === "activate")
          await activateMutation.mutateAsync({
            accountId: account.id,
            payload: { activatedOnDate: date, dateFormat: "yyyy-MM-dd", locale: "en" },
          });
        else if (cmd === "close")
          await closeMutation.mutateAsync({
            accountId: account.id,
            payload: {
              closedOnDate: date,
              dateFormat: "yyyy-MM-dd",
              locale: "en",
              ...(extra as Record<string, unknown>),
            },
          });
        else if (cmd === "reject") await rejectMutation.mutateAsync(account.id);
        else if (cmd === "withdraw") await withdrawMutation.mutateAsync(account.id);
        else if (cmd === "undoreject") await undoRejectMutation.mutateAsync(account.id);
        else if (cmd === "undoapproval") await undoApproveMutation.mutateAsync(account.id);
        else if (cmd === "calculateInterest") await calculateInterestSavings(account.id);
        else if (cmd === "postInterest") await postInterestSavings(account.id);
        else if (cmd === "block") await blockSavingsAccount(account.id, extra?.reasonForBlock as string | undefined);
        else if (cmd === "unblock") await unblockSavingsAccount(account.id);
        else if (cmd === "blockCredit")
          await blockCreditSavingsAccount(account.id, extra?.reasonForBlock as string | undefined);
        else if (cmd === "unblockCredit") await unblockCreditSavingsAccount(account.id);
        else if (cmd === "blockDebit")
          await blockDebitSavingsAccount(account.id, extra?.reasonForBlock as string | undefined);
        else if (cmd === "unblockDebit") await unblockDebitSavingsAccount(account.id);
        refetch();
      } finally {
        setActing(false);
      }
    },
    [
      account,
      approveMutation,
      activateMutation,
      closeMutation,
      rejectMutation,
      withdrawMutation,
      undoRejectMutation,
      undoApproveMutation,
      refetch,
    ],
  );

  if (isLoading)
    return (
      <div className="max-w-6xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );

  if (isError || !account)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">{t("Failed to load:")}: {String(error)}</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            {t("Retry")}
          </Button>
        </div>
      </div>
    );

  const a = account as any;
  const statusCode = a.status?.code ?? "";
  const statusConfig = SAVINGS_STATUS_CONFIG[statusCode];
  const isPending = a.status?.submittedAndPendingApproval === true;
  const isActive = a.status?.active === true;
  const isApproved = a.status?.approved === true && !isActive;
  const isRejected = a.status?.rejected === true;
  const subStatus = a.subStatus?.code ?? "";
  const isBlocked = subStatus === "block" || subStatus === "BLOCK";
  const isBlockedCredit = subStatus === "block_credit" || subStatus === "BLOCK_CREDIT";
  const isBlockedDebit = subStatus === "block_debit" || subStatus === "BLOCK_DEBIT";

  const handleHoldAmount = async (values: HoldAmountFormValues) => {
    if (!account) return;
    await holdAmountMutation.mutateAsync({
      accountId: account.id,
      payload: {
        transactionDate: values.transactionDate,
        transactionAmount: values.transactionAmount,
        reasonForBlock: values.reasonForBlock,
        lienAllowed: values.lienAllowed,
        externalId: values.externalId || undefined,
        locale: values.locale,
        dateFormat: values.dateFormat,
      },
    });
    toastSuccess(t("Amount held successfully"));
    setHoldDialogOpen(false);
    holdForm.reset();
    refetch();
  };

  const handleReleaseHold = async (transactionId: number) => {
    if (!account) return;
    await releaseAmountMutation.mutateAsync({
      accountId: account.id,
      transactionId,
    });
    toastSuccess(t("Amount released successfully"));
    setReleaseConfirmId(null);
    refetch();
  };

  const handleForceWithdrawal = async () => {
    if (!account) return;
    const numAmount = parseFloat(fwAmount);
    if (!numAmount || numAmount <= 0) return;
    await forceWithdrawalMutation.mutateAsync({
      accountId: account.id,
      payload: { transactionDate: fwDate, transactionAmount: numAmount },
    });
    setForceWithdrawalDialogOpen(false);
    setFwAmount("");
    refetch();
  };

  const handleApplyAnnualFees = async () => {
    if (!account) return;
    await applyAnnualFeesMutation.mutateAsync(account.id);
    refetch();
  };

  const handleAssignOfficer = async () => {
    if (!account || !selectedOfficerId) return;
    await assignOfficerMutation.mutateAsync({
      accountId: account.id,
      officerId: Number(selectedOfficerId),
    });
    setAssignOfficerDialogOpen(false);
    setSelectedOfficerId("");
    refetch();
  };

  const handleUnassignOfficer = async () => {
    if (!account) return;
    await unassignOfficerMutation.mutateAsync({ accountId: account.id });
    refetch();
  };

  const handleSearchTransactions = async () => {
    if (!account) return;
    setSearching(true);
    try {
      const result = await searchTransactions(account.id, {
        dateFrom: searchFrom || undefined,
        dateTo: searchTo || undefined,
      });
      setSearchResults(result?.pageItems ?? []);
    } finally {
      setSearching(false);
    }
  };

  const handleUndoTransaction = async (transactionId: number) => {
    if (!account) return;
    await undoTransactionMutation.mutateAsync({ accountId: account.id, transactionId });
    refetch();
  };

  const handleReverseTransaction = async (transactionId: number) => {
    if (!account) return;
    await reverseTransactionMutation.mutateAsync({ accountId: account.id, transactionId });
    refetch();
  };

  const handleBlockConfirm = async () => {
    if (!blockReasonDialog) return;
    await handleCommand(blockReasonDialog, { reasonForBlock: blockReason || undefined });
    setBlockReasonDialog(null);
    setBlockReason("");
  };

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={`${t("Account")} ${a.accountNo}`}
        description={`${a.savingsProductName ?? t("Savings")} — ${a.clientName ?? `${t("Client")} #${a.clientId}`}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap ">
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
                  onClick={() => handleCommand("approve")}
                  disabled={acting}
                  className="text-emerald-600 border-emerald-200"
                >
                  {acting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                   <CheckCircle2 className="mr-1 h-4 w-4" />
                   {t("Approve")}
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleCommand("reject")}
                   disabled={acting}
                   className="text-red-600"
                 >
                   <XCircle className="mr-1 h-4 w-4" />
                   {t("Reject")}
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleCommand("withdraw")}
                   disabled={acting}
                   className="text-amber-600"
                 >
                   {t("Withdraw")}
                 </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (account) {
                      await deleteMutation.mutateAsync(account.id);
                      navigate("/deposits/saving-accounts");
                    }
                  }}
                  disabled={acting}
                  className="text-red-600"
                >
                   <Trash2 className="mr-1 h-4 w-4" /> {t("Delete")}
                </Button>
              </>
            )}
            {isApproved && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCommand("activate")}
                  disabled={acting}
                  className="text-emerald-600"
                >
                  {acting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                   <CheckCircle2 className="mr-1 h-4 w-4" />
                   {t("Activate")}
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleCommand("undoapproval")}
                   disabled={acting}
                   className="text-amber-600"
                 >
                   {t("Undo Approval")}
                 </Button>
              </>
            )}
            {isActive && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTxnDialog("deposit")}
                  disabled={isBlocked || isBlockedDebit}
                  className="text-emerald-600"
                >
                   <ArrowDownCircle className="mr-1 h-4 w-4" />
                   {t("Deposit")}
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setTxnDialog("withdrawal")}
                   disabled={isBlocked || isBlockedCredit}
                   className="text-amber-600"
                 >
                   <ArrowUpCircle className="mr-1 h-4 w-4" />
                   {t("Withdraw")}
                 </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCommand("calculateInterest")}
                  disabled={acting}
                >
                 {t("Calc Interest")}
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => handleCommand("postInterest")} disabled={acting}>
                   {t("Post Interest")}
                 </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHoldDialogOpen(true)}
                    disabled={!hasPermission("HOLDAMOUNT")}
                  >
                    {t("Hold Amount")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOnHold(true)}
                    disabled={!hasPermission("RELEASEAMOUNT")}
                  >
                    {t("On-Hold Funds")}
                  </Button>
                 <Button variant="outline" size="sm" onClick={() => setForceWithdrawalDialogOpen(true)}>
                   {t("Force Withdrawal")}
                 </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyAnnualFees}
                  disabled={applyAnnualFeesMutation.isPending}
                >
                 {t("Apply Annual Fees")}
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => setAssignOfficerDialogOpen(true)}>
                   {t("Assign Officer")}
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleUnassignOfficer}
                   disabled={unassignOfficerMutation.isPending}
                 >
                   {t("Unassign Officer")}
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => setSearchDialogOpen(true)}>
                   <Search className="mr-1 h-4 w-4" />
                   {t("Search Transactions")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setBlockReason(""); setBlockReasonDialog("block"); }}
                  disabled={acting}
                  className="text-red-600"
                >
                 {t("Block")}
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => { setBlockReason(""); setBlockReasonDialog("blockCredit"); }}
                   disabled={acting}
                   className="text-amber-600"
                 >
                   {t("Block Credit")}
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => { setBlockReason(""); setBlockReasonDialog("blockDebit"); }}
                   disabled={acting}
                   className="text-amber-600"
                 >
                   {t("Block Debit")}
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleCommand("unblock")}
                   disabled={acting}
                   className="text-emerald-600"
                 >
                   {t("Unblock")}
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleCommand("unblockCredit")}
                   disabled={acting}
                   className="text-emerald-600"
                 >
                   {t("Unblock Credit")}
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleCommand("unblockDebit")}
                   disabled={acting}
                   className="text-emerald-600"
                 >
                   {t("Unblock Debit")}
                 </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCommand("close")}
                  disabled={acting}
                  className="text-gray-600"
                >
                   <XCircle className="mr-1 h-4 w-4" />
                   {t("Close")}
                </Button>
              </>
            )}
            {isRejected && (
              <Button variant="outline" size="sm" onClick={() => handleCommand("undoreject")} disabled={acting}>
                {t("Undo Reject")}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/deposits/saving-accounts")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("Back")}
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general">
            <Info className="h-4 w-4 mr-1" />
            {t("General")}
          </TabsTrigger>
          <TabsTrigger value="charges">
            <Receipt className="h-4 w-4 mr-1" />
            {t("Charges")}
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            {t("Transactions")}
          </TabsTrigger>
        </TabsList>
        <Separator className="my-4" />

        <TabsContent value="general" className="mt-0 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-emerald-500" />
                  {t("Account Info")}
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label={t("Account No")}
                  value={<code className="text-xs">{a.accountNo}</code>}
                />
                <InfoRow
                  icon={<Building2 className="h-4 w-4" />}
                  label={t("Product")}
                  value={a.savingsProductName ?? a.savingsProductId}
                />
                <InfoRow icon={<User className="h-4 w-4" />} label={t("Client")} value={a.clientName ?? `#${a.clientId}`} />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label={t("Field Officer ID")}
                  value={a.fieldOfficerId != null && a.fieldOfficerId !== 0 ? a.fieldOfficerId : "—"}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label={t("Balance")}
                  value={
                    <span className="font-semibold">{formatCurrency(summary.accountBalance, a.currency?.code)}</span>
                  }
                />
                <InfoRow
                  icon={<Percent className="h-4 w-4" />}
                  label={t("Interest Rate")}
                  value={`${a.nominalAnnualInterestRate ?? 0}%`}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                  label={t("Available")}
                  value={formatCurrency(summary.availableBalance, a.currency?.code)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  {t("Summary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                <InfoRow
                  icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                  label={t("Total Deposits")}
                  value={formatCurrency(summary.totalDeposits, a.currency?.code)}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4 text-amber-500" />}
                  label={t("Interest Earned")}
                  value={formatCurrency(summary.totalInterestEarned, a.currency?.code)}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4 text-amber-500" />}
                  label={t("Interest Posted")}
                  value={formatCurrency(summary.totalInterestPosted, a.currency?.code)}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label={t("Last Transaction")}
                  value={fmtDate(a.lastActiveTransactionDate)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {t("Timeline")}
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label={t("Submitted")}
                  value={fmtDate(a.timeline?.submittedOnDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label={t("Approved")}
                  value={fmtDate(a.timeline?.approvedOnDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label={t("Activated")}
                  value={fmtDate(a.timeline?.activatedOnDate)}
                />
              </CardContent>
            </Card>

            <Card className="col-span-full">
              <CardHeader>
                <CardTitle className="text-base">
                  <Percent className="inline mr-2 h-4 w-4" />
                   {t("Interest Rate & Configuration")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                                     <span className="text-gray-500">{t("Interest Rate:")}</span>{" "}
                  <span className="font-medium">{a.nominalAnnualInterestRate ?? 0}%</span>
                </div>
                <div>
                                     <span className="text-gray-500">{t("Compounding:")}</span>{" "}
                  <span className="font-medium">{a.interestCompoundingPeriodType?.value ?? "—"}</span>
                </div>
                <div>
                                     <span className="text-gray-500">{t("Posting:")}</span>{" "}
                  <span className="font-medium">{a.interestPostingPeriodType?.value ?? "—"}</span>
                </div>
                <div>
                                     <span className="text-gray-500">{t("Calculation:")}</span>{" "}
                  <span className="font-medium">{a.interestCalculationType?.value ?? "—"}</span>
                </div>
                <div>
                                     <span className="text-gray-500">{t("Days/Year:")}</span>{" "}
                  <span className="font-medium">{a.interestCalculationDaysInYearType?.value ?? "—"}</span>
                </div>
                <div>
                                     <span className="text-gray-500">{t("Min Opening Balance:")}</span>{" "}
                  <span className="font-medium">
                    {a.minRequiredOpeningBalance != null
                      ? formatCurrency(a.minRequiredOpeningBalance, a.currency?.code)
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">{t("Withdrawal Fee (Transfers):")}</span>{" "}
                  <span className="font-medium">{a.withdrawalFeeForTransfers ? t("Yes") : t("No")}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t("Allow Overdraft:")}</span>{" "}
                  <span className="font-medium">{a.allowOverdraft ? t("Yes") : t("No")}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t("Withhold Tax:")}</span>{" "}
                  <span className="font-medium">{a.withHoldTax ? t("Yes") : t("No")}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charges" className="mt-0">
          <SavingsCharges accountId={a.id} />
        </TabsContent>
        <TabsContent value="transactions" className="mt-0">
          <SavingsTransactions
            transactions={a?.transactions ?? []}
            onUndo={handleUndoTransaction}
            onReverse={handleReverseTransaction}
            onRelease={(txnId) => setReleaseConfirmId(txnId)}
            canRelease={hasPermission("RELEASEAMOUNT") && isActive}
            currencyCode={a.currency?.code}
          />
        </TabsContent>
      </Tabs>

      {txnDialog && (
        <DepositWithdrawDialog
          accountId={a.id}
          type={txnDialog}
          open={!!txnDialog}
          onOpenChange={() => setTxnDialog(null)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Hold Amount Dialog */}
      <Dialog
        open={holdDialogOpen}
        onOpenChange={(open) => {
          setHoldDialogOpen(open);
          if (!open) holdForm.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Hold Amount")}</DialogTitle>
            <DialogDescription>{t("Freeze an amount on this account.")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={holdForm.handleSubmit(handleHoldAmount)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="holdAmount">{t("Amount")} *</Label>
              <Input
                id="holdAmount"
                type="number"
                step="0.01"
                {...holdForm.register("transactionAmount", { valueAsNumber: true })}
              />
              {holdForm.formState.errors.transactionAmount && (
                <p className="text-xs text-red-500">{holdForm.formState.errors.transactionAmount.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="holdDate">{t("Date")} *</Label>
              <Input id="holdDate" type="date" {...holdForm.register("transactionDate")} />
              {holdForm.formState.errors.transactionDate && (
                <p className="text-xs text-red-500">{holdForm.formState.errors.transactionDate.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="holdReason">{t("Reason")} *</Label>
              <Input
                id="holdReason"
                maxLength={100}
                {...holdForm.register("reasonForBlock")}
                placeholder={t("e.g. Court order hold")}
              />
              {holdForm.formState.errors.reasonForBlock && (
                <p className="text-xs text-red-500">{holdForm.formState.errors.reasonForBlock.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="holdExternalId">{t("External ID")}</Label>
              <Input
                id="holdExternalId"
                maxLength={100}
                {...holdForm.register("externalId")}
                placeholder={t("Optional")}
              />
            </div>
            <Button type="submit" disabled={!holdForm.formState.isValid || holdAmountMutation.isPending}>
              {holdAmountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Hold")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* On-Hold Transactions Dialog */}
      <Dialog open={showOnHold} onOpenChange={setShowOnHold}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("On-Hold Funds")}</DialogTitle>
            <DialogDescription>{t("Currently held amounts on this account.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {!onHoldData?.pageItems?.length ? (
              <p className="text-sm text-gray-500">{t("No funds on hold.")}</p>
            ) : (
              onHoldData.pageItems.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(txn.amount, a.currency?.code)}</p>
                    {txn.reasonForBlock && <p className="text-xs text-gray-500">{txn.reasonForBlock}</p>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReleaseConfirmId(txn.transactionId)}
                    disabled={!hasPermission("RELEASEAMOUNT") || releaseAmountMutation.isPending}
                  >
                    {t("Release")}
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={releaseConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setReleaseConfirmId(null);
        }}
        onConfirm={() => releaseConfirmId !== null && handleReleaseHold(releaseConfirmId)}
        title={t("Release Held Amount")}
        description={t("Are you sure you want to release this held amount?")}
        confirmLabel={t("Release")}
        loading={releaseAmountMutation.isPending}
      />

      {/* Force Withdrawal Dialog */}
      <Dialog open={forceWithdrawalDialogOpen} onOpenChange={setForceWithdrawalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Force Withdrawal")}</DialogTitle>
            <DialogDescription>{t("Force a withdrawal from this account.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="fwAmount">
                {t("Amount")} *
              </label>
              <Input
                id="fwAmount"
                type="number"
                step="0.01"
                value={fwAmount}
                onChange={(e) => setFwAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="fwDate">
                {t("Date")} *
              </label>
              <Input id="fwDate" type="date" value={fwDate} onChange={(e) => setFwDate(e.target.value)} />
            </div>
            <Button onClick={handleForceWithdrawal} disabled={!fwAmount || forceWithdrawalMutation.isPending}>
              {forceWithdrawalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Force Withdraw")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Officer Dialog */}
      <Dialog open={assignOfficerDialogOpen} onOpenChange={setAssignOfficerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Assign Savings Officer")}</DialogTitle>
            <DialogDescription>{t("Select an officer to assign to this account.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">{t("Officer")} *</label>
              <Select onValueChange={setSelectedOfficerId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select officer")} />
                </SelectTrigger>
                <SelectContent>
                  {staffList?.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.displayName ?? o.firstname + " " + o.lastname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignOfficer} disabled={!selectedOfficerId || assignOfficerMutation.isPending}>
              {assignOfficerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Assign")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Transactions Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("Search Transactions")}</DialogTitle>
            <DialogDescription>{t("Filter transactions by date range.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="block text-sm font-medium" htmlFor="searchFrom">
                  {t("From Date")}
                </label>
                <Input id="searchFrom" type="date" value={searchFrom} onChange={(e) => setSearchFrom(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="block text-sm font-medium" htmlFor="searchTo">
                  {t("To Date")}
                </label>
                <Input id="searchTo" type="date" value={searchTo} onChange={(e) => setSearchTo(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSearchTransactions} disabled={searching}>
              {searching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Search className="mr-2 h-4 w-4" />
              {t("Search")}
            </Button>
            {searchResults.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.map((txn: any, idx: number) => (
                  <div key={txn.id ?? idx} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <p className="font-medium">{formatCurrency(txn.amount, a.currency?.code)}</p>
                      <p className="text-xs text-gray-500">{txn.type?.value ?? txn.transactionType?.value ?? "—"}</p>
                    </div>
                    <span className="text-xs text-gray-400">{txn.date ?? txn.transactionDate ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}
            {searchResults.length === 0 && !searching && searchFrom && (
              <p className="text-sm text-gray-500">{t("No transactions found.")}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Reason Dialog */}
      <Dialog open={!!blockReasonDialog} onOpenChange={() => setBlockReasonDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Block Account")}</DialogTitle>
            <DialogDescription>{t("Provide a reason for blocking (required by backend).")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="blockReason">
                {t("Reason for Block")} *
              </label>
              <Input
                id="blockReason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder={t("Enter reason...")}
                maxLength={100}
              />
            </div>
            <Button onClick={handleBlockConfirm} disabled={acting || !blockReason.trim()}>
              {acting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepositAccountDetailPage;
