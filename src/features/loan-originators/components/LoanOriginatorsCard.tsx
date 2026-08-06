import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Handshake, Plus, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  useLoanOriginatorsByLoan,
  useAttachLoanOriginator,
  useDetachLoanOriginator,
} from "../hooks/useLoanOriginatorsByLoan";
import LoanOriginatorPicker from "./LoanOriginatorPicker";
import type { LoanOriginator } from "../types/loanOriginator";

interface LoanOriginatorsCardProps {
  loanId: number;
  originators?: LoanOriginator[];
  /** Only editable while the loan is in "Submitted and Pending Approval" (status.id === 100). */
  canEdit?: boolean;
}

const titleCase = (s?: string) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : "—");

const LoanOriginatorsCard: FC<LoanOriginatorsCardProps> = ({ loanId, originators: initial, canEdit = false }) => {
  const { t } = useTranslation();
  const originatorsQuery = useLoanOriginatorsByLoan(initial ? undefined : loanId);
  const items = initial ?? originatorsQuery.data ?? [];

  const attachMutation = useAttachLoanOriginator();
  const detachMutation = useDetachLoanOriginator();

  const [attachOpen, setAttachOpen] = useState(false);
  const [selected, setSelected] = useState<LoanOriginator[]>([]);
  const [detachTarget, setDetachTarget] = useState<LoanOriginator | null>(null);

  const isMutating = attachMutation.isPending || detachMutation.isPending;

  const handleAttach = async () => {
    if (selected.length === 0) return;
    await attachMutation.mutateAsync({ loanId, originatorId: selected[0].id });
    setSelected([]);
    setAttachOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Handshake className="h-4 w-4 text-gray-400" />
            {t("Originators ({{count}})", { count: items.length })}
          </CardTitle>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelected([]);
                setAttachOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("Add Originator")}
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No originators linked to this loan.")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("External ID")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Channel")}</TableHead>
                  {canEdit && <TableHead className="text-right">{t("Actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-medium">{item.name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{item.externalId}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status.toLowerCase()} size="sm" />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{titleCase(item.originatorType?.name)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{titleCase(item.channelType?.name)}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isMutating}
                          onClick={() => setDetachTarget(item)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Attach dialog */}
      <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Add Originator")}</DialogTitle>
            <DialogDescription>{t("Attach an ACTIVE originator to this loan. Attach/detach is only possible while the loan is submitted and pending approval.")}</DialogDescription>
          </DialogHeader>
          <LoanOriginatorPicker
            value={selected}
            onChange={setSelected}
            excludeIds={items.map((o) => o.id)}
            disabled={isMutating}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAttachOpen(false)} disabled={isMutating}>
              {t("Cancel")}
            </Button>
            <Button type="button" onClick={handleAttach} disabled={isMutating || selected.length === 0}>
              {attachMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Attach")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detach confirm */}
      <ConfirmDialog
        open={!!detachTarget}
        onOpenChange={(open) => !open && setDetachTarget(null)}
        title={t("Detach Originator")}
        description={t('Remove originator "{{name}}" from this loan?', { name: detachTarget?.name ?? detachTarget?.externalId })}
        confirmLabel={t("Detach")}
        variant="destructive"
        loading={detachMutation.isPending}
        onConfirm={async () => {
          if (!detachTarget) return;
          await detachMutation.mutateAsync({ loanId, originatorId: detachTarget.id });
          setDetachTarget(null);
        }}
      />
    </>
  );
};

export default LoanOriginatorsCard;
export type { LoanOriginatorsCardProps };
