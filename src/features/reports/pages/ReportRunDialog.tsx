import React, { useState, useCallback } from "react";
import { Play, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRunReport } from "../hooks/useReports";
import type { Report } from "../api/reports";

interface ReportRunDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OUTPUT_TYPES = [
  { value: "HTML", label: "HTML" },
  { value: "CSV", label: "CSV" },
  { value: "XLS", label: "XLS" },
  { value: "PDF", label: "PDF" },
];

const ReportRunDialog: React.FC<ReportRunDialogProps> = ({ report, open, onOpenChange }) => {
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [outputType, setOutputType] = useState("HTML");
  const runReportMutation = useRunReport();

  const handleParamChange = useCallback((name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRun = useCallback(async () => {
    if (!report) return;
    try {
      await runReportMutation.mutateAsync({
        reportName: report.reportName,
        params: { ...paramValues, outputType },
      });
    } catch {
      // handled by mutation
    }
  }, [report, paramValues, outputType, runReportMutation]);

  const result = runReportMutation.data;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setParamValues({});
        setOutputType("HTML");
        runReportMutation.reset();
      }
      onOpenChange(open);
    },
    [onOpenChange, runReportMutation],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Run Report: {report?.reportName}</DialogTitle>
          <DialogDescription>Set parameters and run the report</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Output Type</Label>
            <Select value={outputType} onValueChange={setOutputType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_TYPES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(report?.reportParameters ?? []).length > 0 && (
            <div className="space-y-3">
              <Label>Parameters</Label>
              {report?.reportParameters.map((param) => (
                <div key={param.id} className="grid grid-cols-2 gap-2 items-center">
                  <Label>{param.parameterName}</Label>
                  {param.selectOne ? (
                    <Select
                      value={paramValues[param.parameterName] ?? ""}
                      onValueChange={(v) => handleParamChange(param.parameterName, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select value" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={paramValues[param.parameterName] ?? ""}
                      onChange={(e) => handleParamChange(param.parameterName, e.target.value)}
                      placeholder={param.parameterName}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {result && (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {result.columnHeaders.map((col) => (
                      <TableHead key={col.columnName}>{col.columnName}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={result.columnHeaders.length} className="text-center text-gray-500">
                        No results
                      </TableCell>
                    </TableRow>
                  ) : (
                    result.data.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex}>{cell ?? "—"}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleRun} disabled={runReportMutation.isPending}>
            {runReportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Run
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ReportRunDialog };
