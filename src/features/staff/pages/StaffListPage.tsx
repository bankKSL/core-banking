import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { useStaffList } from "../hooks/useStaff";
import type { Staff } from "../api/staff";
import type { ColumnDef } from "@/components/shared/DataTable";

const StaffListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isRefetching } = useStaffList();

  const columns: ColumnDef<Staff>[] = [
    { key: "displayName", header: t("Name") },
    { key: "officeName", header: t("Office") },
    {
      key: "isLoanOfficer",
      header: t("Loan Officer"),
      cell: (row) => (
        <StatusBadge status={row.isLoanOfficer ? "active" : "inactive"} label={row.isLoanOfficer ? t("Yes") : t("No")} />
      ),
    },
    {
      key: "isActive",
      header: t("Status"),
      cell: (row) => (
        <StatusBadge status={row.isActive ? "active" : "inactive"} />
      ),
    },
    {
      key: "joiningDate",
      header: t("Joining Date"),
      className: "text-gray-500",
    },
  ];

  const staff = useMemo(() => data ?? [], [data]);

  const handleRowClick = useCallback(
    (row: Staff) => {
      navigate(`/staff/edit/${row.id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Staff")}
          description={t("Manage organization staff members")}
          actions={
            <Button onClick={() => navigate("/staff/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Staff")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load staff.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Staff")}
        description={t("Manage organization staff members")}
        actions={
          <Button onClick={() => navigate("/staff/new")}>
            <Plus className="mr-2 h-4 w-4" /> {t("New Staff")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("Staff Members")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={staff}
            onRowClick={handleRowClick}
            loading={isLoading || isRefetching}
            emptyState={{
              title: t("No staff found"),
              message: t("Get started by creating a new staff member."),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffListPage;
