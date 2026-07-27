import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOffices } from "@/hooks/useOffices";
import { useTellers, useDeleteTeller, TELLER_STATUS_OPTIONS } from "../index";
import type { Teller } from "../types/teller";

const STATUS_LABELS: Record<number, string> = { 100: "Pending", 300: "Active", 400: "Inactive", 600: "Closed" };

const TellerListPage: FC = () => {
  const navigate = useNavigate();
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const { data: offices = [] } = useOffices();
  const {
    data: tellers = [],
    isLoading,
    refetch,
  } = useTellers(officeFilter !== "all" ? Number(officeFilter) : undefined);
  const deleteMutation = useDeleteTeller();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Teller | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return tellers;
    return tellers.filter((t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
  }, [tellers, search]);

  const columns: ColumnDef<Teller>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "officeName", header: "Office", cell: (r) => r.officeName ?? "—" },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge variant={r.status === 300 ? "success" : r.status === 600 ? "default" : "info"} size="sm">
          {STATUS_LABELS[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      key: "startDate",
      header: "Start Date",
      cell: (r) => (r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"),
    },
    { key: "endDate", header: "End Date", cell: (r) => (r.endDate ? new Date(r.endDate).toLocaleDateString() : "—") },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/tellers/${r.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/tellers/edit/${r.id}`)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tellers"
        description="Manage teller counters and cashier assignments"
        actions={
          <Button onClick={() => navigate("/tellers/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> Create Teller
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Tellers</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tellers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={officeFilter} onValueChange={setOfficeFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Offices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Offices</SelectItem>
                {offices.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} emptyState={{ message: "No tellers found." }} minWidth={700} />
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Delete Teller"
        description={`Delete "${deleteTarget?.name}"? Fails if cashiers are assigned.`}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
};

export default TellerListPage;
