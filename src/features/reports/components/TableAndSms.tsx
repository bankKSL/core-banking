import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { exportToCsv, exportToXls } from "../utils/export.utils";
import type { RunReportData } from "../api/reports";

interface TableAndSmsProps {
  dataObject: {
    formData: Record<string, string>;
    report: { name: string; type: string };
    decimalChoice: string;
  };
  reportData: RunReportData | undefined;
  isLoading: boolean;
  hasError: boolean;
}

export function TableAndSms({ dataObject, reportData, isLoading, hasError }: TableAndSmsProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState(`${dataObject.report.name}.csv`);
  const [exportDelimiter, setExportDelimiter] = useState(",");

  const displayedColumns = useMemo(() => {
    if (!reportData) return [];
    return reportData.columnHeaders.map((h) => h.columnName);
  }, [reportData]);

  const columnTypes = useMemo(() => {
    if (!reportData) return [];
    return reportData.columnHeaders.map((h) => h.columnDisplayType || h.columnType);
  }, [reportData]);

  const rows = useMemo(() => {
    if (!reportData) return [];
    return reportData.data.map((item) => item.row);
  }, [reportData]);

  const totalPages = Math.ceil(rows.length / pageSize);
  const paginatedRows = rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const isDecimal = useCallback(
    (index: number) => columnTypes[index] === "DECIMAL",
    [columnTypes],
  );

  const toDecimal = useCallback(
    (value: string | number | null) => {
      if (value == null) return "—";
      const num = Number(value);
      if (isNaN(num)) return value;
      return num.toFixed(Number(dataObject.decimalChoice));
    },
    [dataObject.decimalChoice],
  );

  const handleExportCsv = useCallback(() => {
    exportToCsv(displayedColumns, rows, exportFileName, exportDelimiter);
    setShowExportDialog(false);
  }, [displayedColumns, rows, exportFileName, exportDelimiter]);

  const handleExportXls = useCallback(() => {
    exportToXls(displayedColumns, rows, `${dataObject.report.name}.xls`);
  }, [displayedColumns, rows, dataObject.report.name]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#D32F2F]" />
        <span className="ml-3 text-gray-600">{t("Loading report data...")}</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-16">
        <div className="text-red-500 text-lg font-medium">{t("Failed to load report data")}</div>
        <p className="text-gray-500 mt-2">{t("Please try again or check the report parameters.")}</p>
      </div>
    );
  }

  if (!reportData || rows.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500 text-lg">{t("No report data was generated")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dataObject.report.type === "Table" && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {rows.length} {t("records")}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {t("Export CSV")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportXls}>
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
              {t("Export XLS")}
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {displayedColumns.map((col, i) => (
                <TableHead key={col} className="whitespace-nowrap">
                  {col}
                  {isDecimal(i) && (
                    <span className="ml-1 text-xs text-gray-400">DEC</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    className={`whitespace-nowrap ${isDecimal(cellIndex) ? "text-right" : ""}`}
                  >
                    {isDecimal(cellIndex) ? toDecimal(cell) : (cell ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t("Rows per page")}:</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(0); }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="300">300</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, rows.length)} {t("of")} {rows.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              {t("Previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              {t("Next")}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Export data to File")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Delimiter")}</label>
              <Select value={exportDelimiter} onValueChange={setExportDelimiter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value=":">Colon (:)</SelectItem>
                  <SelectItem value=";">;Semicolon (;)</SelectItem>
                  <SelectItem value="|">Pipe (|)</SelectItem>
                  <SelectItem value=" ">Space ( )</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("File Name")}</label>
              <Input
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                placeholder="filename.csv"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleExportCsv}>
              {t("Export to File")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
