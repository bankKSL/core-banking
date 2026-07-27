import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { usePaymentType, useCreatePaymentType, useUpdatePaymentType } from "../hooks/usePaymentTypes";

const PaymentTypeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: existing, isLoading: isExistingLoading, isError } = usePaymentType(
    id ? Number(id) : undefined,
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCashPayment, setIsCashPayment] = useState(false);
  const [position, setPosition] = useState(0);
  const [codeName, setCodeName] = useState("");
  const [isSystemDefined, setIsSystemDefined] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  if (existing && !initialized) {
    setName(existing.name ?? "");
    setDescription(existing.description ?? "");
    setIsCashPayment(existing.isCashPayment);
    setPosition(existing.position);
    setCodeName(existing.codeName ?? "");
    setIsSystemDefined(existing.isSystemDefined);
    setInitialized(true);
  }

  const createMutation = useCreatePaymentType();
  const updateMutation = useUpdatePaymentType();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMutationError(null);

      if (!name.trim()) {
        setMutationError("Name is required.");
        return;
      }

      try {
        const payload = {
          name: name.trim(),
          description: description.trim() || undefined,
          isCashPayment,
          position,
          codeName: codeName.trim() || undefined,
        };

        if (isEdit) {
          await updateMutation.mutateAsync({ id: Number(id), payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
        navigate("/payment-types");
      } catch (err: unknown) {
        const error = err as {
          response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } };
        };
        const msg =
          error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to save payment type.";
        setMutationError(msg);
      }
    },
    [name, description, isCashPayment, position, codeName, isEdit, id, createMutation, updateMutation, navigate],
  );

  if (isExistingLoading) {
    return (
      <div className="p-6 max-w-2xl m-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
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

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Payment Type" : "New Payment Type"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter payment type name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isCashPayment"
                checked={isCashPayment}
                onCheckedChange={(checked) => setIsCashPayment(checked === true)}
              />
              <Label htmlFor="isCashPayment">Cash Payment</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                type="number"
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeName">Code Name</Label>
              <Input
                id="codeName"
                value={codeName}
                onChange={(e) => setCodeName(e.target.value)}
                placeholder="Enter code name"
                disabled={isEdit && isSystemDefined}
              />
            </div>

            {isEdit && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isSystemDefined"
                  checked={isSystemDefined}
                  disabled
                />
                <Label htmlFor="isSystemDefined" className="text-gray-500">
                  System Defined
                </Label>
              </div>
            )}

            {mutationError && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                {mutationError}
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
