import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/shared/ErrorState";
import { useAdhocQuery, useCreateAdhocQuery, useUpdateAdhocQuery } from "../hooks/useReports";

const AdhocQueryFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: existingQuery, isLoading: isQueryLoading } = useAdhocQuery(id ? Number(id) : undefined);

  const isLoaded = !!existingQuery;
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [tableName, setTableName] = useState("");
  const [tableFields, setTableFields] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const resolvedName = isLoaded ? (existingQuery?.name ?? "") : name;
  const resolvedQuery = isLoaded ? (existingQuery?.query ?? "") : query;
  const resolvedTableName = isLoaded ? (existingQuery?.tableName ?? "") : tableName;
  const resolvedTableFields = isLoaded ? (existingQuery?.tableFields ?? "") : tableFields;
  const resolvedEmail = isLoaded ? (existingQuery?.email ?? "") : email;
  const resolvedIsActive = isLoaded ? (existingQuery?.isActive ?? false) : isActive;

  const createMutation = useCreateAdhocQuery();
  const updateMutation = useUpdateAdhocQuery();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMutationError(null);
      try {
        const payload: Record<string, unknown> = {
          name: resolvedName,
          query: resolvedQuery,
          tableName: resolvedTableName,
          tableFields: resolvedTableFields,
          email: resolvedEmail,
          isActive: resolvedIsActive,
        };

        if (isEdit) {
          await updateMutation.mutateAsync({ id: Number(id), payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
        navigate("/adhoc-queries");
      } catch (err: unknown) {
        const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
        const msg =
          error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to save adhoc query.";
        setMutationError(msg);
      }
    },
    [resolvedName, resolvedQuery, resolvedTableName, resolvedTableFields, resolvedEmail, resolvedIsActive, isEdit, id, createMutation, updateMutation, navigate],
  );

  if (isQueryLoading) {
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
        title={isEdit ? "Edit Adhoc Query" : "New Adhoc Query"}
        description="Create or edit an adhoc query definition"
        actions={
          <Button variant="outline" onClick={() => navigate("/adhoc-queries")}>
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
            <CardTitle>Query Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={resolvedName}
                onChange={(e) => { if (!isLoaded) setName(e.target.value); }}
                placeholder="e.g. Active Loans Report"
                required
              />
            </div>

            <div>
              <Label htmlFor="query">Query *</Label>
              <Textarea
                id="query"
                value={resolvedQuery}
                onChange={(e) => { if (!isLoaded) setQuery(e.target.value); }}
                placeholder="SELECT ..."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tableName">Table Name</Label>
                <Input
                  id="tableName"
                  value={resolvedTableName}
                  onChange={(e) => { if (!isLoaded) setTableName(e.target.value); }}
                  placeholder="e.g. m_loan"
                />
              </div>
              <div>
                <Label htmlFor="tableFields">Table Fields</Label>
                <Input
                  id="tableFields"
                  value={resolvedTableFields}
                  onChange={(e) => { if (!isLoaded) setTableFields(e.target.value); }}
                  placeholder="e.g. id, display_name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={resolvedEmail}
                onChange={(e) => { if (!isLoaded) setEmail(e.target.value); }}
                placeholder="recipient@example.com"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={resolvedIsActive}
                onCheckedChange={(checked) => { if (!isLoaded) setIsActive(!!checked); }}
                disabled={isLoaded}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/adhoc-queries")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !resolvedName || !resolvedQuery}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update Query" : "Create Query"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdhocQueryFormPage;
