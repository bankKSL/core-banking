import { type FC, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle2, XCircle, DollarSign, Ban, Undo2, RotateCcw,
    FileText, Loader2, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    useApproveLoan, useDisburseLoan, useRejectLoan, useCloseLoan,
    useUndoApproval, useUndoDisbursal,
} from "../hooks/useLoanCommands";
import { LOAN_STATUS_ID_MAP } from "../constants/status";
import type { Loan } from "../types/loan";

interface LoanCommandsProps { loan: Loan; onSuccess?: () => void; }

const LoanCommands: FC<LoanCommandsProps> = ({ loan, onSuccess }) => {
    const navigate = useNavigate();
    const approveMut = useApproveLoan();
    const disburseMut = useDisburseLoan();
    const rejectMut = useRejectLoan();
    const closeMut = useCloseLoan();
    const undoApprovalMut = useUndoApproval();
    const undoDisbursalMut = useUndoDisbursal();

    const statusId = loan.status?.id;
    const isPending = statusId === 100;
    const isApproved = statusId === 200;
    const isActive = statusId === 300;
    const isClosed = statusId && [600, 601, 602].includes(statusId);
    const isOverpaid = statusId === 700;

    const [command, setCommand] = useState<string | null>(null);
    const [dateInput, setDateInput] = useState(new Date().toISOString().split("T")[0]);
    const [dateDialog, setDateDialog] = useState(false);

    const handleCommand = useCallback(async (cmd: string) => {
        switch (cmd) {
            case "approve":
                await approveMut.mutateAsync({ loanId: loan.id, payload: { approvedOnDate: dateInput, dateFormat: "yyyy-MM-dd", locale: "en" } });
                setDateDialog(false); break;
            case "disburse":
                await disburseMut.mutateAsync({ loanId: loan.id, payload: { actualDisbursementDate: dateInput, dateFormat: "yyyy-MM-dd", locale: "en", transactionAmount: loan.principal } });
                setDateDialog(false); break;
            case "reject": await rejectMut.mutateAsync({ loanId: loan.id }); break;
            case "close":
                await closeMut.mutateAsync({ loanId: loan.id, payload: { closedOnDate: dateInput, dateFormat: "yyyy-MM-dd", locale: "en" } });
                setDateDialog(false); break;
            case "undoApproval": await undoApprovalMut.mutateAsync(loan.id); break;
            case "undoDisbursal": await undoDisbursalMut.mutateAsync(loan.id); break;
        }
        setCommand(null);
        onSuccess?.();
    }, [loan.id, loan.principal, dateInput, approveMut, disburseMut, rejectMut, closeMut, undoApprovalMut, undoDisbursalMut, onSuccess]);

    const openDateDialog = (cmd: string) => {
        setCommand(cmd);
        setDateInput(new Date().toISOString().split("T")[0]);
        setDateDialog(true);
    };

    const isMutating = approveMut.isPending || disburseMut.isPending || rejectMut.isPending || closeMut.isPending || undoApprovalMut.isPending || undoDisbursalMut.isPending;

    return (
        <>
            <div className="flex flex-wrap items-center gap-2">
                {isPending && (
                    <>
                        <Button variant="outline" size="sm" onClick={() => openDateDialog("approve")} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                            <CheckCircle2 className="mr-1 h-4 w-4" />Approve
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCommand("reject")} className="text-red-600 border-red-200 hover:bg-red-50">
                            <XCircle className="mr-1 h-4 w-4" />Reject
                        </Button>
                    </>
                )}
                {isApproved && (
                    <>
                        <Button variant="outline" size="sm" onClick={() => openDateDialog("disburse")} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                            <DollarSign className="mr-1 h-4 w-4" />Disburse
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCommand("undoApproval")} className="text-amber-600 border-amber-200 hover:bg-amber-50">
                            <Undo2 className="mr-1 h-4 w-4" />Undo Approval
                        </Button>
                    </>
                )}
                {isActive && (
                    <>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/loans/${loan.id}/transactions/repayment`)}>
                            <DollarSign className="mr-1 h-4 w-4" />Repayment
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/loans/${loan.id}/transactions/waiveinterest`)}>
                            <Ban className="mr-1 h-4 w-4" />Waive Interest
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/loans/${loan.id}/transactions/writeoff`)} className="text-red-600 border-red-200 hover:bg-red-50">
                            <FileText className="mr-1 h-4 w-4" />Write Off
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDateDialog("close")} className="text-gray-600">
                            <Ban className="mr-1 h-4 w-4" />Close
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCommand("undoDisbursal")} className="text-amber-600 border-amber-200 hover:bg-amber-50">
                            <RotateCcw className="mr-1 h-4 w-4" />Undo Disbursal
                        </Button>
                    </>
                )}
                {(isClosed || isOverpaid) && (
                    <span className="text-sm text-gray-400 italic">No actions available</span>
                )}
                <Button variant="outline" size="sm" onClick={() => navigate(`/loans/edit/${loan.id}`)}>
                    <Pencil className="mr-1 h-4 w-4" />Edit
                </Button>
            </div>

            <Dialog open={dateDialog} onOpenChange={setDateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{command === "approve" ? "Approve Loan" : command === "disburse" ? "Disburse Loan" : "Close Loan"}</DialogTitle>
                        <DialogDescription>Enter the {command === "approve" ? "approval" : command === "disburse" ? "disbursement" : "closure"} date.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="actionDate">Date</Label>
                            <Input id="actionDate" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setDateDialog(false)}>Cancel</Button>
                            <Button onClick={() => handleCommand(command!)} disabled={isMutating}>
                                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {command === "reject" && (
                <ConfirmDialog open={!!command} onOpenChange={() => setCommand(null)} title="Reject Loan"
                    description={`Reject loan ${loan.accountNo ?? `#${loan.id}`}?`}
                    onConfirm={() => handleCommand("reject")} variant="destructive" confirmLabel="Reject" loading={isMutating} />
            )}
            {command === "undoApproval" && (
                <ConfirmDialog open={!!command} onOpenChange={() => setCommand(null)} title="Undo Approval"
                    description={`Undo approval for loan ${loan.accountNo ?? `#${loan.id}`}?`}
                    onConfirm={() => handleCommand("undoApproval")} variant="destructive" confirmLabel="Undo" loading={isMutating} />
            )}
            {command === "undoDisbursal" && (
                <ConfirmDialog open={!!command} onOpenChange={() => setCommand(null)} title="Undo Disbursal"
                    description={`Undo disbursal for loan ${loan.accountNo ?? `#${loan.id}`}?`}
                    onConfirm={() => handleCommand("undoDisbursal")} variant="destructive" confirmLabel="Undo" loading={isMutating} />
            )}
        </>
    );
};

export default LoanCommands;
export type { LoanCommandsProps };
