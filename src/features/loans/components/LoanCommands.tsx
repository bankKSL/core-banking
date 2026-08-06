import { type FC, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  DollarSign,
  Ban,
  Undo2,
  RotateCcw,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  ChevronDown,
  CalendarClock,
  PiggyBank,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useApproveLoan,
  useDisburseLoan,
  useDisburseLoanToSavings,
  useRejectLoan,
  useWithdrawLoan,
  useUndoApproval,
  useUndoDisbursal,
  useUndoWriteOff,
} from "../hooks/useLoanCommands";
import { useDeleteLoan } from "../hooks/useDeleteLoan";
import type { Loan } from "../types/loan";

interface LoanCommandsProps {
  loan: Loan;
  onSuccess?: () => void;
}

const today = () => new Date().toISOString().split("T")[0];

type DateCommand = "approve" | "disburse" | "disburseToSavings";
type ConfirmCommand = "reject" | "withdraw" | "undoApproval" | "undoDisbursal" | "undoWriteOff" | "delete";

const LoanCommands: FC<LoanCommandsProps> = ({ loan, onSuccess }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success: toastSuccess } = useToast();
  const approveMut = useApproveLoan();
  const disburseMut = useDisburseLoan();
  const disburseToSavingsMut = useDisburseLoanToSavings();
  const rejectMut = useRejectLoan();
  const withdrawMut = useWithdrawLoan();
  const undoApprovalMut = useUndoApproval();
  const undoDisbursalMut = useUndoDisbursal();
  const undoWriteOffMut = useUndoWriteOff();
  const deleteMut = useDeleteLoan();

  const statusId = loan.status?.id;
  const isPending = statusId === 100;
  const isApproved = statusId === 200;
  const isActive = statusId === 300;
  const isChargedOff = !!loan.chargedOff || loan.subStatus?.code === "chargeOff";
  const isClosed = statusId != null && [400, 500, 600, 601, 602].includes(statusId);
  const isWrittenOff = statusId === 601;
  const isOverpaid = statusId === 700;

  const [dateCommand, setDateCommand] = useState<DateCommand | null>(null);
  const [confirmCommand, setConfirmCommand] = useState<ConfirmCommand | null>(null);
  const [dateInput, setDateInput] = useState(today());
  const [amountInput, setAmountInput] = useState<string>(String(loan.principal ?? ""));
  const [expectedDisbursementDate, setExpectedDisbursementDate] = useState(today());
  const [noteInput, setNoteInput] = useState("");

  const goToTransaction = useCallback(
    (command: string) => navigate(`/loans/${loan.id}/transactions/${command}`),
    [navigate, loan.id],
  );

  const openDateDialog = (cmd: DateCommand) => {
    setDateCommand(cmd);
    setDateInput(today());
    setExpectedDisbursementDate(today());
    setAmountInput(String(loan.principal ?? ""));
    setNoteInput("");
  };

  const isMutating =
    approveMut.isPending ||
    disburseMut.isPending ||
    disburseToSavingsMut.isPending ||
    rejectMut.isPending ||
    withdrawMut.isPending ||
    undoApprovalMut.isPending ||
    undoDisbursalMut.isPending ||
    undoWriteOffMut.isPending ||
    deleteMut.isPending;

  const handleDateCommand = useCallback(async () => {
    if (!dateCommand) return;
    const note = noteInput || undefined;
    if (dateCommand === "approve") {
      await approveMut.mutateAsync({
        loanId: loan.id,
        payload: {
          approvedOnDate: dateInput,
          approvedLoanAmount: amountInput ? Number(amountInput) : undefined,
          expectedDisbursementDate: expectedDisbursementDate || undefined,
          note,
          dateFormat: "yyyy-MM-dd",
          locale: "en",
        },
      });
      toastSuccess(t("Loan approved successfully"));
    } else if (dateCommand === "disburse") {
      await disburseMut.mutateAsync({
        loanId: loan.id,
        payload: {
          actualDisbursementDate: dateInput,
          transactionAmount: amountInput ? Number(amountInput) : undefined,
          note,
          dateFormat: "yyyy-MM-dd",
          locale: "en",
        },
      });
      toastSuccess(t("Loan disbursed successfully"));
    } else {
      await disburseToSavingsMut.mutateAsync({
        loanId: loan.id,
        payload: { actualDisbursementDate: dateInput, note, dateFormat: "yyyy-MM-dd", locale: "en" },
      });
      toastSuccess(t("Loan disbursed successfully"));
    }
    setDateCommand(null);
    onSuccess?.();
  }, [
    dateCommand,
    dateInput,
    amountInput,
    expectedDisbursementDate,
    noteInput,
    loan.id,
    approveMut,
    disburseMut,
    disburseToSavingsMut,
    toastSuccess,
    onSuccess,
  ]);

  const handleConfirmCommand = useCallback(async () => {
    if (!confirmCommand) return;
    switch (confirmCommand) {
      case "reject":
        await rejectMut.mutateAsync({ loanId: loan.id });
        break;
      case "withdraw":
        await withdrawMut.mutateAsync({ loanId: loan.id });
        break;
      case "undoApproval":
        await undoApprovalMut.mutateAsync(loan.id);
        break;
      case "undoDisbursal":
        await undoDisbursalMut.mutateAsync(loan.id);
        break;
      case "undoWriteOff":
        await undoWriteOffMut.mutateAsync({ loanId: loan.id });
        break;
      case "delete":
        await deleteMut.mutateAsync(loan.id);
        navigate("/loans");
        break;
    }
    setConfirmCommand(null);
    onSuccess?.();
  }, [
    confirmCommand,
    loan.id,
    rejectMut,
    withdrawMut,
    undoApprovalMut,
    undoDisbursalMut,
    undoWriteOffMut,
    deleteMut,
    navigate,
    onSuccess,
  ]);

  const dateDialogTitles: Record<DateCommand, { title: string; description: string }> = {
    approve: { title: t("Approve Loan"), description: t("Confirm the approval date and approved amount.") },
    disburse: { title: t("Disburse Loan"), description: t("Confirm the actual disbursement date and amount.") },
    disburseToSavings: {
      title: t("Disburse to Savings"),
      description: t("Disburse the loan amount directly to the linked savings account."),
    },
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Edit / Delete — pending applications only */}
        {isPending && (
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`/loans/edit/${loan.id}`)}>
              <Pencil className="mr-1 h-4 w-4" />
              {t("Edit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmCommand("delete")}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t("Delete")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDateDialog("approve")}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {t("Approve")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmCommand("reject")}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="mr-1 h-4 w-4" />
              {t("Reject")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmCommand("withdraw")}
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <Ban className="mr-1 h-4 w-4" />
              {t("Withdraw")}
            </Button>
          </>
        )}

        {isApproved && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDateDialog("disburse")}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <DollarSign className="mr-1 h-4 w-4" />
              {t("Disburse")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDateDialog("disburseToSavings")}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <PiggyBank className="mr-1 h-4 w-4" />
              {t("Disburse to Savings")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmCommand("undoApproval")}
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <Undo2 className="mr-1 h-4 w-4" />
              {t("Undo Approval")}
            </Button>
          </>
        )}

        {isActive && isChargedOff && (
          <>
            <Button variant="outline" size="sm" onClick={() => goToTransaction("undo-charge-off")}>
              <Undo2 className="mr-1 h-4 w-4" />
              {t("Undo Charge Off")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => goToTransaction("recoverypayment")}>
              <DollarSign className="mr-1 h-4 w-4" />
              {t("Recovery Repayment")}
            </Button>
          </>
        )}

        {isActive && !isChargedOff && (
          <>
            <Button variant="outline" size="sm" onClick={() => goToTransaction("repayment")}>
              <DollarSign className="mr-1 h-4 w-4" />
              {t("Repayment")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => goToTransaction("prepayLoan")}>
              <DollarSign className="mr-1 h-4 w-4" />
              {t("Prepay")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => goToTransaction("waiveinterest")}>
              <Ban className="mr-1 h-4 w-4" />
              {t("Waive Interest")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToTransaction("writeoff")}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <FileText className="mr-1 h-4 w-4" />
              {t("Write Off")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToTransaction("charge-off")}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Ban className="mr-1 h-4 w-4" />
              {t("Charge Off")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToTransaction("foreclosure")}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Ban className="mr-1 h-4 w-4" />
              {t("Foreclose")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => goToTransaction("close")} className="text-gray-600">
              <Ban className="mr-1 h-4 w-4" />
              {t("Close")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmCommand("undoDisbursal")}
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              {t("Undo Disbursal")}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {t("More Actions")}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => goToTransaction("recoverypayment")}>
                  {t("Recovery Repayment")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => goToTransaction("downPayment")}>{t("Down Payment")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => goToTransaction("interestPaymentWaiver")}>
                  {t("Interest Payment Waiver")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => goToTransaction("interest-refund")}>{t("Interest Refund")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => goToTransaction("goodwillCredit")}>{t("Goodwill Credit")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => goToTransaction("refundbycash")}>{t("Refund by Cash")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => goToTransaction("refundbytransfer")}>
                  {t("Refund by Transfer")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => goToTransaction("merchantIssuedRefund")}>
                  {t("Merchant Issued Refund")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => goToTransaction("payoutRefund")}>{t("Payout Refund")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => goToTransaction("reAmortize")}>{t("Re-Amortize")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => goToTransaction("reAge")}>{t("Re-Age Loan")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => goToTransaction("close-rescheduled")}>
                  {t("Close (Rescheduled)")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/rescheduling/new?loanId=${loan.id}`)}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {t("Reschedule Loan")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {isWrittenOff && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmCommand("undoWriteOff")}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              <Undo2 className="mr-1 h-4 w-4" />
              {t("Undo Write Off")}
            </Button>
          </>
        )}

        {isOverpaid && (
          <>
            <Button variant="outline" size="sm" onClick={() => goToTransaction("refundbycash")}>
              <DollarSign className="mr-1 h-4 w-4" />
              {t("Refund by Cash")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => goToTransaction("creditBalanceRefund")}>
              <DollarSign className="mr-1 h-4 w-4" />
              {t("Credit Balance Refund")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => goToTransaction("goodwillCredit")}>
              <DollarSign className="mr-1 h-4 w-4" />
              {t("Goodwill Credit")}
            </Button>
          </>
        )}

        {(isClosed || (!isPending && !isApproved && !isActive && !isOverpaid && !isChargedOff)) && (
          <span className="text-sm text-gray-400 italic">{t("No actions available")}</span>
        )}
      </div>

      {/* Date dialog: approve / disburse / disburse-to-savings */}
      <Dialog open={!!dateCommand} onOpenChange={(open) => !open && setDateCommand(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dateCommand ? dateDialogTitles[dateCommand].title : ""}</DialogTitle>
            <DialogDescription>{dateCommand ? dateDialogTitles[dateCommand].description : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="commandDate">
                {dateCommand === "approve" ? t("Approval Date") : t("Disbursement Date")}
              </label>
              <Input id="commandDate" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
            </div>
            {dateCommand === "approve" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="block text-sm font-medium" htmlFor="approvedAmount">
                    {t("Approved Amount")}
                  </label>
                  <Input
                    id="approvedAmount"
                    type="number"
                    step="0.01"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="block text-sm font-medium" htmlFor="expectedDisbDate">
                    {t("Expected Disbursement Date")}
                  </label>
                  <Input
                    id="expectedDisbDate"
                    type="date"
                    value={expectedDisbursementDate}
                    onChange={(e) => setExpectedDisbursementDate(e.target.value)}
                  />
                </div>
              </>
            )}
            {dateCommand === "disburse" && (
              <div className="flex flex-col gap-1.5">
                <label className="block text-sm font-medium" htmlFor="disbAmount">
                  {t("Transaction Amount")}
                </label>
                <Input
                  id="disbAmount"
                  type="number"
                  step="0.01"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="commandNote">
                {t("Note")}
              </label>
              <Textarea
                id="commandNote"
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={t("Optional note...")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDateCommand(null)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleDateCommand} disabled={isMutating}>
                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Confirm")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmCommand === "reject"}
        onOpenChange={(open) => !open && setConfirmCommand(null)}
        title={t("Reject Loan")}
        description={`${t("Reject loan")} ${loan.accountNo ?? `#${loan.id}`}?`}
        confirmLabel={t("Reject")}
        variant="destructive"
        loading={rejectMut.isPending}
        onConfirm={handleConfirmCommand}
      />
      <ConfirmDialog
        open={confirmCommand === "withdraw"}
        onOpenChange={(open) => !open && setConfirmCommand(null)}
        title={t("Withdraw Loan")}
        description={`${t("Withdraw loan application")} ${loan.accountNo ?? `#${loan.id}`}?`}
        confirmLabel={t("Withdraw")}
        variant="destructive"
        loading={withdrawMut.isPending}
        onConfirm={handleConfirmCommand}
      />
      <ConfirmDialog
        open={confirmCommand === "undoApproval"}
        onOpenChange={(open) => !open && setConfirmCommand(null)}
        title={t("Undo Approval")}
        description={`${t("Undo approval for loan")} ${loan.accountNo ?? `#${loan.id}`}?`}
        confirmLabel={t("Undo")}
        variant="destructive"
        loading={undoApprovalMut.isPending}
        onConfirm={handleConfirmCommand}
      />
      <ConfirmDialog
        open={confirmCommand === "undoDisbursal"}
        onOpenChange={(open) => !open && setConfirmCommand(null)}
        title={t("Undo Disbursal")}
        description={`${t("Undo disbursal for loan")} ${loan.accountNo ?? `#${loan.id}`}? ${t("All transactions will be reversed.")}`}
        confirmLabel={t("Undo")}
        variant="destructive"
        loading={undoDisbursalMut.isPending}
        onConfirm={handleConfirmCommand}
      />
      <ConfirmDialog
        open={confirmCommand === "undoWriteOff"}
        onOpenChange={(open) => !open && setConfirmCommand(null)}
        title={t("Undo Write Off")}
        description={`${t("Undo write off for loan")} ${loan.accountNo ?? `#${loan.id}`}? ${t("The loan will become active again.")}`}
        confirmLabel={t("Undo")}
        variant="destructive"
        loading={undoWriteOffMut.isPending}
        onConfirm={handleConfirmCommand}
      />
      <ConfirmDialog
        open={confirmCommand === "delete"}
        onOpenChange={(open) => !open && setConfirmCommand(null)}
        title={t("Delete Loan Application")}
        description={`${t("Permanently delete loan application")} ${loan.accountNo ?? `#${loan.id}`}? ${t("This cannot be undone.")}`}
        confirmLabel={t("Delete")}
        variant="destructive"
        loading={deleteMut.isPending}
        onConfirm={handleConfirmCommand}
      />
    </>
  );
};

export default LoanCommands;
export type { LoanCommandsProps };
