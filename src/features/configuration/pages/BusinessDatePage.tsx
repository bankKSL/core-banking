import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessDates, useUpdateBusinessDate } from "../hooks/useConfiguration";

const businessDateSchema = z.object({
  editDate: z.string().min(1, "Date is required"),
});

type BusinessDateFormValues = z.infer<typeof businessDateSchema>;

const BusinessDatePage: FC = () => {
  const navigate = useNavigate();
  const { data: businessDates = [], isLoading } = useBusinessDates();
  const updateMutation = useUpdateBusinessDate();
  const [editType, setEditType] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessDateFormValues>({
    resolver: zodResolver(businessDateSchema),
    defaultValues: {
      editDate: "",
    },
  });

  const handleEdit = (type: string, currentDate: string) => {
    setEditType(type);
    reset({ editDate: currentDate });
  };

  const onSubmit = async (values: BusinessDateFormValues) => {
    if (!editType) return;
    await updateMutation.mutateAsync({
      type: editType,
      date: values.editDate,
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    });
    setEditType(null);
  };

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title="Business Date"
        description="View and update system business dates"
        actions={
          <Button variant="outline" onClick={() => navigate("/configuration")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {updateMutation.isError && (
        <ErrorState
          title="Failed to update business date"
          message={
            updateMutation.error instanceof Error ? updateMutation.error.message : "An unexpected error occurred."
          }
          onRetry={() => updateMutation.reset()}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Business Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : businessDates.length === 0 ? (
            <p className="text-sm text-gray-500">No business dates configured.</p>
          ) : (
            <div className="space-y-4">
              {businessDates.map((bd) => (
                <div
                  key={bd.type}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div>
                    <Badge variant="info" size="sm" className="mb-1">
                      {bd.type}
                    </Badge>
                    <p className="text-sm font-mono">{bd.date}</p>
                    {bd.description && <p className="text-xs text-gray-500 mt-0.5">{bd.description}</p>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(bd.type, bd.date)}>
                    Update
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editType && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update {editType}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Date</label>
                <Input type="date" {...register("editDate")} error={errors.editDate?.message} />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditType(null);
                    reset({ editDate: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="bg-[#D32F2F] hover:bg-red-700">
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
};

export default BusinessDatePage;
