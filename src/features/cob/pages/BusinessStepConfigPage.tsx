import { type FC, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, GripVertical, ListOrdered, Plus, X, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJobNames, useSteps, useAvailableSteps, useUpdateSteps } from "../hooks/useCob";
import { BUSINESS_STEP_LABELS } from "../types/cob";

interface OrderedStep {
  stepName: string;
  order: number;
}

const BusinessStepConfigPage: FC = () => {
  const navigate = useNavigate();
  const { data: jobNamesData } = useJobNames();
  const [selectedJob, setSelectedJob] = useState<string>("LOAN_COB");
  const [orderedSteps, setOrderedSteps] = useState<OrderedStep[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: currentSteps, isLoading: stepsLoading } = useSteps(selectedJob || undefined);
  const { data: availableSteps, isLoading: availableLoading } = useAvailableSteps(selectedJob || undefined);
  const updateMutation = useUpdateSteps();

  useEffect(() => {
    if (currentSteps?.businessSteps) {
      setOrderedSteps(
        [...currentSteps.businessSteps]
          .sort((a, b) => a.order - b.order)
          .map((s) => ({ stepName: s.stepName, order: s.order })),
      );
      setHasChanges(false);
    }
  }, [currentSteps]);

  const allAvailableSteps = availableSteps?.availableBusinessSteps ?? [];

  const unusedSteps = allAvailableSteps.filter(
    (s) => !orderedSteps.find((o) => o.stepName === s.stepName),
  );

  const moveStep = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= orderedSteps.length) return;
    const steps = [...orderedSteps];
    [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
    const reordered = steps.map((s, i) => ({ ...s, order: i + 1 }));
    setOrderedSteps(reordered);
    setHasChanges(true);
  };

  const addStep = () => {
    if (unusedSteps.length === 0) return;
    const stepName = unusedSteps[0].stepName;
    const steps = [...orderedSteps, { stepName, order: orderedSteps.length + 1 }];
    setOrderedSteps(steps);
    setHasChanges(true);
  };

  const removeStep = (stepName: string) => {
    const steps = orderedSteps.filter((s) => s.stepName !== stepName).map((s, i) => ({ ...s, order: i + 1 }));
    setOrderedSteps(steps);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedJob) return;
    await updateMutation.mutateAsync({
      jobName: selectedJob,
      payload: {
        businessSteps: orderedSteps.map((s) => ({
          stepName: s.stepName,
          order: s.order,
        })),
      },
    });
    setHasChanges(false);
  };

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title="Business Step Configuration"
        description="Configure the order of business steps executed during COB processing"
        actions={
          <Button variant="outline" onClick={() => navigate("/cob/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Step Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger>
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {(jobNamesData?.businessJobs ?? ["LOAN_COB"]).map((job) => (
                  <SelectItem key={job} value={job}>
                    {job}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {stepsLoading || availableLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {orderedSteps.map((step, index) => (
                <div
                  key={step.stepName}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveStep(index, -1)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(index, 1)}
                      disabled={index === orderedSteps.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                  <GripVertical className="h-5 w-5 text-gray-400 shrink-0" />
                  <span className="flex-1 text-sm font-medium">
                    {BUSINESS_STEP_LABELS[step.stepName] ?? step.stepName}
                  </span>
                  <Badge size="sm">Step {step.order}</Badge>
                  <button
                    type="button"
                    onClick={() => removeStep(step.stepName)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {orderedSteps.length === 0 && (
                <div className="flex items-center gap-2 p-4 text-sm text-gray-500">
                  <AlertCircle className="h-4 w-4" />
                  No steps configured. Add steps from the available list below.
                </div>
              )}
            </div>
          )}

          {unusedSteps.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">Available steps to add:</p>
              <div className="flex flex-wrap gap-2">
                {unusedSteps.map((step) => (
                  <button
                    key={step.stepName}
                    type="button"
                    onClick={() => {
                      const steps = [...orderedSteps, { stepName: step.stepName, order: orderedSteps.length + 1 }];
                      setOrderedSteps(steps);
                      setHasChanges(true);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-dashed border-gray-300 hover:border-[#D32F2F]/50 hover:text-[#D32F2F] dark:border-gray-600"
                  >
                    <Plus className="h-3 w-3" />
                    {step.stepDescription}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-[#D32F2F] hover:bg-red-700">
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      )}
    </div>
  );
};

export default BusinessStepConfigPage;
