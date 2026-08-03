import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, ArrowRightLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoanSearch } from "@/components/shared/LoanSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saleTransferSchema, type SaleTransferFormValues } from "../schemas/externalAssetOwner.schema";
import { useExecuteTransferByLoanId } from "../hooks/useExternalAssetOwners";

type TransferType = "sale" | "buyback" | "intermediarySale";

const TRANSFER_TYPE_OPTIONS: { id: TransferType; label: string }[] = [
  { id: "sale", label: "Sale" },
  { id: "buyback", label: "Buyback" },
  { id: "intermediarySale", label: "Intermediary Sale" },
];

const TransferFormPage: FC = () => {
  const navigate = useNavigate();
  const executeMutation = useExecuteTransferByLoanId();
  const [transferType, setTransferType] = useState<TransferType>("sale");
  const [loanId, setLoanId] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SaleTransferFormValues>({
    resolver: zodResolver(saleTransferSchema),
    defaultValues: {
      ownerExternalId: "",
      settlementDate: "",
      purchasePriceRatio: "",
      transferExternalId: "",
      transferExternalGroupId: "",
    },
  });

  const isSale = transferType === "sale" || transferType === "intermediarySale";

  const handleTypeChange = (type: TransferType) => {
    setTransferType(type);
    if (type === "buyback") {
      reset({
        settlementDate: watch("settlementDate"),
        transferExternalId: watch("transferExternalId"),
        ownerExternalId: "",
        purchasePriceRatio: "",
        transferExternalGroupId: "",
      });
    }
  };

  const onSubmit = async (values: SaleTransferFormValues) => {
    const payload: Record<string, unknown> = {
      settlementDate: values.settlementDate,
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    };

    if (isSale) {
      payload.ownerExternalId = values.ownerExternalId;
      payload.purchasePriceRatio = values.purchasePriceRatio;
    }

    if (values.transferExternalId) {
      payload.transferExternalId = values.transferExternalId;
    }

    if (isSale && values.transferExternalGroupId) {
      payload.transferExternalGroupId = values.transferExternalGroupId;
    }

    await executeMutation.mutateAsync({
      loanId: Number(loanId),
      command: transferType,
      payload: payload as any,
    });
    navigate("/external-asset-owners/transfers");
  };

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title="New Transfer"
        description="Create a loan sale, buyback, or intermediary sale"
        actions={
          <Button variant="outline" onClick={() => navigate("/external-asset-owners/transfers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Transfer Type *</label>
              <Select value={transferType} onValueChange={(v) => handleTypeChange(v as TransferType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFER_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <LoanSearch value={Number(loanId) || 0} onChange={(id) => setLoanId(String(id))} />

            {isSale && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Owner External ID *</label>
                  <Input
                    {...register("ownerExternalId")}
                    placeholder="e.g. 36efeb06-d835-48a1-99eb-09bd1d348c1e"
                    error={errors.ownerExternalId?.message}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Purchase Price Ratio *</label>
                  <Input
                    {...register("purchasePriceRatio")}
                    placeholder="e.g. 1.23456789"
                    error={errors.purchasePriceRatio?.message}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Transfer External Group ID</label>
                  <Input {...register("transferExternalGroupId")} placeholder="Optional group identifier" />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Settlement Date *</label>
              <Input type="date" {...register("settlementDate")} error={errors.settlementDate?.message} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Transfer External ID</label>
              <Input {...register("transferExternalId")} placeholder="Auto-generated if empty" />
              <p className="text-xs text-gray-500">Optional. A unique external ID will be generated if not provided.</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/external-asset-owners/transfers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Submit Transfer
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TransferFormPage;
