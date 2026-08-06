import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StandingInstructionStatusBadge } from "../components/StandingInstructionStatusBadge";
import { useStandingInstruction, useDeleteStandingInstruction } from "../hooks/useStandingInstructions";
import { parseFineractDate } from "../api/standing-instructions";
import {
  INSTRUCTION_TYPE_LABELS,
  RECURRENCE_TYPE_LABELS,
  TRANSFER_TYPE_LABELS,
  ACCOUNT_TYPE_LABELS,
  PRIORITY_CONFIG,
} from "../constants/status";

function formatDate(dateVal: number[] | null | undefined): string {
  const d = parseFineractDate(dateVal);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(amount?: number | null): string {
  if (amount == null) return "—";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
  </div>
);

const StandingInstructionViewPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: instruction, isLoading, isError, refetch } = useStandingInstruction(id ? Number(id) : undefined);
  const deleteMutation = useDeleteStandingInstruction();

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(Number(id));
      navigate("/transfers/standing-instructions");
    } catch {
      // Error handled by mutation
    }
  }, [id, deleteMutation, navigate]);

  if (isLoading) {
    return (
      <div className="max-w-6xl m-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !instruction) {
    return (
      <div className="p-6 max-w-6xl m-auto">
        <PageHeader
          title={t("Standing Instruction")}
          description={t("View standing instruction details")}
          actions={
            <Button variant="outline" onClick={() => navigate("/transfers/standing-instructions")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load standing instruction.")} onRetry={refetch} />
      </div>
    );
  }

  const priorityLabel = PRIORITY_CONFIG[instruction.priority?.id]?.label ?? instruction.priority?.value ?? "—";

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={instruction.name ?? t("Standing Instruction")}
        description={t("View standing instruction details")}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/transfers/standing-instructions")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/transfers/standing-instructions/edit/${id}`)}>
              <Edit className="mr-2 h-4 w-4" /> {t("Edit")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={instruction.status?.id === 3}
            >
              <Trash2 className="mr-2 h-4 w-4" /> {t("Delete")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("From")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label={t("Office")} value={instruction.fromOffice?.name ?? "—"} />
            <DetailRow label={t("Client")} value={instruction.fromClient?.displayName ?? "—"} />
            <DetailRow label={t("Account Type")} value={ACCOUNT_TYPE_LABELS[instruction.fromAccountType?.id] ?? "—"} />
            <DetailRow
              label={t("Account")}
              value={`${instruction.fromAccount?.accountNo ?? "—"} — ${instruction.fromAccount?.productName ?? ""}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("To")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label={t("Office")} value={instruction.toOffice?.name ?? "—"} />
            <DetailRow label={t("Client")} value={instruction.toClient?.displayName ?? "—"} />
            <DetailRow label={t("Account Type")} value={ACCOUNT_TYPE_LABELS[instruction.toAccountType?.id] ?? "—"} />
            <DetailRow
              label={t("Account")}
              value={`${instruction.toAccount?.accountNo ?? "—"} — ${instruction.toAccount?.productName ?? ""}`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow
            label={t("Transfer Type")}
            value={TRANSFER_TYPE_LABELS[instruction.transferType?.id] ?? instruction.transferType?.value ?? "—"}
          />
          <DetailRow
            label={t("Instruction Type")}
            value={
              INSTRUCTION_TYPE_LABELS[instruction.instructionType?.id] ?? instruction.instructionType?.value ?? "—"
            }
          />
          <DetailRow label={t("Priority")} value={priorityLabel} />
          <DetailRow label={t("Status")} value={<StandingInstructionStatusBadge status={instruction.status} />} />
          <DetailRow label={t("Amount")} value={formatAmount(instruction.amount)} />
          <DetailRow
            label={t("Recurrence Type")}
            value={RECURRENCE_TYPE_LABELS[instruction.recurrenceType?.id] ?? instruction.recurrenceType?.value ?? "—"}
          />
          {instruction.recurrenceFrequency && (
            <DetailRow label={t("Recurrence Frequency")} value={instruction.recurrenceFrequency?.value ?? "—"} />
          )}
          {instruction.recurrenceInterval && (
            <DetailRow label={t("Recurrence Interval")} value={String(instruction.recurrenceInterval)} />
          )}
          <DetailRow label={t("Valid From")} value={formatDate(instruction.validFrom)} />
          <DetailRow label={t("Valid Till")} value={formatDate(instruction.validTill)} />
          <DetailRow label={t("Last Run")} value={formatDate(instruction.lastRunDate)} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t("Delete Standing Instruction")}
        description={t("Are you sure you want to delete this standing instruction? This action soft-deletes the instruction.")}
        confirmLabel={t("Delete")}
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default StandingInstructionViewPage;
