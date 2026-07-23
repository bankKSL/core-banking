import { type FC, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavingsAccount, useApproveSavingsAccount, useActivateSavingsAccount, useCloseSavingsAccount } from "@/features/deposits";
import { currentDate } from "@/lib/utils";

const COMMAND_LABELS: Record<string, string> = {
    approve: "Approve Account",
    activate: "Activate Account",
    close: "Close Account",
    reject: "Reject Account",
    withdraw: "Withdraw Account",
    block: "Block Account",
};

const AccountActionPage: FC = () => {
    const { accountType, accountId, command } = useParams<{ accountType: string; accountId: string; command: string }>();
    const navigate = useNavigate();
    const { data: account, isLoading } = useSavingsAccount(accountId ?? undefined);
    const approveMutation = useApproveSavingsAccount();
    const activateMutation = useActivateSavingsAccount();
    const closeMutation = useCloseSavingsAccount();
    const [actionDate, setActionDate] = useState(new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const commandKey = command ?? "approve";
    const title = COMMAND_LABELS[commandKey] ?? `Execute ${commandKey}`;

    const handleSubmit = async () => {
        if (!accountId) return;
        setSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                dateFormat: "yyyy-MM-dd",
                locale: "en",
            };
            if (commandKey !== "activate") payload.note = note || undefined;
            if (commandKey === "approve") payload.approvedOnDate = currentDate(actionDate);
            else if (commandKey === "activate") payload.activatedOnDate = actionDate;
            else if (commandKey === "close") payload.closedOnDate = actionDate;

            if (commandKey === "approve") await approveMutation.mutateAsync({ accountId: Number(accountId), payload: payload as any });
            else if (commandKey === "activate") await activateMutation.mutateAsync({ accountId: Number(accountId), payload: payload as any });
            else if (commandKey === "close") await closeMutation.mutateAsync({ accountId: Number(accountId), payload: payload as any });

            const backRoute = accountType === "fixed" ? "/deposits/fixed" : "/deposits/saving-accounts";
            navigate(backRoute);
        } catch {
            // Error handled globally by ApiErrorHandler → toast
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-xl m-auto space-y-6">
            <PageHeader
                title={title}
                description={account ? `${account.accountNo} — ${account.clientName ?? `Client #${account.clientId}`}` : ""}
                actions={
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back
                    </Button>
                }
            />

            <Card>
                <CardContent className="space-y-4 pt-6">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="actionDate">Action Date *</Label>
                                <Input id="actionDate" type="date" value={actionDate} onChange={(e) => setActionDate(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="note">Note {commandKey !== "activate" ? "(optional)" : ""}</Label>
                                {commandKey !== "activate" && <Textarea id="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note..." />}
                            </div>
                            <Button onClick={handleSubmit} disabled={submitting} className="bg-[#D32F2F] hover:bg-red-700">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Execute {commandKey}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AccountActionPage;
