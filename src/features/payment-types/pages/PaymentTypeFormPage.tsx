import { type FC, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaymentType, useCreatePaymentType, useUpdatePaymentType } from "../hooks/usePaymentTypes";

const paymentTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().optional(),
  isCashPayment: z.boolean(),
  position: z.number(),
  codeName: z.string().optional(),
});

type PaymentTypeFormValues = z.infer<typeof paymentTypeFormSchema>;

const PaymentTypeFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: existing, isLoading: isExistingLoading, isError: isExistingError } = usePaymentType(
    id ? Number(id) : undefined,
  );

  const createMutation = useCreatePaymentType();
  const updateMutation = useUpdatePaymentType();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PaymentTypeFormValues>({
    resolver: zodResolver(paymentTypeFormSchema),
    values: existing
      ? {
          name: existing.name ?? "",
          description: existing.description ?? "",
          isCashPayment: existing.isCashPayment,
          position: existing.position,
          codeName: existing.codeName ?? "",
        }
      : undefined,
    defaultValues: {
      name: "",
      description: "",
      isCashPayment: false,
      position: 0,
      codeName: "",
    },
  });

  const onSubmit = useCallback(
    async (values: PaymentTypeFormValues) => {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        isCashPayment: values.isCashPayment,
        position: values.position,
        codeName: values.codeName?.trim() || undefined,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/payment-types");
    },
    [isEdit, id, createMutation, updateMutation, navigate],
  );

  if (isExistingLoading) {
    return (
      <div className="p-6 max-w-2xl m-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isExistingError) {
    return (
      <div className="p-6 max-w-2xl m-auto">
        <PageHeader
          title="Payment Type"
          actions={
            <Button variant="outline" onClick={() => navigate("/payment-types")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          }
        />
        <ErrorState message="Failed to load payment type." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Payment Type" : "New Payment Type"}
        actions={
          <Button variant="outline" onClick={() => navigate("/payment-types")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      {(createMutation.isError || updateMutation.isError) && (
        <ErrorState
          title="Failed to save payment type"
          message={
            (createMutation.error ?? updateMutation.error) instanceof Error
              ? (createMutation.error ?? updateMutation.error).message
              : "An unexpected error occurred."
          }
          onRetry={() => {
            createMutation.reset();
            updateMutation.reset();
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Payment Type" : "New Payment Type"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter payment type name"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Enter description"
              />
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="isCashPayment"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isCashPayment"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <Label htmlFor="isCashPayment">Cash Payment</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                type="number"
                {...register("position", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeName">Code Name</Label>
              <Input
                id="codeName"
                {...register("codeName")}
                placeholder="Enter code name"
                disabled={isEdit && (existing?.isSystemDefined ?? false)}
              />
            </div>

            {isEdit && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isSystemDefined"
                  checked={existing?.isSystemDefined ?? false}
                  disabled
                />
                <Label htmlFor="isSystemDefined" className="text-gray-500">
                  System Defined
                </Label>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/payment-types")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentTypeFormPage;
