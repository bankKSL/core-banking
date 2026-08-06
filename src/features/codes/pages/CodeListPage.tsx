import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { useCodes } from "../hooks/useCodes";
import type { Code } from "../api/codes";

const CodeListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: codes = [], isLoading, isError, refetch } = useCodes();

  const columns: ColumnDef<Code>[] = useMemo(
    () => [
      {
        key: "name",
        header: t("Code Name"),
        accessorFn: (row) => (
          <span className="font-medium">{row.name}</span>
        ),
      },
      {
        key: "systemDefined",
        header: t("Type"),
        accessorFn: (row) =>
          row.systemDefined ? (
            <Badge variant="info" size="sm">
              <Shield className="h-3 w-3 mr-1" /> {t("System")}
            </Badge>
          ) : (
            <Badge variant="default" size="sm">{t("User")}</Badge>
          ),
      },
    ],
    [t],
  );

  const handleRowClick = useCallback(
    (code: Code) => {
      navigate(`/codes/${code.id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Codes")}
          description={t("Manage system lookup tables and their values")}
          actions={
            <Button onClick={() => navigate("/codes/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Code")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load codes.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Codes")}
        description={t("Manage system lookup tables and their values")}
        actions={
          <Button onClick={() => navigate("/codes/new")}>
            <Plus className="mr-2 h-4 w-4" /> {t("New Code")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("All Codes")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={codes}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: t("No codes found.") }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeListPage;
