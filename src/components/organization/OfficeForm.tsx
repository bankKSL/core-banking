import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { officeCreateSchema, type OfficeCreateFormData } from "@/lib/validations/office";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OfficeSelect } from "@/components/shared/OfficeSelect";

interface OfficeFormProps {
  defaultValues?: Partial<OfficeCreateFormData>;
  onSubmit: (data: OfficeCreateFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const OfficeForm: React.FC<OfficeFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OfficeCreateFormData>({
    resolver: zodResolver(officeCreateSchema),
    defaultValues: {
      name: "",
      parentId: undefined,
      openingDate: "",
      externalId: "",
      ...defaultValues,
    },
  });

  const parentId = watch("parentId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="text-sm font-medium">Office Name *</label>
        <Input className="mt-1" placeholder="e.g. Head Office" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <OfficeSelect
        value={parentId?.toString() ?? ""}
        onChange={(v) => setValue("parentId", v ? Number(v) : undefined, { shouldValidate: true })}
        includeNone="None (root office)"
        label="Parent Office"
        disabled={isSubmitting}
      />

      {/* Opening Date */}
      <div>
        <label className="text-sm font-medium">Opening Date *</label>
        <Input className="mt-1" type="date" {...register("openingDate")} />
        {errors.openingDate && <p className="mt-1 text-xs text-red-500">{errors.openingDate.message}</p>}
      </div>

      {/* External ID */}
      <div>
        <label className="text-sm font-medium">External ID</label>
        <Input className="mt-1" placeholder="e.g. EXT-001" {...register("externalId")} />
        {errors.externalId && <p className="mt-1 text-xs text-red-500">{errors.externalId.message}</p>}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : defaultValues?.name ? "Save Changes" : "Create Office"}
        </Button>
      </div>
    </form>
  );
};

export default OfficeForm;
