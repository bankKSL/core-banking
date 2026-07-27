import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useCharges, useDeleteCharge } from "../hooks/useCharges";
import type { Charge } from "../api/charges";

const CHARGE_APPLIES_TO_LABELS: Record<number, string> = {
  1: "Loan",
  2: "Savings",
  3: "Client",
  4: "Shares",
  5: "Working Capital Loan",
};

const ChargeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: charges = [], isLoading, isError, refetch } = useCharges();
  const deleteMutation = useDeleteCharge();
  const [deleteTarget, setDeleteTarget] = useState<Charge | null>(null);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch {
      // handled by mutation
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const columns: ColumnDef<Charge>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        accessorFn: (row) => <span className="font-medium">{row.name}</span>,
      },
      {
        key: "type",
        header: "Type",
        accessorFn: (row) =>
          row.penalty ? <Badge variant="error" size="sm">Penalty</Badge> : <Badge variant="info" size="sm">Fee</Badge>,
      },
      {
        key: "chargeAppliesTo",
        header: "Applies To",
        accessorFn: (row) => CHARGE_APPLIES_TO_LABELS[row.chargeAppliesTo?.id] ?? row.chargeAppliesTo?.value ?? "—",
      },
      {
        key: "chargeTimeType",
        header: "Time",
        accessorFn: (row) => row.chargeTimeType?.value ?? "—",
      },
      {
        key: "chargeCalculationType",
        header: "Calculation",
        accessorFn: (row) => row.chargeCalculationType?.value ?? "—",
      },
      {
        key: "amount",
        header: "Amount",
        accessorFn: (row) =>
          `${row.amount?.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${row.currencyCode ?? ""}`,
      },
      {
        key: "active",
        header: "Status",
        accessorFn: (row) => (row.active ? <StatusBadge status="active" /> : <StatusBadge status="inactive" />),
      },
      {
        key: "actions",
        header: "",
        className: "w-[60px]",
        cell: (row) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (charge: Charge) => {
      navigate(`/charges/edit/${charge.id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Charges"
          description="Define fees and penalties"
          actions={
            <Button onClick={() => navigate("/charges/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Charge
            </Button>
          }
        />
        <ErrorState message="Failed to load charges." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Charges"
        description="Define fees and penalties for loans, savings, client accounts"
        actions={
          <Button onClick={() => navigate("/charges/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Charge
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Charges</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={charges}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: "No charges defined." }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Charge"
        description="Are you sure you want to delete this charge?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ChargeListPage;
