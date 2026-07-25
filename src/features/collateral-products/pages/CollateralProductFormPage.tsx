import { type FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, Gem } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createCollateralProductSchema,
  type CreateCollateralProductFormValues,
} from "../schemas/collateralProduct.schema";
import {
  useCollateralProduct,
  useCollateralProductTemplate,
  useCreateCollateralProduct,
  useUpdateCollateralProduct,
} from "../hooks/useCollateralProducts";

const CollateralProductFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: product, isLoading: productLoading } = useCollateralProduct(id);
  const { data: template, isLoading: templateLoading } = useCollateralProductTemplate();
  const createMutation = useCreateCollateralProduct();
  const updateMutation = useUpdateCollateralProduct();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCollateralProductFormValues>({
    resolver: zodResolver(createCollateralProductSchema),
    defaultValues: {
      name: "",
      quality: "",
      basePrice: undefined as any,
      pctToBase: undefined as any,
      unitType: "",
      currency: "",
    },
  });

  const selectedCurrency = watch("currency");

  useEffect(() => {
    if (!product) return;
    reset({
      name: product.name,
      quality: product.quality,
      basePrice: product.basePrice,
      pctToBase: product.pctToBase,
      unitType: product.unitType,
      currency: product.currency,
    });
  }, [product, reset]);

  const onSubmit = async (values: CreateCollateralProductFormValues) => {
    const payload = {
      ...values,
      locale: "en",
    };
    if (isEdit) {
      await updateMutation.mutateAsync({ id: id!, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate("/collateral-products");
  };

  if ((isEdit && productLoading) || templateLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Collateral Product" : "Create Collateral Product"}
        description={isEdit ? `Editing "${product?.name}"` : "Define a new collateral product type"}
        actions={
          <Button variant="outline" onClick={() => navigate("/collateral-products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gem className="h-5 w-5" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register("name")} placeholder="e.g. Gold Jewelry" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="quality">Quality *</Label>
                <Input id="quality" {...register("quality")} placeholder="e.g. 24K" />
                {errors.quality && <p className="text-xs text-red-500 mt-1">{errors.quality.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice">Base Price *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  {...register("basePrice", { valueAsNumber: true })}
                  placeholder="e.g. 75000"
                />
                {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice.message}</p>}
              </div>
              <div>
                <Label htmlFor="pctToBase">Pct to Base (%) *</Label>
                <Input
                  id="pctToBase"
                  type="number"
                  step="0.01"
                  {...register("pctToBase", { valueAsNumber: true })}
                  placeholder="e.g. 80"
                />
                {errors.pctToBase && <p className="text-xs text-red-500 mt-1">{errors.pctToBase.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unitType">Unit Type *</Label>
                <Input id="unitType" {...register("unitType")} placeholder="e.g. gram" />
                {errors.unitType && <p className="text-xs text-red-500 mt-1">{errors.unitType.message}</p>}
              </div>
              <div>
                <Label>Currency *</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(v) => setValue("currency", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.currencies ?? []).map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && <p className="text-xs text-red-500 mt-1">{errors.currency.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/collateral-products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CollateralProductFormPage;
