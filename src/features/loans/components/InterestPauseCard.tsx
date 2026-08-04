import { type FC, useState } from "react";
import { PauseCircle, Plus, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useInterestPauses, useCreateInterestPause, useDeleteInterestPause } from "../hooks/useInterestPauses";
import { formatFineractDate } from "../utils/format";
import type { InterestPause } from "../api/interestPauses";

interface InterestPauseCardProps {
  loanId: number;
}

const InterestPauseCard: FC<InterestPauseCardProps> = ({ loanId }) => {
  const pausesQuery = useInterestPauses(loanId);
  const pauses = pausesQuery.data ?? [];

  const createMutation = useCreateInterestPause();
  const deleteMutation = useDeleteInterestPause();

  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InterestPause | null>(null);

  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");

  const isMutating = createMutation.isPending || deleteMutation.isPending;

  const openAdd = () => {
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setAddOpen(true);
  };

  const handleCreate = async () => {
    if (!startDate || !endDate) return;
    await createMutation.mutateAsync({ loanId, startDate, endDate });
    setAddOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ loanId, pauseId: deleteTarget.id });
    setDeleteTarget(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <PauseCircle className="h-4 w-4 text-gray-400" />
            Interest Pauses ({pauses.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add Pause
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {pauses.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">No interest pauses for this loan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pauses.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{formatFineractDate(p.startDate)}</TableCell>
                    <TableCell className="text-sm">{formatFineractDate(p.endDate)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{p.createdBy}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add pause dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Interest Pause</DialogTitle>
            <DialogDescription>Pause interest accrual for a period.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="pauseStartDate">
                Start Date *
              </label>
              <Input
                id="pauseStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isMutating}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="pauseEndDate">
                End Date *
              </label>
              <Input
                id="pauseEndDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isMutating}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={isMutating}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isMutating || !startDate || !endDate}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Pause
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete pause confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Interest Pause"
        description="Remove this interest pause from the loan? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default InterestPauseCard;
export type { InterestPauseCardProps };
