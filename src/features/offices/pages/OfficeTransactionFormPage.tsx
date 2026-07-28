import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/ErrorState";
import { useOfficeTransactionTemplate, useCreateOfficeTransaction } from "../hooks/useOfficeTransactions";

const formSchema = z.object({
  fromOfficeId: z.string().optional(),
  toOfficeId: z.string().optional(),
  transactionDate: z.string().min(1, "Transaction date is required"),
  currencyCode: z.string().min(1, "Currency is required"),
  transactionAmount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const OfficeTransactionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: template, isLoading: isTemplateLoading } = useOfficeTransactionTemplate();
  const createMutation = useCreateOfficeTransaction();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromOfficeId: "",
      toOfficeId: "",
      transactionDate: "",
      currencyCode: "",
      transactionAmount: "",
      description: "",
    },
  });

  const fromOfficeId = watch("fromOfficeId");
  const toOfficeId = watch("toOfficeId");

  const allowedOffices = template?.allowedOffices ?? [];
  const currencyOptions = template?.currencyOptions ?? [];

  const officeOptions = allowedOffices.length > 0
    ? allowedOffices
    : [];

  const handleFormSubmit = useCallback(
    async (values: FormValues) => {
      setMutationError(null);
      try {
        await createMutation.mutateAsync({
          fromOfficeId: values.fromOfficeId ? Number(values.fromOfficeId) : undefined,
          toOfficeId: values.toOfficeId ? Number(values.toOfficeId) : undefined,
          transactionDate: values.transactionDate,
          currencyCode: values.currencyCode,
          transactionAmount: Number(values.transactionAmount),
          description: values.description || undefined,
          dateFormat: "yyyy-MM-dd",
          locale: "en",
        });
        navigate("/office-transactions");
      } catch (err: unknown) {
        const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
        const msg =
          error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to create transaction.";
        setMutationError(msg);
      }
    },
    [createMutation, navigate],
  );

  if (isTemplateLoading) {
    return (
      <div className="p-6 max-w-2xl m-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl m-auto space-y-6">
      <PageHeader
        title="New Office Transaction"
        description="Create a money transfer between offices"
        actions={
          <Button variant="outline" onClick={() => navigate("/office-transactions")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      {mutationError && (
        <ErrorState message={mutationError} />
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">From Office</label>
                <Select
                  value={fromOfficeId}
                  onValueChange={(v) => setValue("fromOfficeId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source office" />
                  </SelectTrigger>
                  <SelectContent>
                    {officeOptions.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.nameDecorated || o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">To Office</label>
                <Select
                  value={toOfficeId}
                  onValueChange={(v) => setValue("toOfficeId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination office" />
                  </SelectTrigger>
                  <SelectContent>
                    {officeOptions.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.nameDecorated || o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Transaction Date *</label>
              <Input type="date" {...register("transactionDate")} error={errors.transactionDate?.message} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Currency *</label>
                <Select
                  value={watch("currencyCode")}
                  onValueChange={(v) => setValue("currencyCode", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currencyCode && (
                  <p className="mt-1 text-xs text-red-500">{errors.currencyCode.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Amount *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("transactionAmount")}
                  error={errors.transactionAmount?.message}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Description</label>
              <Input placeholder="Optional description" {...register("description")} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/office-transactions")}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Create Transaction
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfficeTransactionFormPage;
