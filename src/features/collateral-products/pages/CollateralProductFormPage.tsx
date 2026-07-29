import { type FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, Gem } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createCollateralProductSchema,
  updateCollateralProductSchema,
  type CreateCollateralProductFormValues,
  type UpdateCollateralProductFormValues,
} from "../schemas/collateralProduct.schema";

type FormValues = CreateCollateralProductFormValues | UpdateCollateralProductFormValues;
import {
  useCollateralProduct,
  useCollateralProductTemplate,
  useCreateCollateralProduct,
  useUpdateCollateralProduct,
} from "../hooks/useCollateralProducts";
import { CurrencySelect } from "@/components/shared/CurrencySelect";

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
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateCollateralProductSchema : createCollateralProductSchema),
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

  const onSubmit = async (values: FormValues) => {
    if (isEdit) {
      const changed: Record<string, unknown> = {};
      const orig = product as Record<string, unknown>;
      for (const [key, val] of Object.entries(values)) {
        if (val !== orig[key] && val !== undefined) {
          changed[key] = val;
        }
      }
      changed.locale = "en";
      await updateMutation.mutateAsync({ id: id!, payload: changed });
    } else {
      await createMutation.mutateAsync({ ...values, locale: "en" });
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
    <div className="max-w-4xl m-auto space-y-6">
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
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Name *</label>
                <Input {...register("name")} placeholder="e.g. Gold Jewelry" error={errors.name?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Quality *</label>
                <Input {...register("quality")} placeholder="e.g. 24K" error={errors.quality?.message} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Base Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("basePrice", { valueAsNumber: true })}
                  placeholder="e.g. 75000"
                  error={errors.basePrice?.message}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Pct to Base (%) *</label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("pctToBase", { valueAsNumber: true })}
                  placeholder="e.g. 80"
                  error={errors.pctToBase?.message}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Unit Type *</label>
                <Input {...register("unitType")} placeholder="e.g. gram" error={errors.unitType?.message} />
              </div>

              <CurrencySelect
                value={selectedCurrency ?? ""}
                onChange={(v) => setValue("currency", v, { shouldValidate: true })}
                error={errors.currency?.message}
              />
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
