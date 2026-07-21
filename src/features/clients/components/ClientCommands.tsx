import { type FC, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Ban, RotateCcw, LogOut, Undo2, Power, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRejectClient, useWithdrawClient, useCloseClient, useReactivateClient, useUndoRejectClient, useUndoWithdrawClient } from "../hooks/useClientCommands";

interface ClientCommandsProps {
    clientId: number;
    status: string;
    displayName: string;
    onSuccess?: () => void;
}

const ClientCommands: FC<ClientCommandsProps> = ({ clientId, status, displayName, onSuccess }) => {
    const rejectMutation = useRejectClient();
    const withdrawMutation = useWithdrawClient();
    const closeMutation = useCloseClient();
    const reactivateMutation = useReactivateClient();
    const undoRejectMutation = useUndoRejectClient();
    const undoWithdrawMutation = useUndoWithdrawClient();

    const [command, setCommand] = useState<string | null>(null);
    const [closeDate, setCloseDate] = useState(new Date().toISOString().split("T")[0]);
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);

    const handleCommand = useCallback(async (cmd: string) => {
        switch (cmd) {
            case "reject": await rejectMutation.mutateAsync(clientId); break;
            case "withdraw": await withdrawMutation.mutateAsync(clientId); break;
            case "close": await closeMutation.mutateAsync({ clientId, closureDate: closeDate, dateFormat: "yyyy-MM-dd", locale: "en" }); setCloseDialogOpen(false); break;
            case "reactivate": await reactivateMutation.mutateAsync(clientId); break;
            case "undoreject": await undoRejectMutation.mutateAsync(clientId); break;
            case "undowithdraw": await undoWithdrawMutation.mutateAsync(clientId); break;
        }
        setCommand(null);
        onSuccess?.();
    }, [clientId, closeDate, rejectMutation, withdrawMutation, closeMutation, reactivateMutation, undoRejectMutation, undoWithdrawMutation, onSuccess]);

    const isPending = status === "pending";
    const isActive = status === "active";
    const isClosed = status === "closed";
    const isRejected = status === "rejected";
    const isWithdrawn = status === "withdrawn";

    return (
        <>
            <div className="flex flex-wrap items-center gap-2">
                {isPending && (
                    <>
                        <Button variant="outline" size="sm" onClick={() => setCommand("reject")} className="text-red-600 border-red-200 hover:bg-red-50">
                            <XCircle className="mr-1 h-4 w-4" />Reject
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCommand("withdraw")} className="text-amber-600 border-amber-200 hover:bg-amber-50">
                            <Ban className="mr-1 h-4 w-4" />Withdraw
                        </Button>
                    </>
                )}
                {isActive && (
                    <Button variant="outline" size="sm" onClick={() => setCloseDialogOpen(true)} className="text-gray-600">
                        <LogOut className="mr-1 h-4 w-4" />Close
                    </Button>
                )}
                {isClosed && (
                    <Button variant="outline" size="sm" onClick={() => setCommand("reactivate")}>
                        <Power className="mr-1 h-4 w-4" />Reactivate
                    </Button>
                )}
                {isRejected && (
                    <Button variant="outline" size="sm" onClick={() => setCommand("undoreject")}>
                        <Undo2 className="mr-1 h-4 w-4" />Undo Reject
                    </Button>
                )}
                {isWithdrawn && (
                    <Button variant="outline" size="sm" onClick={() => setCommand("undowithdraw")}>
                        <RotateCcw className="mr-1 h-4 w-4" />Undo Withdraw
                    </Button>
                )}
            </div>

            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Close Client</DialogTitle>
                        <DialogDescription>Enter closure date for {displayName}.</DialogDescription></DialogHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="closeDate">Closure Date</Label>
                            <Input id="closeDate" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
                        </div>
                        <Button onClick={() => handleCommand("close")} disabled={closeMutation.isPending} variant="destructive">
                            {closeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Close Client
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {command && command !== "close" && (
                <ConfirmDialog
                    open={!!command}
                    onOpenChange={() => setCommand(null)}
                    title={`${command === "reject" ? "Reject" : command === "withdraw" ? "Withdraw" : command === "reactivate" ? "Reactivate" : command === "undoreject" ? "Undo Reject" : "Undo Withdraw"} Client`}
                    description={`Are you sure you want to ${command} ${displayName}?`}
                    onConfirm={() => handleCommand(command)}
                    variant={command === "reject" || command === "withdraw" ? "destructive" : "default"}
                    confirmLabel={command.charAt(0).toUpperCase() + command.slice(1)}
                    loading={rejectMutation.isPending || withdrawMutation.isPending || reactivateMutation.isPending || undoRejectMutation.isPending || undoWithdrawMutation.isPending}
                />
            )}
        </>
    );
};

export default ClientCommands;
