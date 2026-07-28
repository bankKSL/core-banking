import { type FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, UserRound } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { OfficeSelect } from "@/components/shared/OfficeSelect";
import { useStaff, useCreateStaff, useUpdateStaff } from "../hooks/useStaff";
import { currentDate } from "@/lib/utils";

const staffFormSchema = z.object({
  officeId: z.number({ message: "Office is required" }).int().positive(),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  isLoanOfficer: z.boolean(),
  isActive: z.boolean(),
  joiningDate: z.string().optional().or(z.literal("")),
  mobileNo: z.string().optional().or(z.literal("")),
  emailAddress: z.string().optional().or(z.literal("")),
  externalId: z.string().optional().or(z.literal("")),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

const StaffFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: staffMember, isLoading: staffLoading, isError: staffError } = useStaff(
    id ? Number(id) : undefined,
  );
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      officeId: 0,
      firstname: "",
      lastname: "",
      isLoanOfficer: false,
      isActive: true,
      joiningDate: "",
      mobileNo: "",
      emailAddress: "",
      externalId: "",
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (!staffMember) return;
    reset({
      officeId: staffMember.officeId,
      firstname: staffMember.firstname,
      lastname: staffMember.lastname,
      isLoanOfficer: staffMember.isLoanOfficer,
      isActive: staffMember.isActive,
      joiningDate: Array.isArray(staffMember.joiningDate)
        ? `${staffMember.joiningDate[0]}-${String(staffMember.joiningDate[1]).padStart(2, "0")}-${String(staffMember.joiningDate[2]).padStart(2, "0")}`
        : (staffMember.joiningDate ?? ""),
      mobileNo: staffMember.mobileNo ?? "",
      emailAddress: staffMember.emailAddress ?? "",
      externalId: staffMember.externalId ?? "",
    });
  }, [staffMember, reset]);

  const onSubmit = async (values: StaffFormValues) => {
    const payload: Record<string, unknown> = {
      firstname: values.firstname,
      lastname: values.lastname,
      isLoanOfficer: values.isLoanOfficer ?? false,
      isActive: isEdit ? values.isActive : (values.isActive ?? true),
      joiningDate: values.joiningDate
        ? (currentDate(values.joiningDate) ?? values.joiningDate)
        : undefined,
      mobileNo: values.mobileNo || undefined,
      emailAddress: values.emailAddress || undefined,
      externalId: values.externalId || undefined,
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    };

    if (!isEdit) {
      payload.officeId = values.officeId;
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ id: Number(id), payload: payload as any });
    } else {
      await createMutation.mutateAsync(payload as any);
    }
    navigate("/staff");
  };

  const loading = isEdit && staffLoading;

  if (loading) {
    return (
      <div className="p-6 max-w-2xl m-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEdit && staffError) {
    return (
      <div className="p-6 max-w-2xl m-auto">
        <PageHeader
          title="Staff"
          actions={
            <Button variant="outline" onClick={() => navigate("/staff")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          }
        />
        <ErrorState message="Failed to load staff member." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Staff" : "New Staff"}
        description={
          isEdit
            ? `Editing "${staffMember?.displayName ?? ""}"`
            : "Create a new staff member"
        }
        actions={
          <Button variant="outline" onClick={() => navigate("/staff")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Staff Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OfficeSelect
              value={watch("officeId") ? String(watch("officeId")) : ""}
              onChange={(v) => setValue("officeId", Number(v), { shouldValidate: true })}
              disabled={isEdit}
              error={errors.officeId?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">First Name *</label>
                <Input {...register("firstname")} placeholder="Enter first name" error={errors.firstname?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Last Name *</label>
                <Input {...register("lastname")} placeholder="Enter last name" error={errors.lastname?.message} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="isLoanOfficer"
                  checked={watch("isLoanOfficer")}
                  onCheckedChange={(checked) => setValue("isLoanOfficer", checked === true)}
                />
                <Label htmlFor="isLoanOfficer" className="cursor-pointer">
                  Loan Officer
                </Label>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="isActive"
                  checked={watch("isActive")}
                  onCheckedChange={(checked) => setValue("isActive", checked === true)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Joining Date</label>
              <Input type="date" {...register("joiningDate")} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Mobile No</label>
              <Input
                {...register("mobileNo")}
                placeholder="Enter mobile number"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Email Address</label>
              <Input
                type="email"
                {...register("emailAddress")}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">External ID</label>
              <Input
                {...register("externalId")}
                placeholder="Optional external identifier"
              />
            </div>
          </CardContent>
        </Card>

        {createMutation.isError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {(createMutation.error as any)?.response?.data?.errors?.[0]?.defaultUserMessage ??
              "Failed to save staff member."}
          </div>
        )}
        {updateMutation.isError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {(updateMutation.error as any)?.response?.data?.errors?.[0]?.defaultUserMessage ??
              "Failed to save staff member."}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/staff")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Save Changes" : "Create Staff"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StaffFormPage;
