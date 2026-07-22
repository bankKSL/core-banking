import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { createLoanSchema, type CreateLoanFormValues } from "../schemas/loan.schema";
import type { LoanProduct, LoanTemplate, Loan } from "../types/loan";

function normalizeDate(value: unknown): string {
    if (!value) return "";
    if (Array.isArray(value) && value.length >= 3) {
        const [y, m, d] = value;
        return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    if (typeof value === "string") return value.split("T")[0];
    return "";
}

interface LoanFormProps {
    template?: LoanTemplate;
    products: LoanProduct[];
    loan?: Loan;
    onSubmit: (values: CreateLoanFormValues) => Promise<void>;
    isSubmitting: boolean;
    error?: string | null;
    mode: "create" | "edit";
    clientId?: number;
}

const LoanForm: FC<LoanFormProps> = ({ template, products, loan, onSubmit, isSubmitting, error, mode, clientId }) => {
    const defaultDate = new Date().toISOString().split("T")[0];

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CreateLoanFormValues>({
        resolver: zodResolver(createLoanSchema),
        defaultValues: {
            clientId: loan?.clientId ?? clientId ?? 0,
            productId: loan?.loanProductId ?? 0,
            principal: loan?.principal ?? 0,
            loanTermFrequency: loan?.termFrequency ?? 12,
            loanTermFrequencyType: loan?.termPeriodFrequencyType ?? 2,
            numberOfRepayments: loan?.numberOfRepayments ?? 12,
            repaymentEvery: loan?.repaymentEvery ?? 1,
            repaymentFrequencyType: loan?.repaymentFrequencyType?.id ?? 2,
            interestRatePerPeriod: loan?.interestRatePerPeriod ?? 0,
            expectedDisbursementDate: normalizeDate(loan?.expectedDisbursementDate) || defaultDate,
            submittedOnDate: normalizeDate(loan?.submittedOnDate) || defaultDate,
            transactionProcessingStrategyId: loan?.transactionProcessingStrategyId ?? undefined,
            loanPurposeName: loan?.loanPurposeName ?? "",
            loanOfficerId: loan?.loanOfficerId ?? null,
            fundId: null, linkAccountId: null,
            externalId: loan?.externalId ?? "",
            allowPartialPeriodInterestCalcualtion: false,
            maxOutstandingLoanBalance: undefined,
            dateFormat: "yyyy-MM-dd", locale: "en",
        },
    });

    const productId = watch("productId");

    const onFormSubmit = async (values: CreateLoanFormValues) => {
        await onSubmit({
            ...values,
            loanPurposeName: values.loanPurposeName || undefined,
            externalId: values.externalId || undefined,
            loanOfficerId: values.loanOfficerId ?? undefined,
            fundId: values.fundId ?? undefined,
            linkAccountId: values.linkAccountId ?? undefined,
            maxOutstandingLoanBalance: values.maxOutstandingLoanBalance || undefined,
            allowPartialPeriodInterestCalcualtion: values.allowPartialPeriodInterestCalcualtion || undefined,
            dateFormat: "yyyy-MM-dd" as const,
            locale: "en" as const,
        });
    };

    const handleProductSelect = (id: string) => {
        const prod = products.find((p) => p.id === Number(id));
        if (!prod) return;
        setValue("productId", prod.id);
        setValue("principal", prod.principal);
        setValue("numberOfRepayments", prod.numberOfRepayments);
        setValue("repaymentEvery", prod.repaymentEvery);
        setValue("repaymentFrequencyType", prod.repaymentFrequencyType.id);
        setValue("interestRatePerPeriod", prod.interestRatePerPeriod);
        if (prod.amortizationType?.id != null) setValue("amortizationType", prod.amortizationType.id as any);
        if (prod.interestType?.id != null) setValue("interestType", prod.interestType.id as any);
        if (prod.interestCalculationPeriodType?.id != null) setValue("interestCalculationPeriodType", prod.interestCalculationPeriodType.id as any);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{error}</div>
            )}
            <Card>
                <CardHeader><CardTitle className="text-base">Loan Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="clientId">Client ID *</Label>
                        <Input id="clientId" type="number" {...register("clientId", { valueAsNumber: true })} disabled={isSubmitting || !!clientId} />
                        {errors.clientId && <p className="text-xs text-red-500">{errors.clientId.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Loan Product *</Label>
                        <Select value={productId ? String(productId) : ""} onValueChange={handleProductSelect} disabled={isSubmitting || mode === "edit"}>
                            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                            <SelectContent>{products.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}</SelectContent>
                        </Select>
                        {errors.productId && <p className="text-xs text-red-500">{errors.productId.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="externalId">External ID</Label>
                        <Input id="externalId" {...register("externalId")} disabled={isSubmitting} />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-base">Principal & Term</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="principal">Principal *</Label>
                        <Input id="principal" type="number" step="0.01" {...register("principal", { valueAsNumber: true })} disabled={isSubmitting} />
                        {errors.principal && <p className="text-xs text-red-500">{errors.principal.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="loanTermFrequency">Loan Term *</Label>
                        <Input id="loanTermFrequency" type="number" {...register("loanTermFrequency", { valueAsNumber: true })} disabled={isSubmitting} />
                        {errors.loanTermFrequency && <p className="text-xs text-red-500">{errors.loanTermFrequency.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Term Type</Label>
                        <Select value={String(watch("loanTermFrequencyType"))} onValueChange={(v) => setValue("loanTermFrequencyType", Number(v))} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Days</SelectItem>
                                <SelectItem value="1">Weeks</SelectItem>
                                <SelectItem value="2">Months</SelectItem>
                                <SelectItem value="3">Years</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-base">Repayment & Interest</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="numberOfRepayments">Number of Repayments *</Label>
                        <Input id="numberOfRepayments" type="number" {...register("numberOfRepayments", { valueAsNumber: true })} disabled={isSubmitting} />
                        {errors.numberOfRepayments && <p className="text-xs text-red-500">{errors.numberOfRepayments.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="repaymentEvery">Repayment Every *</Label>
                        <Input id="repaymentEvery" type="number" {...register("repaymentEvery", { valueAsNumber: true })} disabled={isSubmitting} />
                        {errors.repaymentEvery && <p className="text-xs text-red-500">{errors.repaymentEvery.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Repayment Frequency</Label>
                        <Select value={String(watch("repaymentFrequencyType"))} onValueChange={(v) => setValue("repaymentFrequencyType", Number(v))} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Days</SelectItem>
                                <SelectItem value="1">Weeks</SelectItem>
                                <SelectItem value="2">Months</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="interestRatePerPeriod">Interest Rate (% per period) *</Label>
                        <Input id="interestRatePerPeriod" type="number" step="0.01" {...register("interestRatePerPeriod", { valueAsNumber: true })} disabled={isSubmitting} />
                        {errors.interestRatePerPeriod && <p className="text-xs text-red-500">{errors.interestRatePerPeriod.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Interest Type</Label>
                        <Select value={String(watch("interestType") ?? 0)} onValueChange={(v) => setValue("interestType", Number(v) as any)} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Declining Balance</SelectItem>
                                <SelectItem value="1">Flat</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Amortization Type</Label>
                        <Select value={String(watch("amortizationType") ?? 1)} onValueChange={(v) => setValue("amortizationType", Number(v) as any)} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Equal Installments</SelectItem>
                                <SelectItem value="0">Equal Principal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Interest Calc Period</Label>
                        <Select value={String(watch("interestCalculationPeriodType") ?? 0)} onValueChange={(v) => setValue("interestCalculationPeriodType", Number(v) as any)} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Daily</SelectItem>
                                <SelectItem value="1">Same as Repayment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-base">Dates</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="submittedOnDate">Submitted On Date *</Label>
                        <Input id="submittedOnDate" type="date" {...register("submittedOnDate")} disabled={isSubmitting} />
                        {errors.submittedOnDate && <p className="text-xs text-red-500">{errors.submittedOnDate.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="expectedDisbursementDate">Expected Disbursement Date *</Label>
                        <Input id="expectedDisbursementDate" type="date" {...register("expectedDisbursementDate")} disabled={isSubmitting} />
                        {errors.expectedDisbursementDate && <p className="text-xs text-red-500">{errors.expectedDisbursementDate.message}</p>}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-base">Additional Options</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="loanPurposeName">Loan Purpose</Label>
                        <Textarea id="loanPurposeName" {...register("loanPurposeName")} disabled={isSubmitting} placeholder="Purpose of the loan..." rows={2} />
                    </div>
                    <div className="flex items-end gap-2 pb-2">
                        <div className="flex items-center gap-2">
                            <Checkbox id="allowPartialPeriodInterestCalcualtion" checked={watch("allowPartialPeriodInterestCalcualtion") ?? false}
                                onCheckedChange={(v) => setValue("allowPartialPeriodInterestCalcualtion", v === true)} disabled={isSubmitting} />
                            <Label htmlFor="allowPartialPeriodInterestCalcualtion" className="text-sm font-normal">Partial Period Interest Calc</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
                    {isSubmitting ? (
                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{mode === "create" ? "Creating..." : "Saving..."}</span>
                    ) : mode === "create" ? "Create Loan" : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => window.history.back()}>Cancel</Button>
            </div>
        </form>
    );
};

export default LoanForm;
export type { LoanFormProps };
