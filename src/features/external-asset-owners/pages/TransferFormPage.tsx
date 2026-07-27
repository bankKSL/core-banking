import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, ArrowRightLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
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
    <div className="max-w-4xl m-auto space-y-6">
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
              <Label>Transfer Type *</Label>
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

            <div>
              <Label htmlFor="loanId">Loan ID *</Label>
              <Input
                id="loanId"
                value={loanId}
                onChange={(e) => setLoanId(e.target.value)}
                placeholder="Enter loan ID"
              />
            </div>

            {isSale && (
              <>
                <div>
                  <Label htmlFor="ownerExternalId">Owner External ID *</Label>
                  <Input
                    id="ownerExternalId"
                    {...register("ownerExternalId")}
                    placeholder="e.g. 36efeb06-d835-48a1-99eb-09bd1d348c1e"
                  />
                  {errors.ownerExternalId && (
                    <p className="text-xs text-red-500 mt-1">{errors.ownerExternalId.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="purchasePriceRatio">Purchase Price Ratio *</Label>
                  <Input id="purchasePriceRatio" {...register("purchasePriceRatio")} placeholder="e.g. 1.23456789" />
                  {errors.purchasePriceRatio && (
                    <p className="text-xs text-red-500 mt-1">{errors.purchasePriceRatio.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="transferExternalGroupId">Transfer External Group ID</Label>
                  <Input
                    id="transferExternalGroupId"
                    {...register("transferExternalGroupId")}
                    placeholder="Optional group identifier"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="settlementDate">Settlement Date *</Label>
              <Input id="settlementDate" type="date" {...register("settlementDate")} />
              {errors.settlementDate && <p className="text-xs text-red-500 mt-1">{errors.settlementDate.message}</p>}
            </div>

            <div>
              <Label htmlFor="transferExternalId">Transfer External ID</Label>
              <Input
                id="transferExternalId"
                {...register("transferExternalId")}
                placeholder="Auto-generated if empty"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional. A unique external ID will be generated if not provided.
              </p>
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
