import { type FC, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Pause,
  CalendarClock,
  TrendingUp,
  Loader2,
  XCircle,
  Undo2,
  ShieldAlert,
  Percent,
  HandCoins,
  RotateCcw,
  Landmark,
  ReceiptText,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  useWCLoan,
  useApproveWCLoan,
  useDisburseWCLoan,
  useWCRepayment,
  useAmortizationSchedule,
  useDelinquencyRangeSchedule,
  useBreachScheduleQuery,
  useWCDelinquencyTags,
  useWCLoanTransactions,
  useCreateDelinquencyAction,
  useUpdatePaymentRate,
  useRateChangeHistory,
  useStateTransitionMutation,
  useMarkAsFraudMutation,
  useUpdateDiscountMutation,
  useWCTransactionCommandMutation,
  useUndoWCTransactionMutation,
  useWCLoanChargesQuery,
  useCreateLoanChargeMutation,
  useAdjustLoanChargeMutation,
  useBreachActionMutation,
  useDeleteWCLoan,
  useNearBreachActionMutation,
  WC_LOAN_STATUS_CONFIG,
  WC_LOAN_CODE_TO_KEY,
  WC_LOAN_STATUS_ID_MAP,
  type DelinquencyActionRequest,
  type NearBreachActionRequest,
  type WCChargeData,
  type WCBreachDelinquencyAction,
} from "../index";
import { formatDate, formatMoney, toDisplayText } from "../utils/format";
import { getErrorMessage } from "@/lib/error";

const today = () => new Date().toISOString().split("T")[0];

const WCLoanViewPage: FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: loan, isLoading, isError, refetch, isRefetching } = useWCLoan(id);
  const [activeTab, setActiveTab] = useState("details");

  const approveMut = useApproveWCLoan();
  const disburseMut = useDisburseWCLoan();
  const repaymentMut = useWCRepayment();
  const delinqActionMut = useCreateDelinquencyAction();
  const rateChangeMut = useUpdatePaymentRate();
  const transitionMut = useStateTransitionMutation();
  const markFraudMut = useMarkAsFraudMutation();
  const updateDiscountMut = useUpdateDiscountMutation();
  const txnCommandMut = useWCTransactionCommandMutation();
  const undoTxnMut = useUndoWCTransactionMutation();
  const createChargeMut = useCreateLoanChargeMutation();
  const adjustChargeMut = useAdjustLoanChargeMutation();
  const breachActionMut = useBreachActionMutation();
  const deleteLoanMut = useDeleteWCLoan();
  const nearBreachMut = useNearBreachActionMutation();

  const { data: amortSchedule = [] } = useAmortizationSchedule(id ? Number(id) : undefined);
  const { data: delinqSchedule = [] } = useDelinquencyRangeSchedule(id ? Number(id) : undefined);
  const { data: breachSchedule = [] } = useBreachScheduleQuery(id ? Number(id) : undefined);
  const { data: delinqTags = [] } = useWCDelinquencyTags(id ? Number(id) : undefined);
  const { data: transactions = [] } = useWCLoanTransactions(id ? Number(id) : undefined);
  const { data: rateChanges = [] } = useRateChangeHistory(id ? Number(id) : undefined);
  const { data: charges = [] } = useWCLoanChargesQuery(id ? Number(id) : undefined);

  const [approveOpen, setApproveOpen] = useState(false);
  const [disburseOpen, setDisburseOpen] = useState(false);
  const [repayOpen, setRepayOpen] = useState(false);
  const [rateChangeOpen, setRateChangeOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [undoApprovalOpen, setUndoApprovalOpen] = useState(false);
  const [undoDisbursalOpen, setUndoDisbursalOpen] = useState(false);
  const [markFraudOpen, setMarkFraudOpen] = useState(false);
  const [updateDiscountOpen, setUpdateDiscountOpen] = useState(false);
  const [goodwillOpen, setGoodwillOpen] = useState(false);
  const [payoutRefundOpen, setPayoutRefundOpen] = useState(false);
  const [creditRefundOpen, setCreditRefundOpen] = useState(false);
  const [chargeOffOpen, setChargeOffOpen] = useState(false);
  const [undoChargeOffOpen, setUndoChargeOffOpen] = useState(false);
  const [discountFeeOpen, setDiscountFeeOpen] = useState(false);
  const [discountFeeAdjustOpen, setDiscountFeeAdjustOpen] = useState(false);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [adjustChargeTarget, setAdjustChargeTarget] = useState<WCChargeData | null>(null);
  const [monitorAction, setMonitorAction] = useState<{
    kind: "breach" | "delinquency";
    action: WCBreachDelinquencyAction;
  } | null>(null);
  const [nearBreachOpen, setNearBreachOpen] = useState(false);
  const [deleteLoanOpen, setDeleteLoanOpen] = useState(false);

  const [approveDate, setApproveDate] = useState(today());
  const [approveAmount, setApproveAmount] = useState("");
  const [disburseDate, setDisburseDate] = useState(today());
  const [disburseAmount, setDisburseAmount] = useState("");
  const [repayDate, setRepayDate] = useState(today());
  const [repayAmount, setRepayAmount] = useState("");
  const [monitorStartDate, setMonitorStartDate] = useState(today());
  const [monitorEndDate, setMonitorEndDate] = useState("");
  const [rescheduleMinPayment, setRescheduleMinPayment] = useState("");
  const [rescheduleFrequency, setRescheduleFrequency] = useState("");
  const [newRate, setNewRate] = useState("");
  const [rateNote, setRateNote] = useState("");
  const [rejectDate, setRejectDate] = useState(today());
  const [rejectNote, setRejectNote] = useState("");
  const [undoNote, setUndoNote] = useState("");
  const [undoReversalExternalId, setUndoReversalExternalId] = useState("");
  const [discountAmountInput, setDiscountAmountInput] = useState("");
  const [txnDate, setTxnDate] = useState(today());
  const [txnAmount, setTxnAmount] = useState("");
  const [chargeOffReasonId, setChargeOffReasonId] = useState("");
  const [addChargeId, setAddChargeId] = useState("");
  const [addChargeAmount, setAddChargeAmount] = useState("");
  const [adjustChargeAmount, setAdjustChargeAmount] = useState("");
  const [nearBreachThreshold, setNearBreachThreshold] = useState("");
  const [nearBreachFrequency, setNearBreachFrequency] = useState("");
  const [nearBreachFrequencyType, setNearBreachFrequencyType] = useState<"DAYS" | "WEEKS" | "MONTHS">("DAYS");

  const handleSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const runMutation = useCallback(
    async (action: () => Promise<unknown>, successMessage: string, close: () => void) => {
      try {
        await action();
        toastSuccess(successMessage);
        close();
        handleSuccess();
      } catch (e) {
        toastError(getErrorMessage(e));
      }
    },
    [toastSuccess, toastError, handleSuccess],
  );

  if (isLoading) {
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
  }

  if (isError || !loan) {
    return (
      <div className="p-6">
        <ErrorState
          title={t("Failed to load loan")}
          message={t("Could not load loan details.")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const rawCode = loan.status?.code;
  const statusCode =
    (rawCode && WC_LOAN_CODE_TO_KEY[rawCode]) ?? rawCode ?? WC_LOAN_STATUS_ID_MAP[loan.status?.id ?? -1] ?? "";
  const statusCfg = WC_LOAN_STATUS_CONFIG[statusCode];
  const currencyCode = loan.summary?.currency?.code ?? "USD";
  const statusId = loan.status?.id;
  const isPending = statusId === 100;
  const isApproved = statusId === 200;
  const isActive = statusId === 300;

  const delinquencyClassification =
    loan.delinquent?.installmentLevelDelinquency?.[0]?.classification ?? loan.delinquencyRange?.classification;

  const isMutating =
    approveMut.isPending ||
    disburseMut.isPending ||
    repaymentMut.isPending ||
    delinqActionMut.isPending ||
    rateChangeMut.isPending ||
    transitionMut.isPending ||
    markFraudMut.isPending ||
    updateDiscountMut.isPending ||
    txnCommandMut.isPending ||
    undoTxnMut.isPending ||
    createChargeMut.isPending ||
    adjustChargeMut.isPending ||
    breachActionMut.isPending;

  const handleApprove = () =>
    runMutation(
      () =>
        approveMut.mutateAsync({
          loanId: Number(id),
          payload: {
            approvedOnDate: approveDate,
            approvedLoanAmount: approveAmount ? Number(approveAmount) : loan.principal,
            expectedDisbursementDate: approveDate,
            dateFormat: "yyyy-MM-dd",
            locale: "en",
          },
        }),
      t("Loan approved"),
      () => setApproveOpen(false),
    );

  const handleDisburse = () =>
    runMutation(
      () =>
        disburseMut.mutateAsync({
          loanId: Number(id),
          payload: {
            actualDisbursementDate: disburseDate,
            transactionAmount: disburseAmount ? Number(disburseAmount) : (loan.approvedPrincipal ?? loan.principal),
            dateFormat: "yyyy-MM-dd",
            locale: "en",
          },
        }),
      t("Loan disbursed"),
      () => setDisburseOpen(false),
    );

  const handleRepay = () =>
    runMutation(
      () =>
        repaymentMut.mutateAsync({
          loanId: Number(id),
          payload: {
            transactionDate: repayDate,
            transactionAmount: Number(repayAmount),
            dateFormat: "yyyy-MM-dd",
            locale: "en",
          },
        }),
      t("Repayment recorded"),
      () => setRepayOpen(false),
    );

  const ACTION_LABELS: Record<WCBreachDelinquencyAction, string> = {
    pause: t("Pause"),
    resume: t("Resume"),
    reschedule: t("Reschedule"),
    reset: t("Reset"),
    undo_reset: t("Undo Reset"),
    disable: t("Disable"),
    enable: t("Enable"),
  };

  // Unified breach/delinquency action dispatch (docs/WCLoan.md §4.18–4.19)
  const handleMonitorAction = () => {
    if (!monitorAction) return;
    const { kind, action } = monitorAction;
    const payload: DelinquencyActionRequest & Record<string, unknown> = { action, locale: "en" };
    if (action === "pause") {
      payload.startDate = monitorStartDate;
      payload.endDate = monitorEndDate;
    } else if (action === "resume" || action === "disable" || action === "enable") {
      payload.startDate = monitorStartDate;
    } else if (action === "reset" && kind === "delinquency") {
      payload.startNewPeriod = true;
    } else if (action === "reschedule") {
      payload.minimumPayment = rescheduleMinPayment ? Number(rescheduleMinPayment) : undefined;
      payload.frequency = rescheduleFrequency ? Number(rescheduleFrequency) : undefined;
      if (payload.minimumPayment != null) payload.minimumPaymentType = "FLAT";
      if (payload.frequency != null) payload.frequencyType = "DAYS";
      delete payload.dateFormat;
    }
    const mutate =
      kind === "breach"
        ? () => breachActionMut.mutateAsync({ loanId: Number(id), payload })
        : () => delinqActionMut.mutateAsync({ loanId: Number(id), payload });
    return runMutation(
      mutate,
      `${ACTION_LABELS[action]} — ${kind === "breach" ? t("breach") : t("delinquency")}`,
      () => setMonitorAction(null),
    );
  };

  const handleUndoChargeOff = () =>
    runMutation(
      () =>
        txnCommandMut.mutateAsync({
          loanId: Number(id),
          command: "undoChargeOff",
          payload: {
            reversalExternalId: undoReversalExternalId || undefined,
            note: undoNote || undefined,
            locale: "en",
          },
        }),
      t("Charge-off undone"),
      () => setUndoChargeOffOpen(false),
    );

  const handleDiscountFee = (command: "discountFee" | "discountFeeAdjustment", close: () => void) =>
    runMutation(
      () =>
        txnCommandMut.mutateAsync({
          loanId: Number(id),
          command,
          payload:
            command === "discountFeeAdjustment"
              ? {
                  transactionAmount: Number(txnAmount),
                  transactionDate: txnDate,
                  dateFormat: "yyyy-MM-dd",
                  locale: "en",
                }
              : {
                  transactionAmount: txnAmount ? Number(txnAmount) : undefined,
                  transactionDate: txnDate,
                  dateFormat: "yyyy-MM-dd",
                  locale: "en",
                },
        }),
      t("Transaction recorded"),
      close,
    );

  const handleNearBreachReschedule = () =>
    runMutation(
      () => {
        const payload: NearBreachActionRequest = {
          action: "RESCHEDULE",
          nearBreachThreshold: Number(nearBreachThreshold),
          nearBreachFrequency: Number(nearBreachFrequency),
          nearBreachFrequencyType: nearBreachFrequencyType,
          locale: "en",
        };
        return nearBreachMut.mutateAsync({ loanId: Number(id), payload });
      },
      t("Near-breach rescheduled"),
      () => setNearBreachOpen(false),
    );

  const handleDeleteLoan = async () => {
    try {
      await deleteLoanMut.mutateAsync(Number(id));
      toastSuccess(t("Loan application deleted"));
      navigate("/working-capital-loans");
    } catch (e) {
      toastError(getErrorMessage(e));
    }
  };

  const handleRateChange = () =>
    runMutation(
      () =>
        rateChangeMut.mutateAsync({
          loanId: Number(id),
          payload: { periodPaymentRate: Number(newRate), note: rateNote || undefined, locale: "en" },
        }),
      t("Payment rate updated"),
      () => setRateChangeOpen(false),
    );

  // ─── New handlers (docs/WCLoan.md §14 state machine gating) ───

  const handleReject = () =>
    runMutation(
      () =>
        transitionMut.mutateAsync({
          loanId: Number(id),
          command: "reject",
          payload: { rejectedOnDate: rejectDate, note: rejectNote || undefined, dateFormat: "yyyy-MM-dd", locale: "en" },
        }),
      t("Loan rejected"),
      () => setRejectOpen(false),
    );

  const handleUndoApproval = () =>
    runMutation(
      () =>
        transitionMut.mutateAsync({
          loanId: Number(id),
          command: "undoapproval",
          payload: { note: undoNote || undefined, dateFormat: "yyyy-MM-dd", locale: "en" },
        }),
      t("Approval undone"),
      () => setUndoApprovalOpen(false),
    );

  const handleUndoDisbursal = () =>
    runMutation(
      () =>
        transitionMut.mutateAsync({
          loanId: Number(id),
          command: "undodisbursal",
          payload: { note: undoNote || undefined, dateFormat: "yyyy-MM-dd", locale: "en" },
        }),
      t("Disbursal undone"),
      () => setUndoDisbursalOpen(false),
    );

  const handleMarkFraud = (fraud: boolean) =>
    runMutation(
      () => markFraudMut.mutateAsync({ loanId: Number(id), payload: { fraud } }),
      fraud ? t("Loan marked as fraud") : t("Fraud flag removed"),
      () => setMarkFraudOpen(false),
    );

  const handleUpdateDiscount = () =>
    runMutation(
      () =>
        updateDiscountMut.mutateAsync({
          loanId: Number(id),
          payload: { discountAmount: Number(discountAmountInput), dateFormat: "yyyy-MM-dd", locale: "en" },
        }),
      t("Discount updated"),
      () => setUpdateDiscountOpen(false),
    );

  type SimpleTxnCommand = "goodwillCredit" | "payoutRefund" | "creditBalanceRefund";

  const handleSimpleTransaction = (command: SimpleTxnCommand, close: () => void) =>
    runMutation(
      () =>
        txnCommandMut.mutateAsync({
          loanId: Number(id),
          command,
          payload: {
            transactionDate: txnDate,
            transactionAmount: Number(txnAmount),
            dateFormat: "yyyy-MM-dd",
            locale: "en",
          },
        }),
      t("Transaction recorded"),
      close,
    );

  const handleChargeOff = () =>
    runMutation(
      () =>
        txnCommandMut.mutateAsync({
          loanId: Number(id),
          command: "chargeOff",
          payload: {
            transactionDate: txnDate,
            chargeOffReasonId: chargeOffReasonId ? Number(chargeOffReasonId) : undefined,
            dateFormat: "yyyy-MM-dd",
            locale: "en",
          },
        }),
      t("Charge-off recorded"),
      () => setChargeOffOpen(false),
    );

  const handleUndoTransaction = (transactionId: number) =>
    runMutation(
      () => undoTxnMut.mutateAsync({ loanId: Number(id), transactionId, payload: { locale: "en" } }),
      t("Transaction undone"),
      () => undefined,
    );

  const handleAddCharge = () =>
    runMutation(
      () =>
        createChargeMut.mutateAsync({
          loanId: Number(id),
          payload: {
            chargeId: Number(addChargeId),
            amount: Number(addChargeAmount),
            dateFormat: "yyyy-MM-dd",
            locale: "en",
          },
        }),
      t("Charge added"),
      () => setAddChargeOpen(false),
    );

  const handleAdjustCharge = () =>
    runMutation(
      () =>
        adjustChargeMut.mutateAsync({
          loanId: Number(id),
          loanChargeId: adjustChargeTarget!.id,
          payload: { amount: Number(adjustChargeAmount), dateFormat: "yyyy-MM-dd", locale: "en" },
        }),
      t("Charge adjusted"),
      () => setAdjustChargeTarget(null),
    );

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={`${t("Working Capital Loan")} ${loan.accountNo ?? `#${loan.id}`}`}
        description={`${loan.loanProductName} — ${loan.clientName ?? `Client #${loan.clientId}`}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant={
                statusCfg?.variant === "success"
                  ? "success"
                  : statusCfg?.variant === "error"
                    ? "error"
                    : statusCfg?.variant === "warning"
                      ? "warning"
                      : "default"
              }
            >
              {statusCfg?.label ?? statusCode}
            </Badge>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" onClick={() => navigate("/working-capital-loans")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {isPending && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setApproveAmount(String(loan.principal));
                setApproveOpen(true);
              }}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              <CheckCircle2 className="mr-1 h-4 w-4" /> {t("Approve")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRejectOpen(true)} className="text-red-600 border-red-200 hover:bg-red-50">
              <XCircle className="mr-1 h-4 w-4" /> {t("Reject")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/working-capital-loans/edit/${loan.id}`)}
            >
              <Pencil className="mr-1 h-4 w-4" /> {t("Edit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteLoanOpen(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
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
              onClick={() => {
                setDisburseAmount(String(loan.approvedPrincipal ?? loan.principal));
                setDisburseOpen(true);
              }}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <DollarSign className="mr-1 h-4 w-4" /> {t("Disburse")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setUndoApprovalOpen(true)}>
              <Undo2 className="mr-1 h-4 w-4" /> {t("Undo Approval")}
            </Button>
          </>
        )}
        {isActive && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRepayOpen(true)}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              <DollarSign className="mr-1 h-4 w-4" /> {t("Repayment")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setGoodwillOpen(true)}>
              <HandCoins className="mr-1 h-4 w-4" /> {t("Goodwill Credit")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPayoutRefundOpen(true)}>
              <Landmark className="mr-1 h-4 w-4" /> {t("Payout Refund")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCreditRefundOpen(true)}>
              <RotateCcw className="mr-1 h-4 w-4" /> {t("Credit Balance Refund")}
            </Button>
            {!loan.chargedOff && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChargeOffOpen(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <ReceiptText className="mr-1 h-4 w-4" /> {t("Charge-Off")}
              </Button>
            )}
            {loan.chargedOff && (
              <Button variant="outline" size="sm" onClick={() => setUndoChargeOffOpen(true)}>
                <RotateCcw className="mr-1 h-4 w-4" /> {t("Undo Charge-Off")}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setDiscountFeeOpen(true)}>
              <Percent className="mr-1 h-4 w-4" /> {t("Discount Fee")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDiscountFeeAdjustOpen(true)}>
              <Percent className="mr-1 h-4 w-4" /> {t("Adjust Discount Fee")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setUpdateDiscountOpen(true)}>
              <Percent className="mr-1 h-4 w-4" /> {t("Update Discount")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonitorAction({ kind: "delinquency", action: "pause" })}
            >
              <Pause className="mr-1 h-4 w-4" /> {t("Pause Delinquency")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonitorAction({ kind: "delinquency", action: "reschedule" })}
            >
              <CalendarClock className="mr-1 h-4 w-4" /> {t("Reschedule")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRateChangeOpen(true)}>
              <TrendingUp className="mr-1 h-4 w-4" /> {t("Change Rate")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setUndoDisbursalOpen(true)}>
              <Undo2 className="mr-1 h-4 w-4" /> {t("Undo Disbursal")}
            </Button>
          </>
        )}
        {(isPending || isActive) && (
          <Button
            variant={loan.fraud ? "default" : "outline"}
            size="sm"
            onClick={() => setMarkFraudOpen(true)}
            className={loan.fraud ? "" : "text-amber-600 border-amber-200 hover:bg-amber-50"}
          >
            <ShieldAlert className="mr-1 h-4 w-4" />
            {loan.fraud ? t("Unmark Fraud") : t("Mark as Fraud")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{t("Principal")}</p>
            <p className="text-2xl font-bold font-mono">{formatMoney(loan.principal, currencyCode)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{t("Outstanding")}</p>
            <p className="text-2xl font-bold font-mono">
              {formatMoney(loan.summary?.totalOutstanding ?? loan.balance?.totalOutstanding ?? 0, currencyCode)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{t("Total Paid")}</p>
            <p className="text-2xl font-bold font-mono">
              {formatMoney(loan.summary?.principalPaid ?? loan.balance?.totalRepayment ?? 0, currencyCode)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{t("Delinquent Days")}</p>
            <p className="text-2xl font-bold font-mono">{loan.delinquent?.delinquentDays ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="details">{t("General")}</TabsTrigger>
          <TabsTrigger value="amortization">
            {t("Amortization")} ({amortSchedule.length})
          </TabsTrigger>
          <TabsTrigger value="delinquency">
            {t("Delinquency Schedule")} ({delinqSchedule.length})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            {t("Transactions")} ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="charges">
            {t("Charges")} ({charges.length})
          </TabsTrigger>
          <TabsTrigger value="breach">
            {t("Breach Schedule")} ({breachSchedule.length})
          </TabsTrigger>
          <TabsTrigger value="tags">
            {t("Delinquency Tags")} ({delinqTags.length})
          </TabsTrigger>
          <TabsTrigger value="rates">
            {t("Rate Changes")} ({rateChanges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Loan Information")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("Account No")}</span>
                <span className="font-mono">{loan.accountNo ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("External ID")}</span>
                <span>{loan.externalId ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("Product")}</span>
                <span>{loan.loanProductName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("Client")}</span>
                <span>{loan.clientName ?? `#${loan.clientId}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("Submitted")}</span>
                <span>{formatDate(loan.timeline?.submittedOnDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("Disbursed")}</span>
                <span>{formatDate(loan.timeline?.actualDisbursementDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("Approved")}</span>
                <span>{formatMoney(loan.approvedPrincipal, currencyCode)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("Grace Days")}</span>
                <span>{loan.delinquencyGraceDays ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t("Delinquency Start")}</span>
                <span>{toDisplayText(loan.delinquencyStartType)}</span>
              </div>
              {delinquencyClassification && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("Delinquency Range")}</span>
                  <Badge variant="warning" size="sm">
                    {delinquencyClassification}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amortization" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("EIR Amortization Schedule")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {amortSchedule.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No schedule data available.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{t("From")}</TableHead>
                        <TableHead>{t("Due")}</TableHead>
                        <TableHead>{t("Expected")}</TableHead>
                        <TableHead>{t("Paid")}</TableHead>
                        <TableHead>{t("Outstanding")}</TableHead>
                        <TableHead>{t("EIR")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {amortSchedule.map((entry) => (
                        <TableRow key={entry.period}>
                          <TableCell>{entry.period}</TableCell>
                          <TableCell>{formatDate(entry.fromDate)}</TableCell>
                          <TableCell>{formatDate(entry.dueDate)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(entry.expectedAmount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(entry.paidAmount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">
                            {formatMoney(entry.outstandingAmount, currencyCode)}
                          </TableCell>
                          <TableCell className="font-mono">
                            {entry.eir != null ? `${entry.eir.toFixed(4)}%` : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delinquency" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["pause", "resume", "reschedule", "reset", "undo_reset", "disable", "enable"] as const).map((a) => (
              <Button
                key={a}
                variant="outline"
                size="sm"
                onClick={() => setMonitorAction({ kind: "delinquency", action: a })}
              >
                {ACTION_LABELS[a]}
              </Button>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Delinquency Range Schedule")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {delinqSchedule.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No delinquency schedule data.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{t("From")}</TableHead>
                        <TableHead>{t("To")}</TableHead>
                        <TableHead>{t("Expected")}</TableHead>
                        <TableHead>{t("Paid")}</TableHead>
                        <TableHead>{t("Outstanding")}</TableHead>
                        <TableHead>{t("Status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {delinqSchedule.map((entry) => (
                        <TableRow key={entry.period}>
                          <TableCell>{entry.period}</TableCell>
                          <TableCell>{formatDate(entry.fromDate)}</TableCell>
                          <TableCell>{formatDate(entry.toDate)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(entry.expectedAmount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(entry.paidAmount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">
                            {formatMoney(entry.outstandingAmount, currencyCode)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                entry.minPaymentCriteriaMet ? "success" : entry.delinquencyStatus ? "error" : "warning"
                              }
                              size="sm"
                            >
                              {entry.minPaymentCriteriaMet ? t("Met") : (entry.delinquencyStatus ?? t("Pending"))}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Transaction History")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No transactions yet.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{t("Type")}</TableHead>
                        <TableHead>{t("Date")}</TableHead>
                        <TableHead>{t("Amount")}</TableHead>
                        <TableHead>{t("Principal")}</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id} className={tx.reversed ? "opacity-50" : undefined}>
                          <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                          <TableCell>
                            {tx.type?.value ?? tx.type?.code}
                            {tx.reversed && (
                              <Badge variant="error" size="sm" className="ml-2">
                                {t("Reversed")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(tx.date)}</TableCell>
                          <TableCell className="font-mono font-semibold">
                            {formatMoney(tx.amount, currencyCode)}
                          </TableCell>
                          <TableCell className="font-mono">{formatMoney(tx.principalPortion, currencyCode)}</TableCell>
                          <TableCell className="text-right">
                            {isActive && !tx.reversed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isMutating}
                                onClick={() => handleUndoTransaction(tx.id)}
                              >
                                <Undo2 className="mr-1 h-4 w-4" /> {t("Undo")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charges" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("Loan Charges")}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setAddChargeOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> {t("Add Charge")}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {charges.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No charges recorded.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Name")}</TableHead>
                        <TableHead>{t("Due Date")}</TableHead>
                        <TableHead>{t("Amount")}</TableHead>
                        <TableHead>{t("Paid")}</TableHead>
                        <TableHead>{t("Outstanding")}</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {charges.map((charge) => (
                        <TableRow key={charge.id}>
                          <TableCell>{charge.name}</TableCell>
                          <TableCell>{formatDate(charge.dueDate)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(charge.amount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(charge.amountPaid ?? 0, currencyCode)}</TableCell>
                          <TableCell className="font-mono">
                            {formatMoney(charge.amountOutstanding, currencyCode)}
                          </TableCell>
                          <TableCell className="text-right">
                            {(charge.amountOutstanding ?? 0) > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setAdjustChargeAmount(String(charge.amountOutstanding));
                                  setAdjustChargeTarget(charge);
                                }}
                              >
                                {t("Adjust")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breach" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["pause", "resume", "reschedule", "reset", "undo_reset", "disable", "enable"] as const).map((a) => (
              <Button
                key={a}
                variant="outline"
                size="sm"
                onClick={() => setMonitorAction({ kind: "breach", action: a })}
              >
                {ACTION_LABELS[a]}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setNearBreachOpen(true)}>
              {t("Near-Breach Reschedule")}
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Breach Schedule")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {breachSchedule.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No breach schedule data.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{t("From")}</TableHead>
                        <TableHead>{t("To")}</TableHead>
                        <TableHead>{t("Min Payment")}</TableHead>
                        <TableHead>{t("Outstanding")}</TableHead>
                        <TableHead>{t("Status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {breachSchedule.map((period) => (
                        <TableRow key={period.id}>
                          <TableCell>{period.periodNumber}</TableCell>
                          <TableCell>{formatDate(period.fromDate)}</TableCell>
                          <TableCell>{formatDate(period.toDate)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(period.minPaymentAmount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">
                            {formatMoney(period.outstandingAmount, currencyCode)}
                          </TableCell>
                          <TableCell>
                            {period.breach ? (
                              <Badge variant="error" size="sm">
                                {t("Breach")}
                              </Badge>
                            ) : period.nearBreach ? (
                              <Badge variant="warning" size="sm">
                                {t("Near Breach")}
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm">
                                {t("OK")}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Delinquency Tag History")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {delinqTags.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No delinquency tags recorded.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Classification")}</TableHead>
                        <TableHead>{t("Added On")}</TableHead>
                        <TableHead>{t("Lifted On")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {delinqTags.map((tag) => (
                        <TableRow key={tag.id}>
                          <TableCell>
                            <Badge variant="warning" size="sm">
                              {tag.classification ?? `#${tag.tagId ?? tag.id}`}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(tag.addedOnDate)}</TableCell>
                          <TableCell>{tag.liftedOnDate ? formatDate(tag.liftedOnDate) : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Rate Change History")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rateChanges.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No rate changes recorded.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{t("Rate (%)")}</TableHead>
                        <TableHead>{t("From Date")}</TableHead>
                        <TableHead>{t("Created")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateChanges.map((rc) => (
                        <TableRow key={rc.id}>
                          <TableCell>{rc.id}</TableCell>
                          <TableCell className="font-mono font-semibold">{rc.periodPaymentRate}%</TableCell>
                          <TableCell>{formatDate(rc.fromDate)}</TableCell>
                          <TableCell>{formatDate(rc.createdOnDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={approveOpen} onOpenChange={(o) => !o && setApproveOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Approve Loan")}</DialogTitle>
            <DialogDescription>{t("Confirm approval date and amount.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Approval Date")}</label>
              <Input type="date" value={approveDate} onChange={(e) => setApproveDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Approved Amount")}</label>
              <Input
                type="number"
                step="0.01"
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleApprove} disabled={isMutating}>
                {approveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Approve")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={disburseOpen} onOpenChange={(o) => !o && setDisburseOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Disburse Loan")}</DialogTitle>
            <DialogDescription>{t("Confirm disbursement date and amount.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Disbursement Date")}</label>
              <Input type="date" value={disburseDate} onChange={(e) => setDisburseDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")}</label>
              <Input
                type="number"
                step="0.01"
                value={disburseAmount}
                onChange={(e) => setDisburseAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDisburseOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleDisburse} disabled={isMutating}>
                {disburseMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Disburse")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={repayOpen} onOpenChange={(o) => !o && setRepayOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Make Repayment")}</DialogTitle>
            <DialogDescription>{t("Record a repayment transaction.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Transaction Date")}</label>
              <Input type="date" value={repayDate} onChange={(e) => setRepayDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")}</label>
              <Input type="number" step="0.01" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRepayOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleRepay} disabled={isMutating}>
                {repaymentMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Repay")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rateChangeOpen} onOpenChange={(o) => !o && setRateChangeOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Change Payment Rate")}</DialogTitle>
            <DialogDescription>{t("Recalculate EIR and amortization from the change date forward.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("New Period Payment Rate (%)")}</label>
              <Input type="number" step="0.01" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Note")}</label>
              <Textarea
                value={rateNote}
                onChange={(e) => setRateNote(e.target.value)}
                rows={2}
                placeholder={t("Optional reason...")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRateChangeOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleRateChange} disabled={isMutating || !newRate}>
                {rateChangeMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Update Rate")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={(o) => !o && setRejectOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Reject Loan")}</DialogTitle>
            <DialogDescription>{t("Rejecting is terminal and cannot be undone.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Rejection Date")}</label>
              <Input type="date" value={rejectDate} onChange={(e) => setRejectDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Note")}</label>
              <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isMutating}>
                {transitionMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Reject")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={undoApprovalOpen} onOpenChange={(o) => !o && setUndoApprovalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Undo Approval")}</DialogTitle>
            <DialogDescription>{t("Return the loan to submitted-and-pending-approval.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Note")}</label>
              <Textarea value={undoNote} onChange={(e) => setUndoNote(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUndoApprovalOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={() => { handleUndoApproval(); }} disabled={isMutating}>
                {transitionMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Undo Approval")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={undoDisbursalOpen} onOpenChange={(o) => !o && setUndoDisbursalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Undo Disbursal")}</DialogTitle>
            <DialogDescription>
              {t("Blocked once repayment-like transactions exist on the loan.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Note")}</label>
              <Textarea value={undoNote} onChange={(e) => setUndoNote(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUndoDisbursalOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={() => { handleUndoDisbursal(); }} disabled={isMutating}>
                {transitionMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Undo Disbursal")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={markFraudOpen} onOpenChange={(o) => !o && setMarkFraudOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{loan.fraud ? t("Unmark Fraud") : t("Mark as Fraud")}</DialogTitle>
            <DialogDescription>
              {t("Routes later charge-offs to the fraud expense account. Does not change loan status.")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMarkFraudOpen(false)} disabled={isMutating}>
              {t("Cancel")}
            </Button>
            <Button
              variant={loan.fraud ? "outline" : "destructive"}
              onClick={() => handleMarkFraud(!loan.fraud)}
              disabled={isMutating}
            >
              {markFraudMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loan.fraud ? t("Unmark Fraud") : t("Mark as Fraud")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={updateDiscountOpen} onOpenChange={(o) => !o && setUpdateDiscountOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Update Discount")}</DialogTitle>
            <DialogDescription>{t("Allowed once after disbursement, on the disbursement date only.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Discount Amount")}</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={discountAmountInput}
                onChange={(e) => setDiscountAmountInput(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUpdateDiscountOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleUpdateDiscount} disabled={isMutating || discountAmountInput === ""}>
                {updateDiscountMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Update Discount")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={goodwillOpen || payoutRefundOpen || creditRefundOpen}
        onOpenChange={(o) => {
          if (!o) {
            setGoodwillOpen(false);
            setPayoutRefundOpen(false);
            setCreditRefundOpen(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {goodwillOpen
                ? t("Goodwill Credit")
                : payoutRefundOpen
                  ? t("Payout Refund")
                  : t("Credit Balance Refund")}
            </DialogTitle>
            <DialogDescription>
              {creditRefundOpen
                ? t("Cannot be backdated; may close the loan when fully refunded.")
                : t("Record the transaction against this loan.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Transaction Date")}</label>
              <Input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")}</label>
              <Input type="number" step="0.01" value={txnAmount} onChange={(e) => setTxnAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setGoodwillOpen(false);
                  setPayoutRefundOpen(false);
                  setCreditRefundOpen(false);
                }}
                disabled={isMutating}
              >
                {t("Cancel")}
              </Button>
              <Button
                onClick={() =>
                  handleSimpleTransaction(
                    goodwillOpen ? "goodwillCredit" : payoutRefundOpen ? "payoutRefund" : "creditBalanceRefund",
                    () => {
                      setGoodwillOpen(false);
                      setPayoutRefundOpen(false);
                      setCreditRefundOpen(false);
                    },
                  )
                }
                disabled={isMutating || !txnAmount}
              >
                {txnCommandMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={chargeOffOpen} onOpenChange={(o) => !o && setChargeOffOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Charge-Off")}</DialogTitle>
            <DialogDescription>
              {t("Accounting tag only — the loan stays active. Reversible while it is the last user transaction.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Transaction Date")}</label>
              <Input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Reason")}</label>
              <Input
                type="number"
                placeholder={t("Charge-off reason id (optional)")}
                value={chargeOffReasonId}
                onChange={(e) => setChargeOffReasonId(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setChargeOffOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button variant="destructive" onClick={handleChargeOff} disabled={isMutating || !txnDate}>
                {txnCommandMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Charge Off")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addChargeOpen} onOpenChange={(o) => !o && setAddChargeOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Add Charge")}</DialogTitle>
            <DialogDescription>{t("Attach a charge definition to this loan.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Charge Id")}</label>
              <Input
                type="number"
                min="1"
                value={addChargeId}
                onChange={(e) => setAddChargeId(e.target.value)}
                placeholder={t("Charge definition id")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")}</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={addChargeAmount}
                onChange={(e) => setAddChargeAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddChargeOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleAddCharge} disabled={isMutating || !addChargeId || !addChargeAmount}>
                {createChargeMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Add Charge")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjustChargeTarget} onOpenChange={(o) => !o && setAdjustChargeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Adjust Charge")}</DialogTitle>
            <DialogDescription>
              {adjustChargeTarget?.name} — {t("outstanding")}{" "}
              {formatMoney(adjustChargeTarget?.amountOutstanding ?? 0, currencyCode)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")}</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={adjustChargeAmount}
                onChange={(e) => setAdjustChargeAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdjustChargeTarget(null)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleAdjustCharge} disabled={isMutating || !adjustChargeAmount}>
                {adjustChargeMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Adjust")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!monitorAction} onOpenChange={(o) => !o && setMonitorAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {monitorAction
                ? `${ACTION_LABELS[monitorAction.action]} — ${monitorAction.kind === "breach" ? t("Breach") : t("Delinquency")}`
                : ""}
            </DialogTitle>
            <DialogDescription>
              {t("Monitoring action applied to this loan's payment schedule evaluation.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {(monitorAction?.action === "pause" ||
              monitorAction?.action === "resume" ||
              monitorAction?.action === "disable" ||
              monitorAction?.action === "enable") && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Start Date")}</label>
                <Input type="date" value={monitorStartDate} onChange={(e) => setMonitorStartDate(e.target.value)} />
              </div>
            )}
            {monitorAction?.action === "pause" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("End Date")}</label>
                <Input type="date" value={monitorEndDate} onChange={(e) => setMonitorEndDate(e.target.value)} />
                {monitorEndDate && monitorEndDate <= monitorStartDate && (
                  <p className="text-sm text-red-500">{t("End date must be after start date")}</p>
                )}
              </div>
            )}
            {monitorAction?.action === "reschedule" && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Minimum Payment")}</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rescheduleMinPayment}
                    onChange={(e) => setRescheduleMinPayment(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Frequency (days)")}</label>
                  <Input
                    type="number"
                    value={rescheduleFrequency}
                    onChange={(e) => setRescheduleFrequency(e.target.value)}
                  />
                </div>
                {!rescheduleMinPayment && !rescheduleFrequency && (
                  <p className="text-sm text-red-500">
                    {t("Provide a minimum payment or frequency to reschedule.")}
                  </p>
                )}
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMonitorAction(null)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button
                onClick={handleMonitorAction}
                disabled={
                  isMutating ||
                  (monitorAction?.action === "pause" &&
                    (!monitorEndDate || monitorEndDate <= monitorStartDate)) ||
                  (monitorAction?.action === "reschedule" && !rescheduleMinPayment && !rescheduleFrequency)
                }
              >
                {(breachActionMut.isPending || delinqActionMut.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {monitorAction ? ACTION_LABELS[monitorAction.action] : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={nearBreachOpen} onOpenChange={(o) => !o && setNearBreachOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Near-Breach Reschedule")}</DialogTitle>
            <DialogDescription>{t("Adjust the near-breach threshold and frequency for this loan.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Threshold (%)")}</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={nearBreachThreshold}
                onChange={(e) => setNearBreachThreshold(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Frequency")}</label>
              <Input
                type="number"
                min="1"
                value={nearBreachFrequency}
                onChange={(e) => setNearBreachFrequency(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Frequency Type")}</label>
              <Select
                value={nearBreachFrequencyType}
                onValueChange={(v) => setNearBreachFrequencyType(v as "DAYS" | "WEEKS" | "MONTHS")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAYS">{t("Days")}</SelectItem>
                  <SelectItem value="WEEKS">{t("Weeks")}</SelectItem>
                  <SelectItem value="MONTHS">{t("Months")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNearBreachOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button
                onClick={handleNearBreachReschedule}
                disabled={
                  isMutating ||
                  !nearBreachThreshold ||
                  Number(nearBreachThreshold) <= 0 ||
                  Number(nearBreachThreshold) > 100 ||
                  !nearBreachFrequency ||
                  Number(nearBreachFrequency) <= 0
                }
              >
                {nearBreachMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Reschedule")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={discountFeeOpen} onOpenChange={(o) => !o && setDiscountFeeOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Record Discount Fee")}</DialogTitle>
            <DialogDescription>{t("Allowed only on the disbursement date.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Transaction Date")}</label>
              <Input
                type="date"
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")}</label>
              <Input type="number" step="0.01" min="0" value={txnAmount} onChange={(e) => setTxnAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDiscountFeeOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={() => handleDiscountFee("discountFee", () => setDiscountFeeOpen(false))} disabled={isMutating}>
                {txnCommandMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={discountFeeAdjustOpen} onOpenChange={(o) => !o && setDiscountFeeAdjustOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Adjust Discount Fee")}</DialogTitle>
            <DialogDescription>
              {t("Reduces a previously recorded discount fee; loan must be active.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Transaction Date")}</label>
              <Input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")} *</label>
              <Input type="number" step="0.01" min="0.01" value={txnAmount} onChange={(e) => setTxnAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDiscountFeeAdjustOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button
                onClick={() => handleDiscountFee("discountFeeAdjustment", () => setDiscountFeeAdjustOpen(false))}
                disabled={isMutating || !txnAmount}
              >
                {txnCommandMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={undoChargeOffOpen} onOpenChange={(o) => !o && setUndoChargeOffOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Undo Charge-Off")}</DialogTitle>
            <DialogDescription>
              {t("Only possible while charge-off is the last user transaction.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Reversal External Id")}</label>
              <Input
                value={undoReversalExternalId}
                onChange={(e) => setUndoReversalExternalId(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Note")}</label>
              <Textarea value={undoNote} onChange={(e) => setUndoNote(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUndoChargeOffOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleUndoChargeOff} disabled={isMutating}>
                {txnCommandMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Undo Charge-Off")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteLoanOpen}
        onOpenChange={setDeleteLoanOpen}
        onConfirm={handleDeleteLoan}
        title={t("Delete Loan Application")}
        description={t("This will permanently delete the submitted application. This action cannot be undone.")}
        confirmLabel={t("Delete")}
        variant="destructive"
        loading={deleteLoanMut.isPending}
      />
    </div>
  );
};

export default WCLoanViewPage;
