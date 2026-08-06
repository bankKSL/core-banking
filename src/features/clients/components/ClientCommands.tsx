import { type FC, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  XCircle,
  Ban,
  RotateCcw,
  LogOut,
  Undo2,
  Power,
  Loader2,
  UserPlus,
  UserX,
  PiggyBank,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  useRejectClient,
  useWithdrawClient,
  useCloseClient,
  useReactivateClient,
  useUndoRejectClient,
  useUndoWithdrawClient,
} from "../hooks/useClientCommands";
import { useAssignStaff } from "../hooks/useAssignStaff";
import { useUnassignStaff } from "../hooks/useUnassignStaff";
import { useUpdateSavingsAccount } from "../hooks/useUpdateSavingsAccount";
import {
  useProposeClientTransfer,
  useAcceptClientTransfer,
  useRejectClientTransfer,
  useWithdrawClientTransfer,
} from "../hooks/useClientTransfer";
import type { ClientTemplate } from "../types/client";

interface ClientCommandsProps {
  clientId: number;
  status: string;
  displayName: string;
  template?: ClientTemplate;
  currentStaffId?: number | null;
  onSuccess?: () => void;
}

const ClientCommands: FC<ClientCommandsProps> = ({
  clientId,
  status,
  displayName,
  template,
  currentStaffId,
  onSuccess,
}) => {
  const rejectMutation = useRejectClient();
  const withdrawMutation = useWithdrawClient();
  const closeMutation = useCloseClient();
  const reactivateMutation = useReactivateClient();
  const undoRejectMutation = useUndoRejectClient();
  const undoWithdrawMutation = useUndoWithdrawClient();
  const assignStaffMutation = useAssignStaff();
  const unassignStaffMutation = useUnassignStaff();
  const updateSavingsMutation = useUpdateSavingsAccount();
  const proposeTransferMutation = useProposeClientTransfer();
  const acceptTransferMutation = useAcceptClientTransfer();
  const rejectTransferMutation = useRejectClientTransfer();
  const withdrawTransferMutation = useWithdrawClientTransfer();
  const { t } = useTranslation();

  const [command, setCommand] = useState<string | null>(null);
  const [closeDate, setCloseDate] = useState(new Date().toISOString().split("T")[0]);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);
  const [savingsAccountId, setSavingsAccountId] = useState<string>("");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [destinationOfficeId, setDestinationOfficeId] = useState<string>("");
  const [transferDate, setTransferDate] = useState("");
  const [transferNote, setTransferNote] = useState("");

  const handleCommand = useCallback(
    async (cmd: string) => {
      switch (cmd) {
        case "reject":
          await rejectMutation.mutateAsync(clientId);
          break;
        case "withdraw":
          await withdrawMutation.mutateAsync(clientId);
          break;
        case "close":
          await closeMutation.mutateAsync({ clientId, closureDate: closeDate, dateFormat: "yyyy-MM-dd", locale: "en" });
          setCloseDialogOpen(false);
          break;
        case "reactivate":
          await reactivateMutation.mutateAsync(clientId);
          break;
        case "undoreject":
          await undoRejectMutation.mutateAsync(clientId);
          break;
        case "undowithdraw":
          await undoWithdrawMutation.mutateAsync(clientId);
          break;
      }
      setCommand(null);
      onSuccess?.();
    },
    [
      clientId,
      closeDate,
      rejectMutation,
      withdrawMutation,
      closeMutation,
      reactivateMutation,
      undoRejectMutation,
      undoWithdrawMutation,
      onSuccess,
    ],
  );

  const handleAssignStaff = useCallback(async () => {
    if (!selectedStaffId) return;
    await assignStaffMutation.mutateAsync({ clientId, staffId: Number(selectedStaffId) });
    setStaffDialogOpen(false);
    setSelectedStaffId("");
    onSuccess?.();
  }, [clientId, selectedStaffId, assignStaffMutation, onSuccess]);

  const handleUnassignStaff = useCallback(async () => {
    if (!currentStaffId) return;
    await unassignStaffMutation.mutateAsync({ clientId, staffId: currentStaffId });
    onSuccess?.();
  }, [clientId, currentStaffId, unassignStaffMutation, onSuccess]);

  const handleUpdateSavings = useCallback(async () => {
    if (!savingsAccountId) return;
    await updateSavingsMutation.mutateAsync({ clientId, savingsAccountId: Number(savingsAccountId) });
    setSavingsDialogOpen(false);
    setSavingsAccountId("");
    onSuccess?.();
  }, [clientId, savingsAccountId, updateSavingsMutation, onSuccess]);

  const handleProposeTransfer = useCallback(async () => {
    if (!destinationOfficeId) return;
    await proposeTransferMutation.mutateAsync({
      clientId,
      payload: {
        destinationOfficeId: Number(destinationOfficeId),
        transferDate: transferDate || undefined,
        dateFormat: "yyyy-MM-dd",
        locale: "en",
        note: transferNote || undefined,
      },
    });
    setTransferDialogOpen(false);
    setDestinationOfficeId("");
    setTransferDate("");
    setTransferNote("");
    onSuccess?.();
  }, [clientId, destinationOfficeId, transferDate, transferNote, proposeTransferMutation, onSuccess]);

  const handleAcceptTransfer = useCallback(async () => {
    await acceptTransferMutation.mutateAsync({ clientId });
    onSuccess?.();
  }, [clientId, acceptTransferMutation, onSuccess]);

  const handleRejectTransfer = useCallback(async () => {
    await rejectTransferMutation.mutateAsync({ clientId });
    onSuccess?.();
  }, [clientId, rejectTransferMutation, onSuccess]);

  const handleWithdrawTransfer = useCallback(async () => {
    await withdrawTransferMutation.mutateAsync({ clientId });
    onSuccess?.();
  }, [clientId, withdrawTransferMutation, onSuccess]);

  const isPending = status === "pending";
  const isActive = status === "active";
  const isClosed = status === "closed";
  const isRejected = status === "rejected";
  const isWithdrawn = status === "withdrawn";
  const isTransferInProgress = status === "transfer in progress";

  const anyLoading =
    rejectMutation.isPending ||
    withdrawMutation.isPending ||
    reactivateMutation.isPending ||
    undoRejectMutation.isPending ||
    undoWithdrawMutation.isPending ||
    assignStaffMutation.isPending ||
    unassignStaffMutation.isPending ||
    updateSavingsMutation.isPending;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Lifecycle commands */}
        {isPending && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommand("reject")}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="mr-1 h-4 w-4" />
              {t("clients.commands.reject")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommand("withdraw")}
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <Ban className="mr-1 h-4 w-4" />
              {t("clients.commands.withdraw")}
            </Button>
          </>
        )}
        {isActive && (
          <Button variant="outline" size="sm" onClick={() => setCloseDialogOpen(true)} className="text-gray-600">
            <LogOut className="mr-1 h-4 w-4" />
            {t("clients.commands.close")}
          </Button>
        )}
        {isClosed && (
          <Button variant="outline" size="sm" onClick={() => setCommand("reactivate")}>
            <Power className="mr-1 h-4 w-4" />
            {t("clients.commands.reactivate")}
          </Button>
        )}
        {isRejected && (
          <Button variant="outline" size="sm" onClick={() => setCommand("undoreject")}>
            <Undo2 className="mr-1 h-4 w-4" />
            {t("clients.commands.undoReject")}
          </Button>
        )}
        {isWithdrawn && (
          <Button variant="outline" size="sm" onClick={() => setCommand("undowithdraw")}>
            <RotateCcw className="mr-1 h-4 w-4" />
            {t("clients.commands.undoWithdraw")}
          </Button>
        )}

        {/* Staff commands */}
        {isActive && (
          <>
            <Button variant="outline" size="sm" onClick={() => setStaffDialogOpen(true)}>
              <UserPlus className="mr-1 h-4 w-4" />
              {currentStaffId ? t("clients.commands.changeStaff") : t("clients.commands.assignStaff")}
            </Button>
            {currentStaffId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnassignStaff}
                className="text-gray-600"
                disabled={anyLoading}
              >
                <UserX className="mr-1 h-4 w-4" />
                {t("clients.commands.unassignStaff")}
              </Button>
            )}
          </>
        )}

        {/* Savings account command */}
        {isActive && (
          <Button variant="outline" size="sm" onClick={() => setSavingsDialogOpen(true)}>
            <PiggyBank className="mr-1 h-4 w-4" />
            {t("clients.commands.updateSavings")}
          </Button>
        )}

        {/* Transfer commands */}
        {isActive && !isTransferInProgress && (
          <Button variant="outline" size="sm" onClick={() => setTransferDialogOpen(true)}>
            <ArrowLeftRight className="mr-1 h-4 w-4" />
            {t("clients.commands.proposeTransfer")}
          </Button>
        )}
        {isTransferInProgress && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcceptTransfer}
              className="text-emerald-600"
              disabled={anyLoading}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {t("clients.commands.acceptTransfer")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectTransfer}
              className="text-red-600"
              disabled={anyLoading}
            >
              <XCircle className="mr-1 h-4 w-4" />
              {t("clients.commands.rejectTransfer")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWithdrawTransfer}
              className="text-amber-600"
              disabled={anyLoading}
            >
              <Ban className="mr-1 h-4 w-4" />
              {t("clients.commands.withdrawTransfer")}
            </Button>
          </>
        )}
      </div>

      {/* Close dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("clients.commands.closeClient")}</DialogTitle>
            <DialogDescription>{t("clients.commands.closeDescription", { name: displayName })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="closeDate">
                {t("clients.commands.closureDate")}
              </label>
              <Input id="closeDate" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            </div>
            <Button onClick={() => handleCommand("close")} disabled={closeMutation.isPending} variant="destructive">
              {closeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("clients.commands.closeClient")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Staff dialog */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentStaffId ? t("clients.commands.changeStaff") : t("clients.commands.assignStaff")}</DialogTitle>
            <DialogDescription>{t("clients.commands.assignStaffDescription", { name: displayName })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">{t("clients.commands.staffLoanOfficer")}</label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("clients.commands.selectStaff")} />
                </SelectTrigger>
                <SelectContent>
                  {template?.staffOptions?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignStaff} disabled={!selectedStaffId || assignStaffMutation.isPending}>
              {assignStaffMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("clients.commands.assign")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Savings Account dialog */}
      <Dialog open={savingsDialogOpen} onOpenChange={setSavingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("clients.commands.updateDefaultSavingsAccount")}</DialogTitle>
            <DialogDescription>{t("clients.commands.savingsDescription", { name: displayName })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="savingsAccountId">
                {t("clients.commands.savingsAccountId")}
              </label>
              <Input
                id="savingsAccountId"
                type="number"
                value={savingsAccountId}
                onChange={(e) => setSavingsAccountId(e.target.value)}
                placeholder={t("clients.commands.savingsAccountPlaceholder")}
              />
            </div>
            <Button onClick={handleUpdateSavings} disabled={!savingsAccountId || updateSavingsMutation.isPending}>
              {updateSavingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("clients.commands.update")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Propose Transfer dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("clients.commands.proposeTransfer")}</DialogTitle>
            <DialogDescription>{t("clients.commands.transferDescription", { name: displayName })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">{t("clients.commands.destinationOffice")}</label>
              <Select value={destinationOfficeId} onValueChange={setDestinationOfficeId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("clients.commands.selectOffice")} />
                </SelectTrigger>
                <SelectContent>
                  {template?.officeOptions?.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="transferDate">
                {t("clients.commands.transferDate")}
              </label>
              <Input
                id="transferDate"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="transferNote">
                {t("clients.commands.note")}
              </label>
              <Input
                id="transferNote"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder={t("clients.commands.optionalNote")}
              />
            </div>
            <Button
              onClick={handleProposeTransfer}
              disabled={!destinationOfficeId || proposeTransferMutation.isPending}
            >
              {proposeTransferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("clients.commands.proposeTransfer")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm dialogs for lifecycle commands */}
      {command && !["close"].includes(command) && (
        <ConfirmDialog
          open={!!command}
          onOpenChange={() => setCommand(null)}
          title={`${command === "reject" ? t("clients.commands.reject") : command === "withdraw" ? t("clients.commands.withdraw") : command === "reactivate" ? t("clients.commands.reactivate") : command === "undoreject" ? t("clients.commands.undoReject") : t("clients.commands.undoWithdraw")} ${t("clients.commands.client")}`}
          description={t("clients.commands.confirmAction", { action: command, name: displayName })}
          onConfirm={() => handleCommand(command)}
          variant={command === "reject" || command === "withdraw" ? "destructive" : "default"}
          confirmLabel={command.charAt(0).toUpperCase() + command.slice(1)}
          loading={anyLoading}
        />
      )}
    </>
  );
};

export default ClientCommands;
