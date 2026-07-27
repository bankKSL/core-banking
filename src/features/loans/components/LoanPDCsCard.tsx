import { type FC, useState } from "react";
import { Banknote, Loader2, Trash2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useLoanPDCs, useBouncePDC, useDeletePDC } from "../hooks/useLoanPDCs";
import { formatMoney } from "../utils/format";
import type { PostDatedCheck } from "../api/loanPDCs";

interface LoanPDCsCardProps {
  loanId: number;
  currencyCode?: string;
}

function formatPDCDate(date: number[]): string {
  if (!date || date.length < 3) return "—";
  const [y, m, d] = date;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString();
}

const statusVariant: Record<string, "default" | "success" | "warning" | "info" | "error"> = {
  Pending: "warning",
  Bounced: "error",
  Paid: "success",
};

const LoanPDCsCard: FC<LoanPDCsCardProps> = ({ loanId, currencyCode = "USD" }) => {
  const pdcsQuery = useLoanPDCs(loanId);
  const pdcs = pdcsQuery.data ?? [];

  const bounceMutation = useBouncePDC();
  const deleteMutation = useDeletePDC();

  const [bounceTarget, setBounceTarget] = useState<PostDatedCheck | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PostDatedCheck | null>(null);

  const isMutating = bounceMutation.isPending || deleteMutation.isPending;

  const handleBounce = async () => {
    if (!bounceTarget) return;
    await bounceMutation.mutateAsync({ loanId, pdcId: bounceTarget.id });
    setBounceTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ loanId, pdcId: deleteTarget.id });
    setDeleteTarget(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-4 w-4 text-gray-400" />
            Post-Dated Checks ({pdcs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pdcs.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">No post-dated checks for this loan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check No</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pdcs.map((pdc) => {
                  const statusValue = pdc.status?.value ?? "Unknown";
                  return (
                    <TableRow key={pdc.id}>
                      <TableCell className="text-sm font-mono">{pdc.checkNo}</TableCell>
                      <TableCell className="text-sm">{pdc.bankName ?? "—"}</TableCell>
                      <TableCell className="text-sm">{formatPDCDate(pdc.checkDate)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatMoney(pdc.amount, currencyCode)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[statusValue] ?? "default"} size="sm">
                          {statusValue}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {statusValue === "Pending" && (
                            <Button variant="ghost" size="sm" onClick={() => setBounceTarget(pdc)}>
                              <XCircle className="h-4 w-4 text-amber-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(pdc)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bounce PDC confirm */}
      <ConfirmDialog
        open={!!bounceTarget}
        onOpenChange={(open) => !open && setBounceTarget(null)}
        title="Mark Check as Bounced"
        description={`Mark check #${bounceTarget?.checkNo} (${formatMoney(bounceTarget?.amount ?? 0, currencyCode)}) as bounced?`}
        confirmLabel="Mark Bounced"
        loading={bounceMutation.isPending}
        onConfirm={handleBounce}
      />

      {/* Delete PDC confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Check"
        description={`Remove check #${deleteTarget?.checkNo} from this loan? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default LoanPDCsCard;
export type { LoanPDCsCardProps };
