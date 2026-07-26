import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Send, Loader2, ArrowRightLeft, Quote, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transferSchema, type TransferFormValues } from "../schemas/interop.schema";
import { useCreateQuote, useExecuteTransfer } from "../hooks/useInterop";
import type { QuoteResponse, TransferResponse } from "../types/interop";

type Step = "form" | "quote" | "result";

const InteropTransferPage: FC = () => {
  const navigate = useNavigate();
  const quoteMutation = useCreateQuote();
  const transferMutation = useExecuteTransfer();
  const [step, setStep] = useState<Step>("form");
  const [action, setAction] = useState<"PREPARE" | "CREATE" | "RELEASE">("PREPARE");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [transferResult, setTransferResult] = useState<TransferResponse | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transactionCode: "",
      transferCode: "",
      accountId: "",
      amount: "",
      currency: "USD",
      transactionRole: "PAYER",
      scenario: "TRANSFER",
      initiator: "PAYER",
      initiatorType: "CONSUMER",
      fspFee: "",
      fspCommission: "",
      note: "",
    },
  });

  const getTransferPayload = (values: TransferFormValues) => ({
    transactionCode: values.transactionCode,
    transferCode: values.transferCode,
    accountId: values.accountId,
    amount: { amount: values.amount, currency: values.currency },
    transactionRole: values.transactionRole as any,
    transactionType: {
      scenario: values.scenario as any,
      initiator: values.initiator as any,
      initiatorType: values.initiatorType as any,
    },
    fspFee: values.fspFee
      ? { amount: values.fspFee, currency: values.currency }
      : undefined,
    fspCommission: values.fspCommission
      ? { amount: values.fspCommission, currency: values.currency }
      : undefined,
    note: values.note || undefined,
    expiration: new Date(Date.now() + 86400000).toISOString(),
    locale: "en",
    extensionList: [],
  });

  const handleGetQuote = async (values: TransferFormValues) => {
    const result = await quoteMutation.mutateAsync({
      transactionCode: values.transactionCode,
      quoteCode: `q-${values.transactionCode}`,
      accountId: values.accountId,
      amount: { amount: values.amount, currency: values.currency },
      transactionRole: values.transactionRole as any,
      transactionType: {
        scenario: values.scenario as any,
        initiator: values.initiator as any,
        initiatorType: values.initiatorType as any,
      },
      note: values.note || undefined,
      expiration: new Date(Date.now() + 86400000).toISOString(),
      locale: "en",
      extensionList: [],
    });
    setQuote(result);
    setStep("quote");
  };

  const handleExecuteTransfer = async (values: TransferFormValues) => {
    const payload = getTransferPayload(values);
    const result = await transferMutation.mutateAsync({ action, payload });
    setTransferResult(result);
    setStep("result");
  };

  const isPayer = watch("transactionRole") === "PAYER";

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title="Interop Transfer"
        description="Create quotes, prepare holds, and commit transfers"
        actions={
          <Button variant="outline" onClick={() => navigate("/interop/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {step === "form" && (
        <form className="space-y-6" noValidate>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Transfer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transactionCode">Transaction Code *</Label>
                  <Input id="transactionCode" {...register("transactionCode")} placeholder="e.g. tx-001" />
                </div>
                <div>
                  <Label htmlFor="transferCode">Transfer Code *</Label>
                  <Input id="transferCode" {...register("transferCode")} placeholder="e.g. tr-001" />
                </div>
              </div>
              <div>
                <Label htmlFor="accountId">Account External ID *</Label>
                <Input id="accountId" {...register("accountId")} placeholder="e.g. ext-payer-account" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input id="amount" {...register("amount")} placeholder="e.g. 100.00" />
                </div>
                <div>
                  <Label htmlFor="currency">Currency *</Label>
                  <Input id="currency" {...register("currency")} placeholder="e.g. USD" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Transaction Role *</Label>
                  <Select
                    onValueChange={(v) => setValue("transactionRole", v)}
                    defaultValue="PAYER"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAYER">Payer (Debit)</SelectItem>
                      <SelectItem value="PAYEE">Payee (Credit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Scenario *</Label>
                  <Select
                    onValueChange={(v) => setValue("scenario", v)}
                    defaultValue="TRANSFER"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                      <SelectItem value="PAYMENT">Payment</SelectItem>
                      <SelectItem value="DEPOSIT">Deposit</SelectItem>
                      <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                      <SelectItem value="REFUND">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Initiator *</Label>
                  <Select
                    onValueChange={(v) => setValue("initiator", v)}
                    defaultValue="PAYER"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAYER">Payer</SelectItem>
                      <SelectItem value="PAYEE">Payee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Initiator Type *</Label>
                  <Select
                    onValueChange={(v) => setValue("initiatorType", v)}
                    defaultValue="CONSUMER"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSUMER">Consumer</SelectItem>
                      <SelectItem value="AGENT">Agent</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="DEVICE">Device</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="note">Note</Label>
                <Input id="note" {...register("note")} placeholder="Optional note" />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/interop/dashboard")}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(handleGetQuote)}
              disabled={quoteMutation.isPending}
              className="bg-[#D32F2F] hover:bg-red-700"
            >
              {quoteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Quote className="mr-2 h-4 w-4" />
              Get Quote
            </Button>
          </div>
        </form>
      )}

      {step === "quote" && quote && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              Quote Received
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">State</p>
                <Badge variant={quote.state === "ACCEPTED" ? "success" : "error"}>
                  {quote.state}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Transaction Code</p>
                <p className="font-mono text-sm">{quote.transactionCode}</p>
              </div>
              {quote.fspFee && (
                <div>
                  <p className="text-xs text-gray-500">FSP Fee</p>
                  <p className="font-mono text-sm">
                    {quote.fspFee.amount} {quote.fspFee.currency}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("form")}
              >
                Back to Form
              </Button>
              <Button
                onClick={handleSubmit((v) => {
                  setAction("PREPARE");
                  handleExecuteTransfer(v);
                })}
                disabled={transferMutation.isPending}
                className="bg-[#D32F2F] hover:bg-red-700"
              >
                {transferMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Send className="mr-2 h-4 w-4" />
                Prepare Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "result" && transferResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              Transfer {action === "PREPARE" ? "Prepared" : action === "CREATE" ? "Committed" : "Released"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">State</p>
                <Badge variant={transferResult.state === "ACCEPTED" ? "success" : "error"}>
                  {transferResult.state}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Transfer Code</p>
                <p className="font-mono text-sm">{transferResult.transferCode}</p>
              </div>
              {transferResult.completedTimestamp && (
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-sm">
                    {new Date(transferResult.completedTimestamp).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              {action === "PREPARE" && (
                <Button
                  onClick={handleSubmit((v) => {
                    setAction("CREATE");
                    handleExecuteTransfer(v);
                  })}
                  disabled={transferMutation.isPending}
                  className="bg-[#D32F2F] hover:bg-red-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Commit Transfer
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/interop/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InteropTransferPage;
