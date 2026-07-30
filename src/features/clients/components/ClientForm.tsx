import { useWatch, useForm } from "react-hook-form";
import type { FC } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientSchema, type CreateClientFormValues } from "../schemas/client.schema";
import type { ClientTemplate, Client } from "../types/client";

function normalizeDateForForm(value: unknown): string {
  if (!value) return "";
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d] = value;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  if (typeof value === "string") {
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

const ClientForm: FC<ClientFormProps> = ({ template, client, onSubmit, isSubmitting, error, mode }) => {
  const defaultDate = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    control,
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
      clientTypeId: client?.clientType?.id ?? null,
      clientClassificationId: client?.clientClassification?.id ?? null,
      externalId: client?.externalId ?? "",
      mobileNo: client?.mobileNo ?? "",
      emailAddress: client?.emailAddress ?? "",
      activationDate: normalizeDateForForm(client?.activationDate) || (mode === "create" ? defaultDate : ""),
      submittedOnDate: mode === "create" ? defaultDate : "",
      dateFormat: "yyyy-MM-dd",
      locale: "en",
      active: mode === "create" ? true : (client?.active ?? false),
      isStaff: client?.isStaff ?? false,
      savingsProductId: null,
      accountNo: client?.accountNo ?? "",
      clientNonPersonDetails: undefined,
    },
  });

  const legalFormId = useWatch({ control, name: "legalFormId" });
  const active = useWatch({ control, name: "active" });
  const isPerson = legalFormId === 1 || legalFormId === null || legalFormId === undefined;

  const onFormSubmit = async (values: CreateClientFormValues) => {
    const cleaned: Record<string, unknown> = {
      ...values,
      middlename: values.middlename || undefined,
      fullname: values.fullname || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      externalId: values.externalId || undefined,
      mobileNo: values.mobileNo || undefined,
      emailAddress: values.emailAddress || undefined,
      activationDate: mode === "edit" && !values.activationDate ? undefined : values.activationDate || undefined,
      staffId: values.staffId ?? undefined,
      genderId: values.genderId ?? undefined,
      legalFormId: values.legalFormId ?? undefined,
      groupId: values.groupId ?? undefined,
      savingsProductId: values.savingsProductId ?? undefined,
      clientTypeId: values.clientTypeId ?? undefined,
      clientClassificationId: values.clientClassificationId ?? undefined,
      accountNo: values.accountNo || undefined,
      isStaff: values.isStaff || undefined,
    };

    if (values.clientNonPersonDetails) {
      const npd = values.clientNonPersonDetails;
      cleaned.clientNonPersonDetails = {
        constitutionId: npd.constitutionId ?? undefined,
        incorpNumber: npd.incorpNumber || undefined,
        mainBusinessLineId: npd.mainBusinessLineId ?? undefined,
        remarks: npd.remarks || undefined,
        incorpValidityTillDate: npd.incorpValidityTillDate || undefined,
      };
    }

    if (isPerson) {
      delete cleaned.fullname;
    } else {
      delete cleaned.firstname;
      delete cleaned.middlename;
      delete cleaned.lastname;
    }

    await onSubmit(cleaned as CreateClientFormValues);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Section 1: Legal Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legal Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={isPerson ? "default" : "outline"}
              className={isPerson ? "bg-[#D32F2F] hover:bg-red-700" : ""}
              onClick={() => setValue("legalFormId", 1, { shouldValidate: true })}
              disabled={isSubmitting}
            >
              Person
            </Button>
            <Button
              type="button"
              variant={!isPerson ? "default" : "outline"}
              className={!isPerson ? "bg-[#D32F2F] hover:bg-red-700" : ""}
              onClick={() => setValue("legalFormId", 2, { shouldValidate: true })}
              disabled={isSubmitting}
            >
              Entity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium" htmlFor="officeId">
              Office *
            </label>
            <Select
              disabled={isSubmitting || mode === "edit"}
              value={client?.officeId ? String(client.officeId) : undefined}
              onValueChange={(v) => setValue("officeId", Number(v), { shouldValidate: true })}
            >
              <SelectTrigger className={errors.officeId ? "border-red-300" : ""}>
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
            {errors.officeId && <p className="text-xs text-red-500">{errors.officeId.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium">Staff (Loan Officer)</label>
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
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Account No</label>
            <Input
              {...register("accountNo")}
              disabled={isSubmitting}
              placeholder="Auto-generated if empty"
              maxLength={20}
              error={errors.accountNo?.message}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">External ID</label>
            <Input {...register("externalId")} disabled={isSubmitting} maxLength={100} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium">Client Type</label>
            <Select
              disabled={isSubmitting}
              onValueChange={(v) => setValue("clientTypeId", v === "" ? null : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {template?.clientTypeOptions?.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium">Client Classification</label>
            <Select
              disabled={isSubmitting}
              onValueChange={(v) => setValue("clientClassificationId", v === "" ? null : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {template?.clientClassificationOptions?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Name (changes based on Legal Form) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isPerson ? "Person Name" : "Entity Name"}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isPerson ? (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">First Name *</label>
                <Input {...register("firstname")} disabled={isSubmitting} error={errors.firstname?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Middle Name</label>
                <Input {...register("middlename")} disabled={isSubmitting} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Last Name *</label>
                <Input {...register("lastname")} disabled={isSubmitting} error={errors.lastname?.message} />
              </div>
            </>
          ) : (
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium">Full Name *</label>
              <Input
                {...register("fullname")}
                disabled={isSubmitting}
                placeholder="Organization name"
                error={errors.fullname?.message}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Mobile No</label>
            <Input
              {...register("mobileNo")}
              disabled={isSubmitting}
              placeholder="+1234567890"
              error={errors.mobileNo?.message}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Email Address</label>
            <Input
              type="email"
              {...register("emailAddress")}
              disabled={isSubmitting}
              placeholder="client@example.com"
              error={errors.emailAddress?.message}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Date of Birth</label>
            <Input type="date" {...register("dateOfBirth")} disabled={isSubmitting} />
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demographics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="block text-sm font-medium">Gender</label>
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
          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="isStaff"
              disabled={isSubmitting}
              onCheckedChange={(v) => setValue("isStaff", v)}
              defaultChecked={client?.isStaff ?? false}
            />
            <label className="block text-sm font-medium" htmlFor="isStaff">
              Is Staff?
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Activation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="active"
              disabled={isSubmitting || mode === "edit"}
              onCheckedChange={(v) => setValue("active", v)}
              defaultChecked={mode === "create" ? true : (client?.active ?? false)}
            />
            <Label htmlFor="active">Active (required)</Label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {mode === "create" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Submitted On Date</label>
                <Input type="date" {...register("submittedOnDate")} disabled={isSubmitting} />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Activation Date {active ? "*" : ""}</label>
              <Input
                type="date"
                {...register("activationDate")}
                disabled={isSubmitting}
                error={errors.activationDate?.message}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Entity Details (only when Legal Form = Entity) */}
      {!isPerson && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entity Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">Constitution</label>
              <Select
                disabled={isSubmitting}
                onValueChange={(v) => setValue("clientNonPersonDetails.constitutionId", v === "" ? null : Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select constitution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {template?.clientNonPersonConstitutionOptions?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Incorporation Number</label>
              <Input {...register("clientNonPersonDetails.incorpNumber")} disabled={isSubmitting} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">Main Business Line</label>
              <Select
                disabled={isSubmitting}
                onValueChange={(v) =>
                  setValue("clientNonPersonDetails.mainBusinessLineId", v === "" ? null : Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business line" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {template?.clientNonPersonMainBusinessLineOptions?.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="block text-sm font-medium">Remarks</label>
              <Input {...register("clientNonPersonDetails.remarks")} disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Incorporation Validity Till</label>
              <Input
                type="date"
                {...register("clientNonPersonDetails.incorpValidityTillDate")}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 8: Financial */}
      {template?.savingsProductOptions && template.savingsProductOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5 max-w-xs">
              <label className="block text-sm font-medium">Savings Product</label>
              <Select
                disabled={isSubmitting}
                onValueChange={(v) => setValue("savingsProductId", v === "" ? null : Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (skip)" />
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 9: Group */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Group</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-w-xs">
            <label className="block text-sm font-medium">Group ID</label>
            <Input
              type="number"
              {...register("groupId", { valueAsNumber: true })}
              disabled={isSubmitting}
              placeholder="Optional group ID"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
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
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
