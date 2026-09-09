import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useReportParams, useSelectOptions, useRunTableReport, useRunChartReport } from "../hooks/useReports";
import { formatUserResponse } from "../api/reports";
import { TableAndSms } from "../components/TableAndSms";
import { ChartOutput } from "../components/ChartOutput";
import { PentahoOutput } from "../components/PentahoOutput";
import { BirtOutput } from "../components/BirtOutput";
import type { ReportParameter, SelectOption } from "../api/reports";

const OUTPUT_TYPE_OPTIONS = [
  { value: "PDF", label: "PDF format" },
  { value: "HTML", label: "Normal format" },
  { value: "XLS", label: "Excel format" },
  { value: "XLSX", label: "Excel 2007 format" },
  { value: "CSV", label: "CSV format" },
];

const DECIMAL_OPTIONS = ["0", "1", "2", "3", "4"];

export default function RunReportPage() {
  const { t } = useTranslation();
  const { name } = useParams<{ name: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reportType = searchParams.get("type") || "Table";

  const isTableReport = reportType === "Table" || reportType === "SMS";
  const isChartReport = reportType === "Chart";
  const isPentahoReport = reportType === "Pentaho";
  const isBirtReport = reportType === "BIRT";

  const defaultOutput = isChartReport ? "HTML" : isPentahoReport || isBirtReport ? "PDF" : "HTML";

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string | SelectOption>>({});
  const [outputType, setOutputType] = useState(defaultOutput);
  const [decimalChoice, setDecimalChoice] = useState("2");
  const [reportData, setReportData] = useState<Record<string, unknown> | undefined>(undefined);
  const [hasError, setHasError] = useState(false);

  const { data: paramData, isLoading: isLoadingParams } = useReportParams(name);
  const tableReportMutation = useRunTableReport();
  const chartReportMutation = useRunChartReport();

  const handleParamChange = useCallback((paramName: string, value: string | SelectOption) => {
    setParamValues((prev) => ({ ...prev, [paramName]: value }));
  }, []);

  const isFormValid = useMemo(() => {
    if (!paramData) return false;
    return paramData.every((param) => {
      if (param.parentParameterName) return true;
      const value = paramValues[param.name];
      return value !== undefined && value !== "";
    });
  }, [paramData, paramValues]);

  const handleRun = useCallback(() => {
    if (!name || !paramData) return;

    const formattedParams = formatUserResponse(paramData ? Object.fromEntries(
      Object.entries(paramValues).map(([key, value]) => {
        const param = paramData.find((p) => p.name === key);
        if (param?.displayType === "select" && typeof value === "object") {
          return [key, value];
        }
        return [key, String(value)];
      })
    ) : {}, paramData, reportType);

    setIsCollapsed(true);
    setHasError(false);

    if (isTableReport) {
      tableReportMutation.mutate(
        { reportName: name, params: formattedParams },
        {
          onSuccess: (data) => {
            setReportData(data as unknown as Record<string, unknown>);
          },
          onError: () => {
            setHasError(true);
          },
        },
      );
    } else if (isChartReport) {
      chartReportMutation.mutate(
        { reportName: name, params: formattedParams },
        {
          onSuccess: (data) => {
            setReportData(data as unknown as Record<string, unknown>);
          },
          onError: () => {
            setHasError(true);
          },
        },
      );
    }
  }, [name, paramData, paramValues, reportType, isTableReport, isChartReport, tableReportMutation, chartReportMutation]);

  const dataObject = useMemo(() => ({
    formData: { ...paramValues, outputType } as Record<string, string>,
    report: { name: name ?? "", type: reportType },
    decimalChoice,
  }), [paramValues, outputType, name, reportType, decimalChoice]);

  if (isLoadingParams) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/reports")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("Back")}
        </Button>
        <h1 className="text-2xl font-bold">{name}</h1>
        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 rounded">{reportType}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !isCollapsed ? "bg-[#D32F2F] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setIsCollapsed(false)}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
          {t("Parameters")}
        </button>
        <div className="w-8 h-px bg-gray-300" />
        <button
          type="button"
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isCollapsed ? "bg-[#D32F2F] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          disabled={!isCollapsed}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
          {t("Results")}
        </button>
      </div>

      {!isCollapsed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{t("Filters")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paramData?.map((param) => {
                if (param.parentParameterName) return null;
                return (
                  <ParameterField
                    key={param.name}
                    param={param}
                    paramData={paramData}
                    allParamValues={paramValues}
                    value={paramValues[param.name] ?? ""}
                    onChange={(value) => handleParamChange(param.name, value)}
                  />
                );
              })}
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="block text-sm font-medium">{t("Decimal Places")}</Label>
                  <div className="flex gap-1">
                    {DECIMAL_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDecimalChoice(d)}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                          decimalChoice === d
                            ? "bg-[#D32F2F] text-white border-[#D32F2F]"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {(isPentahoReport || isBirtReport) && (
                  <div className="space-y-1.5 lg:col-span-2">
                    <Label className="block text-sm font-medium">{t("Output Type")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {OUTPUT_TYPE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setOutputType(option.value)}
                          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            outputType === option.value
                              ? "bg-[#D32F2F] text-white border-[#D32F2F]"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <span className="font-mono text-xs mr-1">{option.value}</span>
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <div className="flex justify-end gap-3 p-6 pt-0">
            <Button variant="outline" onClick={() => navigate("/reports")}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={handleRun}
              disabled={!isFormValid || tableReportMutation.isPending || chartReportMutation.isPending}
            >
              {(tableReportMutation.isPending || chartReportMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("Running...")}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {t("Run Report")}
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {isCollapsed && (
        <div className="space-y-4">
          {isTableReport && (
            <TableAndSms
              dataObject={dataObject}
              reportData={reportData as Parameters<typeof TableAndSms>[0]["reportData"]}
              isLoading={tableReportMutation.isPending}
              hasError={hasError}
            />
          )}
          {isChartReport && (
            <ChartOutput
              dataObject={dataObject}
              reportData={reportData as Parameters<typeof ChartOutput>[0]["reportData"]}
              isLoading={chartReportMutation.isPending}
              hasError={hasError}
            />
          )}
          {isPentahoReport && <PentahoOutput dataObject={dataObject} />}
          {isBirtReport && <BirtOutput dataObject={dataObject} />}

          <div className="pt-4">
            <Button variant="outline" onClick={() => navigate("/reports")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("Back")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ParameterFieldProps {
  param: ReportParameter;
  value: string | SelectOption;
  onChange: (value: string | SelectOption) => void;
}

function ParameterField({ param, value, onChange }: ParameterFieldProps) {
  const { t } = useTranslation();

  const selectInputString = param.displayType === "select" ? `${param.name}` : undefined;
  const { data: options, isLoading: isLoadingOptions } = useSelectOptions(selectInputString);

  switch (param.displayType) {
    case "text":
      return (
        <div className="space-y-1.5">
          <Label className="block text-sm text-gray-600">
            {param.label || param.name}<span className="text-red-500">*</span>
          </Label>
          <Input
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={param.label || param.name}
            required
          />
        </div>
      );

    case "date":
      return (
        <div className="space-y-1.5">
          <Label className="block text-sm text-gray-600">
            {param.label || param.name}<span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            required
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-1.5">
          <Label className="block text-sm text-gray-600">
            {param.label || param.name}<span className="text-red-500">*</span>
          </Label>
          <Select
            value={typeof value === "object" ? String(value.id) : (value as string)}
            onValueChange={(v) => {
              const selected = options?.find((o) => String(o.id) === v);
              if (selected) {
                onChange(selected);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("Select value")} />
            </SelectTrigger>
            <SelectContent>
              {isLoadingOptions ? (
                <div className="px-2 py-1.5">
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (options ?? []).length > 0 ? (
                (options ?? []).map((opt) => (
                  <SelectItem key={opt.id} value={String(opt.id)}>
                    {opt.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  {t("No options available")}
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      );

    case "none":
      return null;

    default:
      return (
        <div className="space-y-1.5">
          <Label className="block text-sm text-gray-600">
            {param.label || param.name}
          </Label>
          <Input
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={param.label || param.name}
          />
        </div>
      );
  }
}
