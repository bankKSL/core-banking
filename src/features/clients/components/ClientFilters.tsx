import type { FC } from "react";
import { Search, RotateCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ClientTemplate } from "../types/client";
import { STATUS_ID_MAP, CLIENT_STATUS_LABELS } from "../constants/status";

interface ClientFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    officeId: string;
    onOfficeChange: (value: string) => void;
    staffId: string;
    onStaffChange: (value: string) => void;
    status: string;
    onStatusChange: (value: string) => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    template?: ClientTemplate;
    isLoading: boolean;
}

const ClientFilters: FC<ClientFiltersProps> = ({
    search,
    onSearchChange,
    officeId,
    onOfficeChange,
    staffId,
    onStaffChange,
    status,
    onStatusChange,
    onRefresh,
    isRefreshing,
    template,
    isLoading,
}) => {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search by name, account no, mobile..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-10 pl-9"
                />
            </div>

            {/* Office filter */}
            <Select value={officeId} onValueChange={onOfficeChange} disabled={isLoading}>
                <SelectTrigger className="h-10 w-[170px]">
                    <SelectValue placeholder="All Offices" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Offices</SelectItem>
                    {template?.officeOptions?.map((office) => (
                        <SelectItem key={office.id} value={String(office.id)}>
                            {office.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Staff filter */}
            <Select value={staffId} onValueChange={onStaffChange} disabled={isLoading}>
                <SelectTrigger className="h-10 w-[170px]">
                    <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {template?.staffOptions?.map((staff) => (
                        <SelectItem key={staff.id} value={String(staff.id)}>
                            {staff.displayName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={status} onValueChange={onStatusChange} disabled={isLoading}>
                <SelectTrigger className="h-10 w-[150px]">
                    <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(STATUS_ID_MAP).map(([id, code]) => (
                        <SelectItem key={id} value={id}>
                            {CLIENT_STATUS_LABELS[code] ?? code}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Refresh */}
            <Button
                variant="outline"
                size="default"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-10"
                aria-label="Refresh client list"
            >
                <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
        </div>
    );
};

export default ClientFilters;
