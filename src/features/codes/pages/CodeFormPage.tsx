import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/ErrorState";
import { Badge } from "@/components/ui/badge";
import { useCode, useCreateCode, useUpdateCode } from "../hooks/useCodes";

const formSchema = z.object({
  name: z.string().min(1, "Code name is required").max(100, "Max 100 characters"),
});

type FormValues = z.infer<typeof formSchema>;

const CodeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: existingCode, isLoading } = useCode(id ? Number(id) : undefined);
  const createMutation = useCreateCode();
  const updateMutation = useUpdateCode();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: existingCode ? { name: existingCode.name } : undefined,
    defaultValues: { name: "" },
  });

  const handleFormSubmit = useCallback(
    async (values: FormValues) => {
      setMutationError(null);
      try {
        if (isEdit) {
          await updateMutation.mutateAsync({ id: Number(id), payload: values });
        } else {
          await createMutation.mutateAsync(values);
        }
        navigate("/codes");
      } catch (err: unknown) {
        const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
        const msg = error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to save code.";
        setMutationError(msg);
      }
    },
    [isEdit, id, createMutation, updateMutation, navigate],
  );

  const isSystemDefined = existingCode?.systemDefined;

  if (isLoading) {
    return (
      <div className="p-6 max-w-lg m-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <Card>
          <CardContent className="py-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Code" : "New Code"}
        description={isEdit ? "Update code name" : "Create a new lookup code"}
        actions={
          <Button variant="outline" onClick={() => navigate("/codes")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      {mutationError && <ErrorState message={mutationError} />}

      {isSystemDefined && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          System-defined codes cannot be renamed.
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Code Name *</label>
              <Input
                {...register("name")}
                placeholder="e.g. Marital Status"
                disabled={isSystemDefined}
                error={errors.name?.message}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/codes")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSystemDefined || createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update Code" : "Create Code"}
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

export default CodeFormPage;
