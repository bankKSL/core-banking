import React, { useState } from "react";
import { Plus, Trash2, Lock, Loader2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGLClosures, useCreateGLClosure, useUpdateGLClosure, useDeleteGLClosure } from "@/features/accounting";
import type { GLClosureData } from "@/features/accounting";
import { useOffices } from "@/hooks/useOffices";
import { currentDate } from "@/lib/utils";

const AccountingClosuresPage: React.FC = () => {
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const { data: offices = [] } = useOffices();
  const {
    data: closures = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGLClosures(officeFilter !== "all" ? Number(officeFilter) : undefined);
  const createMutation = useCreateGLClosure();
  const updateMutation = useUpdateGLClosure();
  const deleteMutation = useDeleteGLClosure();

  const [showForm, setShowForm] = useState(false);
  const [officeId, setOfficeId] = useState(0);
  const [closingDate, setClosingDate] = useState(currentDate());
  const [comments, setComments] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GLClosureData | null>(null);
  const [editTarget, setEditTarget] = useState<GLClosureData | null>(null);
  const [editComments, setEditComments] = useState("");

  const handleCreate = async () => {
    if (!officeId || !closingDate) {
      setFormError("Office and closing date are required.");
      return;
    }
    setFormError("");
    await createMutation.mutateAsync({
      officeId,
      closingDate: currentDate(closingDate),
      dateFormat: "yyyy-MM-dd",
      locale: "en",
      comments: comments || undefined,
    });
    setOfficeId(0);
    setClosingDate(currentDate());
    setComments("");
    setShowForm(false);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    await updateMutation.mutateAsync({ id: editTarget.id, payload: { comments: editComments } });
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnDef<GLClosureData>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "officeName", header: "Office", cell: (r) => <span className="font-medium">{r.officeName}</span> },
    {
      key: "closingDate",
      header: "Closing Date",
      cell: (r) => <span className="text-sm">{r.closingDate ?? "—"}</span>,
    },
    { key: "comments", header: "Comments", cell: (r) => <span className="text-sm">{r.comments || "—"}</span> },
    {
      key: "deleted",
      header: "Status",
      cell: (r) =>
        r.deleted ? (
          <Badge variant="error" size="sm">
            Deleted
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            Locked
          </Badge>
        ),
    },
    {
      key: "createdByUsername",
      header: "Created By",
      cell: (r) => <span className="text-sm text-gray-500">{r.createdByUsername ?? "—"}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) =>
        !r.deleted ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditTarget(r);
                setEditComments(r.comments ?? "");
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : null,
    },
  ];

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Accounting Closures" description="Lock journal entry posting per office" />
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <span className="text-sm">Failed to load: {error?.message ?? "Unknown error"}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounting Closures"
        description="Lock journal entry posting before a given date per office"
        actions={
          <Button onClick={() => setShowForm((s) => !s)} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> New Closure
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" /> Create Closure
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Office *</Label>
              <Select value={officeId ? String(officeId) : ""} onValueChange={(v) => setOfficeId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Closing Date *</Label>
              <Input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Comments</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
                placeholder="e.g. Month-end closure"
              />
            </div>
            {formError && <p className="col-span-2 text-sm text-red-500">{formError}</p>}
            <div className="col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Closure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Closures</CardTitle>
          <Select value={officeFilter} onValueChange={setOfficeFilter}>
            <SelectTrigger className="w-48">
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={closures}
              emptyState={{ message: "No closures found." }}
              minWidth={800}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Closure"
        description={`Delete closure for "${deleteTarget?.officeName}" (${deleteTarget?.closingDate})? Only the latest closure per office can be deleted.`}
        confirmLabel="Delete"
        variant="destructive"
      />

      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Closure Comments</DialogTitle>
            <DialogDescription>Only comments may be edited on an accounting closure.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editComments}
            onChange={(e) => setEditComments(e.target.value)}
            rows={3}
            placeholder="Comments"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingClosuresPage;
