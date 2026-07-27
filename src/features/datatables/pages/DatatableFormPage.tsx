import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/ErrorState";
import { useCreateDatatable } from "../hooks/useDatatables";

const APPTABLE_OPTIONS = [
  { value: "m_client", label: "Client" },
  { value: "m_group", label: "Group" },
  { value: "m_loan", label: "Loan" },
  { value: "m_office", label: "Office" },
  { value: "m_saving_account", label: "Saving Account" },
  { value: "m_product_loan", label: "Product Loan" },
  { value: "m_savings_product", label: "Savings Product" },
];

const COLUMN_TYPE_OPTIONS = [
  "Boolean",
  "Date",
  "DateTime",
  "Decimal",
  "Dropdown",
  "Number",
  "String",
  "Text",
];

interface ColumnRow {
  id: string;
  name: string;
  type: string;
  length: number;
  mandatory: boolean;
}

const DatatableFormPage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateDatatable();

  const [datatableName, setDatatableName] = useState("");
  const [apptableName, setApptableName] = useState("");
  const [multiRow, setMultiRow] = useState(false);
  const [columns, setColumns] = useState<ColumnRow[]>([
    { id: crypto.randomUUID(), name: "", type: "String", length: 0, mandatory: false },
  ]);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const addColumn = useCallback(() => {
    setColumns((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", type: "String", length: 0, mandatory: false },
    ]);
  }, []);

  const removeColumn = useCallback((id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateColumn = useCallback((id: string, field: keyof ColumnRow, value: string | number | boolean) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMutationError(null);

      if (!datatableName.trim()) {
        setMutationError("Datatable name is required.");
        return;
      }
      if (!apptableName) {
        setMutationError("App table is required.");
        return;
      }
      const validColumns = columns.filter((c) => c.name.trim());
      if (validColumns.length === 0) {
        setMutationError("At least one column with a name is required.");
        return;
      }

      try {
        await createMutation.mutateAsync({
          datatableName: datatableName.trim(),
          apptableName,
          multiRow,
          columns: validColumns.map((c) => ({
            name: c.name.trim(),
            type: c.type,
            length: c.length,
            mandatory: c.mandatory,
          })),
        });
        navigate("/datatables");
      } catch (err: unknown) {
        const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
        const msg =
          error?.response?.data?.errors?.[0]?.defaultUserMessage ??
          "Failed to create datatable.";
        setMutationError(msg);
      }
    },
    [datatableName, apptableName, multiRow, columns, createMutation, navigate],
  );

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title="New Datatable"
        description="Create or register a new datatable"
        actions={
          <Button variant="outline" onClick={() => navigate("/datatables")}>
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
            <CardTitle>Datatable Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="datatableName">Datatable Name *</Label>
              <Input
                id="datatableName"
                value={datatableName}
                onChange={(e) => setDatatableName(e.target.value)}
                placeholder="e.g. extra_client_details"
              />
            </div>

            <div>
              <Label htmlFor="apptableName">App Table *</Label>
              <Select value={apptableName} onValueChange={setApptableName}>
                <SelectTrigger id="apptableName">
                  <SelectValue placeholder="Select app table" />
                </SelectTrigger>
                <SelectContent>
                  {APPTABLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="multiRow"
                checked={multiRow}
                onCheckedChange={(checked) => setMultiRow(checked === true)}
              />
              <Label htmlFor="multiRow" className="cursor-pointer">Allow multiple rows per entity</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Columns</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addColumn}>
              <Plus className="h-4 w-4 mr-1" /> Add Column
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {columns.map((col, index) => (
              <div key={col.id} className="flex items-start gap-4 p-4 border rounded-lg relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeColumn(col.id)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Name *</Label>
                  <Input
                    value={col.name}
                    onChange={(e) => updateColumn(col.id, "name", e.target.value)}
                    placeholder={`Column ${index + 1}`}
                  />
                </div>

                <div className="w-40 space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={col.type} onValueChange={(v) => updateColumn(col.id, "type", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {col.type !== "Text" && col.type !== "Dropdown" && (
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Length</Label>
                    <Input
                      type="number"
                      min="0"
                      value={col.length || ""}
                      onChange={(e) => updateColumn(col.id, "length", Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    id={`mandatory-${col.id}`}
                    checked={col.mandatory}
                    onCheckedChange={(checked) => updateColumn(col.id, "mandatory", checked === true)}
                  />
                  <Label htmlFor={`mandatory-${col.id}`} className="text-xs cursor-pointer">Mandatory</Label>
                </div>
              </div>
            ))}

            {columns.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No columns defined. Click "Add Column" to add one.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/datatables")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Create Datatable
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DatatableFormPage;
