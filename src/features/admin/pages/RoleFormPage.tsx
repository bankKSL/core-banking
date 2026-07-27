import { type FC, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole, useCreateRole, useUpdateRole } from "../hooks/useRoles";

const roleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
});

type RoleFormValues = z.infer<typeof roleSchema>;

const RoleFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: role, isLoading } = useRole(id);
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (!role) return;
    reset({ name: role.name, description: role.description });
  }, [role, reset]);

  const onSubmit = async (values: RoleFormValues) => {
    if (isEdit) {
      await updateMutation.mutateAsync({ roleId: id!, payload: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    navigate("/admin/roles");
  };

  if (isEdit && isLoading) {
    return (
      <div className="p-6 max-w-lg m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Role" : "Create Role"}
        description={isEdit ? `Editing role #${id}` : "Define a new application role"}
        actions={
          <Button variant="outline" onClick={() => navigate("/admin/roles")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Role Name *</Label>
              <Input id="name" {...register("name")} placeholder="e.g. Loan Officer" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe this role's purpose"
                rows={3}
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/admin/roles")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Save Changes" : "Create Role"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoleFormPage;
