import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createClientSchema,
  type CreateClientFormValues,
} from "../schemas/client.schema";
import type { ClientTemplate, Client } from "../types/client";

/** Normalize a date value from Fineract (string or number[]) to yyyy-MM-dd string for form inputs */
function normalizeDateForForm(value: unknown): string {
  if (!value) return "";
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d] = value;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  if (typeof value === "string") {
    // Strip time portion if ISO
    return value.split("T")[0];
  }
  return "";
}

interface ClientFormProps {
  template?: ClientTemplate;
  client?: Client;
  onSubmit: (values: CreateClientFormValues) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
  mode: "create" | "edit";
}

const ClientForm: FC<ClientFormProps> = ({
  template,
  client,
  onSubmit,
  isSubmitting,
  error,
  mode,
}) => {
  const defaultDate = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      firstname: client?.firstname ?? "",
      middlename: client?.middlename ?? "",
      lastname: client?.lastname ?? "",
      fullname: client?.fullname ?? "",
      officeId: client?.officeId ?? undefined,
      staffId: client?.staffId ?? null,
      groupId: null,
      dateOfBirth: normalizeDateForForm(client?.dateOfBirth),
      genderId: client?.gender?.id ?? null,
      legalFormId: client?.legalForm?.id ?? (mode === "create" ? 1 : null),
      externalId: client?.externalId ?? "",
      mobileNo: client?.mobileNo ?? "",
      emailAddress: client?.emailAddress ?? "",
      activationDate:
        normalizeDateForForm(client?.activationDate) ||
        (mode === "create" ? defaultDate : ""),
      submittedOnDate: mode === "create" ? defaultDate : "",
      dateFormat: "yyyy-MM-dd",
      locale: "en",
      active: mode === "create" ? true : (client?.active ?? false),
      savingsProductId: null,
    },
  });

  const onFormSubmit = async (values: CreateClientFormValues) => {
    const cleaned = {
      ...values,
      middlename: values.middlename || undefined,
      fullname: values.fullname || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      externalId: values.externalId || undefined,
      mobileNo: values.mobileNo || undefined,
      emailAddress: values.emailAddress || undefined,
      activationDate:
        mode === "edit" && !values.activationDate
          ? undefined
          : values.activationDate || undefined,
      staffId: values.staffId ?? undefined,
      genderId: values.genderId ?? undefined,
      legalFormId: values.legalFormId ?? undefined,
      groupId: values.groupId ?? undefined,
      savingsProductId: values.savingsProductId ?? undefined,
    };
    await onSubmit(cleaned as CreateClientFormValues);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      noValidate
      className="space-y-8"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstname">First Name *</Label>
            <Input
              id="firstname"
              {...register("firstname")}
              disabled={isSubmitting}
              className={errors.firstname ? "border-red-300" : ""}
            />
            {errors.firstname && (
              <p className="text-xs text-red-500">{errors.firstname.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="middlename">Middle Name</Label>
            <Input
              id="middlename"
              {...register("middlename")}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastname">Last Name *</Label>
            <Input
              id="lastname"
              {...register("lastname")}
              disabled={isSubmitting}
              className={errors.lastname ? "border-red-300" : ""}
            />
            {errors.lastname && (
              <p className="text-xs text-red-500">{errors.lastname.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullname">Full Name</Label>
            <Input
              id="fullname"
              {...register("fullname")}
              disabled={isSubmitting}
              placeholder="Required for organizations"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register("dateOfBirth")}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Gender</Label>
            <Select
              disabled={isSubmitting}
              value={client?.gender?.id ? String(client.gender.id) : undefined}
              onValueChange={(v) => setValue("genderId", Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {template?.genderOptions?.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="officeId">Office *</Label>
            <Select
              disabled={isSubmitting || mode === "edit"}
              value={client?.officeId ? String(client.officeId) : undefined}
              onValueChange={(v) => setValue("officeId", Number(v))}
            >
              <SelectTrigger
                className={errors.officeId ? "border-red-300" : ""}
              >
                <SelectValue placeholder="Select office" />
              </SelectTrigger>
              <SelectContent>
                {template?.officeOptions?.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.officeId && (
              <p className="text-xs text-red-500">{errors.officeId.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Staff</Label>
            <Select
              disabled={isSubmitting}
              value={client?.staffId ? String(client.staffId) : undefined}
              onValueChange={(v) => setValue("staffId", Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                {template?.staffOptions?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Savings Product — Section 5: optional, omit if no products exist */}
      {template?.savingsProductOptions &&
        template.savingsProductOptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Savings Product (optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Default Savings Product</Label>
                <Select
                  disabled={isSubmitting}
                  onValueChange={(v) =>
                    setValue("savingsProductId", v === "" ? null : Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None — skip to omit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (skip)</SelectItem>
                    {template.savingsProductOptions.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-gray-400">
                  Optional. Omit if you don't need a default savings product.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      {template?.savingsProductOptions &&
        template.savingsProductOptions.length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            No savings products available.{" "}
            <a href="/deposits/products" className="underline font-medium">
              Create one first
            </a>{" "}
            or skip this field — it's optional.
          </div>
        )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mobileNo">Mobile Number</Label>
            <Input
              id="mobileNo"
              {...register("mobileNo")}
              disabled={isSubmitting}
              placeholder="+1234567890"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emailAddress">Email</Label>
            <Input
              id="emailAddress"
              type="email"
              {...register("emailAddress")}
              disabled={isSubmitting}
              placeholder="client@example.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="externalId">External ID</Label>
            <Input
              id="externalId"
              {...register("externalId")}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activation</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {mode === "create" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="submittedOnDate">Submitted On</Label>
              <Input
                id="submittedOnDate"
                type="date"
                {...register("submittedOnDate")}
                disabled={isSubmitting}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activationDate">Activation Date</Label>
            <Input
              id="activationDate"
              type="date"
              {...register("activationDate")}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#D32F2F] hover:bg-red-700"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </span>
          ) : mode === "create" ? (
            "Create Client"
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
