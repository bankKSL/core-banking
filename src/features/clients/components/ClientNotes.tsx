import { type FC, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, StickyNote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useClientNotes, useCreateClientNote, useUpdateClientNote, useDeleteClientNote } from "../hooks/useClientNotes";
import { formatClientDate } from "../utils/client";

const noteSchema = z.object({ note: z.string().min(1, "Note content is required") });
type NoteFormValues = z.infer<typeof noteSchema>;

interface ClientNotesProps { clientId: number }

const ClientNotes: FC<ClientNotesProps> = ({ clientId }) => {
    const { data: notes, isLoading } = useClientNotes(clientId);
    const createMutation = useCreateClientNote();
    const updateMutation = useUpdateClientNote();
    const deleteMutation = useDeleteClientNote();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [viewingNote, setViewingNote] = useState<{ id: number; note: string; createdOn?: string } | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<NoteFormValues>({
        resolver: zodResolver(noteSchema),
    });

    const openCreate = useCallback(() => {
        setEditingId(null);
        reset({ note: "" });
        setDialogOpen(true);
    }, [reset]);

    const openEdit = useCallback((note: { id: number; note: string }) => {
        setEditingId(note.id);
        reset({ note: note.note });
        setDialogOpen(true);
    }, [reset]);

    const onSubmit = useCallback(async (values: NoteFormValues) => {
        if (editingId) {
            await updateMutation.mutateAsync({ clientId, noteId: editingId, payload: values });
        } else {
            await createMutation.mutateAsync({ clientId, payload: values });
        }
        setDialogOpen(false);
    }, [clientId, editingId, createMutation, updateMutation]);

    const handleDelete = useCallback(async () => {
        if (!deleteId) return;
        await deleteMutation.mutateAsync({ clientId, noteId: deleteId });
        setDeleteId(null);
    }, [clientId, deleteId, deleteMutation]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2"><StickyNote className="h-5 w-5" />Notes</h3>
                <Button onClick={openCreate} size="sm"><Plus className="mr-1 h-4 w-4" />Add Note</Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !notes || notes.length === 0 ? (
                <Card><CardContent className="py-8 text-center"><StickyNote className="mx-auto h-8 w-8 text-gray-300 mb-2" /><p className="text-sm text-gray-500">No notes yet.</p></CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {notes.map((note) => (
                        <Card key={note.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setViewingNote(note)}>
                            <CardContent className="py-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">{note.note}</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatClientDate(note.createdOn)} {note.createdByUsername ? `by ${note.createdByUsername}` : ""}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(note)}><Pencil className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(note.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingId ? "Edit Note" : "Add Note"}</DialogTitle><DialogDescription>Enter note content.</DialogDescription></DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="note">Note *</Label>
                            <Textarea id="note" {...register("note")} rows={5} placeholder="Write your note here..." />
                            {errors.note && <p className="text-xs text-red-500">{errors.note.message}</p>}
                        </div>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#D32F2F] hover:bg-red-700">
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingId ? "Update" : "Create"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
                <DialogContent><DialogHeader><DialogTitle>Note</DialogTitle></DialogHeader>
                    <p className="text-sm whitespace-pre-wrap">{viewingNote?.note}</p>
                    {viewingNote?.createdOn && <p className="text-xs text-gray-400">{formatClientDate(viewingNote.createdOn)}</p>}
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Note"
                description="Are you sure? This cannot be undone." onConfirm={handleDelete} variant="destructive" confirmLabel="Delete" loading={deleteMutation.isPending} />
        </div>
    );
};

export default ClientNotes;
