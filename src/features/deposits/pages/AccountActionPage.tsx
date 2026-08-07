import { type FC, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useSavingsAccount,
  useApproveSavingsAccount,
  useActivateSavingsAccount,
  useCloseSavingsAccount,
} from "@/features/deposits";
import { currentDate } from "@/lib/utils";

const COMMAND_LABELS: Record<string, string> = {
  approve: "Approve Account",
  activate: "Activate Account",
  close: "Close Account",
  reject: "Reject Account",
  withdraw: "Withdraw Account",
  block: "Block Account",
};

const accountActionSchema = z.object({
  actionDate: z.string().min(1, "Action date is required"),
  note: z.string().optional(),
});

type AccountActionFormValues = z.infer<typeof accountActionSchema>;

const CLOSE_PAYMENT_TYPES = [
  { id: 1, name: "Cash" },
  { id: 2, name: "Cheque" },
  { id: 3, name: "Bank Transfer" },
  { id: 4, name: "Card Payment" },
];

const AccountActionPage: FC = () => {
  const { t } = useTranslation();
  const { accountType, accountId, command } = useParams<{ accountType: string; accountId: string; command: string }>();
  const navigate = useNavigate();
  const { data: account, isLoading } = useSavingsAccount(accountId ?? undefined);
  const approveMutation = useApproveSavingsAccount();
  const activateMutation = useActivateSavingsAccount();
  const closeMutation = useCloseSavingsAccount();

  const commandKey = command ?? "approve";
  const title = t(COMMAND_LABELS[commandKey] ?? "Execute {{command}}", { command: commandKey });

  const [withdrawBalance, setWithdrawBalance] = useState(false);
  const [closePaymentTypeId, setClosePaymentTypeId] = useState("1");
  const [postInterestValidation, setPostInterestValidation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountActionFormValues>({
    resolver: zodResolver(accountActionSchema),
    defaultValues: {
      actionDate: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const onSubmit = async (values: AccountActionFormValues) => {
    if (!accountId) return;
    const payload: Record<string, unknown> = {
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    };
    if (commandKey !== "activate") payload.note = values.note || undefined;
    if (commandKey === "approve") payload.approvedOnDate = currentDate(values.actionDate);
    else if (commandKey === "activate") payload.activatedOnDate = values.actionDate;
    else if (commandKey === "close") {
      payload.closedOnDate = values.actionDate;
      payload.withdrawBalance = withdrawBalance;
      if (withdrawBalance) payload.paymentTypeId = Number(closePaymentTypeId);
      payload.postInterestValidationOnClosure = postInterestValidation;
    }

    if (commandKey === "approve")
      await approveMutation.mutateAsync({ accountId: Number(accountId), payload: payload as any });
    else if (commandKey === "activate")
      await activateMutation.mutateAsync({ accountId: Number(accountId), payload: payload as any });
    else if (commandKey === "close")
      await closeMutation.mutateAsync({ accountId: Number(accountId), payload: payload as any });

    const backRoute = accountType === "fixed" ? "/deposits/fixed" : "/deposits/saving-accounts";
    navigate(backRoute);
  };

  const isClose = commandKey === "close";

  return (
    <div className="p-6 max-w-xl m-auto space-y-6">
      <PageHeader
        title={title}
        description={
          account ? `${account.accountNo} — ${account.clientName ?? t("Client #{{id}}", { id: account.clientId })}` : ""
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("Back")}
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Action Date")} *</label>
                <Input type="date" {...register("actionDate")} error={errors.actionDate?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  {t("Note")} {commandKey !== "activate" ? `(${t("Optional")})` : ""}
                </label>
                {commandKey !== "activate" && (
                  <Textarea id="note" rows={4} {...register("note")} placeholder={t("Optional note...")} />
                )}
              </div>

              {isClose && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="withdrawBalance"
                      checked={withdrawBalance}
                      onChange={(e) => setWithdrawBalance(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="withdrawBalance" className="text-sm font-medium">
                      {t("Withdraw Balance")}
                    </label>
                  </div>
                  {withdrawBalance && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">{t("Payment Type")} *</label>
                      <Select value={closePaymentTypeId} onValueChange={setClosePaymentTypeId}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLOSE_PAYMENT_TYPES.map((pt) => (
                            <SelectItem key={pt.id} value={String(pt.id)}>
                              {t(pt.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="postInterestValidation"
                      checked={postInterestValidation}
                      onChange={(e) => setPostInterestValidation(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="postInterestValidation" className="text-sm font-medium">
                      {t("Post Interest Validation on Closure")}
                    </label>
                  </div>
                </>
              )}

              <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {t("Execute {{command}}", { command: commandKey })}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountActionPage;
