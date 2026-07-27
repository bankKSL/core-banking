import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProvisioningCategories,
  useCreateProvisioningCategory,
  useUpdateProvisioningCategory,
} from "../hooks/useProvisioning";

const ProvisioningCategoryFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: categories } = useProvisioningCategories();
  const existingCategory = categories?.find((c) => c.id === Number(id));

  const createMutation = useCreateProvisioningCategory();
  const updateMutation = useUpdateProvisioningCategory();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  useEffect(() => {
    if (!existingCategory) return;
    setCategoryName(existingCategory.categoryName);
    setCategoryDescription(existingCategory.categoryDescription ?? "");
  }, [existingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setMutationError(null);

    try {
      const payload = {
        categoryName: categoryName.trim(),
        ...(categoryDescription.trim() ? { categoryDescription: categoryDescription.trim() } : {}),
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/provisioning/categories");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
      const msg =
        error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to save provisioning category.";
      setMutationError(msg);
    }
  };

  if (isEdit && !categories) {
    return (
      <div className="p-6 max-w-3xl m-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Provisioning Category" : "New Provisioning Category"}
        description={isEdit ? "Update category details" : "Create a new provisioning category"}
        actions={
          <Button variant="outline" onClick={() => navigate("/provisioning/categories")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      {mutationError && <ErrorState message={mutationError} />}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Category Name *"
              placeholder="Enter category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              error={!categoryName.trim() && mutationError ? "Name is required" : undefined}
            />
            <Textarea
              label="Description"
              placeholder="Enter category description (optional)"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate("/provisioning/categories")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update Category" : "Create Category"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProvisioningCategoryFormPage;
