import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { useStaffList } from "../hooks/useStaff";
import type { Staff } from "../api/staff";
import type { ColumnDef } from "@/components/shared/DataTable";

const columns: ColumnDef<Staff>[] = [
  { key: "displayName", header: "Name" },
  { key: "officeName", header: "Office" },
  {
    key: "isLoanOfficer",
    header: "Loan Officer",
    cell: (row) => (
      <StatusBadge status={row.isLoanOfficer ? "active" : "inactive"} label={row.isLoanOfficer ? "Yes" : "No"} />
    ),
  },
  {
    key: "isActive",
    header: "Status",
    cell: (row) => (
      <StatusBadge status={row.isActive ? "active" : "inactive"} />
    ),
  },
  {
    key: "joiningDate",
    header: "Joining Date",
    className: "text-gray-500",
  },
];

const StaffListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isRefetching } = useStaffList();

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
          title="Staff"
          description="Manage organization staff members"
          actions={
            <Button onClick={() => navigate("/staff/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Staff
            </Button>
          }
        />
        <ErrorState message="Failed to load staff." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Manage organization staff members"
        actions={
          <Button onClick={() => navigate("/staff/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Staff
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={staff}
            onRowClick={handleRowClick}
            loading={isLoading || isRefetching}
            emptyState={{
              title: "No staff found",
              message: "Get started by creating a new staff member.",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffListPage;
