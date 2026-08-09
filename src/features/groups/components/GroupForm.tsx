import { type FC, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OfficeSelect } from "@/components/shared/OfficeSelect";
import { createGroupSchema, type CreateGroupFormValues } from "../schemas/group.schema";
import type { GroupDetail, GroupTemplate } from "../types/group";
import { currentDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface GroupFormProps {
  group?: GroupDetail;
  template?: GroupTemplate;
  /** Persisted `active` flag read from the raw server response */
  originalActive: boolean;
  mode: "create" | "edit";
  onSubmit: (values: CreateGroupFormValues) => Promise<void>;
  onActivate?: (activationDate: string) => Promise<void>;
  isSubmitting: boolean;
  isActivating?: boolean;
  error?: string | null;
}

/**
 * Single form handling three operations (mirrors the reference GroupFormComponent):
 *  - create   → name, office, active, activationDate
 *  - edit     → name only (office + active disabled)
 *  - activate → separate action, rendered when editing a pending group
 */
const GroupForm: FC<GroupFormProps> = ({
  group,
  template,
  originalActive,
  mode,
  onSubmit,
  onActivate,
  isSubmitting,
  isActivating = false,
  error,
}) => {
  const { t } = useTranslation();
  const isEditMode = mode === "edit";
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateGroupFormValues, unknown, CreateGroupFormValues>({
    resolver: isEditMode ? undefined : (zodResolver(createGroupSchema) as never),
    defaultValues: {
      name: "",
      officeId: template?.officeId ?? 0,
      staffId: "",
      clientMembers: [],
      externalId: "",
      active: true,
      activationDate: currentDate(),
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    },
  });

  // Populate the form once the group detail loads (edit mode)
  useEffect(() => {
    if (isEditMode && group) {
      reset({
        name: group.name ?? "",
        officeId: group.officeId ?? template?.officeId ?? 0,
        staffId: group.staffId ?? "",
        clientMembers: group.clientMembers?.map((c) => c.id) ?? [],
        externalId: group.externalId ?? "",
        active: originalActive,
        activationDate: currentDate(),
        dateFormat: "yyyy-MM-dd",
        locale: "en",
      });
    } else if (!isEditMode && template?.officeId) {
      reset({
        name: "",
        officeId: template.officeId,
        staffId: "",
        clientMembers: [],
        externalId: "",
        active: true,
        activationDate: currentDate(),
        dateFormat: "yyyy-MM-dd",
        locale: "en",
      });
    }
  }, [isEditMode, group, originalActive, reset, template]);

  const active = watch("active");
  const officeId = watch("officeId");
  const activationDate = watch("activationDate");
  const staffId = watch("staffId");
  const clientMembers = watch("clientMembers") ?? [];

  // Activate is offered only in edit mode while the persisted group is pending
  const showActivate = useMemo(() => isEditMode && !originalActive, [isEditMode, originalActive]);

  const staffOptions = template?.staffOptions ?? [];
  const clientOptions = template?.clientOptions ?? [];

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return clientOptions;
    const q = clientSearchQuery.toLowerCase();
    return clientOptions.filter((c) => c.displayName.toLowerCase().includes(q) || String(c.id).includes(q));
  }, [clientOptions, clientSearchQuery]);

  const handleActivate = async () => {
    if (!onActivate || !activationDate) return;
    await onActivate(activationDate);
  };

  const toggleClient = (clientId: number) => {
    const current = clientMembers;
    if (current.includes(clientId)) {
      setValue(
        "clientMembers",
        current.filter((id) => id !== clientId),
      );
    } else {
      setValue("clientMembers", [...current, clientId]);
    }
  };

  const removeClient = (clientId: number) => {
    setValue(
      "clientMembers",
      clientMembers.filter((id) => id !== clientId),
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? t("Group Details") : t("New Group")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Group Name — the only field editable in edit mode */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Group Name")} *</label>
            <Input
              {...register("name", { required: t("Group name is required") })}
              disabled={isSubmitting}
              placeholder={t("e.g. Sunrise Self-Help Group")}
              error={errors.name?.message}
            />
          </div>

          <OfficeSelect
            value={officeId ? String(officeId) : ""}
            onChange={(v) => setValue("officeId", Number(v), { shouldValidate: true })}
            disabled={isEditMode || isSubmitting}
            error={errors.officeId?.message}
            label={t("Office")}
          />

          {/* Staff dropdown */}
          {!isEditMode && (
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="staffId">
                {t("Staff")}
              </label>
              <Select
                value={staffId ? String(staffId) : ""}
                onValueChange={(v) => setValue("staffId", v ? Number(v) : "")}
                disabled={isSubmitting}
              >
                <SelectTrigger id="staffId">
                  <SelectValue placeholder={t("Select staff")} />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map((staff) => (
                    <SelectItem key={staff.id} value={String(staff.id)}>
                      {staff.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Client multi-select */}
          {!isEditMode && clientOptions.length > 0 && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="block text-sm font-medium">{t("Client Members")}</label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={t("Search clients...")}
                    className="pl-9"
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    onFocus={() => setShowClientDropdown(true)}
                    disabled={isSubmitting}
                  />
                </div>
                {showClientDropdown && (
                  <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => toggleClient(client.id)}
                        >
                          <Checkbox
                            checked={clientMembers.includes(client.id)}
                            onCheckedChange={() => toggleClient(client.id)}
                          />
                          <span className="flex-1">{client.displayName}</span>
                          {client.officeName && <span className="text-xs text-gray-400">({client.officeName})</span>}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-center text-sm text-gray-500">{t("No clients found")}</div>
                    )}
                  </div>
                )}
              </div>
              {clientMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {clientMembers.map((clientId) => {
                    const client = clientOptions.find((c) => c.id === clientId);
                    return client ? (
                      <span
                        key={clientId}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700"
                      >
                        {client.displayName}
                        <button
                          type="button"
                          onClick={() => removeClient(clientId)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          {/* External ID — create mode only */}
          {!isEditMode && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("External ID")}</label>
              <Input
                {...register("externalId")}
                disabled={isSubmitting}
                placeholder={t("Optional")}
                error={errors.externalId?.message}
              />
            </div>
          )}

          {/* Active checkbox — editable on create, disabled on edit */}
          <div className="flex items-center gap-2 pt-6">
            <Checkbox
              id="active"
              checked={isEditMode ? originalActive : active}
              onCheckedChange={(checked) => setValue("active", checked === true)}
              disabled={isEditMode || isSubmitting}
            />
            <label className="block text-sm font-medium cursor-pointer" htmlFor="active">
              {t("Active")}
            </label>
          </div>

          {/* Activation Date — create: shown, required when active; edit: only for the Activate action on pending groups */}
          {((!isEditMode && active) || showActivate) && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Activation Date")} *</label>
              <Input
                type="date"
                {...register("activationDate")}
                disabled={isSubmitting}
                error={errors.activationDate?.message}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || isActivating} className="bg-[#D32F2F] hover:bg-red-700">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditMode ? t("Saving...") : t("Creating...")}
            </span>
          ) : isEditMode ? (
            t("Save Changes")
          ) : (
            t("Create Group")
          )}
        </Button>

        {showActivate && (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isActivating || !activationDate}
            onClick={handleActivate}
            className="border-green-600 text-green-700 hover:bg-green-50 dark:text-green-400"
          >
            {isActivating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("Activating...")}
              </span>
            ) : (
              t("Activate Group")
            )}
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting || isActivating}
          onClick={() => window.history.back()}
        >
          {t("Cancel")}
        </Button>
      </div>
    </form>
  );
};

export default GroupForm;
export type { GroupFormProps };
