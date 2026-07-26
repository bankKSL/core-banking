import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Repeat } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useStandingInstructions } from "../hooks/useStandingInstructions";
import { StandingInstructionTable } from "../components/StandingInstructionTable";
import { StandingInstructionFilters } from "../components/StandingInstructionFilters";
import type { StandingInstruction } from "../types/standing-instruction.types";

const StandingInstructionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [transferType, setTransferType] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);

  const params = useMemo(
    () => ({
      ...(search ? { clientName: search } : {}),
      ...(transferType ? { transferType } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    [search, transferType, statusFilter],
  );

  const { data, isLoading, isError, refetch, isRefetching } = useStandingInstructions(params);

  const instructions = useMemo(() => data?.pageItems ?? [], [data]);

  const handleRowClick = useCallback(
    (row: StandingInstruction) => {
      navigate(`/transfers/standing-instructions/edit/${row.id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Standing Instructions"
          description="Manage recurring transfer instructions"
          actions={
            <Button onClick={() => navigate("/transfers/standing-instructions/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Instruction
            </Button>
          }
        />
        <ErrorState message="Failed to load standing instructions." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Standing Instructions"
        description="Manage recurring transfer instructions"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/transfers/standing-instructions/history")}>
              View History
            </Button>
            <Button onClick={() => navigate("/transfers/standing-instructions/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Instruction
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StandingInstructionFilters
            search={search}
            onSearchChange={setSearch}
            transferType={transferType}
            onTransferTypeChange={setTransferType}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            onRefresh={refetch}
            isRefreshing={isRefetching}
          />

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : instructions.length === 0 ? (
            <EmptyState title="No standing instructions found." />
          ) : (
            <StandingInstructionTable data={instructions} onRowClick={handleRowClick} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StandingInstructionListPage;
