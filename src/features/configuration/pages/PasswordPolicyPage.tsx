import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePasswordPreferences, usePasswordPolicies, useUpdatePasswordPreference } from "../hooks/useConfiguration";

const PasswordPolicyPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: activePolicies = [], isLoading: prefsLoading } = usePasswordPreferences();
  const { data: allPolicies = [], isLoading: templatesLoading } = usePasswordPolicies();
  const updateMutation = useUpdatePasswordPreference();
  const [activatingId, setActivatingId] = useState<number | null>(null);

  const activePolicyId = activePolicies?.find((p) => p.active)?.id;

  const handleActivate = async (policyId: number) => {
    setActivatingId(policyId);
    await updateMutation.mutateAsync(policyId);
    setActivatingId(null);
  };

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={t("Password Policy")}
        description={t("View and change the active password validation policy")}
        actions={
          <Button variant="outline" onClick={() => navigate("/configuration")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Back")}
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {t("Active Policy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prefsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div>
              {activePolicies
                .filter((p) => p.active)
                .map((p) => (
                  <div key={p.id} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Available Policies")}</CardTitle>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : allPolicies.length === 0 ? (
            <p className="text-sm text-gray-500">{t("No password policies available.")}</p>
          ) : (
            <div className="space-y-3">
              {allPolicies.map((policy) => {
                const isActive = policy.id === activePolicyId;
                return (
                  <div
                    key={policy.id}
                    className={`flex items-start justify-between p-4 rounded-lg border ${
                      isActive
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{policy.name}</span>
                        {isActive && (
                          <Badge variant="success" size="sm">
                            {t("Active")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{policy.description}</p>
                    </div>
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(policy.id)}
                        disabled={updateMutation.isPending}
                      >
                        {activatingId === policy.id ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Activate")}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordPolicyPage;
