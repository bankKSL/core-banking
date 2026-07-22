import { type FC, useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ExternalLink, Search, X, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { createLoanSchema, type CreateLoanFormValues } from "../schemas/loan.schema";
import type { LoanProduct, LoanTemplate, Loan } from "../types/loan";
import { useClients } from "@/features/clients";
import { currentDate } from "@/lib/utils";

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

/** Type override for fields not in the Zod schema yet */
type FormFields = CreateLoanFormValues & {
    graceOnInterestPayment?: number;
    inArrearsTolerance?: number;
    repaymentsStartingFromDate?: string;
};

// ─── Inline Client Search Component ─────────────────────────────────
interface ClientSearchProps {
    value: number;
    onChange: (clientId: number) => void;
    disabled?: boolean;
    error?: string;
}

const ClientSearch: FC<ClientSearchProps> = ({ value, onChange, disabled, error }) => {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    const { data, isLoading } = useClients(query.length >= 2 ? { limit: 20, offset: 0, displayName: query } : { limit: 100 });

    const clients = data?.pageItems ?? [];
    const selected = clients.find((c) => c.id === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = useCallback((val: string) => {
        setQuery(val);
        clearTimeout(debounceRef.current!);
        debounceRef.current = setTimeout(() => setOpen(true), 200);
    }, []);

    return (
        <div ref={ref} className="relative">
            <Label htmlFor="clientSearch">Client *</Label>
            {selected ? (
                <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
                    <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="flex-1 text-sm">{selected.displayName ?? `Client #${selected.id}`}</span>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={() => {
                                onChange(0);
                                setQuery("");
                                setOpen(false);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        id="clientSearch"
                        placeholder="Search client by name…"
                        className="pl-9"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => query.length >= 2 && setOpen(true)}
                        disabled={disabled}
                    />
                </div>
            )}

            {open && !selected && clients.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {clients.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => {
                                onChange(c.id);
                                setOpen(false);
                                setQuery("");
                            }}
                        >
                            <span>{c.displayName ?? `Client #${c.id}`}</span>
                            {c.accountNo && <span className="ml-2 text-xs text-gray-400">#{c.accountNo}</span>}
                        </button>
                    ))}
                </div>
            )}

            {open && !selected && query.length >= 2 && clients.length === 0 && !isLoading && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    No clients found
                </div>
            )}

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

            <Button type="button" variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" onClick={() => window.open("/clients/new", "_blank")}>
                <ExternalLink className="mr-1 h-3 w-3" />
                Create New Client
            </Button>
        </div>
    );
};

// ─── Loan Form Component ─────────────────────────────────────────
const LoanForm: FC<LoanFormProps> = ({ template, products, loan, onSubmit, isSubmitting, error, mode, clientId }) => {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormFields>({
        defaultValues: {
            clientId: loan?.clientId ?? clientId ?? 0,
            productId: loan?.loanProductId ?? 0,
            principal: loan?.principal ?? 0,
            loanTermFrequency: loan?.termFrequency ?? 12,
            loanTermFrequencyType: loan?.termPeriodFrequencyType?.id ?? 2,
            numberOfRepayments: loan?.numberOfRepayments ?? 12,
            repaymentEvery: loan?.repaymentEvery ?? 1,
            repaymentFrequencyType: loan?.repaymentFrequencyType?.id ?? 2,
            interestRatePerPeriod: loan?.interestRatePerPeriod ?? 0,
            interestType: 0,
            amortizationType: 1,
            interestCalculationPeriodType: 0,
            expectedDisbursementDate: currentDate(loan?.expectedDisbursementDate) || currentDate(),
            submittedOnDate: currentDate(loan?.submittedOnDate) || currentDate(),
            externalId: loan?.externalId ?? "",
            graceOnInterestPayment: undefined,
            inArrearsTolerance: undefined,
            repaymentsStartingFromDate: "",
            dateFormat: "yyyy-MM-dd",
            locale: "en",
        },
    });

    const productId = watch("productId");

    // ── Detect progressive schedule ──────────────────────────────────
    const product = products.find((p) => p.id === productId);
    const isProgressive = (() => {
        if (!product) return false;
        const lst = (product as any).loanScheduleType;
        return lst?.code === "PROGRESSIVE" || lst === "PROGRESSIVE";
    })();

    const scheduleTypeLabel = (() => {
        if (!product) return null;
        const lst = (product as any).loanScheduleType;
        const val = lst?.value ?? lst ?? "";
        return String(val);
    })();

    // ── Product select handler ───────────────────────────────────────
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

    const clientIdVal = watch("clientId");

    // ── Client change handler ────────────────────────────────────────
    const handleClientChange = useCallback((id: number) => setValue("clientId", id, { shouldValidate: true }), [setValue]);

    return (
        <form onSubmit={handleSubmit((values) => onSubmit(values as any))} className="space-y-6">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{error}</div>}

            {/* Row 1 (full width) — Client Search */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Client & Product</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="col-span-2">
                        <ClientSearch value={clientIdVal} onChange={handleClientChange} disabled={isSubmitting || mode === "edit"} error={errors.clientId?.message} />
                    </div>

                    {/* Row 2 (full width) — Product select + create button */}
                    <div className="col-span-2">
                        <Label>Loan Product *</Label>
                        <div className="flex items-start gap-2">
                            <div className="flex-1">
                                <Select value={productId ? String(productId) : ""} onValueChange={handleProductSelect} disabled={isSubmitting || mode === "edit"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.productId && <p className="mt-1 text-xs text-red-500">{errors.productId.message}</p>}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="mt-0 shrink-0" onClick={() => window.open("/lending/products", "_blank")}>
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Create
                            </Button>
                        </div>

                        {/* Row 2b (conditional) — Loan Schedule Type chip */}
                        {scheduleTypeLabel && (
                            <div className="mt-2">
                                <Badge variant={scheduleTypeLabel === "PROGRESSIVE" ? "info" : "default"} size="sm" rounded>
                                    {scheduleTypeLabel === "PROGRESSIVE" ? "Progressive" : "Cumulative"}
                                </Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Rows 3-6: 2-column grid */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Loan Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Row 3: Principal | Loan Term Frequency */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="principal">Principal *</Label>
                        <Input id="principal" type="number" step="0.01" {...register("principal", { valueAsNumber: true })} disabled={isSubmitting} />
                        {errors.principal && <p className="text-xs text-red-500">{errors.principal.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="loanTermFrequency">Loan Term Frequency</Label>
                        <Input id="loanTermFrequency" type="number" {...register("loanTermFrequency", { valueAsNumber: true })} disabled={isSubmitting} />
                        {errors.loanTermFrequency && <p className="text-xs text-red-500">{errors.loanTermFrequency.message}</p>}
                    </div>

                    {/* Row 4: # Repayments | Repayment Frequency Type */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="numberOfRepayments">Number of Repayments *</Label>
                        <Input id="numberOfRepayments" type="number" {...register("numberOfRepayments", { valueAsNumber: true })} disabled={isSubmitting} />
                        {errors.numberOfRepayments && <p className="text-xs text-red-500">{errors.numberOfRepayments.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Repayment Frequency Type *</Label>
                        <Select value={String(watch("repaymentFrequencyType"))} onValueChange={(v) => setValue("repaymentFrequencyType", Number(v))} disabled={isSubmitting}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Days</SelectItem>
                                <SelectItem value="1">Weeks</SelectItem>
                                <SelectItem value="2">Months</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.repaymentFrequencyType && <p className="text-xs text-red-500">{errors.repaymentFrequencyType.message}</p>}
                    </div>

                    {/* Row 5: Interest Type | Interest Calculation Period Type */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Interest Type *</Label>
                        <Select value={String(watch("interestType") ?? 0)} onValueChange={(v) => setValue("interestType", Number(v) as any)} disabled={isSubmitting}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Declining Balance</SelectItem>
                                <SelectItem value="1">Flat</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Interest Calculation Period Type *</Label>
                        <Select
                            value={String(watch("interestCalculationPeriodType") ?? 0)}
                            onValueChange={(v) => setValue("interestCalculationPeriodType", Number(v) as any)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Daily</SelectItem>
                                <SelectItem value="1">Same as Repayment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Row 6: Grace on Interest | In Arrears Tolerance */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="graceOnInterestPayment">Grace on Interest Payment</Label>
                        <Input id="graceOnInterestPayment" type="number" {...register("graceOnInterestPayment", { valueAsNumber: true })} disabled={isSubmitting} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="inArrearsTolerance">In Arrears Tolerance</Label>
                        <Input id="inArrearsTolerance" type="number" step="0.01" {...register("inArrearsTolerance", { valueAsNumber: true })} disabled={isSubmitting} />
                    </div>

                    {/* Row 7: Submitted On Date | Expected Disbursement Date */}
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

                    {/* Row 8: Repayments Starting From Date (span full width) */}
                    <div className="col-span-2 flex flex-col gap-1.5">
                        <Label htmlFor="repaymentsStartingFromDate">Repayments Starting From Date</Label>
                        <Input id="repaymentsStartingFromDate" type="date" {...register("repaymentsStartingFromDate")} disabled={isSubmitting} className="max-w-sm" />
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {mode === "create" ? "Creating..." : "Saving..."}
                        </span>
                    ) : mode === "create" ? (
                        "Create Loan"
                    ) : (
                        "Save Changes"
                    )}
                </Button>
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => window.history.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
};

export default LoanForm;
export type { LoanFormProps };
