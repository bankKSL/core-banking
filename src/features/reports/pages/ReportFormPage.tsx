import React, { useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/ErrorState";
import { useReport, useReportTemplate, useCreateReport, useUpdateReport } from "../hooks/useReports";

interface ParameterEntry {
  parameterName: string;
  parameterType: string;
  selectOne: boolean;
  reportParameterName: string;
}

const ReportFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: template, isLoading: isTemplateLoading } = useReportTemplate();
  const { data: existingReport, isLoading: isReportLoading } = useReport(id ? Number(id) : undefined);

  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("");
  const [reportSubType, setReportSubType] = useState("");
  const [reportCategory, setReportCategory] = useState("");
  const [description, setDescription] = useState("");
  const [reportSql, setReportSql] = useState("");
  const [reportActive, setReportActive] = useState(false);
  const [parameters, setParameters] = useState<ParameterEntry[]>([]);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const isLoaded = !!existingReport;
  const resolvedReportName = isLoaded ? (existingReport?.reportName ?? "") : reportName;
  const resolvedReportType = isLoaded ? (existingReport?.reportType ?? "") : reportType;
  const resolvedReportSubType = isLoaded ? (existingReport?.reportSubType ?? "") : reportSubType;
  const resolvedReportCategory = isLoaded ? (existingReport?.reportCategory ?? "") : reportCategory;
  const resolvedDescription = isLoaded ? (existingReport?.description ?? "") : description;
  const resolvedReportSql = isLoaded ? (existingReport?.reportSql ?? "") : reportSql;
  const resolvedUseReport = isLoaded ? (existingReport?.useReport ?? false) : reportActive;
  const resolvedParameters: ParameterEntry[] = useMemo(
    () =>
      isLoaded
        ? (existingReport?.reportParameters?.map((p) => ({
            parameterName: p.parameterName,
            parameterType: p.parameterType,
            selectOne: p.selectOne,
            reportParameterName: p.reportParameterName,
          })) ?? [])
        : parameters,
    [isLoaded, existingReport, parameters],
  );

  const createMutation = useCreateReport();
  const updateMutation = useUpdateReport();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMutationError(null);
      try {
        const payload: Record<string, unknown> = {
          reportName: resolvedReportName,
          reportType: resolvedReportType,
          reportSubType: resolvedReportSubType,
          reportCategory: resolvedReportCategory,
          description: resolvedDescription,
          reportSql: resolvedReportSql,
          useReport: resolvedUseReport,
          reportParameters: resolvedParameters.map((p) => ({
            parameterName: p.parameterName,
            parameterType: p.parameterType,
            selectOne: p.selectOne,
            reportParameterName: p.reportParameterName,
          })),
        };

        if (isEdit) {
          await updateMutation.mutateAsync({ id: Number(id), payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
        navigate("/reports");
      } catch (err: unknown) {
        const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
        const msg =
          error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to save report.";
        setMutationError(msg);
      }
    },
    [resolvedReportName, resolvedReportType, resolvedReportSubType, resolvedReportCategory, resolvedDescription, resolvedReportSql, resolvedUseReport, resolvedParameters, isEdit, id, createMutation, updateMutation, navigate],
  );

  const addParameter = useCallback(() => {
    setParameters((prev) => [
      ...prev,
      { parameterName: "", parameterType: "", selectOne: false, reportParameterName: "" },
    ]);
  }, []);

  const removeParameter = useCallback((index: number) => {
    setParameters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateParameter = useCallback((index: number, field: keyof ParameterEntry, value: unknown) => {
    setParameters((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }, []);

  const isLoading = isTemplateLoading || isReportLoading;

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Report" : "New Report"}
        description="Create or edit a report definition"
        actions={
          <Button variant="outline" onClick={() => navigate("/reports")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        {mutationError && (
          <div className="mb-6">
            <ErrorState message={mutationError} />
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reportName">Report Name *</Label>
              <Input
                id="reportName"
                value={resolvedReportName}
                onChange={(e) => { if (!isLoaded) setReportName(e.target.value); }}
                placeholder="e.g. Client Loan Summary"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Report Type</Label>
                <Select
                  value={resolvedReportType}
                  onValueChange={(v) => { if (!isLoaded) setReportType(v); }}
                  disabled={isLoaded}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.paramTypes ?? []).map((opt) => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Report Sub Type</Label>
                <Select
                  value={resolvedReportSubType}
                  onValueChange={(v) => { if (!isLoaded) setReportSubType(v); }}
                  disabled={isLoaded}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.reportSubTypes ?? []).map((opt) => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Report Category</Label>
                <Select
                  value={resolvedReportCategory}
                  onValueChange={(v) => { if (!isLoaded) setReportCategory(v); }}
                  disabled={isLoaded}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.reportCategories ?? []).map((opt) => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {opt.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={resolvedDescription}
                onChange={(e) => { if (!isLoaded) setDescription(e.target.value); }}
                placeholder="Brief description of the report"
              />
            </div>

            <div>
              <Label htmlFor="reportSql">Report SQL</Label>
              <Textarea
                id="reportSql"
                value={resolvedReportSql}
                onChange={(e) => { if (!isLoaded) setReportSql(e.target.value); }}
                placeholder="SELECT ..."
                rows={6}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="useReport"
                checked={resolvedUseReport}
                onCheckedChange={(checked) => { if (!isLoaded) setReportActive(!!checked); }}
                disabled={isLoaded}
              />
              <Label htmlFor="useReport">Active</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Parameters</CardTitle>
            {!isLoaded && (
              <Button type="button" variant="outline" size="sm" onClick={addParameter}>
                <Plus className="mr-1 h-4 w-4" /> Add Parameter
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {resolvedParameters.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No parameters defined.</p>
            )}
            {resolvedParameters.map((param, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label>Parameter Name</Label>
                    <Input
                      value={param.parameterName}
                      onChange={(e) => updateParameter(index, "parameterName", e.target.value)}
                      disabled={isLoaded}
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <Label>Parameter Type</Label>
                    <Select
                      value={param.parameterType}
                      onValueChange={(v) => updateParameter(index, "parameterType", v)}
                      disabled={isLoaded}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {(template?.paramTypes ?? []).map((opt) => (
                          <SelectItem key={opt.id} value={String(opt.id)}>
                            {opt.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Report Param Name</Label>
                    <Input
                      value={param.reportParameterName}
                      onChange={(e) => updateParameter(index, "reportParameterName", e.target.value)}
                      disabled={isLoaded}
                      placeholder="Report param"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2 pb-2">
                      <Checkbox
                        id={`selectOne-${index}`}
                        checked={param.selectOne}
                        onCheckedChange={(checked) => updateParameter(index, "selectOne", !!checked)}
                        disabled={isLoaded}
                      />
                      <Label htmlFor={`selectOne-${index}`}>Select One</Label>
                    </div>
                    {!isLoaded && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParameter(index)}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/reports")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !resolvedReportName}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update Report" : "Create Report"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReportFormPage;
