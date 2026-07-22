import { type FC, useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { useLoans } from "../hooks/useLoans";
import LoanTable from "../components/LoanTable";
import LoanFilters from "../components/LoanFilters";
import { LOANS_PAGE_SIZE, LOAN_SEARCH_DEBOUNCE_MS, LOAN_STATUS_CONFIG } from "../constants/status";

const LoansListPage: FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const page = Number(searchParams.get("page") ?? "1");
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "all";

    const [searchInput, setSearchInput] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchInput) params.set("search", searchInput);
            else params.delete("search");
            params.set("page", "1");
            setSearchParams(params, { replace: true });
        }, LOAN_SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const queryParams = useMemo(() => {
        const params: Record<string, unknown> = {
            offset: (page - 1) * LOANS_PAGE_SIZE,
            limit: LOANS_PAGE_SIZE,
        };
        if (search) params.searchByParam = search;
        if (status !== "all") {
            const codeToId: Record<string, number> = {
                "Submitted and pending approval": 100,
                "Approved": 200,
                "Active": 300,
                "Closed (obligations met)": 600,
                "Closed (written off)": 601,
                "Closed (rescheduled)": 602,
                "Overpaid": 700,
            };
            const statusId = codeToId[status];
            if (statusId) params.status = String(statusId);
        }
        return params;
    }, [page, search, status]);

    const { data, isLoading, isError, refetch, isRefetching } = useLoans(queryParams);

    const totalRecords = data?.totalFilteredRecords ?? 0;
    const loans = data?.pageItems ?? [];
    const totalPages = Math.max(1, Math.ceil(totalRecords / LOANS_PAGE_SIZE));
    const safePage = Math.min(page, totalPages);

    const updateParam = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams);
            if (value && value !== "all") params.set(key, value);
            else params.delete(key);
            if (key !== "page") params.set("page", "1");
            setSearchParams(params, { replace: true });
        },
        [searchParams, setSearchParams],
    );

    const handlePageChange = useCallback((newPage: number) => updateParam("page", String(newPage)), [updateParam]);

    if (isError) {
        return (
            <div className="p-6">
                <ErrorState title="Failed to load loans" message="There was an error fetching the loan list. Please try again." onRetry={() => refetch()} />
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                title="Loans"
                description="Manage loan accounts in Apache Fineract"
                actions={
                    <Button onClick={() => navigate("/loans/create")} className="bg-[#D32F2F] hover:bg-red-700">
                        <Plus className="mr-2 h-4 w-4" />Create Loan
                    </Button>
                }
            />
            <div className="mb-4">
                <LoanFilters
                    search={searchInput}
                    onSearchChange={setSearchInput}
                    status={status}
                    onStatusChange={(v) => updateParam("status", v)}
                    onRefresh={() => refetch()}
                    isRefreshing={isRefetching}
                />
            </div>
            <LoanTable data={loans} loading={isLoading} />
            {totalPages > 1 && (
                <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    totalItems={totalRecords}
                    pageSize={LOANS_PAGE_SIZE}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

export default LoansListPage;
