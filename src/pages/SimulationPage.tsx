import React, { useState, useCallback, useMemo } from "react";
import { Play, Clock, CheckCircle, XCircle, Zap, Loader2, BarChart3, FileJson } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { campaigns } from "@/mock/data";
import { Badge } from "@/components/ui/badge";
import type { SimulationResult } from "@/types";

const DEFAULT_INPUT_JSON = JSON.stringify(
  {
    balance: 25000,
    amount: 1000,
    interestRate: 5.5,
    tenor: 12,
    transactionCount: 25,
    accountAge: 365,
    customerScore: 750,
    currency: "USD",
    customerType: "VIP",
    channel: "Mobile",
  },
  null,
  2,
);

const actionColorSpec: Record<string, { bg: string; text: string; label: string }> = {
  set_interest_rate: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-400",
    label: "Set Interest Rate",
  },
  apply_cashback: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-800 dark:text-emerald-400",
    label: "Apply Cashback",
  },
  waive_fee: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-400",
    label: "Waive Fee",
  },
  add_reward_points: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-800 dark:text-purple-400",
    label: "Add Reward Points",
  },
  apply_penalty: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-400",
    label: "Apply Penalty",
  },
  adjust_limit: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-800 dark:text-indigo-400",
    label: "Adjust Limit",
  },
};

const SimulationPage: React.FC = () => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [inputJson, setInputJson] = useState(DEFAULT_INPUT_JSON);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId) || null,
    [selectedCampaignId],
  );

  const handleRunSimulation = useCallback(() => {
    setJsonError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(inputJson);
    } catch {
      setJsonError("Invalid JSON format. Please check your input.");
      return;
    }
    if (!selectedCampaign) {
      setJsonError("Please select a campaign first.");
      return;
    }

    setIsRunning(true);
    setResult(null);
    const startTime = performance.now();
    setTimeout(
      () => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime + Math.random() * 50);
        let matched = true;
        for (const rule of selectedCampaign.eligibilityRules) {
          const fieldVal = parsed[rule.field];
          if (fieldVal === undefined) {
            matched = false;
            break;
          }
          const ruleVal = isNaN(Number(rule.value)) ? rule.value : Number(rule.value);
          const compareVal = isNaN(Number(fieldVal)) ? String(fieldVal) : Number(fieldVal);
          switch (rule.operator) {
            case "==":
              matched = compareVal === ruleVal;
              break;
            case "!=":
              matched = compareVal !== ruleVal;
              break;
            case ">":
              matched = Number(compareVal) > Number(ruleVal);
              break;
            case ">=":
              matched = Number(compareVal) >= Number(ruleVal);
              break;
            case "<":
              matched = Number(compareVal) < Number(ruleVal);
              break;
            case "<=":
              matched = Number(compareVal) <= Number(ruleVal);
              break;
            case "contains":
              matched = String(compareVal).includes(String(ruleVal));
              break;
            case "in":
              matched = String(ruleVal)
                .split(",")
                .map((s) => s.trim())
                .includes(String(compareVal));
              break;
            default:
              matched = false;
          }
          if (!matched && rule.logicalOperator === "AND") break;
          if (matched && rule.logicalOperator === "OR") break;
        }
        const formulaResult = matched
          ? Math.round(((Number(parsed.balance || 0) * (Number(parsed.interestRate || 5) + 2)) / 100) * 100) / 100
          : 0;
        setResult({
          campaignId: selectedCampaign.id,
          campaignName: selectedCampaign.name,
          matched,
          formulaResult,
          actions: matched ? selectedCampaign.actions : [],
          steps: matched
            ? [
                { step: 1, expression: "balance * (interestRate + 0.02) / 100", result: formulaResult },
                { step: 2, expression: `ROUND(${formulaResult}, 2)`, result: formulaResult },
              ]
            : [],
          duration,
        });
        setIsRunning(false);
      },
      800 + Math.random() * 700,
    );
  }, [inputJson, selectedCampaign]);

  return (
    <div className="space-y-6">
      <PageHeader title="Simulation" description="Test your formula with sample inputs" />
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-md">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Select Campaign</label>
            <Select
              value={selectedCampaignId}
              onValueChange={(v) => {
                setSelectedCampaignId(v);
                setResult(null);
                setJsonError(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a campaign to simulate..." />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              Input Data
            </CardTitle>
            <CardDescription>JSON payload for simulation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={inputJson}
              onChange={(e) => {
                setInputJson(e.target.value);
                setJsonError(null);
              }}
              className="font-mono text-xs bg-gray-50 dark:bg-gray-900 min-h-75 resize-y"
              placeholder='{"balance":25000,...}'
            />
            {jsonError && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" />
                {jsonError}
              </p>
            )}
            <Button
              onClick={handleRunSimulation}
              disabled={isRunning || !selectedCampaignId}
              className="w-full"
              style={{ backgroundColor: "#D32F2F" }}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Simulation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </CardTitle>
            <CardDescription>Simulation output & performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRunning && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#D32F2F]" />
              </div>
            )}
            {!isRunning && !result && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Play className="h-10 w-10 mb-2" />
                <p className="text-sm">Select a campaign and run the simulation</p>
              </div>
            )}
            {!isRunning && result && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Match Status</span>
                  {result.matched ? (
                    <Badge variant="success" size="md">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Matched
                    </Badge>
                  ) : (
                    <Badge variant="error" size="md">
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Not Matched
                    </Badge>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Calculated Value</span>
                  <code className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">
                    {result.formulaResult}
                  </code>
                </div>
                <Separator />
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                    Actions Triggered ({result.actions.length})
                  </span>
                  {result.actions.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No actions triggered</p>
                  ) : (
                    <div className="space-y-1.5">
                      {result.actions.map((a) => {
                        const spec = actionColorSpec[a.type] || {
                          bg: "bg-gray-100",
                          text: "text-gray-600",
                          label: a.type,
                        };
                        return (
                          <div
                            key={a.id}
                            className="flex items-center justify-between text-xs p-2 rounded border border-gray-100 dark:border-gray-700"
                          >
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium ${spec.bg} ${spec.text}`}
                            >
                              {spec.label}
                            </span>
                            <span className="font-mono text-gray-600 dark:text-gray-400">
                              {a.target}: {a.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-2">
                    <Clock className="h-3.5 w-3.5" />
                    Performance
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-gray-50 dark:bg-gray-900">
                      <span className="text-gray-500">Duration</span>
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{result.duration} ms</p>
                    </div>
                    <div className="p-2 rounded bg-gray-50 dark:bg-gray-900">
                      <span className="text-gray-500">Steps</span>
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{result.steps.length}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimulationPage;
