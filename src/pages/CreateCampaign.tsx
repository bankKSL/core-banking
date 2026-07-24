import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Plus,
  Trash2,
  Check,
  FileText,
  Package,
  Filter,
  Calculator,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categories as mockCategories, products as mockProducts } from "@/mock/data";
import { formulaVariables, operatorList, functionList, eligibilityFields, comparisonOperators } from "@/mock/data";
import { useRuleBuilderStore, useFormulaStore } from "@/store";
import type { EligibilityRule, LogicalOperator, ComparisonOperator } from "@/types";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface FormErrors {
  name?: string;
  description?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

const campaignBasicSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  priority: z.number(),
  status: z.string(),
  version: z.number(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type CampaignFormValues = z.infer<typeof campaignBasicSchema>;

const STEP_LABELS = [
  { title: "Basic Information", icon: FileText },
  { title: "Select Products", icon: Package },
  { title: "Eligibility Rules", icon: Filter },
  { title: "Formula Builder", icon: Calculator },
];

const CreateCampaign: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignBasicSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      priority: 3,
      status: "draft",
      version: 1,
      startDate: "",
      endDate: "",
    },
  });

  // Rule Builder
  const { rules, addRule, updateRule, removeRule, setRules, resetRules } = useRuleBuilderStore();
  const [ruleField, setRuleField] = useState(eligibilityFields[0]?.key ?? "");
  const [ruleOperator, setRuleOperator] = useState<ComparisonOperator>("==");
  const [ruleValue, setRuleValue] = useState("");

  // Formula
  const { formula, setFormula } = useFormulaStore();

  // ─── Validation ─────────────────────────────────────────
  const validateStep1 = useCallback(async (): Promise<boolean> => {
    const valid = await trigger(["name", "description", "categoryId", "startDate", "endDate"]);
    const startDate = getValues("startDate");
    const endDate = getValues("endDate");
    if (startDate && endDate && startDate > endDate) {
      return false;
    }
    return valid;
  }, [trigger, getValues]);

  // ─── Navigation ─────────────────────────────────────────
  const handleNext = useCallback(async () => {
    if (currentStep === 0) {
      const valid = await validateStep1();
      if (!valid) return;
    }
    setCurrentStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }, [currentStep, validateStep1]);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleStepClick = useCallback(
    (idx: number) => {
      if (idx < currentStep) {
        setCurrentStep(idx);
      }
    },
    [currentStep],
  );

  const toggleProduct = useCallback((productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((p) => p !== productId) : [...prev, productId],
    );
  }, []);

  const addRuleLocal = useCallback(() => {
    if (!ruleField || !ruleValue) return;
    addRule({
      id: `rule-${Date.now()}`,
      field: ruleField,
      operator: ruleOperator,
      value: ruleValue,
    });
  }, [ruleField, ruleOperator, ruleValue, addRule]);

  const handleSaveDraft = useCallback(async () => {
    const formValues = getValues();
  }, [getValues, selectedProducts, rules, formula]);

  const handlePublish = useCallback(async () => {
    const valid = await validateStep1();
    if (!valid) return;
    if (selectedProducts.length === 0) return;
    const formValues = getValues();
  }, [validateStep1, selectedProducts, getValues, rules, formula]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Campaign Name *"
                {...register("name")}
                error={errors.name?.message}
                placeholder="e.g. Summer Savings Promotion"
              />
              <div>
                <label className="text-sm font-medium">Category *</label>
                <Select
                  value={watch("categoryId")}
                  onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCategories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-sm text-red-500 mt-1">{errors.categoryId.message}</p>}
              </div>
            </div>
            <Textarea
              label="Description *"
              {...register("description")}
              placeholder="Describe the campaign purpose..."
              error={errors.description?.message}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date *</label>
                <Input type="date" {...register("startDate")} error={errors.startDate?.message} />
              </div>
              <div>
                <label className="text-sm font-medium">End Date *</label>
                <Input type="date" {...register("endDate")} error={errors.endDate?.message} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  value={watch("priority")}
                  onChange={(e) => setValue("priority", Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((p) => (
                    <option key={p} value={p}>
                      P{p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  value={watch("status")}
                  onChange={(e) => setValue("status", e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <Input label="Version" type="number" {...register("version")} />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-3">
            {mockProducts.map((product) => {
              const checked = selectedProducts.includes(product.id);
              return (
                <label
                  key={product.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors",
                    checked
                      ? "border-[#D32F2F] bg-[#D32F2F]/5 dark:border-[#D32F2F] dark:bg-[#D32F2F]/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                  )}
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggleProduct(product.id)} />
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.type}</p>
                  </div>
                  <Badge variant="default" size="sm">
                    {product.id}
                  </Badge>
                </label>
              );
            })}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-35">
                <label className="text-xs font-medium mb-1 block">Field</label>
                <Select value={ruleField} onValueChange={setRuleField}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibilityFields.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-25">
                <label className="text-xs font-medium mb-1 block">Operator</label>
                <Select value={ruleOperator} onValueChange={(v) => setRuleOperator(v as ComparisonOperator)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {comparisonOperators.map((op) => (
                      <SelectItem key={op.key} value={op.key}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-35">
                <label className="text-xs font-medium mb-1 block">Value</label>
                <Input value={ruleValue} onChange={(e) => setRuleValue(e.target.value)} placeholder="Enter value" />
              </div>
              <Button size="sm" onClick={addRuleLocal} disabled={!ruleField || !ruleValue}>
                <Plus className="mr-1 h-4 w-4" /> Add Rule
              </Button>
            </div>

            {rules.length > 0 && (
              <div className="space-y-2">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {rule.field}
                    </span>
                    <span className="text-sm font-medium">{rule.operator}</span>
                    <span className="text-sm font-mono">{rule.value}</span>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => removeRule(rule.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {rules.length > 1 && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-medium">Logical connector:</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">AND</span>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Variables</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {formulaVariables.map((v) => (
                  <Badge
                    key={v.key}
                    variant="info"
                    size="sm"
                    className="cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                    onClick={() => setFormula(formula + v.key)}
                  >
                    {v.key}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Operators</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {operatorList.map((op) => (
                  <Badge
                    key={op}
                    variant="default"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setFormula(formula + op)}
                  >
                    {op}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Functions</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {functionList.map((fn) => (
                  <Badge
                    key={fn.key}
                    variant="warning"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setFormula(formula + fn.key + "()")}
                  >
                    {fn.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Formula</label>
              <Textarea
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                rows={5}
                placeholder="Build your formula using variables, operators, and functions..."
                className="font-mono text-sm"
              />
            </div>
            {formula && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <p className="font-mono">{formula}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Create Campaign</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Set up a new banking campaign with rules and formula
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/campaigns")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
        </Button>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        {STEP_LABELS.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <React.Fragment key={idx}>
              <button
                onClick={() => handleStepClick(idx)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  isActive && "bg-[#D32F2F]/10 text-[#D32F2F]",
                  isCompleted && "text-emerald-600 dark:text-emerald-400",
                  !isActive && !isCompleted && "text-gray-400 dark:text-gray-500",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold",
                    isActive && "bg-[#D32F2F] text-white",
                    isCompleted && "bg-emerald-500 text-white",
                    !isActive && !isCompleted && "bg-gray-200 dark:bg-gray-700 text-gray-500",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium">{step.title}</p>
                </div>
              </button>
              {idx < STEP_LABELS.length - 1 && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0",
                    idx < currentStep ? "text-emerald-400" : "text-gray-300 dark:text-gray-600",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Step {currentStep + 1}: {STEP_LABELS[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          {currentStep === 3 ? (
            <>
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="mr-2 h-4 w-4" /> Save Draft
              </Button>
              <Button onClick={handlePublish}>
                <Send className="mr-2 h-4 w-4" /> Publish Campaign
              </Button>
            </>
          ) : (
            <Button onClick={handleNext}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
