import { type FC, useState, useCallback } from "react";
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
              Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommand("withdraw")}
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <Ban className="mr-1 h-4 w-4" />
              Withdraw
            </Button>
          </>
        )}
        {isActive && (
          <Button variant="outline" size="sm" onClick={() => setCloseDialogOpen(true)} className="text-gray-600">
            <LogOut className="mr-1 h-4 w-4" />
            Close
          </Button>
        )}
        {isClosed && (
          <Button variant="outline" size="sm" onClick={() => setCommand("reactivate")}>
            <Power className="mr-1 h-4 w-4" />
            Reactivate
          </Button>
        )}
        {isRejected && (
          <Button variant="outline" size="sm" onClick={() => setCommand("undoreject")}>
            <Undo2 className="mr-1 h-4 w-4" />
            Undo Reject
          </Button>
        )}
        {isWithdrawn && (
          <Button variant="outline" size="sm" onClick={() => setCommand("undowithdraw")}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Undo Withdraw
          </Button>
        )}

        {/* Staff commands */}
        {isActive && (
          <>
            <Button variant="outline" size="sm" onClick={() => setStaffDialogOpen(true)}>
              <UserPlus className="mr-1 h-4 w-4" />
              {currentStaffId ? "Change Staff" : "Assign Staff"}
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
                Unassign Staff
              </Button>
            )}
          </>
        )}

        {/* Savings account command */}
        {isActive && (
          <Button variant="outline" size="sm" onClick={() => setSavingsDialogOpen(true)}>
            <PiggyBank className="mr-1 h-4 w-4" />
            Update Savings
          </Button>
        )}

        {/* Transfer commands */}
        {isActive && !isTransferInProgress && (
          <Button variant="outline" size="sm" onClick={() => setTransferDialogOpen(true)}>
            <ArrowLeftRight className="mr-1 h-4 w-4" />
            Propose Transfer
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
              Accept Transfer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectTransfer}
              className="text-red-600"
              disabled={anyLoading}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Reject Transfer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWithdrawTransfer}
              className="text-amber-600"
              disabled={anyLoading}
            >
              <Ban className="mr-1 h-4 w-4" />
              Withdraw Transfer
            </Button>
          </>
        )}
      </div>

      {/* Close dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Client</DialogTitle>
            <DialogDescription>Enter closure date for {displayName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="closeDate">
                Closure Date
              </label>
              <Input id="closeDate" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            </div>
            <Button onClick={() => handleCommand("close")} disabled={closeMutation.isPending} variant="destructive">
              {closeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Close Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Staff dialog */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentStaffId ? "Change Staff" : "Assign Staff"}</DialogTitle>
            <DialogDescription>Select a loan officer to assign to {displayName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">Staff (Loan Officer)</label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
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
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Savings Account dialog */}
      <Dialog open={savingsDialogOpen} onOpenChange={setSavingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Default Savings Account</DialogTitle>
            <DialogDescription>Enter the savings account ID to set as default for {displayName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="savingsAccountId">
                Savings Account ID
              </label>
              <Input
                id="savingsAccountId"
                type="number"
                value={savingsAccountId}
                onChange={(e) => setSavingsAccountId(e.target.value)}
                placeholder="Savings account ID"
              />
            </div>
            <Button onClick={handleUpdateSavings} disabled={!savingsAccountId || updateSavingsMutation.isPending}>
              {updateSavingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Propose Transfer dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propose Transfer</DialogTitle>
            <DialogDescription>Transfer {displayName} to another office.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">Destination Office</label>
              <Select value={destinationOfficeId} onValueChange={setDestinationOfficeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
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
                Transfer Date
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
                Note
              </label>
              <Input
                id="transferNote"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="Optional note"
              />
            </div>
            <Button
              onClick={handleProposeTransfer}
              disabled={!destinationOfficeId || proposeTransferMutation.isPending}
            >
              {proposeTransferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Propose Transfer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm dialogs for lifecycle commands */}
      {command && !["close"].includes(command) && (
        <ConfirmDialog
          open={!!command}
          onOpenChange={() => setCommand(null)}
          title={`${command === "reject" ? "Reject" : command === "withdraw" ? "Withdraw" : command === "reactivate" ? "Reactivate" : command === "undoreject" ? "Undo Reject" : "Undo Withdraw"} Client`}
          description={`Are you sure you want to ${command} ${displayName}?`}
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
