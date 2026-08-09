import React, { useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OfficeSelect } from "@/components/shared/OfficeSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStaffList } from "../hooks/useStaff";
import StaffBulkImport from "../components/StaffBulkImport";
import type { Staff, StaffListParams } from "../api/staff";
import type { ColumnDef } from "@/components/shared/DataTable";

const StaffListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<StaffListParams>({});
  const [showFilters, setShowFilters] = useState(false);
  const { data, isLoading, isError, refetch, isRefetching } = useStaffList(filters);

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

  const handleOfficeChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      officeId: value ? Number(value) : undefined,
    }));
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? "all" : value === "active" ? "active" : "inactive",
    }));
  }, []);

  const handleLoanOfficersOnlyChange = useCallback((checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      loanOfficersOnly: checked || undefined,
    }));
  }, []);

  const handleHierarchyChange = useCallback((checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      staffInOfficeHierarchy: checked || undefined,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.officeId || filters.status || filters.loanOfficersOnly || filters.staffInOfficeHierarchy;
  }, [filters]);

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Staff")}
          description={t("Manage organization staff members")}
          actions={
            <div className="flex items-center gap-2">
              <StaffBulkImport />
              <Button onClick={() => navigate("/staff/new")}>
                <Plus className="mr-2 h-4 w-4" /> {t("New Staff")}
              </Button>
            </div>
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
          <div className="flex items-center gap-2">
            <StaffBulkImport />
            <Button onClick={() => navigate("/staff/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Staff")}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("Staff Members")}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={hasActiveFilters ? "border-[#D32F2F] text-[#D32F2F]" : ""}
            >
              <Filter className="mr-1 h-4 w-4" />
              {t("Filters")}
              {hasActiveFilters && <span className="ml-1">•</span>}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <Label>{t("Office")}</Label>
                <OfficeSelect
                  value={filters.officeId ? String(filters.officeId) : ""}
                  onChange={handleOfficeChange}
                  includeNone={t("All Offices")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("Status")}</Label>
                <Select
                  value={filters.status ?? "all"}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All")}</SelectItem>
                    <SelectItem value="active">{t("Active")}</SelectItem>
                    <SelectItem value="inactive">{t("Inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("Options")}</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="loanOfficersOnly"
                      checked={filters.loanOfficersOnly ?? false}
                      onCheckedChange={handleLoanOfficersOnlyChange}
                    />
                    <label htmlFor="loanOfficersOnly" className="text-sm cursor-pointer">
                      {t("Loan Officers Only")}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="staffInOfficeHierarchy"
                      checked={filters.staffInOfficeHierarchy ?? false}
                      onCheckedChange={handleHierarchyChange}
                    />
                    <label htmlFor="staffInOfficeHierarchy" className="text-sm cursor-pointer">
                      {t("Include Hierarchy")}
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2 flex items-end">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    {t("Clear Filters")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={staff}
            onRowClick={handleRowClick}
            loading={isLoading || isRefetching}
            emptyState={{
              title: t("No staff found"),
              message: hasActiveFilters
                ? t("Try adjusting your filters or create a new staff member.")
                : t("Get started by creating a new staff member."),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffListPage;
