import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface StandingInstructionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  transferType: number | null;
  onTransferTypeChange: (value: number | null) => void;
  status: number | null;
  onStatusChange: (value: number | null) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const TRANSFER_TYPE_OPTIONS = [
  { id: 1, label: "Account Transfer" },
  { id: 2, label: "Loan Repayment" },
  { id: 3, label: "Charge Payment" },
];

const STATUS_OPTIONS = [
  { id: 1, label: "Active" },
  { id: 2, label: "Disabled" },
];

const StandingInstructionFilters: React.FC<StandingInstructionFiltersProps> = ({
  search,
  onSearchChange,
  transferType,
  onTransferTypeChange,
  status,
  onStatusChange,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="si-search">Search</Label>
        <Input
          id="si-search"
          placeholder="Search by client name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="w-[180px]">
        <Label>Transfer Type</Label>
        <Select
          value={transferType ? String(transferType) : ""}
          onValueChange={(v) => onTransferTypeChange(v ? Number(v) : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {TRANSFER_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={String(opt.id)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-[150px]">
        <Label>Status</Label>
        <Select
          value={status ? String(status) : ""}
          onValueChange={(v) => onStatusChange(v ? Number(v) : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={String(opt.id)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
        <RotateCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );
};

export { StandingInstructionFilters };
