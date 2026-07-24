import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavingsProducts, createSavingsProduct, updateSavingsProduct, useSavingsProduct } from "@/features/deposits";
import type { SavingsProductCreateRequest } from "@/features/deposits";

const CURRENCY_OPTIONS = ["LAK", "THB", "CNY", "USD"];

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  shortName: z.string().min(1, "Short name is required"),
  description: z.string().optional(),
  currencyCode: z.string().min(1, "Currency is required"),
  digitsAfterDecimal: z.string().min(1, "Valid decimal places required"),
  nominalAnnualInterestRate: z.string().min(1, "Interest rate is required"),
});

type ProductFormValues = z.infer<typeof productSchema>;

const SavingsProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: existingProduct, isLoading: productLoading } = useSavingsProduct(id ? Number(id) : undefined);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      shortName: "",
      currencyCode: "USD",
      digitsAfterDecimal: "2",
      nominalAnnualInterestRate: "",
    },
  });

  useEffect(() => {
    if (!existingProduct) return;
    const p = existingProduct as any;
    reset({
      name: p.name,
      shortName: p.shortName ?? "",
      description: p.description ?? "",
      currencyCode: p.currency.code,
      digitsAfterDecimal: String(p.currency.decimalPlaces ?? 2),
      nominalAnnualInterestRate: String(p.nominalAnnualInterestRate),
    });
  }, [existingProduct, reset]);

  const handleSave = async (values: ProductFormValues) => {
    const payload: SavingsProductCreateRequest = {
      name: values.name,
      shortName: values.shortName,
      description: values.description,
      currencyCode: values.currencyCode,
      digitsAfterDecimal: Number(values.digitsAfterDecimal),
      inMultiplesOf: 0,
      locale: "en",
      nominalAnnualInterestRate: Number(values.nominalAnnualInterestRate),
      interestCompoundingPeriodType: 1,
      interestPostingPeriodType: 4,
      interestCalculationType: 1,
      interestCalculationDaysInYearType: 365,
      accountingRule: 1,
    };

    if (isEdit) {
      await updateSavingsProduct(Number(id), payload);
    } else {
      await createSavingsProduct(payload);
    }
    navigate("/deposits/products");
  };

  if (isEdit && productLoading) {
    return (
      <div className="p-6 max-w-2xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Savings Product" : "Create Savings Product"}
        description="Fields marked with * are required."
        actions={
          <Button variant="outline" onClick={() => navigate("/deposits/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Product Name *" {...register("name")} error={errors.name?.message} />
            </div>
            <Input
              label="Short Name *"
              {...register("shortName")}
              error={errors.shortName?.message}
              placeholder="No spaces (e.g. REGSAV01)"
            />
            <div>
              <label className="block text-sm font-medium mb-1.5">Currency *</label>
              <Select
                value={watch("currencyCode")}
                onValueChange={(v) => setValue("currencyCode", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currencyCode && <p className="text-xs text-red-500 mt-1">{errors.currencyCode.message}</p>}
            </div>
            <div className="col-span-2">
              <Textarea label="Description" placeholder="Brief product description" {...register("description")} />
            </div>
            <Input
              label="Decimal Places *"
              type="number"
              {...register("digitsAfterDecimal")}
              error={errors.digitsAfterDecimal?.message}
            />
            <Input
              label="Nominal Annual Rate (%) *"
              type="number"
              step="0.01"
              {...register("nominalAnnualInterestRate")}
              error={errors.nominalAnnualInterestRate?.message}
            />
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/deposits/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Save Changes" : "Create Product"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SavingsProductFormPage;
