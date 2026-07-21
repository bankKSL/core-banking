import { type FC, useState, useCallback, useRef } from "react";
import { Upload, Trash2, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@/components/shared/DataTable";
import { useClientDocuments, useCreateClientDocument, useDeleteClientDocument, useUpdateClientDocument } from "../hooks/useClientDocuments";
import type { ClientDocument } from "../api/documents";
import { downloadClientDocument } from "../api/documents";

const docSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

type DocFormValues = z.infer<typeof docSchema>;

function formatFileSize(bytes?: number): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ClientDocumentsProps { clientId: number }

const ClientDocuments: FC<ClientDocumentsProps> = ({ clientId }) => {
    const { data: documents, isLoading } = useClientDocuments(clientId);
    const createMutation = useCreateClientDocument();
    const updateMutation = useUpdateClientDocument();
    const deleteMutation = useDeleteClientDocument();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<ClientDocument | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<DocFormValues>({
        resolver: zodResolver(docSchema),
    });

    const openCreate = useCallback(() => {
        setEditingDoc(null);
        setSelectedFile(null);
        reset({ name: "", description: "" });
        setDialogOpen(true);
    }, [reset]);

    const openEdit = useCallback((doc: ClientDocument) => {
        setEditingDoc(doc);
        setSelectedFile(null);
        reset({ name: doc.name, description: doc.description ?? "" });
        setDialogOpen(true);
    }, [reset]);

    const onSubmit = useCallback(async (values: DocFormValues) => {
        if (editingDoc) {
            await updateMutation.mutateAsync({ clientId, documentId: editingDoc.id, payload: { ...values, file: selectedFile ?? undefined } });
        } else {
            if (!selectedFile) return;
            await createMutation.mutateAsync({ clientId, payload: { ...values, file: selectedFile } });
        }
        setDialogOpen(false);
    }, [clientId, editingDoc, selectedFile, createMutation, updateMutation]);

    const handleDelete = useCallback(async () => {
        if (!deleteId) return;
        await deleteMutation.mutateAsync({ clientId, documentId: deleteId });
        setDeleteId(null);
    }, [clientId, deleteId, deleteMutation]);

    const handleDownload = useCallback(async (doc: ClientDocument) => {
        setDownloadingId(doc.id);
        try {
            const blob = await downloadClientDocument(clientId, doc.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = doc.fileName ?? doc.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } finally {
            setDownloadingId(null);
        }
    }, [clientId]);

    const columns: ColumnDef<ClientDocument>[] = [
        { key: "name", header: "Name", accessorFn: (row) => <span className="text-sm font-medium">{row.name}</span> },
        { key: "fileName", header: "File Name", accessorFn: (row) => <span className="text-sm font-mono">{row.fileName ?? "—"}</span> },
        { key: "size", header: "Size", accessorFn: (row) => <span className="text-sm">{formatFileSize(row.size)}</span> },
        { key: "type", header: "Type", accessorFn: (row) => <span className="text-sm">{row.type ?? "—"}</span> },
        { key: "description", header: "Description", accessorFn: (row) => <span className="text-sm text-gray-500 truncate max-w-[200px]">{row.description ?? "—"}</span> },
        { key: "actions", header: "Actions", accessorFn: (row) => (
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDownload(row); }} disabled={downloadingId === row.id}>
                    {downloadingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><FileText className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
        )},
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2"><FileText className="h-5 w-5" />Documents</h3>
                <Button onClick={openCreate} size="sm"><Upload className="mr-1 h-4 w-4" />Upload Document</Button>
            </div>
            <Card><CardContent className="p-0">
                <DataTable columns={columns} data={documents ?? []} loading={isLoading} minWidth={700}
                    emptyState={{ icon: <FileText className="h-8 w-8 text-gray-300" />, message: "No documents uploaded." }} />
            </CardContent></Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingDoc ? "Edit Document" : "Upload Document"}</DialogTitle><DialogDescription>{editingDoc ? "Update document metadata." : "Upload a new document for this client."}</DialogDescription></DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" {...register("name")} />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>
                        {!editingDoc && (
                            <div className="flex flex-col gap-1.5">
                                <Label>File *</Label>
                                <Input type="file" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="cursor-pointer" />
                            </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...register("description")} rows={3} />
                        </div>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#D32F2F] hover:bg-red-700">
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingDoc ? "Update" : "Upload"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Document"
                description="Are you sure you want to delete this document? This cannot be undone."
                onConfirm={handleDelete} variant="destructive" confirmLabel="Delete" loading={deleteMutation.isPending} />
        </div>
    );
};

export default ClientDocuments;
