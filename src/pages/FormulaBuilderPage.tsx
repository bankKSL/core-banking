import React, { useRef, useState, useCallback, useMemo } from "react";
import { CheckCircle, XCircle, Code2, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formulaVariables, operatorList, functionList } from "@/mock/data";
import { useFormulaStore } from "@/store";

const FormulaBuilderPage: React.FC = () => {
  const { formula, setFormula } = useFormulaStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState(0);

  const insertAtCursor = useCallback(
    (text: string) => {
      const el = textareaRef.current;
      if (!el) {
        setFormula(formula + text);
        return;
      }
      const pos = el.selectionStart;
      const before = formula.slice(0, pos);
      const after = formula.slice(el.selectionEnd);
      const newFormula = before + text + after;
      setFormula(newFormula);
      // Restore cursor after React re-render
      setTimeout(() => {
        el.focus();
        const newPos = pos + text.length;
        el.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [formula, setFormula]
  );

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFormula(e.target.value);
      setCursorPos(e.target.selectionStart);
    },
    [setFormula]
  );

  const handleTextareaClick = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      setCursorPos((e.target as HTMLTextAreaElement).selectionStart);
    },
    []
  );

  const handleTextareaKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      setCursorPos((e.target as HTMLTextAreaElement).selectionStart);
    },
    []
  );

  // Syntax-colored preview
  const previewHtml = useMemo(() => {
    if (!formula.trim()) {
      return <span className="text-gray-400 text-sm italic">Enter a formula to preview...</span>;
    }
    const tokens = formula.split(/([+\-*/%()])/g);
    return (
      <span className="font-mono text-sm break-all">
        {tokens.map((token, i) => {
          const trimmed = token.trim();
          const isVar = formulaVariables.some((v) => v.key === trimmed);
          const isFunc = functionList.some((f) => f.key === trimmed.toUpperCase());
          const isOp = operatorList.some((op) => op === trimmed);
          if (isVar)
            return <span key={i} className="text-blue-600 dark:text-blue-400 font-semibold">{token}</span>;
          if (isFunc)
            return <span key={i} className="text-green-600 dark:text-green-400 font-semibold">{token}</span>;
          if (isOp)
            return <span key={i} className="text-red-500 dark:text-red-400">{token}</span>;
          return <span key={i}>{token}</span>;
        })}
      </span>
    );
  }, [formula]);

  // Basic validation
  const validation = useMemo(() => {
    if (!formula.trim()) {
      return { valid: false, message: "Formula is empty", issues: [] as string[] };
    }
    const issues: string[] = [];
    const openParens = (formula.match(/\(/g) || []).length;
    const closeParens = (formula.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Unmatched parentheses: ${openParens} open vs ${closeParens} close`);
    }
    // Check for division by zero pattern
    if (/\/\s*0(?!\d)/.test(formula)) {
      issues.push("Potential division by zero");
    }
    const knownKeys = new Set([
      ...formulaVariables.map((v) => v.key),
      ...operatorList,
      ...functionList.map((f) => f.key),
    ]);
    const words = formula.match(/[a-zA-Z_]\w*/g) || [];
    const unknownVars = words.filter(
      (w) => !knownKeys.has(w) && isNaN(Number(w)) && w !== "true" && w !== "false"
    );
    if (unknownVars.length > 0) {
      issues.push(`Unknown identifiers: ${[...new Set(unknownVars)].join(", ")}`);
    }
    return {
      valid: issues.length === 0,
      message: issues.length === 0 ? "Formula looks valid" : issues[0],
      issues,
    };
  }, [formula]);

  return (
    <div className="space-y-6">
      <PageHeader title="Formula Builder" description="Visual Formula Editor" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Available Variables */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4" />Available Variables
            </CardTitle>
            <CardDescription>Click to insert at cursor position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {formulaVariables.map((v) => (
              <button
                key={v.key}
                onClick={() => insertAtCursor(v.key)}
                className="w-full text-left px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-[#D32F2F]/5 hover:border-[#D32F2F]/30 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-blue-600 dark:text-blue-400 font-semibold group-hover:text-[#D32F2F]">
                    {v.key}
                  </code>
                  <Badge variant="info" size="sm">{v.label}</Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Center Panel: Formula Input */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wand2 className="h-4 w-4" />Formula Expression
            </CardTitle>
            <CardDescription>Write your formula or use the buttons below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              ref={textareaRef}
              value={formula}
              onChange={handleTextareaChange}
              onClick={handleTextareaClick}
              onKeyUp={handleTextareaKeyUp}
              placeholder="e.g. balance * (interestRate + 0.02) / 100"
              className="font-mono text-sm bg-gray-50 dark:bg-gray-900 min-h-[160px] resize-y"
            />
            <Separator />
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Operators</p>
              <div className="flex flex-wrap gap-1.5">
                {operatorList.map((op) => (
                  <Button key={op} size="sm" variant="outline" onClick={() => insertAtCursor(` ${op} `)} className="font-mono h-7 px-2 text-xs">
                    {op}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Functions</p>
              <div className="flex flex-wrap gap-1.5">
                {functionList.map((fn) => (
                  <Button key={fn.key} size="sm" variant="outline" onClick={() => insertAtCursor(`${fn.key}()`)} className="font-mono h-7 px-2 text-xs">
                    {fn.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Preview & Validation */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Formula Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[80px] p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {previewHtml}
            </div>
          </CardContent>
          <CardHeader className="pb-3 pt-0">
            <CardTitle className="text-base">Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-2 p-3 rounded-md border ${
              !formula.trim()
                ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                : validation.valid
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
            }`}>
              {!formula.trim() ? (
                <span className="text-sm text-gray-500">—</span>
              ) : validation.valid ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">{validation.message}</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <p>{validation.message}</p>
                    {validation.issues.length > 1 && (
                      <ul className="list-disc list-inside mt-1 text-xs">
                        {validation.issues.slice(1).map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormulaBuilderPage;
