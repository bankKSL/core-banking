import { type FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useUserTemplate, useCreateUser, useUpdateUser } from "../hooks/useUsers";

type UserFormValues = z.infer<ReturnType<typeof getUserSchema>>;

function getUserSchema(t: (key: string) => string) {
  return z.object({
    username: z.string().min(1, t("Username is required")).max(100),
    firstname: z.string().min(1, t("First name is required")).max(100),
    lastname: z.string().min(1, t("Last name is required")).max(100),
    email: z.string().email().optional().or(z.literal("")),
    officeId: z.string().min(1, t("Office is required")),
    staffId: z.string().optional(),
    roles: z.array(z.string()).min(1, t("At least one role is required")),
    password: z.string().optional(),
    repeatPassword: z.string().optional(),
    sendPasswordToEmail: z.boolean().optional(),
    passwordNeverExpires: z.boolean().optional(),
    isLoginRetriesEnabled: z.boolean().optional(),
    isPasswordResetAllowed: z.boolean().optional(),
  });
}

const UserFormPage: FC = () => {
  const { t } = useTranslation();
  const userSchema = getUserSchema(t);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: user, isLoading: userLoading } = useUser(id);
  const { data: template, isLoading: templateLoading } = useUserTemplate();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      username: "",
      firstname: "",
      lastname: "",
      email: "",
      officeId: "",
      staffId: "",
      roles: [],
      password: "",
      repeatPassword: "",
      sendPasswordToEmail: false,
      passwordNeverExpires: false,
      isLoginRetriesEnabled: true,
      isPasswordResetAllowed: true,
    },
  });

  useEffect(() => {
    if (!user || !template) return;
    reset({
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email ?? "",
      officeId: String(user.officeId),
      staffId: user.staffId ? String(user.staffId) : "",
      roles: user?.roles?.map((r) => String(r.id)),
      password: "",
      repeatPassword: "",
      sendPasswordToEmail: false,
      passwordNeverExpires: !!user.passwordNeverExpires,
      isLoginRetriesEnabled: user.isLoginRetriesEnabled ?? true,
      isPasswordResetAllowed: user.isPasswordResetAllowed ?? true,
    });
  }, [user, template, reset]);

  const selectedRoles = watch("roles");
  const sendPasswordToEmail = watch("sendPasswordToEmail");

  const toggleRole = (roleId: string) => {
    const current = selectedRoles || [];
    const updated = current.includes(roleId) ? current.filter((r) => r !== roleId) : [...current, roleId];
    setValue("roles", updated, { shouldValidate: true });
  };

  const onSubmit = async (values: UserFormValues) => {
    const payload: Record<string, unknown> = {
      username: values.username,
      firstname: values.firstname,
      lastname: values.lastname,
      email: values.email || undefined,
      officeId: Number(values.officeId),
      staffId: values.staffId ? Number(values.staffId) : undefined,
      roles: (values.roles || []).map(Number),
      passwordNeverExpires: !!values.passwordNeverExpires,
      isLoginRetriesEnabled: !!values.isLoginRetriesEnabled,
      isPasswordResetAllowed: !!values.isPasswordResetAllowed,
    };

    if (!isEdit) {
      if (values.sendPasswordToEmail) {
        payload.sendPasswordToEmail = true;
      } else {
        payload.password = values.password;
        payload.repeatPassword = values.repeatPassword;
      }
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ userId: id!, payload });
    } else {
      await createMutation.mutateAsync(payload as any);
    }
    navigate("/admin/users");
  };

  if ((isEdit && userLoading) || templateLoading) {
    return (
      <div className="p-6 max-w-6xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit User") : t("Create User")}
        description={isEdit ? t("Editing user #{{id}}", { id }) : t("Register a new application user")}
        actions={
          <Button variant="outline" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Basic Information")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium">{t("Username")} *</label>
              <Input {...register("username")} error={errors.username?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("First Name")} *</label>
              <Input {...register("firstname")} error={errors.firstname?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Last Name")} *</label>
              <Input {...register("lastname")} error={errors.lastname?.message} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium">{t("Email")}</label>
              <Input type="email" {...register("email")} placeholder={t("user@example.com")} error={errors.email?.message} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Organization")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Office")} *</label>
              <Select
                value={watch("officeId")}
                onValueChange={(v) => setValue("officeId", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select office")} />
                </SelectTrigger>
                <SelectContent>
                  {template?.allowedOffices?.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.officeId && <p className="text-xs text-red-500 mt-1">{errors.officeId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Staff ID")}</label>
              <Input type="number" {...register("staffId")} placeholder={t("Optional")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Roles")} *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {template?.availableRoles?.map((role) => (
                <Button
                  key={role.id}
                  type="button"
                  variant={selectedRoles?.includes(String(role.id)) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleRole(String(role.id))}
                  className={selectedRoles?.includes(String(role.id)) ? "bg-[#D32F2F]" : ""}
                >
                  {role.name}
                </Button>
              ))}
            </div>
            {errors.roles && <p className="text-xs text-red-500 mt-2">{errors.roles.message}</p>}
          </CardContent>
        </Card>

        {!isEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Password")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-3">
                <Switch id="sendPasswordToEmail" onCheckedChange={(v) => setValue("sendPasswordToEmail", v)} />
                <label className="block text-sm font-medium" htmlFor="sendPasswordToEmail">
                  {t("Send password via email")}
                </label>
              </div>
              {!sendPasswordToEmail && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">{t("Password")} *</label>
                    <Input type="password" {...register("password")} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">{t("Repeat Password")} *</label>
                    <Input type="password" {...register("repeatPassword")} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch
                id="passwordNeverExpires"
                onCheckedChange={(v) => setValue("passwordNeverExpires", v)}
                defaultChecked={user?.passwordNeverExpires ?? false}
              />
              <label className="block text-sm font-medium" htmlFor="passwordNeverExpires">
                {t("Password never expires")}
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isLoginRetriesEnabled"
                onCheckedChange={(v) => setValue("isLoginRetriesEnabled", v)}
                defaultChecked={user?.isLoginRetriesEnabled ?? true}
              />
              <label className="block text-sm font-medium" htmlFor="isLoginRetriesEnabled">
                {t("Enable login retry locking")}
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isPasswordResetAllowed"
                onCheckedChange={(v) => setValue("isPasswordResetAllowed", v)}
                defaultChecked={user?.isPasswordResetAllowed ?? true}
              />
              <label className="block text-sm font-medium" htmlFor="isPasswordResetAllowed">
                {t("Allow password reset")}
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? t("Save Changes") : t("Create User")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserFormPage;
