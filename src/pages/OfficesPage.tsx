import React, { useState, useMemo } from "react";
import { Plus, Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OfficeTable from "@/components/organization/OfficeTable";
import OfficeForm from "@/components/organization/OfficeForm";
import OfficeDrawer from "@/components/organization/OfficeDrawer";
import OfficeTree from "@/components/organization/OfficeTree";
import OfficeBreadcrumb from "@/components/organization/OfficeBreadcrumb";
import OfficeFilters from "@/components/organization/OfficeFilters";
import { useOffices, useCreateOffice, useUpdateOffice } from "@/hooks/useOffices";
import type { Office, OfficeCreateRequest } from "@/types";

const PAGE_SIZE = 10;

const OfficesPage: React.FC = () => {
    const { data: offices = [], isLoading, isError, refetch } = useOffices();
    const createMutation = useCreateOffice();
    const updateMutation = useUpdateOffice();

    const [search, setSearch] = useState("");
    const [parentFilter, setParentFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingOffice, setEditingOffice] = useState<Office | null>(null);
    const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Office | null>(null);

    const filtered = useMemo(() => {
        let result = offices;
        const q = search.toLowerCase();
        if (q) {
            result = result.filter(
                (o) =>
                    o.name.toLowerCase().includes(q) ||
                    o.nameDecorated.toLowerCase().includes(q) ||
                    (o.externalId && o.externalId.toLowerCase().includes(q)),
            );
        }
        if (parentFilter === "root") result = result.filter((o) => !o.parentId);
        if (parentFilter === "children") result = result.filter((o) => !!o.parentId);
        return result;
    }, [offices, search, parentFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);

    const stats = useMemo(
        () => ({
            total: offices.length,
            rootOffices: offices.filter((o) => !o.parentId).length,
            childOffices: offices.filter((o) => !!o.parentId).length,
        }),
        [offices],
    );

    const handleOpenCreate = () => {
        setEditingOffice(null);
        setDialogOpen(true);
    };
    const handleOpenEdit = (office: Office) => {
        setEditingOffice(office);
        setDialogOpen(true);
    };
    const handleRowClick = (office: Office) => {
        setSelectedOffice(office);
        setDrawerOpen(true);
    };

    const handleSubmit = (formData: { name: string; parentId?: number; openingDate: string; externalId?: string }) => {
        if (editingOffice) {
            updateMutation.mutate({ id: editingOffice.id, payload: formData }, { onSuccess: () => setDialogOpen(false) });
        } else {
            createMutation.mutate(formData as OfficeCreateRequest, {
                onSuccess: () => setDialogOpen(false),
            });
        }
    };

    const handleDelete = () => {
        setDeleteTarget(null);
    };
    const handleBreadcrumbNavigate = (office: Office) => {
        setSelectedOffice(office);
        setDrawerOpen(true);
    };
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Offices" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="space-y-6">
                <PageHeader title="Offices" />
                <ErrorState
                    title="Failed to load offices"
                    message="Could not connect to the server. Please try again."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Offices"
                description="Manage your organization's office hierarchy"
                actions={
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Office
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard title="Total Offices" value={stats.total} icon={Building2} />
                <StatCard title="Root Offices" value={stats.rootOffices} icon={Building2} />
                <StatCard title="Child Offices" value={stats.childOffices} icon={Building2} />
            </div>

            <Tabs defaultValue="table">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <TabsList>
                        <TabsTrigger value="table">Table View</TabsTrigger>
                        <TabsTrigger value="tree">Tree View</TabsTrigger>
                    </TabsList>
                    <OfficeFilters
                        search={search}
                        onSearchChange={(v) => {
                            setSearch(v);
                            setPage(1);
                        }}
                        parentFilter={parentFilter}
                        onParentFilterChange={(v) => {
                            setParentFilter(v);
                            setPage(1);
                        }}
                    />
                </div>
                {selectedOffice && drawerOpen && (
                    <div className="mt-4">
                        <OfficeBreadcrumb office={selectedOffice} offices={offices} onNavigate={handleBreadcrumbNavigate} />
                    </div>
                )}

                <TabsContent value="table" className="mt-4">
                    {filtered.length === 0 ? (
                        <EmptyState
                            icon={Building2}
                            title="No offices found"
                            description={search ? "Try adjusting your search or filters." : "Create your first office to get started."}
                            action={!search ? { label: "Add Office", onClick: handleOpenCreate } : undefined}
                        />
                    ) : (
                        <>
                            <OfficeTable
                                data={paginated}
                                onRowClick={handleRowClick}
                                onEdit={handleOpenEdit}
                                onDelete={(o) => setDeleteTarget(o)}
                            />
                            {totalPages > 1 && (
                                <div className="mt-4">
                                    <Pagination
                                        currentPage={safePage}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                        totalItems={0}
                                        pageSize={0}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>
                <TabsContent value="tree" className="mt-4">
                    {filtered.length === 0 ? (
                        <EmptyState
                            icon={Building2}
                            title="No offices found"
                            description={search ? "Try adjusting your search or filters." : "Create your first office to get started."}
                        />
                    ) : (
                        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                            <OfficeTree
                                offices={filtered}
                                selectedId={selectedOffice?.id}
                                onSelect={(o) => {
                                    setSelectedOffice(o);
                                    setDrawerOpen(true);
                                }}
                            />
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <OfficeDrawer
                office={selectedOffice}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onEdit={(o) => {
                    setDrawerOpen(false);
                    handleOpenEdit(o);
                }}
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingOffice ? "Edit Office" : "Create Office"}</DialogTitle>
                        <DialogDescription>
                            {editingOffice
                                ? `Update details for "${editingOffice.name}".`
                                : "Add a new office to the organization hierarchy."}
                        </DialogDescription>
                    </DialogHeader>
                    <OfficeForm
                        offices={offices.filter((o) => o.id !== editingOffice?.id)}
                        defaultValues={
                            editingOffice
                                ? {
                                      name: editingOffice.name,
                                      parentId: editingOffice.parentId ?? undefined,
                                      openingDate: editingOffice.openingDate,
                                      externalId: editingOffice.externalId || "",
                                  }
                                : undefined
                        }
                        onSubmit={handleSubmit}
                        onCancel={() => setDialogOpen(false)}
                        isSubmitting={isSubmitting}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(v) => {
                    if (!v) setDeleteTarget(null);
                }}
                title="Delete Office"
                description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    );
};

export default OfficesPage;
