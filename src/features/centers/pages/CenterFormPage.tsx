import { type FC, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfficeSelect } from "@/components/shared/OfficeSelect";
import { useCenter, useCenterTemplate, useCreateCenter, useUpdateCenter } from "../hooks/useCenters";
import { currentDate } from "@/lib/utils";

const centerFormSchema = z
  .object({
    name: z.string({ message: "Name is required" }).min(1, "Name is required"),
    officeId: z.number({ message: "Office is required" }).int().positive("Office is required"),
    staffId: z.number().optional().or(z.literal("")),
    externalId: z.string().optional().or(z.literal("")),
    active: z.boolean().default(true),
    activationDate: z.string().optional().or(z.literal("")),
    submittedOnDate: z.string().optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    if (values.active && !values.activationDate) {
      ctx.addIssue({
        code: "custom",
        path: ["activationDate"],
        message: "Activation date is required when the center is active",
      });
    }
  });

type CenterFormValues = z.infer<typeof centerFormSchema>;

const CenterFormPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { data: template } = useCenterTemplate();
  const { data: center, isLoading: centerLoading } = useCenter(id ? Number(id) : undefined);
  const createMutation = useCreateCenter();
  const updateMutation = useUpdateCenter();

  const isLoading = isEditMode && centerLoading;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CenterFormValues>({
    resolver: zodResolver(centerFormSchema) as any,
    defaultValues: {
      name: "",
      officeId: 0,
      staffId: "",
      externalId: "",
      active: true,
      activationDate: currentDate(),
      submittedOnDate: currentDate(),
    },
  });

  const officeId = watch("officeId");
  const active = watch("active");

  const staffOptions = template?.staffOptions ?? [];
  const filteredStaff = officeId ? staffOptions : staffOptions;

  if (isEditMode && center && !centerLoading) {
    reset({
      name: center.name ?? "",
      officeId: center.officeId ?? 0,
      staffId: center.staffId ?? "",
      externalId: center.externalId ?? "",
      active: center.active ?? false,
      activationDate: center.activationDate ?? "",
      submittedOnDate: center.timeline?.submittedOnDate ?? currentDate(),
    });
  }

  const onSubmit = useCallback(
    async (values: CenterFormValues) => {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({
          id: Number(id),
          payload: {
            name: values.name,
            externalId: values.externalId || undefined,
          },
        });
        navigate("/centers");
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          officeId: values.officeId,
          staffId: values.staffId || undefined,
          externalId: values.externalId || undefined,
          active: values.active,
          activationDate: values.active ? values.activationDate : undefined,
          submittedOnDate: values.submittedOnDate || undefined,
        });
        navigate("/centers");
      }
    },
    [createMutation, updateMutation, navigate, isEditMode, id],
  );

  const error = createMutation.error?.message ?? updateMutation.error?.message ?? null;

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="rounded-xl border p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto">
      <PageHeader
        title={isEditMode ? "Edit Center" : "Create Center"}
        description={isEditMode ? `Editing center ${center?.name ?? `#${id}`}` : "Register a new center"}
        actions={
          <Button variant="outline" onClick={() => navigate("/centers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Centers
          </Button>
        }
      />
      {(createMutation.isError || updateMutation.isError) && (
        <div className="mb-4">
          <ErrorState
            title="Failed to save center"
            message={error ?? "An unexpected error occurred."}
            onRetry={() => {
              createMutation.reset();
              updateMutation.reset();
            }}
          />
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Center Details" : "New Center"}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input id="name" {...register("name")} disabled={isSubmitting} placeholder="e.g. Downtown Center" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <OfficeSelect
              value={officeId ? String(officeId) : ""}
              onChange={(v) => setValue("officeId", Number(v), { shouldValidate: true })}
              disabled={isEditMode || isSubmitting}
              error={errors.officeId?.message}
            />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staffId">Staff</Label>
              <Select
                value={watch("staffId") ? String(watch("staffId")) : ""}
                onValueChange={(v) => setValue("staffId", v ? Number(v) : "")}
                disabled={isSubmitting}
              >
                <SelectTrigger id="staffId">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStaff.map((staff) => (
                    <SelectItem key={staff.id} value={String(staff.id)}>
                      {staff.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isEditMode && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="externalId">External ID</Label>
                <Input id="externalId" {...register("externalId")} disabled={isSubmitting} placeholder="Optional" />
              </div>
            )}

            {!isEditMode && (
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="active"
                  checked={active}
                  onCheckedChange={(checked) => setValue("active", checked === true)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Active
                </Label>
              </div>
            )}

            {!isEditMode && active && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="activationDate">
                  Activation Date <span className="text-red-500">*</span>
                </Label>
                <Input id="activationDate" type="date" {...register("activationDate")} disabled={isSubmitting} />
                {errors.activationDate && <p className="text-xs text-red-500">{errors.activationDate.message}</p>}
              </div>
            )}

            {!isEditMode && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="submittedOnDate">Submitted On Date</Label>
                <Input id="submittedOnDate" type="date" {...register("submittedOnDate")} disabled={isSubmitting} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEditMode ? "Saving..." : "Creating..."}
              </span>
            ) : isEditMode ? (
              "Save Changes"
            ) : (
              "Create Center"
            )}
          </Button>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => navigate("/centers")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CenterFormPage;
