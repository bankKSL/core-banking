import { type FC, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, UserRound, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { OfficeSelect } from "@/components/shared/OfficeSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStaff, useStaffWithTemplate, useCreateStaff, useUpdateStaff } from "../hooks/useStaff";
import { currentDate } from "@/lib/utils";
import type { Office } from "@/types";

type StaffFormValues = z.infer<ReturnType<typeof getStaffFormSchema>>;

function getStaffFormSchema(t: (key: string) => string) {
  return z.object({
    officeId: z.number({ message: t("Office is required") }).int().positive(),
    firstname: z.string().min(1, t("First name is required")).max(50),
    lastname: z.string().min(1, t("Last name is required")).max(50),
    isLoanOfficer: z.boolean(),
    isActive: z.boolean(),
    joiningDate: z.string().optional().or(z.literal("")),
    mobileNo: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || /^\+?[0-9]{7,15}$/.test(val),
        { message: t("Mobile number must be 7-15 digits, optionally starting with +") }
      ),
    emailAddress: z.string().optional().or(z.literal("")).refine(
      (val) => !val || val.length <= 50,
      { message: t("Email must be 50 characters or less") }
    ),
    externalId: z.string().optional().or(z.literal("")).refine(
      (val) => !val || val.length <= 100,
      { message: t("External ID must be 100 characters or less") }
    ),
  });
}

const StaffFormPage: FC = () => {
  const { t } = useTranslation();
  const staffFormSchema = getStaffFormSchema(t);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: staffMember, isLoading: staffLoading, isError: staffError } = useStaff(id ? Number(id) : undefined);
  const { data: staffWithTemplate } = useStaffWithTemplate(id ? Number(id) : undefined);
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();

  const [forceStatusDialogOpen, setForceStatusDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<StaffFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema) as any,
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

  const allowedOffices: Office[] | undefined = staffWithTemplate?.allowedOffices?.map((o) => ({
    id: o.id,
    name: o.name,
    nameDecorated: o.nameDecorated,
    externalId: "",
    openingDate: "",
    hierarchy: "",
    parentId: null,
    parentName: null,
  }));

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
      joiningDate: values.joiningDate ? (currentDate(values.joiningDate) ?? values.joiningDate) : undefined,
      mobileNo: values.mobileNo || undefined,
      emailAddress: values.emailAddress || undefined,
      externalId: values.externalId || undefined,
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    };

    if (!isEdit) {
      payload.officeId = values.officeId;
    } else if (values.officeId !== staffMember?.officeId) {
      payload.officeId = values.officeId;
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ id: Number(id), payload: payload as any });
    } else {
      await createMutation.mutateAsync(payload as any);
    }
    navigate("/staff");
  };

  const handleFormSubmit = (values: StaffFormValues) => {
    if (isEdit && isActive === false && staffMember?.isActive === true) {
      setPendingValues(values);
      setForceStatusDialogOpen(true);
    } else {
      onSubmit(values);
    }
  };

  const handleForceStatusConfirm = async () => {
    if (!pendingValues) return;
    setForceStatusDialogOpen(false);

    const payload: Record<string, unknown> = {
      firstname: pendingValues.firstname,
      lastname: pendingValues.lastname,
      isLoanOfficer: pendingValues.isLoanOfficer ?? false,
      isActive: false,
      forceStatus: true,
      joiningDate: pendingValues.joiningDate ? (currentDate(pendingValues.joiningDate) ?? pendingValues.joiningDate) : undefined,
      mobileNo: pendingValues.mobileNo || undefined,
      emailAddress: pendingValues.emailAddress || undefined,
      externalId: pendingValues.externalId || undefined,
      officeId: pendingValues.officeId !== staffMember?.officeId ? pendingValues.officeId : undefined,
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    };

    await updateMutation.mutateAsync({ id: Number(id), payload: payload as any });
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
          title={t("Staff")}
          actions={
            <Button variant="outline" onClick={() => navigate("/staff")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load staff member.")} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Staff") : t("New Staff")}
        description={isEdit ? t('Editing "{{name}}"', { name: staffMember?.displayName ?? "" }) : t("Create a new staff member")}
        actions={
          <Button variant="outline" onClick={() => navigate("/staff")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              {t("Staff Details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OfficeSelect
              value={watch("officeId") ? String(watch("officeId")) : ""}
              onChange={(v) => setValue("officeId", Number(v), { shouldValidate: true })}
              disabled={false}
              error={errors.officeId?.message}
              allowedParents={isEdit ? allowedOffices : undefined}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("First Name *")}</label>
                <Input {...register("firstname")} placeholder={t("Enter first name")} error={errors.firstname?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Last Name *")}</label>
                <Input {...register("lastname")} placeholder={t("Enter last name")} error={errors.lastname?.message} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="isLoanOfficer"
                  checked={watch("isLoanOfficer")}
                  onCheckedChange={(checked) => setValue("isLoanOfficer", checked === true)}
                />
                <label className="block text-sm font-medium cursor-pointer" htmlFor="isLoanOfficer">
                  {t("Loan Officer")}
                </label>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="isActive"
                  checked={watch("isActive")}
                  onCheckedChange={(checked) => setValue("isActive", checked === true)}
                />
                <label className="block text-sm font-medium cursor-pointer" htmlFor="isActive">
                  {t("Active")}
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Joining Date")}</label>
              <Input type="date" {...register("joiningDate")} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Mobile No")}</label>
              <Input {...register("mobileNo")} placeholder={t("Enter mobile number")} error={errors.mobileNo?.message} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Email Address")}</label>
              <Input type="email" {...register("emailAddress")} placeholder={t("Enter email address")} error={errors.emailAddress?.message} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("External ID")}</label>
              <Input {...register("externalId")} placeholder={t("Optional external identifier")} error={errors.externalId?.message} />
            </div>
          </CardContent>
        </Card>

        {createMutation.isError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {(createMutation.error as any)?.response?.data?.errors?.[0]?.defaultUserMessage ??
              t("Failed to save staff member.")}
          </div>
        )}
        {updateMutation.isError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {(updateMutation.error as any)?.response?.data?.errors?.[0]?.defaultUserMessage ??
              t("Failed to save staff member.")}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/staff")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? t("Save Changes") : t("Create Staff")}
          </Button>
        </div>
      </form>

      <Dialog open={forceStatusDialogOpen} onOpenChange={setForceStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              {t("Confirm Deactivation")}
            </DialogTitle>
            <DialogDescription>
              {t("This staff member has assigned clients, groups, loans, or savings accounts. Deactivating may affect these assignments.")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t("Are you sure you want to force deactivation? This action cannot be undone.")}
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setForceStatusDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={handleForceStatusConfirm}
              disabled={updateMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Force Deactivate")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffFormPage;
