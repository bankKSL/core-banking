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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { OfficeSelect } from "@/components/shared/OfficeSelect";
import { useTeller, useCreateTeller, useUpdateTeller, TELLER_STATUS_OPTIONS } from "../index";

const tellerSchema = z.object({
  officeId: z.string().min(1, "Office is required"),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  status: z.string().min(1, "Status is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

type TellerFormValues = z.infer<typeof tellerSchema>;

const TellerFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: teller, isLoading: tellerLoading } = useTeller(id);
  const createMutation = useCreateTeller();
  const updateMutation = useUpdateTeller();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TellerFormValues>({
    resolver: zodResolver(tellerSchema) as any,
    defaultValues: {
      officeId: "",
      name: "",
      description: "",
      status: "300",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    },
  });

  useEffect(() => {
    if (!teller) return;
    reset({
      officeId: String(teller.officeId),
      name: teller.name,
      description: teller.description ?? "",
      status: String(teller.status),
      startDate: teller.startDate ? teller.startDate.split("T")[0] : "",
      endDate: teller.endDate ? teller.endDate.split("T")[0] : "",
    });
  }, [teller, reset]);

  const onSubmit = async (values: TellerFormValues) => {
    const payload = {
      officeId: Number(values.officeId),
      name: values.name,
      description: values.description || undefined,
      status: Number(values.status) as any,
      startDate: values.startDate,
      endDate: values.endDate || undefined,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    };
    if (isEdit) {
      await updateMutation.mutateAsync({ tellerId: id!, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate("/tellers");
  };

  if (isEdit && tellerLoading) {
    return (
      <div className="p-6 max-w-lg m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Teller" : "Create Teller"}
        description={isEdit ? `Editing teller #${id}` : "Register a new teller counter"}
        actions={
          <Button variant="outline" onClick={() => navigate("/tellers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Teller Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OfficeSelect
              value={watch("officeId")}
              onChange={(v) => setValue("officeId", v, { shouldValidate: true })}
              error={errors.officeId?.message}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Teller Name *</label>
              <Input {...register("name")} placeholder="e.g. Main Branch Teller 1" error={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} placeholder="Optional description" rows={2} />
            </div>
            <div>
              <Label>Status *</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {TELLER_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Start Date *</label>
                <Input type="date" {...register("startDate")} error={errors.startDate?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">End Date</label>
                <Input type="date" {...register("endDate")} />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/tellers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Save Changes" : "Create Teller"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TellerFormPage;
