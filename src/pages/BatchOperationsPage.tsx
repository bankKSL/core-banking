import React, { useState } from "react";
import { Loader2, Terminal } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { postBatches, type BatchResponse } from "@/api/batch";

const BatchOperationsPage: React.FC = () => {
  const [batchInput, setBatchInput] = useState("");
  const [enclosingTransaction, setEnclosingTransaction] = useState(false);
  const [results, setResults] = useState<BatchResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Clear previous error and results
    setError(null);
    setResults([]);

    // Parse JSON input
    let parsed: unknown;
    try {
      parsed = JSON.parse(batchInput);
    } catch {
      setError("Invalid JSON. Please check the syntax and try again.");
      return;
    }

    if (!Array.isArray(parsed)) {
      setError("Input must be a JSON array.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await postBatches(parsed, enclosingTransaction);
      // Normalize response to array (handled in API, but safeguard here too)
      const normalized = Array.isArray(response) ? response : [response];
      setResults(normalized);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message)
          : "Request failed. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Batch API Operations" description="Execute multiple API requests in a single batch call." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-[#D32F2F]" />
            Batch Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Textarea */}
          <Textarea
            label="Batch Request (JSON Array)"
            placeholder={`[\n  {\n    "requestId": 1,\n    "relativeUrl": "/api/v2/clients/1",\n    "method": "GET"\n  }\n]`}
            rows={10}
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            className="font-mono text-sm"
          />

          {/* Enclose in Transaction Checkbox */}
          <Checkbox
            id="enclose-transaction"
            label="Enclose in Transaction"
            checked={enclosingTransaction}
            onCheckedChange={(checked) => setEnclosingTransaction(checked === true)}
          />

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <Button onClick={handleSubmit} disabled={isSubmitting || !batchInput.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-md bg-gray-50 p-4 text-sm dark:bg-gray-900">
              <code>{JSON.stringify(results, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchOperationsPage;
