import { type FC, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfficeSelect } from "@/components/shared/OfficeSelect";
import { createGroupSchema, type CreateGroupFormValues } from "../schemas/group.schema";
import type { GroupDetail } from "../types/group";
import { currentDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface GroupFormProps {
  group?: GroupDetail;
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
      officeId: 0,
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
        officeId: group.officeId ?? 0,
        externalId: group.externalId ?? "",
        active: originalActive,
        activationDate: currentDate(),
        dateFormat: "yyyy-MM-dd",
        locale: "en",
      });
    }
  }, [isEditMode, group, originalActive, reset]);

  const active = watch("active");
  const officeId = watch("officeId");
  const activationDate = watch("activationDate");

  // Activate is offered only in edit mode while the persisted group is pending
  const showActivate = useMemo(() => isEditMode && !originalActive, [isEditMode, originalActive]);

  const handleActivate = async () => {
    if (!onActivate || !activationDate) return;
    await onActivate(activationDate);
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
          />

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
