import { type FC, useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Users, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { useClients, useClientPages } from "../hooks/useClients";
import { useClientTemplate } from "../hooks/useClientTemplate";
import ClientTable from "../components/ClientTable";
import ClientFilters from "../components/ClientFilters";
import { CLIENTS_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from "../constants/status";

const ClientListPage: FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // Read filters from URL
    const page = Number(searchParams.get("page") ?? "1");
    const search = searchParams.get("search") ?? "";
    const officeId = searchParams.get("officeId") ?? "all";
    const staffId = searchParams.get("staffId") ?? "all";
    const status = searchParams.get("status") ?? "all";
    const sortBy = searchParams.get("sortBy") ?? "displayName";
    const sortOrder = (searchParams.get("sortOrder") ?? "ASC") as "ASC" | "DESC";

    // Local search state with debounce
    const [searchInput, setSearchInput] = useState(search);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchInput) {
                params.set("search", searchInput);
            } else {
                params.delete("search");
            }
            params.set("page", "1");
            setSearchParams(params, { replace: true });
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Build query params
    const queryParams = useMemo(() => {
        const params: Record<string, unknown> = {
            offset: (page - 1) * CLIENTS_PAGE_SIZE,
            limit: CLIENTS_PAGE_SIZE,
            orderBy: sortBy,
            sortOrder,
        };
        if (search) params.displayName = search;
        if (officeId !== "all") params.officeId = Number(officeId);
        if (staffId !== "all") params.staffId = Number(staffId);
        if (status !== "all") params.status = Number(status);
        return params;
    }, [page, search, officeId, staffId, status, sortBy, sortOrder]);

    const { data, isLoading, isError, refetch, isRefetching } = useClients(queryParams);
    const { data: template } = useClientTemplate();
    const totalPages = useClientPages(data?.totalFilteredRecords, CLIENTS_PAGE_SIZE);
    const totalRecords = data?.totalFilteredRecords ?? 0;
    const clients = data?.pageItems ?? [];

    const updateParam = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams);
            if (value && value !== "all") {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            if (key !== "page") params.set("page", "1");
            setSearchParams(params, { replace: true });
        },
        [searchParams, setSearchParams],
    );

    const handlePageChange = useCallback(
        (newPage: number) => updateParam("page", String(newPage)),
        [updateParam],
    );

    if (isError) {
        return (
            <div className="p-6">
                <ErrorState
                    title="Failed to load clients"
                    message="There was an error fetching the client list. Please try again."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                title="Clients"
                description="Manage clients registered in Apache Fineract"
                actions={
                    <Button onClick={() => navigate("/clients/new")} className="bg-[#D32F2F] hover:bg-red-700">
                        <Plus className="mr-2 h-4 w-4" />Create Client
                    </Button>
                }
            />

            <div className="mb-4">
                <ClientFilters
                    search={searchInput}
                    onSearchChange={setSearchInput}
                    officeId={officeId}
                    onOfficeChange={(v) => updateParam("officeId", v)}
                    staffId={staffId}
                    onStaffChange={(v) => updateParam("staffId", v)}
                    status={status}
                    onStatusChange={(v) => updateParam("status", v)}
                    onRefresh={() => refetch()}
                    isRefreshing={isRefetching}
                    template={template}
                    isLoading={isLoading}
                />
            </div>

            <ClientTable data={clients} loading={isLoading} />

            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalRecords}
                    pageSize={CLIENTS_PAGE_SIZE}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

export default ClientListPage;
