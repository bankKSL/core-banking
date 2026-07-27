import { type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOwnerSchema, type CreateOwnerFormValues } from "../schemas/externalAssetOwner.schema";
import { useCreateExternalAssetOwner } from "../hooks/useExternalAssetOwners";

const ExternalAssetOwnerFormPage: FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateExternalAssetOwner();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateOwnerFormValues>({
    resolver: zodResolver(createOwnerSchema),
    defaultValues: {
      ownerExternalId: "",
    },
  });

  const onSubmit = async (values: CreateOwnerFormValues) => {
    await createMutation.mutateAsync({ ownerExternalId: values.ownerExternalId });
    navigate("/external-asset-owners/owners");
  };

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title="Create External Asset Owner"
        description="Register a new external investor"
        actions={
          <Button variant="outline" onClick={() => navigate("/external-asset-owners/owners")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Owner Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ownerExternalId">Owner External ID *</Label>
              <Input
                id="ownerExternalId"
                {...register("ownerExternalId")}
                placeholder="e.g. 36efeb06-d835-48a1-99eb-09bd1d348c1e"
              />
              {errors.ownerExternalId && <p className="text-xs text-red-500 mt-1">{errors.ownerExternalId.message}</p>}
              <p className="text-xs text-gray-500 mt-1">
                A unique identifier for the external investor. This cannot be changed after creation.
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/external-asset-owners/owners")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Create Owner
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExternalAssetOwnerFormPage;
