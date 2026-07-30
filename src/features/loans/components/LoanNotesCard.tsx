import { type FC, useState } from "react";
import { MessageSquare, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useLoanNotes, useCreateLoanNote, useUpdateLoanNote, useDeleteLoanNote } from "../hooks/useLoanNotes";
import { formatFineractDate } from "../utils/format";
import type { LoanNote } from "../api/loanNotes";

interface LoanNotesCardProps {
  loanId: number;
}

const LoanNotesCard: FC<LoanNotesCardProps> = ({ loanId }) => {
  const notesQuery = useLoanNotes(loanId);
  const notes = notesQuery.data ?? [];

  const createMutation = useCreateLoanNote();
  const updateMutation = useUpdateLoanNote();
  const deleteMutation = useDeleteLoanNote();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LoanNote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoanNote | null>(null);

  const [noteText, setNoteText] = useState("");

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const openAdd = () => {
    setNoteText("");
    setAddOpen(true);
  };

  const openEdit = (note: LoanNote) => {
    setNoteText(note.note);
    setEditTarget(note);
  };

  const handleCreate = async () => {
    if (!noteText.trim()) return;
    await createMutation.mutateAsync({ loanId, note: noteText.trim() });
    setAddOpen(false);
    setNoteText("");
  };

  const handleUpdate = async () => {
    if (!editTarget || !noteText.trim()) return;
    await updateMutation.mutateAsync({ loanId, noteId: editTarget.id, note: noteText.trim() });
    setEditTarget(null);
    setNoteText("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ loanId, noteId: deleteTarget.id });
    setDeleteTarget(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            Notes ({notes.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add Note
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {notes.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">No notes added to this loan.</p>
          ) : (
            <div className="divide-y">
              {notes.map((note) => (
                <div key={note.id} className="px-6 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap wrap-break-word">{note.note}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {note.createdByUsername} &middot; {formatFineractDate(note.createdOnDate)}
                        {note.updatedByUsername && <> (edited &middot; {formatFineractDate(note.updatedOnDate)})</>}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(note)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(note)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add note dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Add a note to this loan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="addNoteText">
                Note
              </label>
              <Textarea
                id="addNoteText"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter note..."
                disabled={isMutating}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={isMutating}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isMutating || !noteText.trim()}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit note dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Update this note.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="editNoteText">
                Note
              </label>
              <Textarea
                id="editNoteText"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter note..."
                disabled={isMutating}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isMutating}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isMutating || !noteText.trim()}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete note confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Note"
        description="Remove this note from the loan? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default LoanNotesCard;
export type { LoanNotesCardProps };
