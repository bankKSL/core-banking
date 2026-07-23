import type { FC } from "react";
import { Search, RefreshCw, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LOAN_STATUS_CONFIG } from "../constants/status";

interface LoanFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const LoanFilters: FC<LoanFiltersProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by account no, client name, product..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-44">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.entries(LOAN_STATUS_CONFIG).map(([code, cfg]) => (
            <SelectItem key={code} value={code}>
              {cfg.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing}>
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
};

export default LoanFilters;
export type { LoanFiltersProps };
