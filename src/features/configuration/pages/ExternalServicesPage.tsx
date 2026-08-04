import { type FC, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Globe } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExternalService, useUpdateExternalService } from "../hooks/useConfiguration";

const SERVICE_NAMES = ["S3", "SMTP", "SMS", "NOTIFICATION"];

const SENSITIVE_FIELDS = ["password", "secretKey", "secret_key", "authToken", "auth_token"];

const ExternalServicesPage: FC = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(SERVICE_NAMES[0]);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());

  const { data: service, isLoading } = useExternalService(selectedService);
  const updateMutation = useUpdateExternalService();

  const { register, handleSubmit, reset } = useForm<Record<string, string>>({
    defaultValues: {} as Record<string, string>,
  });

  useEffect(() => {
    if (service?.properties) {
      const values: Record<string, string> = {};
      service.properties.forEach((p) => {
        values[p.name] = p.value ?? "";
      });
      reset(values);
      setVisibleFields(new Set());
    }
  }, [service, reset]);

  const toggleVisibility = (name: string) => {
    setVisibleFields((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const isSensitive = (name: string) => SENSITIVE_FIELDS.some((f) => name.toLowerCase().includes(f.toLowerCase()));

  const onSubmit = async (values: Record<string, string>) => {
    await updateMutation.mutateAsync({
      serviceName: selectedService,
      payload: values,
    });
  };

  const properties = service?.properties ?? [];

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title="External Services"
        description="Configure S3, SMTP, SMS, and Notification service integrations"
        actions={
          <Button variant="outline" onClick={() => navigate("/configuration")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {updateMutation.isError && (
        <ErrorState
          title="Failed to save configuration"
          message={
            updateMutation.error instanceof Error ? updateMutation.error.message : "An unexpected error occurred."
          }
          onRetry={() => updateMutation.reset()}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Service Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Service</label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {properties.length === 0 && (
                  <p className="text-sm text-gray-500">Select a service to view its configuration.</p>
                )}
                {properties.map((p) => {
                  const sensitive = isSensitive(p.name);
                  const visible = visibleFields.has(p.name);
                  return (
                    <div key={p.name} className="space-y-1.5">
                      <label className="block text-sm font-medium">
                        {p.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </label>
                      <div className="relative">
                        <Input type={sensitive && !visible ? "password" : "text"} {...register(p.name)} />
                        {sensitive && (
                          <button
                            type="button"
                            onClick={() => toggleVisibility(p.name)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {properties.length > 0 && (
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={updateMutation.isPending} className="bg-[#D32F2F] hover:bg-red-700">
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default ExternalServicesPage;
