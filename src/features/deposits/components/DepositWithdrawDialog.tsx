import { type FC, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
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

const DepositWithdrawDialog: FC<DepositWithdrawDialogProps> = ({ accountId, type, open, onOpenChange, onSuccess }) => {
  const { t } = useTranslation();
  const depositMutation = useMakeDeposit();
  const withdrawMutation = useMakeWithdrawal();
  const [amount, setAmount] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [routingCode, setRoutingCode] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [bankNumber, setBankNumber] = useState("");

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
        accountNumber: accountNumber || undefined,
        checkNumber: checkNumber || undefined,
        routingCode: routingCode || undefined,
        receiptNumber: receiptNumber || undefined,
        bankNumber: bankNumber || undefined,
      } as any,
    });
    setAmount("");
    setNote("");
    setAccountNumber("");
    setCheckNumber("");
    setRoutingCode("");
    setReceiptNumber("");
    setBankNumber("");
    onOpenChange(false);
    onSuccess?.();
  }, [accountId, amount, date, paymentTypeId, note, accountNumber, checkNumber, routingCode, receiptNumber, bankNumber, isDeposit, mutation, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDeposit ? (
              <ArrowDownCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <ArrowUpCircle className="h-5 w-5 text-amber-500" />
            )}
            {isDeposit ? t("Make Deposit") : t("Make Withdrawal")}
          </DialogTitle>
          <DialogDescription>{t("Enter transaction details.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium" htmlFor="amount">
              {t("Amount")} *
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium" htmlFor="paymentType">
              {t("Payment Type")} *
            </label>
            <Select value={paymentTypeId} onValueChange={setPaymentTypeId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t("Cash")}</SelectItem>
                <SelectItem value="2">{t("Cheque")}</SelectItem>
                <SelectItem value="3">{t("Bank Transfer")}</SelectItem>
                <SelectItem value="4">{t("Card Payment")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium" htmlFor="date">
              {t("Transaction Date")} *
            </label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium" htmlFor="note">
              {t("Note")}
            </label>
            <Textarea
              id="note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("Optional note")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="accountNumber">
                {t("Account Number")}
              </label>
              <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder={t("Optional")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="checkNumber">
                {t("Cheque Number")}
              </label>
              <Input id="checkNumber" value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} placeholder={t("Optional")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="routingCode">
                {t("Routing Code")}
              </label>
              <Input id="routingCode" value={routingCode} onChange={(e) => setRoutingCode(e.target.value)} placeholder={t("Optional")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="receiptNumber">
                {t("Receipt Number")}
              </label>
              <Input id="receiptNumber" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} placeholder={t("Optional")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="bankNumber">
                {t("Bank Number")}
              </label>
              <Input id="bankNumber" value={bankNumber} onChange={(e) => setBankNumber(e.target.value)} placeholder={t("Optional")} />
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !amount || parseFloat(amount) <= 0}
            className="bg-[#D32F2F] hover:bg-red-700"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeposit ? t("Deposit") : t("Withdraw")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositWithdrawDialog;
