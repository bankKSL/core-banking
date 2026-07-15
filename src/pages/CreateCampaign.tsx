import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Send, Plus, Trash2, Check, FileText, Package, Filter, Calculator, ChevronRight } from "lucide-react";
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
interface FormData {
    name: string;
    description: string;
    categoryId: string;
    priority: number;
    status: string;
    version: number;
    startDate: string;
    endDate: string;
}

interface FormErrors {
    name?: string;
    description?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
}

const STEP_LABELS = [
    { title: "Basic Information", icon: FileText },
    { title: "Select Products", icon: Package },
    { title: "Eligibility Rules", icon: Filter },
    { title: "Formula Builder", icon: Calculator },
];

const INITIAL_FORM: FormData = {
    name: "",
    description: "",
    categoryId: "",
    priority: 3,
    status: "draft",
    version: 1,
    startDate: "",
    endDate: "",
};

const CreateCampaign: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    // Rule Builder
    const { rules, addRule, updateRule, removeRule, setRules, resetRules } = useRuleBuilderStore();
    const [ruleField, setRuleField] = useState(eligibilityFields[0]?.key ?? "");
    const [ruleOperator, setRuleOperator] = useState<ComparisonOperator>("==");
    const [ruleValue, setRuleValue] = useState("");

    // Formula
    const { formula, setFormula } = useFormulaStore();

    // ─── Validation ─────────────────────────────────────────
    const validateStep1 = useCallback((): boolean => {
        const e: FormErrors = {};
        if (!formData.name.trim()) e.name = "Campaign name is required";
        if (!formData.description.trim()) e.description = "Description is required";
        if (!formData.categoryId) e.categoryId = "Category is required";
        if (!formData.startDate) e.startDate = "Start date is required";
        if (!formData.endDate) e.endDate = "End date is required";
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            e.endDate = "End date must be after start date";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }, [formData]);

    // ─── Navigation ─────────────────────────────────────────
    const handleNext = () => {
        if (currentStep === 0 && !validateStep1()) return;
        setCurrentStep((prev) => Math.min(prev + 1, 3));
    };

    const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

    const handleStepClick = (step: number) => {
        // Only allow navigating to steps that are valid or already visited
        if (step <= currentStep) setCurrentStep(step);
        else if (step === currentStep + 1 && currentStep === 0 && validateStep1()) {
            setCurrentStep(step);
        }
    };

    // ─── Rules ──────────────────────────────────────────────
    const handleAddRule = () => {
        if (!ruleField || !ruleValue) return;
        const newRule: EligibilityRule = {
            id: `rule-${Date.now()}`,
            field: ruleField,
            operator: ruleOperator,
            value: ruleValue,
            logicalOperator: rules.length > 0 ? "AND" : undefined,
        };
        addRule(newRule);
        setRuleValue("");
        setRuleField(eligibilityFields[0]?.key ?? "");
        setRuleOperator("==");
    };

    const handleRemoveRule = (id: string) => removeRule(id);

    const handleLogicalOpChange = (id: string, op: LogicalOperator) => {
        updateRule(id, { logicalOperator: op });
    };

    // ─── Submit / Save ──────────────────────────────────────
    const handleSaveDraft = () => {
        // In a real app, persist to backend; for now just navigate
        console.log("Saving draft:", { formData, selectedProducts, rules, formula });
        navigate("/campaigns");
    };

    const handlePublish = () => {
        console.log("Publishing campaign:", { formData, selectedProducts, rules, formula });
        navigate("/campaigns");
    };

    // ─── Formula helpers ────────────────────────────────────
    const insertIntoFormula = (text: string) => {
        setFormula(formula + text);
    };

    const formulaPreview = useMemo(() => {
        if (!formula.trim()) return "Enter a formula to see preview...";
        try {
            // Simple token analysis for preview
            return `Preview: ${formula}`;
        } catch {
            return "Invalid formula";
        }
    }, [formula]);

    // ─── Render Step Content ─────────────────────────────────
    const renderStepContent = () => {
        switch (currentStep) {
            // ── Step 1: Basic Information ──────────────────────────
            case 0:
                return (
                    <div className="space-y-4">
                        <Input
                            label="Campaign Name"
                            placeholder="Enter campaign name"
                            value={formData.name}
                            error={errors.name}
                            onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                        />
                        <Textarea
                            label="Description"
                            placeholder="Describe the campaign purpose and rules..."
                            value={formData.description}
                            error={errors.description}
                            onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Category</label>
                                <Select value={formData.categoryId} onValueChange={(v) => setFormData((f) => ({ ...f, categoryId: v }))}>
                                    <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Select category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Priority</label>
                                <Select
                                    value={String(formData.priority)}
                                    onValueChange={(v) => setFormData((f) => ({ ...f, priority: Number(v) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5].map((p) => (
                                            <SelectItem key={p} value={String(p)}>
                                                P{p} —{" "}
                                                {p === 1 ? "Critical" : p === 2 ? "High" : p === 3 ? "Medium" : p === 4 ? "Low" : "Lowest"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Status</label>
                                <Select value={formData.status} onValueChange={(v) => setFormData((f) => ({ ...f, status: v }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input
                                label="Version"
                                type="number"
                                min={1}
                                value={String(formData.version)}
                                onChange={(e) => setFormData((f) => ({ ...f, version: Number(e.target.value) || 1 }))}
                            />
                            <Input
                                label="Start Date"
                                type="date"
                                value={formData.startDate}
                                error={errors.startDate}
                                onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
                            />
                            <Input
                                label="End Date"
                                type="date"
                                value={formData.endDate}
                                error={errors.endDate}
                                onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
                            />
                        </div>
                    </div>
                );

            // ── Step 2: Select Products ─────────────────────────────
            case 1:
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Select the products this campaign applies to. {selectedProducts.length} product(s) selected.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {mockProducts.map((prod) => {
                                const isSelected = selectedProducts.includes(prod.id);
                                return (
                                    <label
                                        key={prod.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                            isSelected
                                                ? "border-[#D32F2F] bg-[#D32F2F]/5 dark:bg-[#D32F2F]/10"
                                                : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                                        )}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) => {
                                                if (checked) setSelectedProducts((prev) => [...prev, prod.id]);
                                                else setSelectedProducts((prev) => prev.filter((id) => id !== prod.id));
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{prod.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{prod.description}</p>
                                        </div>
                                        {!prod.isActive && (
                                            <Badge variant="warning" size="sm">
                                                Inactive
                                            </Badge>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );

            // ── Step 3: Eligibility Rules ──────────────────────────
            case 2:
                return (
                    <div className="space-y-4">
                        {rules.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">RULE PREVIEW</p>
                                <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                    IF{" "}
                                    {rules.map((r, i) => (
                                        <span key={r.id}>
                                            {i > 0 && r.logicalOperator && (
                                                <Badge
                                                    variant={r.logicalOperator === "AND" ? "info" : "warning"}
                                                    size="sm"
                                                    className="mx-1 align-middle"
                                                >
                                                    {r.logicalOperator}
                                                </Badge>
                                            )}
                                            <span className="font-semibold">{r.field}</span>{" "}
                                            <span className="text-[#D32F2F]">
                                                {comparisonOperators.find((o) => o.key === r.operator)?.label ?? r.operator}
                                            </span>{" "}
                                            <span className="font-semibold">"{r.value}"</span>
                                        </span>
                                    ))}
                                </p>
                            </div>
                        )}

                        <Card className="border-dashed">
                            <CardContent className="pt-4">
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="w-40 space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Field</label>
                                        <Select value={ruleField} onValueChange={setRuleField}>
                                            <SelectTrigger className="h-9 text-sm">
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
                                    <div className="w-44 space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Operator</label>
                                        <Select value={ruleOperator} onValueChange={(v) => setRuleOperator(v as ComparisonOperator)}>
                                            <SelectTrigger className="h-9 text-sm">
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
                                    <div className="w-32 space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Value</label>
                                        <Input
                                            className="h-9"
                                            placeholder="Value..."
                                            value={ruleValue}
                                            onChange={(e) => setRuleValue(e.target.value)}
                                        />
                                    </div>
                                    <Button size="sm" onClick={handleAddRule} disabled={!ruleField || !ruleValue}>
                                        <Plus className="mr-1 h-3.5 w-3.5" /> Add Rule
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {rules.map((rule, idx) => (
                            <div
                                key={rule.id}
                                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            >
                                {idx > 0 && (
                                    <Select
                                        value={rule.logicalOperator ?? "AND"}
                                        onValueChange={(v) => handleLogicalOpChange(rule.id, v as LogicalOperator)}
                                    >
                                        <SelectTrigger className="h-8 w-20 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AND">AND</SelectItem>
                                            <SelectItem value="OR">OR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                <span className="text-sm flex-1">
                                    <span className="font-medium">
                                        {eligibilityFields.find((f) => f.key === rule.field)?.label ?? rule.field}
                                    </span>{" "}
                                    <span className="text-[#D32F2F]">
                                        {comparisonOperators.find((o) => o.key === rule.operator)?.label ?? rule.operator}
                                    </span>{" "}
                                    <span className="font-medium">"{rule.value}"</span>
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-500 hover:text-red-600"
                                    onClick={() => handleRemoveRule(rule.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                        {rules.length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-4">No eligibility rules defined. Add a rule above.</p>
                        )}
                    </div>
                );

            // ── Step 4: Formula Builder ────────────────────────────
            case 3:
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <Card className="lg:col-span-1">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">Variables</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {formulaVariables.map((v) => (
                                    <button
                                        key={v.key}
                                        onClick={() => insertIntoFormula(v.key + " ")}
                                        className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-[#D32F2F]/5 hover:text-[#D32F2F] transition-colors flex flex-col"
                                        title={v.description}
                                    >
                                        <span className="font-mono font-medium">{v.key}</span>
                                        <span className="text-xs text-gray-400">{v.label}</span>
                                    </button>
                                ))}
                            </CardContent>
                        </Card>

                        <div className="lg:col-span-2 space-y-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold">Formula Expression</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="e.g. balance * (interestRate + 0.02) / 100"
                                        value={formula}
                                        onChange={(e) => setFormula(e.target.value)}
                                        className="min-h-40 font-mono text-sm"
                                    />
                                </CardContent>
                            </Card>
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">Operators</p>
                                <div className="flex flex-wrap gap-2">
                                    {operatorList.map((op) => (
                                        <Button
                                            key={op}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 font-mono"
                                            onClick={() => insertIntoFormula(` ${op} `)}
                                        >
                                            {op}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">Functions</p>
                                <div className="flex flex-wrap gap-2">
                                    {functionList.map((fn) => (
                                        <Button
                                            key={fn.key}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 font-mono"
                                            onClick={() => insertIntoFormula(`${fn.key}()`)}
                                            title={fn.description}
                                        >
                                            {fn.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Card className="lg:col-span-1">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">Validation</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-800/50 min-h-20">
                                    <p className="text-xs text-gray-400 mb-1">Preview</p>
                                    <p className="text-sm font-mono break-all text-gray-900 dark:text-gray-100">
                                        {formula || <span className="text-gray-400 italic">No formula entered</span>}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500">Variables Used</p>
                                    <div className="flex flex-wrap gap-1">
                                        {formulaVariables
                                            .filter((v) => formula.includes(v.key))
                                            .map((v) => (
                                                <Badge key={v.key} variant="info" size="sm">
                                                    {v.key}
                                                </Badge>
                                            ))}
                                        {!formulaVariables.some((v) => formula.includes(v.key)) && (
                                            <span className="text-xs text-gray-400">None</span>
                                        )}
                                    </div>
                                </div>
                                {formula && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-emerald-600 dark:text-emerald-400">Syntax valid</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    // ─── Render ──────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Create Campaign</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set up a new banking campaign with rules and formula</p>
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
