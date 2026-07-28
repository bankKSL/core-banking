import { type FC, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, Plus, Pencil, Sliders } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  createLoanProductAttributeSchema,
  type CreateLoanProductAttributeFormValues,
} from "../schemas/externalAssetOwner.schema";
import {
  useLoanProductAttributes,
  useCreateLoanProductAttribute,
  useUpdateLoanProductAttribute,
} from "../hooks/useExternalAssetOwners";
import type { LoanProductAttribute } from "../types/externalAssetOwner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SETTLEMENT_OPTIONS = [
  { value: "DEFAULT_SETTLEMENT", label: "Default Settlement" },
  { value: "DELAYED_SETTLEMENT", label: "Delayed Settlement" },
];

const INTEREST_STRATEGY_OPTIONS = [
  { value: "TOTAL_OUTSTANDING", label: "Total Outstanding" },
  { value: "PAYABLE_OUTSTANDING", label: "Payable Outstanding" },
];

const LoanProductAttributesPage: FC = () => {
  const navigate = useNavigate();
  const { loanProductId } = useParams<{ loanProductId: string }>();
  const parsedId = loanProductId ? Number(loanProductId) : undefined;
  const { data: attributes = [], isLoading } = useLoanProductAttributes(parsedId);
  const createMutation = useCreateLoanProductAttribute();
  const updateMutation = useUpdateLoanProductAttribute();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<LoanProductAttribute | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLoanProductAttributeFormValues>({
    resolver: zodResolver(createLoanProductAttributeSchema),
    defaultValues: { attributeKey: "", attributeValue: "" },
  });

  const openCreate = () => {
    setEditingAttribute(null);
    reset({ attributeKey: "", attributeValue: "" });
    setDialogOpen(true);
  };

  const openEdit = (attr: LoanProductAttribute) => {
    setEditingAttribute(attr);
    reset({ attributeKey: attr.attributeKey, attributeValue: attr.attributeValue });
    setDialogOpen(true);
  };

  const onSubmit = async (values: CreateLoanProductAttributeFormValues) => {
    if (!parsedId) return;
    if (editingAttribute) {
      await updateMutation.mutateAsync({
        loanProductId: parsedId,
        attributeId: editingAttribute.id,
        payload: values,
      });
    } else {
      await createMutation.mutateAsync({
        loanProductId: parsedId,
        payload: values,
      });
    }
    setDialogOpen(false);
  };

  const columns: ColumnDef<LoanProductAttribute>[] = [
    {
      key: "attributeKey",
      header: "Key",
      cell: (r) => <span className="font-medium">{r.attributeKey}</span>,
    },
    {
      key: "attributeValue",
      header: "Value",
      cell: (r) => <span className="font-mono text-sm">{r.attributeValue}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (!parsedId) {
    return (
      <div className="p-6 max-w-4xl m-auto">
        <PageHeader title="Loan Product Attributes" description="Configure investor attributes for a loan product" />
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Please provide a loan product ID in the URL.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title="Loan Product Attributes"
        description={`Configure investor settings for loan product #${parsedId}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/lending/products")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} className="bg-[#D32F2F] hover:bg-red-700">
                  <Plus className="mr-2 h-4 w-4" /> Add Attribute
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingAttribute ? "Edit Attribute" : "Create Attribute"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div>
                    <Label htmlFor="attributeKey">Attribute Key *</Label>
                    <Select
                      value={watch("attributeKey")}
                      onValueChange={(v) => setValue("attributeKey", v, { shouldValidate: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select key" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="settlementModel">Settlement Model</SelectItem>
                        <SelectItem value="outstandingInterestStrategy">Outstanding Interest Strategy</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.attributeKey && <p className="text-xs text-red-500 mt-1">{errors.attributeKey.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">Attribute Value *</label>
                    {watch("attributeKey") === "settlementModel" ? (
                      <Select
                        value={watch("attributeValue")}
                        onValueChange={(v) => setValue("attributeValue", v, { shouldValidate: true })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {SETTLEMENT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : watch("attributeKey") === "outstandingInterestStrategy" ? (
                      <Select
                        value={watch("attributeValue")}
                        onValueChange={(v) => setValue("attributeValue", v, { shouldValidate: true })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {INTEREST_STRATEGY_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input {...register("attributeValue")} placeholder="Enter value" error={errors.attributeValue?.message} />
                    )}
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />
                      {editingAttribute ? "Save Changes" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Attributes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={attributes}
              emptyState={{
                icon: <Sliders className="h-8 w-8 text-gray-300" />,
                message: "No attributes configured for this loan product.",
              }}
              minWidth={500}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanProductAttributesPage;
