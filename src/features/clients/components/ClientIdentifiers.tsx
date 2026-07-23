import { type FC, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import type { ColumnDef } from "@/components/shared/DataTable";
import {
  useClientIdentifiers,
  useClientIdentifierTemplate,
  useCreateClientIdentifier,
  useUpdateClientIdentifier,
  useDeleteClientIdentifier,
} from "../hooks/useClientIdentifiers";
import type { ClientIdentifier } from "../api/identifiers";

const identifierSchema = z.object({
  documentTypeId: z.number({ message: "Document type is required" }),
  documentKey: z.string().min(1, "Document key is required"),
  description: z.string().optional(),
});

type IdentifierFormValues = z.infer<typeof identifierSchema>;

interface ClientIdentifiersProps {
  clientId: number;
}

const ClientIdentifiers: FC<ClientIdentifiersProps> = ({ clientId }) => {
  const { data: identifiers, isLoading } = useClientIdentifiers(clientId);
  const { data: template } = useClientIdentifierTemplate(clientId);
  const createMutation = useCreateClientIdentifier();
  const updateMutation = useUpdateClientIdentifier();
  const deleteMutation = useDeleteClientIdentifier();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<IdentifierFormValues>({
    resolver: zodResolver(identifierSchema),
  });

  const openCreate = useCallback(() => {
    setEditingId(null);
    reset({ documentTypeId: undefined as any, documentKey: "", description: "" });
    setDialogOpen(true);
  }, [reset]);

  const openEdit = useCallback(
    (id: ClientIdentifier) => {
      setEditingId(id.id);
      reset({ documentTypeId: id.documentType.id, documentKey: id.documentKey, description: id.description ?? "" });
      setDialogOpen(true);
    },
    [reset],
  );

  const onSubmit = useCallback(
    async (values: IdentifierFormValues) => {
      if (editingId) {
        await updateMutation.mutateAsync({ clientId, identifierId: editingId, payload: values });
      } else {
        await createMutation.mutateAsync({
          clientId,
          payload: { ...values, documentTypeId: Number(values.documentTypeId) },
        });
      }
      setDialogOpen(false);
    },
    [clientId, editingId, createMutation, updateMutation],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ clientId, identifierId: deleteId });
    setDeleteId(null);
  }, [clientId, deleteId, deleteMutation]);

  const columns: ColumnDef<ClientIdentifier>[] = [
    {
      key: "documentType",
      header: "Document Type",
      accessorFn: (row) => <span className="text-sm font-medium">{row.documentType?.name ?? "—"}</span>,
    },
    {
      key: "documentKey",
      header: "Document Key",
      accessorFn: (row) => <span className="text-sm font-mono">{row.documentKey}</span>,
    },
    {
      key: "description",
      header: "Description",
      accessorFn: (row) => <span className="text-sm text-gray-500">{row.description ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      accessorFn: (row) =>
        row.status ? (
          <Badge variant={row.status === "active" ? "success" : "default"} size="sm">
            {row.status}
          </Badge>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      accessorFn: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(row.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Identifiers
        </h3>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Identifier
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={identifiers ?? []}
            loading={isLoading}
            minWidth={600}
            emptyState={{
              icon: <Fingerprint className="h-8 w-8 text-gray-300" />,
              message: "No identifiers found. Click 'Add Identifier' to create one.",
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Identifier" : "Add Identifier"}</DialogTitle>
            <DialogDescription>Manage client identification documents.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Document Type</Label>
              <Select
                defaultValue={String(template?.allowedDocumentTypes?.[0]?.id ?? "")}
                onValueChange={(v) => setValue("documentTypeId", Number(v), { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {template?.allowedDocumentTypes?.map((dt) => (
                    <SelectItem key={dt.id} value={String(dt.id)}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.documentTypeId && <p className="text-xs text-red-500">{errors.documentTypeId.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="documentKey">Document Key</Label>
              <Input id="documentKey" {...register("documentKey")} placeholder="e.g. passport number" />
              {errors.documentKey && <p className="text-xs text-red-500">{errors.documentKey.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} placeholder="Optional notes" />
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#D32F2F] hover:bg-red-700"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingId ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Identifier"
        description="Are you sure you want to delete this identifier? This cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ClientIdentifiers;
