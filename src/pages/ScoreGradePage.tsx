import React, { useState, useMemo, useCallback } from "react";
import { TrendingUp, Award, AlertTriangle, Info, ShieldCheck, ShieldAlert, ShieldOff, BarChart3, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    calculateScoreGrade,
    scoreToPercent,
    getScoreBarColor,
    SCORE_GRADES,
    type ScoreGrade,
    type ScoreGradeLetter,
} from "@/lib/scoreGrade";

// ─── Score Input Sub-Component ──────────────────────────────

const ScoreInput: React.FC<{
    score: number | null;
    onChange: (value: number | null) => void;
}> = ({ score, onChange }) => {
    const [raw, setRaw] = useState(score?.toString() ?? "");

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setRaw(val);
            const num = parseInt(val, 10);
            if (val === "") {
                onChange(null);
            } else if (!isNaN(num)) {
                onChange(Math.max(0, Math.min(999, num)));
            }
        },
        [onChange],
    );

    return (
        <div className="space-y-2">
            <Label htmlFor="credit-score-input" className="text-sm font-medium">
                Enter Credit Score
            </Label>
            <Input
                id="credit-score-input"
                type="number"
                min={0}
                max={999}
                placeholder="e.g. 720"
                value={raw}
                onChange={handleChange}
                className="w-full max-w-xs text-lg font-mono"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Standard range: 300 – 900</p>
        </div>
    );
};

// ─── Gauge Bar Sub-Component ────────────────────────────────

const GaugeBar: React.FC<{ score: number; grade: ScoreGrade }> = ({ score, grade }) => {
    const percent = useMemo(() => scoreToPercent(score), [score]);

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
                <span>300</span><span>450</span><span>600</span><span>750</span><span>900</span>
            </div>
            <div className="relative h-4 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div className="absolute inset-0 flex">
                    <div className="h-full bg-red-400" style={{ width: "16.67%" }} />
                    <div className="h-full bg-orange-400" style={{ width: "13.33%" }} />
                    <div className="h-full bg-amber-400" style={{ width: "15%" }} />
                    <div className="h-full bg-blue-400" style={{ width: "11.67%" }} />
                    <div className="h-full bg-green-500" style={{ width: "10%" }} />
                    <div className="h-full bg-emerald-500" style={{ flex: 1 }} />
                </div>
                <div
                    className="absolute top-0 h-full w-1 bg-white dark:bg-gray-200 shadow-md transition-all duration-500 ease-out"
                    style={{ left: `${percent}%`, transform: "translateX(-50%)" }}
                />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>Very Poor</span><span>Poor</span><span>Fair</span><span>Good</span><span>Excellent</span><span>Exceptional</span>
            </div>
        </div>
    );
};

// ─── Grade Result Card ──────────────────────────────────────

const GradeResult: React.FC<{ grade: ScoreGrade; score: number }> = ({ grade, score }) => {
    const shieldIcon = useMemo(() => {
        const map: Record<ScoreGradeLetter, React.ReactNode> = {
            "A+": <ShieldCheck className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />,
            A: <ShieldCheck className="h-12 w-12 text-green-600 dark:text-green-400" />,
            B: <ShieldCheck className="h-12 w-12 text-blue-600 dark:text-blue-400" />,
            C: <ShieldAlert className="h-12 w-12 text-amber-600 dark:text-amber-400" />,
            D: <ShieldAlert className="h-12 w-12 text-orange-600 dark:text-orange-400" />,
            F: <ShieldOff className="h-12 w-12 text-red-600 dark:text-red-400" />,
        };
        return map[grade.letter];
    }, [grade.letter]);

    return (
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Grade Result
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <div className={`flex h-24 w-24 items-center justify-center rounded-full ${grade.bgColor} border-4 border-current ${grade.color}`}>
                            <span className={`text-4xl font-extrabold tracking-tight ${grade.color}`}>{grade.letter}</span>
                        </div>
                        <Badge className={`text-sm px-3 py-1 font-semibold ${grade.bgColor} ${grade.color} border-0`}>{grade.label}</Badge>
                    </div>
                    <div className="flex-1 space-y-3 text-sm">
                        <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Credit Score: </span>
                            <span className="font-mono font-bold text-lg text-gray-900 dark:text-gray-100">{score}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{grade.description}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Info className="h-3 w-3" />Credit Assessment
                                </span>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{grade.creditAssessment}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />Typical Interest Rate
                                </span>
                                <p className="text-sm font-mono font-medium text-gray-800 dark:text-gray-200 mt-1">{grade.typicalInterestRate}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// ─── Grading Scale Table ────────────────────────────────────

const GradingScaleTable: React.FC = () => (
    <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Grading Scale Reference
            </CardTitle>
            <CardDescription>Standard credit score grading tiers used by the banking system</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Grade</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead className="text-right">Score Range</TableHead>
                        <TableHead className="hidden md:table-cell">Assessment</TableHead>
                        <TableHead className="hidden lg:table-cell">Typical Rate</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {SCORE_GRADES.map((g) => (
                        <TableRow key={g.letter}>
                            <TableCell>
                                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${g.bgColor} ${g.color}`}>{g.letter}</span>
                            </TableCell>
                            <TableCell>
                                <Badge className={`text-xs font-semibold ${g.bgColor} ${g.color} border-0`}>{g.label}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-right">{g.minScore} – {g.maxScore}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-gray-600 dark:text-gray-400 max-w-xs">{g.creditAssessment}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm font-mono text-gray-600 dark:text-gray-400">{g.typicalInterestRate}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

// ─── Main Page Component ────────────────────────────────────

const ScoreGradePage: React.FC = () => {
    const [score, setScore] = useState<number | null>(null);

    const grade = useMemo(() => {
        if (score === null) return null;
        return calculateScoreGrade(score);
    }, [score]);

    const percent = useMemo(() => {
        if (score === null) return null;
        return scoreToPercent(score);
    }, [score]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Score Grade Calculator"
                description="Calculate and visualize the credit grade for any credit score"
            />

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Left column: Input + Gauge */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold">Calculate Grade</CardTitle>
                            <CardDescription>Enter a credit score to see its grade</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ScoreInput score={score} onChange={setScore} />

                            {score !== null && (
                                <>
                                    <Separator />
                                    <GaugeBar score={score} grade={grade!} />
                                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3 text-center">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Percentile Position
                                        </span>
                                        <p className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">
                                            {percent!.toFixed(1)}%
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Score Distribution */}
                    <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Score Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {SCORE_GRADES.map((g) => {
                                    const rangeSize = g.maxScore - g.minScore;
                                    const widthPct = (rangeSize / 600) * 100;
                                    return (
                                        <div key={g.letter} className="flex items-center gap-3">
                                            <span className={`text-xs font-extrabold w-6 ${g.color}`}>{g.letter}</span>
                                            <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${widthPct}%`,
                                                        backgroundColor: g.barColor,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-gray-500 w-20 text-right">
                                                {g.minScore}–{g.maxScore}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column: Result + Scale Table */}
                <div className="lg:col-span-3 space-y-6">
                    {grade ? (
                        <GradeResult grade={grade} score={score!} />
                    ) : (
                        <Card className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 dark:border-gray-600 dark:bg-gray-800/50">
                            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                                <AlertTriangle className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Enter a credit score to see the calculated grade
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <GradingScaleTable />
                </div>
            </div>
        </div>
    );
};

export default ScoreGradePage;
