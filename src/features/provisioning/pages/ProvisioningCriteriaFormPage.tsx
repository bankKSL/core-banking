import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProvisioningCriteria,
  useProvisioningCriteriaTemplate,
  useCreateProvisioningCriteria,
  useUpdateProvisioningCriteria,
} from "../hooks/useProvisioning";
import type { ProvisioningCategory } from "../api/provisioning";

interface CategoryConfig {
  categoryId: number;
  percentage: string;
}

const ProvisioningCriteriaFormPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: template, isLoading: templateLoading } = useProvisioningCriteriaTemplate();
  const { data: existingCriteria, isLoading: criteriaLoading } = useProvisioningCriteria(id ? Number(id) : undefined);

  const createMutation = useCreateProvisioningCriteria();
  const updateMutation = useUpdateProvisioningCriteria();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [criteriaName, setCriteriaName] = useState("");
  const [selectedLoanProductIds, setSelectedLoanProductIds] = useState<number[]>([]);
  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>([]);

  const categories = template?.categories ?? [];

  useEffect(() => {
    if (!existingCriteria) return;
    setCriteriaName(existingCriteria.criteriaName);
    setSelectedLoanProductIds(existingCriteria.loanProducts?.map((lp) => lp.id) ?? []);
  }, [existingCriteria]);

  useEffect(() => {
    if (categories.length > 0 && categoryConfigs.length === 0 && !isEdit) {
      setCategoryConfigs(
        categories.map((c: ProvisioningCategory) => ({
          categoryId: c.id,
          percentage: "",
        })),
      );
    }
  }, [categories, categoryConfigs.length, isEdit]);

  const loanProducts = template?.loanProducts ?? [];

  const handleLoanProductToggle = (productId: number) => {
    setSelectedLoanProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const handleCategoryPercentageChange = (categoryId: number, value: string) => {
    setCategoryConfigs((prev) =>
      prev.map((cfg) => (cfg.categoryId === categoryId ? { ...cfg, percentage: value } : cfg)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!criteriaName.trim()) return;
    setMutationError(null);

    try {
      const payload: Record<string, unknown> = {
        criteriaName: criteriaName.trim(),
        loanProducts: selectedLoanProductIds,
        provisioningCategoryConfigurations: categoryConfigs
          .filter((cfg) => cfg.percentage !== "" && cfg.percentage !== "0")
          .map((cfg) => ({
            categoryId: cfg.categoryId,
            percentage: Number(cfg.percentage),
          })),
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/provisioning/criterias");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
      const msg = error?.response?.data?.errors?.[0]?.defaultUserMessage ?? t("Failed to save provisioning criteria.");
      setMutationError(msg);
    }
  };

  const isLoading = templateLoading || (isEdit && criteriaLoading);

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl m-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Provisioning Criteria") : t("New Provisioning Criteria")}
        description={isEdit ? t("Update criteria details") : t("Create new provisioning criteria")}
        actions={
          <Button variant="outline" onClick={() => navigate("/provisioning/criterias")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      {mutationError && <ErrorState message={mutationError} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("Basic Information")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              label={t("Criteria Name *")}
              placeholder={t("Enter criteria name")}
              value={criteriaName}
              onChange={(e) => setCriteriaName(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Loan Products")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loanProducts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("No loan products available.")}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {loanProducts.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <Checkbox
                      checked={selectedLoanProductIds.includes(product.id)}
                      onCheckedChange={() => handleLoanProductToggle(product.id)}
                    />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.currency?.code}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Categories Configuration")}</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("No categories available. Create provisioning categories first.")}
              </p>
            ) : (
              <div className="space-y-3">
                {categories.map((cat) => {
                  const config = categoryConfigs.find((c) => c.categoryId === cat.id);
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                    >
                      <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cat.categoryName}
                      </span>
                      <div className="w-40">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder={t("Percentage")}
                          value={config?.percentage ?? ""}
                          onChange={(e) => handleCategoryPercentageChange(cat.id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/provisioning/criterias")}>
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Saving…")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? t("Update Criteria") : t("Create Criteria")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProvisioningCriteriaFormPage;