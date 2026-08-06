import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Calendar, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  useHolidays,
  useActivateHoliday,
  useHolidayTemplate,
} from "../hooks/useHolidays";
import { parseFineractDate } from "../api/holidays";
import type { Holiday } from "../types/holiday.types";

const HOLIDAY_STATUS_MAP: Record<number, string> = {
  1: "pending",
  2: "active",
  3: "deleted",
};

function formatDate(dateVal: number[] | null | undefined): string {
  const d = parseFineractDate(dateVal);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const HolidayListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [officeId, setOfficeId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const params = useMemo(
    () => ({
      ...(officeId ? { officeId } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }),
    [officeId, fromDate, toDate],
  );

  const { data, isLoading, isError, refetch, isRefetching } = useHolidays(params);
  const { data: template } = useHolidayTemplate();
  const activateMutation = useActivateHoliday();

  const holidays = useMemo(() => data?.pageItems ?? [], [data]);

  const handleRowClick = useCallback(
    (row: Holiday) => {
      navigate(`/holidays/edit/${row.id}`);
    },
    [navigate],
  );

  const handleActivate = useCallback(
    async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      try {
        await activateMutation.mutateAsync(id);
      } catch {
        // Error handled by mutation
      }
    },
    [activateMutation],
  );

  const reschedulingTypeOptions = useMemo(
    () => template?.reschedulingTypeOptions ?? [],
    [template],
  );

  const columns: ColumnDef<Holiday>[] = useMemo(
    () => [
      { key: "name", header: t("Name"), accessorFn: (row) => row.name ?? "—" },
      {
        key: "fromDate",
        header: t("From Date"),
        accessorFn: (row) => formatDate(row.fromDate),
      },
      {
        key: "toDate",
        header: t("To Date"),
        accessorFn: (row) => formatDate(row.toDate),
      },
      {
        key: "status",
        header: t("Status"),
        accessorFn: (row) => {
          const statusCode = HOLIDAY_STATUS_MAP[row.status?.id] ?? "unknown";
          const label = row.status?.value ?? row.status?.code ?? t("Unknown");
          return <StatusBadge status={statusCode} label={label} />;
        },
      },
      {
        key: "offices",
        header: t("Offices"),
        accessorFn: (row) => String(row.offices?.length ?? 0),
      },
      {
        key: "actions",
        header: "",
        accessorFn: (row) => {
          if (row.status?.id !== 1) return null;
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => handleActivate(e, row.id)}
              disabled={activateMutation.isPending}
            >
              <CheckCircle className="mr-1 h-3 w-3" /> {t("Activate")}
            </Button>
          );
        },
      },
    ],
    [activateMutation, handleActivate, t],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Holidays")}
          description={t("Manage bank holidays")}
          actions={
            <Button onClick={() => navigate("/holidays/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Holiday")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load holidays.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Holidays")}
        description={t("Manage bank holidays")}
        actions={
          <Button onClick={() => navigate("/holidays/new")}>
            <Plus className="mr-2 h-4 w-4" /> {t("New Holiday")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("Holidays")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            columns={columns}
            data={holidays}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: t("No holidays found.") }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default HolidayListPage;
