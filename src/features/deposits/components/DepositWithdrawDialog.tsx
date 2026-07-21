import { type FC, useState, useCallback } from "react";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMakeDeposit, useMakeWithdrawal } from "../hooks/useDepositWithdraw";

interface DepositWithdrawDialogProps {
    accountId: number;
    type: "deposit" | "withdrawal";
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const PAYMENT_TYPES = [
    { id: 1, name: "Cash" },
    { id: 2, name: "Cheque" },
    { id: 3, name: "Bank Transfer" },
    { id: 4, name: "Card Payment" },
];

const DepositWithdrawDialog: FC<DepositWithdrawDialogProps> = ({ accountId, type, open, onOpenChange, onSuccess }) => {
    const depositMutation = useMakeDeposit();
    const withdrawMutation = useMakeWithdrawal();
    const [amount, setAmount] = useState("");
    const [paymentTypeId, setPaymentTypeId] = useState("1");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");

    const isDeposit = type === "deposit";
    const mutation = isDeposit ? depositMutation : withdrawMutation;

    const handleSubmit = useCallback(async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;
        await mutation.mutateAsync({
            accountId,
            payload: {
                transactionDate: date,
                transactionAmount: numAmount,
                paymentTypeId: Number(paymentTypeId),
                dateFormat: "yyyy-MM-dd",
                locale: "en",
                note: note || undefined,
            } as any,
        });
        setAmount("");
        setNote("");
        onOpenChange(false);
        onSuccess?.();
    }, [accountId, amount, date, paymentTypeId, note, isDeposit, mutation, onOpenChange, onSuccess]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">{isDeposit ? <ArrowDownCircle className="h-5 w-5 text-emerald-500" /> : <ArrowUpCircle className="h-5 w-5 text-amber-500" />}{isDeposit ? "Make Deposit" : "Make Withdrawal"}</DialogTitle>
                    <DialogDescription>Enter transaction details.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="amount">Amount *</Label>
                        <Input id="amount" type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="paymentType">Payment Type *</Label>
                        <Select value={paymentTypeId} onValueChange={setPaymentTypeId}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {PAYMENT_TYPES.map((pt) => (
                                    <SelectItem key={pt.id} value={String(pt.id)}>{pt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="date">Transaction Date *</Label>
                        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="note">Note</Label>
                        <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
                    </div>
                    <Button onClick={handleSubmit} disabled={mutation.isPending || !amount || parseFloat(amount) <= 0} className="bg-[#D32F2F] hover:bg-red-700">
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isDeposit ? "Deposit" : "Withdraw"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DepositWithdrawDialog;
