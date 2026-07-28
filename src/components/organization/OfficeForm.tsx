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
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Office Name *</label>
        <Input placeholder="e.g. Head Office" {...register("name")} error={errors.name?.message} />
      </div>

      <OfficeSelect
        value={parentId?.toString() ?? ""}
        onChange={(v) => setValue("parentId", v ? Number(v) : undefined, { shouldValidate: true })}
        includeNone="None (root office)"
        label="Parent Office"
        disabled={isSubmitting}
      />

      {/* Opening Date */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">Opening Date *</label>
        <Input type="date" {...register("openingDate")} error={errors.openingDate?.message} />
      </div>

      {/* External ID */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">External ID</label>
        <Input placeholder="e.g. EXT-001" {...register("externalId")} error={errors.externalId?.message} />
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
