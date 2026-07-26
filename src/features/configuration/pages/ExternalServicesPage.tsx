import { type FC, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Globe } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExternalService, useUpdateExternalService } from "../hooks/useConfiguration";

const SERVICE_NAMES = ["S3", "SMTP", "SMS", "NOTIFICATION"];

const SENSITIVE_FIELDS = ["password", "secretKey", "secret_key", "authToken", "auth_token"];

const ExternalServicesPage: FC = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(SERVICE_NAMES[0]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());

  const { data: service, isLoading } = useExternalService(selectedService);

  useEffect(() => {
    if (service?.properties) {
      const values: Record<string, string> = {};
      service.properties.forEach((p) => {
        values[p.name] = p.value ?? "";
      });
      setFormValues(values);
      setVisibleFields(new Set());
    }
  }, [service]);

  const handleChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const toggleVisibility = (name: string) => {
    setVisibleFields((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const updateMutation = useUpdateExternalService();

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      serviceName: selectedService,
      payload: formValues,
    });
  };

  const isSensitive = (name: string) => SENSITIVE_FIELDS.some((f) => name.toLowerCase().includes(f.toLowerCase()));

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Service Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Service</Label>
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
              {Object.keys(formValues).length === 0 && (
                <p className="text-sm text-gray-500">Select a service to view its configuration.</p>
              )}
              {Object.entries(formValues).map(([name, value]) => {
                const sensitive = isSensitive(name);
                const visible = visibleFields.has(name);
                return (
                  <div key={name}>
                    <Label htmlFor={`field-${name}`}>
                      {name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Label>
                    <div className="relative">
                      <Input
                        id={`field-${name}`}
                        type={sensitive && !visible ? "password" : "text"}
                        value={value}
                        onChange={(e) => handleChange(name, e.target.value)}
                      />
                      {sensitive && (
                        <button
                          type="button"
                          onClick={() => toggleVisibility(name)}
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

          {Object.keys(formValues).length > 0 && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-[#D32F2F] hover:bg-red-700"
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExternalServicesPage;
