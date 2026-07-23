import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { officeCreateSchema, type OfficeCreateFormData } from "@/lib/validations/office";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Office } from "@/types";

interface OfficeFormProps {
  offices: Office[]; // for parent office dropdown
  defaultValues?: Partial<OfficeCreateFormData>;
  onSubmit: (data: OfficeCreateFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const OfficeForm: React.FC<OfficeFormProps> = ({
  offices,
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

      {/* Parent Office */}
      <div>
        <label className="text-sm font-medium">Parent Office</label>
        <Select
          value={parentId?.toString() ?? ""}
          onValueChange={(v) => setValue("parentId", v ? Number(v) : undefined, { shouldValidate: true })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="None (root office)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None (root office)</SelectItem>
            {offices.map((o) => (
              <SelectItem key={o.id} value={o.id.toString()}>
                {o.nameDecorated || o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
