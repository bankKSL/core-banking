import { type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerIdentifierSchema, type RegisterIdentifierFormValues } from "../schemas/interop.schema";
import { useRegisterIdentifier } from "../hooks/useInterop";
import { IDENTIFIER_TYPE_OPTIONS } from "../types/interop";

const PartyRegisterPage: FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegisterIdentifier();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterIdentifierFormValues>({
    resolver: zodResolver(registerIdentifierSchema),
    defaultValues: {
      idType: "MSISDN",
      idValue: "",
      accountId: "",
      subIdOrType: "",
    },
  });

  const onSubmit = async (values: RegisterIdentifierFormValues) => {
    await registerMutation.mutateAsync({
      idType: values.idType,
      idValue: values.idValue,
      payload: { accountId: values.accountId },
      subIdOrType: values.subIdOrType || undefined,
    });
    navigate("/interop/party/search");
  };

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title="Register Identifier"
        description="Link a secondary identifier (MSISDN, email, IBAN, etc.) to a savings account"
        actions={
          <Button variant="outline" onClick={() => navigate("/interop/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Identifier Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Identifier Type *</Label>
                <Select onValueChange={(v) => setValue("idType", v, { shouldValidate: true })} defaultValue="MSISDN">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {IDENTIFIER_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.idType && <p className="text-xs text-red-500 mt-1">{errors.idType.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Identifier Value *</label>
                <Input {...register("idValue")} placeholder="e.g. 254700111222" error={errors.idValue?.message} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Account External ID *</label>
              <Input {...register("accountId")} placeholder="e.g. ext-uuid-account-id" error={errors.accountId?.message} />
              <p className="text-xs text-gray-500">
                The external ID of the savings account to link this identifier to.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Sub Type (Optional)</label>
              <Input {...register("subIdOrType")} placeholder="Optional sub-type" />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/interop/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Register Identifier
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PartyRegisterPage;
