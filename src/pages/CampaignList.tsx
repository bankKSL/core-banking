import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Download,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { campaigns, products } from "@/mock/data";
import type { Campaign } from "@/types";

const CampaignList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q) ||
        c.createdBy.toLowerCase().includes(q),
    );
  }, [search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  const stats = useMemo(
    () => ({
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === "active").length,
      scheduled: campaigns.filter((c) => c.status === "scheduled").length,
      expired: campaigns.filter((c) => c.status === "expired").length,
    }),
    [],
  );

  const getProductNames = useCallback(
    (ids: string[]) => ids.map((id) => products.find((p) => p.id === id)?.name ?? id).join(", "),
    [],
  );

  const handleDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const columns: ColumnDef<Campaign>[] = [
    {
      key: "name",
      header: "Campaign Name",
      cell: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.name}</span>,
    },
    { key: "categoryName", header: "Category" },
    {
      key: "products",
      header: "Products",
      cell: (row) => <span className="text-xs">{getProductNames(row.products)}</span>,
    },
    {
      key: "priority",
      header: "Priority",
      cell: (row) => (
        <Badge variant={row.priority <= 2 ? "error" : row.priority === 3 ? "warning" : "info"} size="sm">
          P{row.priority}
        </Badge>
      ),
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { key: "startDate", header: "Start Date", cell: (row) => new Date(row.startDate).toLocaleDateString() },
    { key: "endDate", header: "End Date", cell: (row) => new Date(row.endDate).toLocaleDateString() },
    { key: "version", header: "Version", cell: (row) => <span className="text-xs font-mono">v{row.version}</span> },
    { key: "createdBy", header: "Created By" },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/campaign/${row.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/campaign/${row.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.status === "active" ? (
              <DropdownMenuItem>
                <PowerOff className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
                <Power className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign Management"
        description="Manage banking campaigns and promotional rules"
        actions={
          <Button onClick={() => navigate("/campaign/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Campaigns" value={stats.total} />
        <StatCard title="Active" value={stats.active} variant="success" />
        <StatCard title="Scheduled" value={stats.scheduled} variant="warning" />
        <StatCard title="Expired" value={stats.expired} variant="error" />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Campaigns</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={paginated} onRowClick={(row) => navigate(`/campaign/${row.id}`)} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default CampaignList;
