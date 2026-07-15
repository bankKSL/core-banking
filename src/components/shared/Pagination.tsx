import React, { useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    pageSize: number;
    className?: string;
}

function getVisiblePages(currentPage: number, totalPages: number): (number | "ellipsis-start" | "ellipsis-end")[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [1];

    if (currentPage <= 3) {
        for (let i = 2; i <= 5; i++) pages.push(i);
        pages.push("ellipsis-end");
        pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
        pages.push("ellipsis-start");
        for (let i = totalPages - 4; i < totalPages; i++) pages.push(i);
        pages.push(totalPages);
    } else {
        pages.push("ellipsis-start");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("ellipsis-end");
        pages.push(totalPages);
    }

    return pages;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, totalItems, pageSize, className }) => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const visiblePages = useMemo(() => getVisiblePages(currentPage, totalPages), [currentPage, totalPages]);

    const handlePrevious = useCallback(() => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    }, [currentPage, onPageChange]);

    const handleNext = useCallback(() => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    }, [currentPage, totalPages, onPageChange]);

    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;

    if (totalPages <= 0) return null;

    return (
        <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4", className)}>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium text-gray-900 dark:text-gray-100">{startItem}</span> to{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">{endItem}</span> of{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">{totalItems}</span> results
            </p>

            <nav className="flex items-center gap-1" aria-label="Pagination">
                <Button variant="outline" size="sm" onClick={handlePrevious} disabled={isFirstPage} aria-label="Go to previous page">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                    {visiblePages.map((page) => {
                        if (page === "ellipsis-start" || page === "ellipsis-end") {
                            return (
                                <span key={page} className="flex h-8 w-8 items-center justify-center text-sm text-gray-400" aria-hidden>
                                    &hellip;
                                </span>
                            );
                        }

                        const isActive = page === currentPage;
                        return (
                            <Button
                                key={`page-${page}`}
                                variant={isActive ? "default" : "outline"}
                                size="sm"
                                className={cn("h-8 w-8 p-0", isActive && "bg-[#D32F2F] text-white hover:bg-[#D32F2F]/90")}
                                onClick={() => onPageChange(page)}
                                aria-label={`Go to page ${page}`}
                                aria-current={isActive ? "page" : undefined}
                            >
                                {page}
                            </Button>
                        );
                    })}
                </div>

                <Button variant="outline" size="sm" onClick={handleNext} disabled={isLastPage} aria-label="Go to next page">
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </nav>
        </div>
    );
};

export { Pagination };
export type { PaginationProps };
