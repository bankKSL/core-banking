import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { data: codes = [], isLoading, isError, refetch } = useCodes();

  const columns: ColumnDef<Code>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Code Name",
        accessorFn: (row) => (
          <span className="font-medium">{row.name}</span>
        ),
      },
      {
        key: "systemDefined",
        header: "Type",
        accessorFn: (row) =>
          row.systemDefined ? (
            <Badge variant="info" size="sm">
              <Shield className="h-3 w-3 mr-1" /> System
            </Badge>
          ) : (
            <Badge variant="default" size="sm">User</Badge>
          ),
      },
    ],
    [],
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
          title="Codes"
          description="Manage system lookup tables and their values"
          actions={
            <Button onClick={() => navigate("/codes/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Code
            </Button>
          }
        />
        <ErrorState message="Failed to load codes." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Codes"
        description="Manage system lookup tables and their values"
        actions={
          <Button onClick={() => navigate("/codes/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Code
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={codes}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: "No codes found." }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeListPage;
