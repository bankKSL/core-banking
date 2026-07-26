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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useUserTemplate, useCreateUser, useUpdateUser } from "../hooks/useUsers";

const userSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  firstname: z.string().min(1, "First name is required").max(100),
  lastname: z.string().min(1, "Last name is required").max(100),
  email: z.string().email().optional().or(z.literal("")),
  officeId: z.string().min(1, "Office is required"),
  staffId: z.string().optional(),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  password: z.string().optional(),
  repeatPassword: z.string().optional(),
  sendPasswordToEmail: z.boolean().optional(),
  passwordNeverExpires: z.boolean().optional(),
  isLoginRetriesEnabled: z.boolean().optional(),
  isPasswordResetAllowed: z.boolean().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

const UserFormPage: FC = () => {
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
      <div className="p-6 max-w-4xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit User" : "Create User"}
        description={isEdit ? `Editing user #${id}` : "Register a new application user"}
        actions={
          <Button variant="outline" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="username">Username *</Label>
              <Input id="username" {...register("username")} />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <Label htmlFor="firstname">First Name *</Label>
              <Input id="firstname" {...register("firstname")} />
              {errors.firstname && <p className="text-xs text-red-500 mt-1">{errors.firstname.message}</p>}
            </div>
            <div>
              <Label htmlFor="lastname">Last Name *</Label>
              <Input id="lastname" {...register("lastname")} />
              {errors.lastname && <p className="text-xs text-red-500 mt-1">{errors.lastname.message}</p>}
            </div>
            <div className="col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} placeholder="user@example.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Office *</Label>
              <Select
                value={watch("officeId")}
                onValueChange={(v) => setValue("officeId", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
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
            <div>
              <Label htmlFor="staffId">Staff ID</Label>
              <Input id="staffId" type="number" {...register("staffId")} placeholder="Optional" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Roles *</CardTitle>
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
              <CardTitle className="text-base">Password</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-3">
                <Switch id="sendPasswordToEmail" onCheckedChange={(v) => setValue("sendPasswordToEmail", v)} />
                <Label htmlFor="sendPasswordToEmail">Send password via email</Label>
              </div>
              {!sendPasswordToEmail && (
                <>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input id="password" type="password" {...register("password")} />
                  </div>
                  <div>
                    <Label htmlFor="repeatPassword">Repeat Password *</Label>
                    <Input id="repeatPassword" type="password" {...register("repeatPassword")} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch
                id="passwordNeverExpires"
                onCheckedChange={(v) => setValue("passwordNeverExpires", v)}
                defaultChecked={user?.passwordNeverExpires ?? false}
              />
              <Label htmlFor="passwordNeverExpires">Password never expires</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isLoginRetriesEnabled"
                onCheckedChange={(v) => setValue("isLoginRetriesEnabled", v)}
                defaultChecked={user?.isLoginRetriesEnabled ?? true}
              />
              <Label htmlFor="isLoginRetriesEnabled">Enable login retry locking</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isPasswordResetAllowed"
                onCheckedChange={(v) => setValue("isPasswordResetAllowed", v)}
                defaultChecked={user?.isPasswordResetAllowed ?? true}
              />
              <Label htmlFor="isPasswordResetAllowed">Allow password reset</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserFormPage;
