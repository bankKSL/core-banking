import React from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OfficeFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    parentFilter: string;
    onParentFilterChange: (value: string) => void;
}

const OfficeFilters: React.FC<OfficeFiltersProps> = ({
    search,
    onSearchChange,
    parentFilter,
    onParentFilterChange,
}) => {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                    placeholder="Search offices..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Parent filter */}
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={parentFilter} onValueChange={onParentFilterChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All offices" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All offices</SelectItem>
                        <SelectItem value="root">Root offices only</SelectItem>
                        <SelectItem value="children">Child offices only</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default OfficeFilters;
