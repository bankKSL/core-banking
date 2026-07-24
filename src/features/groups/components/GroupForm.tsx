import { type FC, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Office } from "@/types";
import { createGroupSchema, type CreateGroupFormValues } from "../schemas/group.schema";
import type { GroupDetail } from "../types/group";
import { currentDate } from "@/lib/utils";

interface GroupFormProps {
  offices: Office[];
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
  offices,
  group,
  originalActive,
  mode,
  onSubmit,
  onActivate,
  isSubmitting,
  isActivating = false,
  error,
}) => {
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
          <CardTitle>{isEditMode ? "Group Details" : "New Group"}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Group Name — the only field editable in edit mode */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name", { required: "Group name is required" })}
              disabled={isSubmitting}
              placeholder="e.g. Sunrise Self-Help Group"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Office — disabled in edit mode (a group's office cannot change) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="officeId">
              Office <span className="text-red-500">*</span>
            </Label>
            <Select
              value={officeId ? String(officeId) : ""}
              onValueChange={(v) => setValue("officeId", Number(v), { shouldValidate: true })}
              disabled={isEditMode || isSubmitting}
            >
              <SelectTrigger id="officeId">
                <SelectValue placeholder="Select an office" />
              </SelectTrigger>
              <SelectContent>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={String(office.id)}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.officeId && <p className="text-xs text-red-500">{errors.officeId.message}</p>}
          </div>

          {/* External ID — create mode only */}
          {!isEditMode && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="externalId">External ID</Label>
              <Input id="externalId" {...register("externalId")} disabled={isSubmitting} placeholder="Optional" />
              {errors.externalId && <p className="text-xs text-red-500">{errors.externalId.message}</p>}
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
            <Label htmlFor="active" className="cursor-pointer">
              Active
            </Label>
          </div>

          {/* Activation Date — create: shown, required when active; edit: only for the Activate action on pending groups */}
          {((!isEditMode && active) || showActivate) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activationDate">
                Activation Date <span className="text-red-500">*</span>
              </Label>
              <Input id="activationDate" type="date" {...register("activationDate")} disabled={isSubmitting} />
              {errors.activationDate && <p className="text-xs text-red-500">{errors.activationDate.message}</p>}
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
              {isEditMode ? "Saving..." : "Creating..."}
            </span>
          ) : isEditMode ? (
            "Save Changes"
          ) : (
            "Create Group"
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
                Activating...
              </span>
            ) : (
              "Activate Group"
            )}
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting || isActivating}
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default GroupForm;
export type { GroupFormProps };
