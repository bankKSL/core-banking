import { type FC, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavingsAccount, fetchDepositTemplate, fetchWithdrawTemplate, makeDeposit, makeWithdrawal } from "@/features/deposits";
import type { SavingsTransactionTemplate } from "@/features/deposits";
import { currentDate } from "@/lib/utils";

const SavingsTransactionFormPage: FC = () => {
    const { id, command } = useParams<{ id: string; command: string }>();
    const navigate = useNavigate();
    const { data: account, isLoading: accountLoading } = useSavingsAccount(id ?? undefined);
    const [template, setTemplate] = useState<SavingsTransactionTemplate | null>(null);
    const [loadingTemplate, setLoadingTemplate] = useState(true);
    const [amount, setAmount] = useState("");
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
    const [paymentTypeId, setPaymentTypeId] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isDeposit = command === "deposit";
    const title = isDeposit ? "Make Deposit" : "Make Withdrawal";

    useEffect(() => {
        if (!id) return;
        const tplId = Number(id);
        if (isNaN(tplId)) return;
        setLoadingTemplate(true);
        const fetchTemplate = isDeposit ? fetchDepositTemplate : fetchWithdrawTemplate;
        fetchTemplate(tplId)
            .then((data) => {
                setTemplate(data);
                if (data.paymentTypeOptions?.length) {
                    setPaymentTypeId(String(data.paymentTypeOptions[0].id));
                }
            })
            .catch(() => {
                /* ignore template errors */
            })
            .finally(() => setLoadingTemplate(false));
    }, [id, command]);

    const handleSubmit = async () => {
        if (!id || !amount || parseFloat(amount) <= 0) return;
        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                transactionDate: currentDate(transactionDate),
                transactionAmount: parseFloat(amount),
                paymentTypeId: paymentTypeId ? Number(paymentTypeId) : undefined,
                note: note || undefined,
                dateFormat: "yyyy-MM-dd",
                locale: "en",
            };

            const tplId = Number(id);
            if (isDeposit) {
                await makeDeposit(tplId, payload as any);
            } else {
                await makeWithdrawal(tplId, payload as any);
            }
            navigate(`/deposits/saving-accounts/${id}`);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err?.message ?? "Transaction failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (accountLoading || loadingTemplate) {
        return (
            <div className="p-6 max-w-xl m-auto space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-80 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-xl m-auto space-y-6">
            <PageHeader
                title={title}
                description={account ? `${account.accountNo} — ${account.clientName ?? `Client #${account.clientId}`}` : ""}
                actions={
                    <Button variant="outline" size="sm" onClick={() => navigate(`/deposits/saving-accounts/${id}`)}>
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back
                    </Button>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        {isDeposit ? <ArrowDownCircle className="h-5 w-5 text-emerald-500" /> : <ArrowUpCircle className="h-5 w-5 text-amber-500" />}
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="amount">Transaction Amount *</Label>
                        <Input id="amount" type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="transactionDate">Transaction Date *</Label>
                        <Input id="transactionDate" type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="paymentTypeId">Payment Type *</Label>
                        <Select value={paymentTypeId} onValueChange={setPaymentTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                            <SelectContent>
                                {template?.paymentTypeOptions?.length ? (
                                    template.paymentTypeOptions.map((pt: any) => (
                                        <SelectItem key={pt.id} value={String(pt.id)}>
                                            {pt.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <>
                                        <SelectItem value="1">Cash</SelectItem>
                                        <SelectItem value="2">Cheque</SelectItem>
                                        <SelectItem value="3">Bank Transfer</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="note">Note</Label>
                        <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note..." />
                    </div>
                    <Button onClick={handleSubmit} disabled={submitting || !amount || parseFloat(amount) <= 0} className="bg-[#D32F2F] hover:bg-red-700">
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        {isDeposit ? "Deposit" : "Withdraw"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default SavingsTransactionFormPage;
