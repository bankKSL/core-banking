import { type FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSavingsAccount,
  useMakeDeposit,
  useMakeWithdrawal,
  fetchDepositTemplate,
  fetchWithdrawTemplate,
} from "@/features/deposits";
import type { SavingsTransactionTemplate } from "@/features/deposits";
import { currentDate } from "@/lib/utils";

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const transactionSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
  transactionDate: z.string().min(1, "Date is required"),
  paymentTypeId: z.string().min(1, "Payment type is required"),
  note: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const SavingsTransactionFormPage: FC = () => {
  const { id, command } = useParams<{ id: string; command: string }>();
  const navigate = useNavigate();
  const { data: account, isLoading: accountLoading } = useSavingsAccount(id ?? undefined);
  const depositMutation = useMakeDeposit();
  const withdrawMutation = useMakeWithdrawal();

  const isDeposit = command === "deposit";
  const title = isDeposit ? "Make Deposit" : "Make Withdrawal";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: "",
      transactionDate: new Date().toISOString().split("T")[0],
      paymentTypeId: "",
      note: "",
    },
  });

  const paymentTypeId = watch("paymentTypeId");

  useEffect(() => {
    if (!id) return;
    const tplId = Number(id);
    if (isNaN(tplId)) return;
    const fetchTemplate = isDeposit ? fetchDepositTemplate : fetchWithdrawTemplate;
    fetchTemplate(tplId)
      .then((data: SavingsTransactionTemplate) => {
        if (data.paymentTypeOptions?.length) {
          setValue("paymentTypeId", String(data.paymentTypeOptions[0].id));
        }
      })
      .catch(() => {
        /* ignore template errors */
      });
  }, [id, command, setValue]);

  const onSubmit = async (values: TransactionFormValues) => {
    if (!id) return;
    const payload = {
      transactionDate: currentDate(values.transactionDate),
      transactionAmount: parseFloat(values.amount),
      paymentTypeId: values.paymentTypeId ? Number(values.paymentTypeId) : undefined,
      note: values.note || undefined,
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    };

    const tplId = Number(id);
    if (isDeposit) {
      await depositMutation.mutateAsync({ accountId: tplId, payload: payload as any });
    } else {
      await withdrawMutation.mutateAsync({ accountId: tplId, payload: payload as any });
    }
    navigate(`/deposits/saving-accounts/${id}`);
  };

  if (accountLoading) {
    return (
      <div className="p-6 max-w-xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
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
            {isDeposit ? (
              <ArrowDownCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <ArrowUpCircle className="h-5 w-5 text-amber-500" />
            )}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Transaction Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register("amount")}
                error={errors.amount?.message}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transactionDate">Transaction Date *</Label>
              <Input
                id="transactionDate"
                type="date"
                {...register("transactionDate")}
                error={errors.transactionDate?.message}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paymentTypeId">Payment Type *</Label>
              <div>
                <Select
                  value={paymentTypeId}
                  onValueChange={(v) => setValue("paymentTypeId", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select payment type</SelectItem>
                    <SelectItem value="1">Cash</SelectItem>
                    <SelectItem value="2">Cheque</SelectItem>
                    <SelectItem value="3">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentTypeId && <p className="text-sm text-red-500 mt-1">{errors.paymentTypeId.message}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note">Note</Label>
              <Textarea id="note" rows={3} {...register("note")} placeholder="Optional note..." />
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {isDeposit ? "Deposit" : "Withdraw"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsTransactionFormPage;
