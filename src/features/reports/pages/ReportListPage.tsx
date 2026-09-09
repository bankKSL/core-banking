import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Play, Trash2, Search, Pin, PinOff, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/ErrorState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useReports, useDeleteReport } from "../hooks/useReports";
import type { Report } from "../api/reports";

const PIN_KEY = "pinnedReports";
const COLLAPSED_KEY = "collapsedReportCategories";

function getPinned(): number[] {
  try {
    return JSON.parse(localStorage.getItem(PIN_KEY) || "[]");
  } catch {
    return [];
  }
}

function getCollapsed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "[]");
  } catch {
    return [];
  }
}

const ReportListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinned, setPinned] = useState<number[]>(getPinned);
  const [collapsed, setCollapsed] = useState<string[]>(getCollapsed);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const activeCategory = searchParams.get("category") || "all";

  const { data: reports, isLoading, isError, refetch } = useReports();
  const deleteMutation = useDeleteReport();

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // handled by mutation
    }
  }, [deleteTarget, deleteMutation]);

  const togglePin = useCallback((reportId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinned((prev) => {
      const next = prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId];
      localStorage.setItem(PIN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setCollapsed((prev) => {
      const next = prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category];
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setCategory = useCallback(
    (category: string) => {
      if (category === "all") {
        searchParams.delete("category");
      } else {
        searchParams.set("category", category);
      }
      setSearchParams(searchParams);
      setCurrentPage(1);
    },
    [searchParams, setSearchParams],
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    (reports ?? []).forEach((r) => {
      if (r.reportCategory) cats.add(r.reportCategory);
    });
    return ["all", ...Array.from(cats).sort()];
  }, [reports]);

  const filteredReports = useMemo(() => {
    let result = reports ?? [];

    if (activeCategory !== "all") {
      result = result.filter((r) => r.reportCategory === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.reportName?.toLowerCase().includes(q) ||
          r.reportType?.toLowerCase().includes(q) ||
          r.reportCategory?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [reports, activeCategory, searchQuery]);

  const pinnedReports = useMemo(() => filteredReports.filter((r) => pinned.includes(r.id)), [filteredReports, pinned]);

  const unpinnedReports = useMemo(
    () => filteredReports.filter((r) => !pinned.includes(r.id)),
    [filteredReports, pinned],
  );

  const groupedReports = useMemo(() => {
    const groups: Record<string, Report[]> = {};
    unpinnedReports.forEach((r) => {
      const cat = r.reportCategory || t("Uncategorized");
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });
    return groups;
  }, [unpinnedReports, t]);

  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const paginatedPinned = pinnedReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Reports")}
          description={t("Browse and run reports")}
          actions={
            <Button onClick={() => navigate("/reports/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Report")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load reports.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Reports")}
        description={t("Browse and run reports")}
        actions={
          <Button onClick={() => navigate("/reports/new")}>
            <Plus className="mr-2 h-4 w-4" /> {t("New Report")}
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="md:w-64 shrink-0">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{t("Categories")}</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeCategory === cat ? "bg-[#D32F2F] text-white font-medium" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {cat === "all" ? t("All Reports") : cat}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t("Search reports...")}
              className="pl-10"
            />
          </div>

          {pinnedReports.length > 0 && (
            <Card className="border-[#D32F2F]/20 bg-red-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Pin className="h-4 w-4 text-[#D32F2F]" />
                  {t("Pinned Reports")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(currentPage === 1 ? pinnedReports : paginatedPinned).map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      pinned={true}
                      onPin={togglePin}
                      onRun={(r) =>
                        navigate(`/reports/run/${encodeURIComponent(r.reportName)}?type=${r.reportType}&id=${r.id}`)
                      }
                      onDelete={setDeleteTarget}
                      onView={(r) => navigate(`/reports/${r.id}`)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">{t("No reports found.")}</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedReports).map(([category, reports]) => (
                    <div key={category}>
                      <button
                        onClick={() => toggleCategory(category)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 hover:text-[#D32F2F] transition-colors"
                      >
                        {collapsed.includes(category) ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        {category}
                        <Badge className="text-xs">{reports.length}</Badge>
                      </button>
                      {!collapsed.includes(category) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {reports.map((report) => (
                            <ReportCard
                              key={report.id}
                              report={report}
                              pinned={false}
                              onPin={togglePin}
                              onRun={(r) =>
                                navigate(
                                  `/reports/run/${encodeURIComponent(r.reportName)}?type=${r.reportType}&id=${r.id}`,
                                )
                              }
                              onDelete={setDeleteTarget}
                              onView={(r) => navigate(`/reports/${r.id}`)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <span className="text-sm text-gray-600">
                    {t("Showing")} {(currentPage - 1) * pageSize + 1}-
                    {Math.min(currentPage * pageSize, filteredReports.length)} {t("of")} {filteredReports.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      {t("Previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      {t("Next")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("Delete Report")}
        description={`${t("Are you sure you want to delete")} "${deleteTarget?.reportName}"?`}
        confirmLabel={t("Delete")}
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

interface ReportCardProps {
  report: Report;
  pinned: boolean;
  onPin: (id: number, e: React.MouseEvent) => void;
  onRun: (report: Report) => void;
  onDelete: (report: Report) => void;
  onView: (report: Report) => void;
}

function ReportCard({ report, pinned, onPin, onRun, onDelete, onView }: ReportCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onView(report)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium truncate" title={report.reportName}>
            {report.reportName}
          </h4>
          {report.reportCategory && <Badge className="text-xs mt-1">{report.reportCategory}</Badge>}
        </div>
        <button
          onClick={(e) => onPin(report.id, e)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
          title={pinned ? t("Unpin") : t("Pin")}
        >
          {pinned ? <PinOff className="h-3.5 w-3.5 text-[#D32F2F]" /> : <Pin className="h-3.5 w-3.5 text-gray-400" />}
        </button>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Button
          variant="default"
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onRun(report);
          }}
        >
          <Play className="mr-1 h-3 w-3" />
          {t("Run")}
        </Button>
        {!report.coreReport && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(report);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default ReportListPage;
