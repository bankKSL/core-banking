import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Building2, ArrowRightLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { useOffices } from "@/hooks/useOffices";
import OfficeTree from "@/components/organization/OfficeTree";
import OfficeFilters from "@/components/organization/OfficeFilters";
import OfficeDrawer from "@/components/organization/OfficeDrawer";
import type { Office } from "@/types";

const OfficeListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: offices = [], isLoading, isError, refetch } = useOffices();

  const [search, setSearch] = useState("");
  const [parentFilter, setParentFilter] = useState("all");
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = offices;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          (o.externalId && o.externalId.toLowerCase().includes(q)),
      );
    }

    if (parentFilter === "root") {
      list = list.filter((o) => !o.parentId);
    } else if (parentFilter === "children") {
      list = list.filter((o) => o.parentId);
    }

    return list;
  }, [offices, search, parentFilter]);

  const columns: ColumnDef<Office>[] = useMemo(
    () => [
      { key: "nameDecorated", header: t("Office Name"), sortable: true },
      { key: "externalId", header: t("External ID") },
      { key: "openingDate", header: t("Opening Date") },
      {
        key: "parentName",
        header: t("Parent Office"),
        accessorFn: (row) => row.parentName ?? "—",
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (office: Office) => {
      setSelectedOffice(office);
      setDrawerOpen(true);
    },
    [],
  );

  const handleOfficeSelect = useCallback((office: Office) => {
    setSelectedOffice(office);
    setDrawerOpen(true);
  }, []);

  const handleEdit = useCallback(
    (office: Office) => {
      navigate(`/offices/edit/${office.id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Branches (Offices)")}
          description={t("Manage organizational hierarchy")}
          actions={
            <Button onClick={() => navigate("/offices/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Office")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load offices.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Branches (Offices)")}
        description={t("Manage organizational hierarchy")}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/office-transactions")}>
              <ArrowRightLeft className="mr-2 h-4 w-4" /> {t("Transactions")}
            </Button>
            <Button onClick={() => navigate("/offices/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Office")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("Hierarchy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md" />
                ))}
              </div>
            ) : (
              <OfficeTree offices={offices} selectedId={selectedOffice?.id} onSelect={handleOfficeSelect} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("All Offices")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OfficeFilters
              search={search}
              onSearchChange={setSearch}
              parentFilter={parentFilter}
              onParentFilterChange={setParentFilter}
            />
            <DataTable
              columns={columns}
              data={filtered}
              onRowClick={handleRowClick}
              loading={isLoading}
              emptyState={{ message: t("No offices found.") }}
            />
          </CardContent>
        </Card>
      </div>

      <OfficeDrawer
        office={selectedOffice}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={selectedOffice ? () => handleEdit(selectedOffice) : undefined}
      />
    </div>
  );
};

export default OfficeListPage;
