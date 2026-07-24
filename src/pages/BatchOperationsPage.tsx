import React, { type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Terminal } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { postBatches, type BatchRequest, type BatchResponse } from "@/api/batch";

const batchSchema = z.object({
  batchInput: z.string().min(1, "Batch request JSON is required"),
  enclosingTransaction: z.boolean().default(false),
});

type BatchFormValues = z.infer<typeof batchSchema>;

const BatchOperationsPage: FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema) as any,
    defaultValues: {
      batchInput: "",
      enclosingTransaction: false,
    },
  });

  const batchInput = watch("batchInput");
  const enclosingTransaction = watch("enclosingTransaction");

  const mutation = useMutation({
    mutationFn: (values: BatchFormValues) => {
      const parsed: unknown = JSON.parse(values.batchInput);
      if (!Array.isArray(parsed)) {
        throw new Error("Input must be a JSON array.");
      }
      return postBatches(parsed as BatchRequest[], values.enclosingTransaction);
    },
  });

  const results = mutation.data ?? [];
  const error = mutation.error instanceof Error ? mutation.error.message : null;

  const onSubmit = handleSubmit((values) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(values.batchInput);
    } catch {
      throw new Error("Invalid JSON. Please check the syntax and try again.");
    }
    if (!Array.isArray(parsed)) {
      throw new Error("Input must be a JSON array.");
    }
    mutation.mutate(values);
  });

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
          <form onSubmit={onSubmit} className="space-y-4">
            <Textarea
              label="Batch Request (JSON Array)"
              placeholder={`[\n  {\n    "requestId": 1,\n    "relativeUrl": "/api/v2/clients/1",\n    "method": "GET"\n  }\n]`}
              rows={10}
              {...register("batchInput")}
              error={errors.batchInput?.message}
              className="font-mono text-sm"
            />

            <Checkbox
              id="enclose-transaction"
              label="Enclose in Transaction"
              checked={enclosingTransaction}
              onCheckedChange={(checked) => setValue("enclosingTransaction", checked === true)}
            />

            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={mutation.isPending || !batchInput.trim()}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

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
