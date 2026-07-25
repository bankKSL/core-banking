import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Wallet, ExternalLink, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffices } from "@/hooks/useOffices";
import { useClients } from "@/features/clients";
import {
  DEPOSIT_PERIOD_FREQUENCIES,
  RECURRING_DEPOSIT_FREQUENCY_TYPES,
  useRecurringDepositProducts,
  useCreateRecurringDepositAccount,
  fetchRecurringDepositAccountTemplate,
} from "@/features/deposits";

const INTEREST_COMPOUNDING_OPTIONS = [
  { id: 1, label: "Daily" },
  { id: 4, label: "Monthly" },
  { id: 5, label: "Quarterly" },
  { id: 6, label: "Semi-Annual" },
  { id: 7, label: "Annual" },
];

const INTEREST_POSTING_OPTIONS = [
  { id: 1, label: "Monthly" },
  { id: 4, label: "Quarterly" },
  { id: 5, label: "Semi-Annual" },
  { id: 6, label: "Annual" },
  { id: 8, label: "Daily" },
  { id: 9, label: "Weekly" },
  { id: 11, label: "At Maturity" },
];

const INTEREST_CALCULATION_OPTIONS = [
  { id: 1, label: "Daily Balance" },
  { id: 2, label: "Average Daily Balance" },
];

const DAYS_IN_YEAR_OPTIONS = [
  { id: 360, label: "360" },
  { id: 365, label: "365" },
];

const LOCKIN_PERIOD_TYPE_OPTIONS = [
  { id: 0, label: "Days" },
  { id: 1, label: "Weeks" },
  { id: 2, label: "Months" },
  { id: 3, label: "Years" },
];

const PRE_CLOSURE_PENALTY_ON_OPTIONS = [
  { id: 1, label: "Whole Term" },
  { id: 2, label: "Till Premature Withdrawal" },
];

const rdSchema = z.object({
  officeId: z.string().min(1, "Office is required"),
  clientId: z.string().min(1, "Client is required"),
  productId: z.string().min(1, "Product is required"),
  externalId: z.string().optional(),
  mandatoryRecommendedDepositAmount: z.string().min(1, "Recurring amount is required"),
  depositPeriod: z.string().min(1, "Period is required"),
  depositPeriodFrequencyId: z.string(),
  submittedOnDate: z.string().min(1, "Date is required"),
  isCalendarInherited: z.boolean().optional(),
  recurringFrequency: z.string().optional(),
  recurringFrequencyType: z.string().optional(),
  isMandatoryDeposit: z.boolean().optional(),
  allowWithdrawal: z.boolean().optional(),
  adjustAdvanceTowardsFuturePayments: z.boolean().optional(),
  expectedFirstDepositOnDate: z.string().optional(),
  nominalAnnualInterestRate: z.string().optional(),
  interestCompoundingPeriodType: z.string().optional(),
  interestPostingPeriodType: z.string().optional(),
  interestCalculationType: z.string().optional(),
  interestCalculationDaysInYearType: z.string().optional(),
  lockinPeriodFrequency: z.string().optional(),
  lockinPeriodFrequencyType: z.string().optional(),
  preClosurePenalApplicable: z.boolean().optional(),
  preClosurePenalInterest: z.string().optional(),
  preClosurePenalInterestOnTypeId: z.string().optional(),
  withHoldTax: z.boolean().optional(),
  fieldOfficerId: z.string().optional(),
});

type RDFormValues = z.infer<typeof rdSchema>;

const CreateRecurringDepositPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId");

  const createMutation = useCreateRecurringDepositAccount();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RDFormValues>({
    resolver: zodResolver(rdSchema) as any,
    defaultValues: {
      officeId: "",
      clientId: clientIdParam || "",
      productId: "",
      externalId: "",
      mandatoryRecommendedDepositAmount: "",
      depositPeriod: "12",
      depositPeriodFrequencyId: "2",
      submittedOnDate: new Date().toISOString().split("T")[0],
      isCalendarInherited: false,
      recurringFrequency: "1",
      recurringFrequencyType: "2",
      isMandatoryDeposit: true,
      allowWithdrawal: false,
      adjustAdvanceTowardsFuturePayments: false,
      expectedFirstDepositOnDate: "",
      nominalAnnualInterestRate: "",
      interestCompoundingPeriodType: "",
      interestPostingPeriodType: "",
      interestCalculationType: "",
      interestCalculationDaysInYearType: "",
      lockinPeriodFrequency: "",
      lockinPeriodFrequencyType: "",
      preClosurePenalApplicable: false,
      preClosurePenalInterest: "",
      preClosurePenalInterestOnTypeId: "",
      withHoldTax: false,
      fieldOfficerId: "",
    },
  });

  const officeId = watch("officeId");
  const clientId = watch("clientId");
  const productId = watch("productId");
  const isCalendarInherited = watch("isCalendarInherited");
  const preClosurePenalApplicable = watch("preClosurePenalApplicable");

  const { data: offices = [], isLoading: officesLoading } = useOffices();
  const clientsQuery = useMemo(() => (officeId && officeId !== "all" ? { officeId: Number(officeId) } : {}), [officeId]);
  const { data: clientsData, isLoading: clientsLoading } = useClients(clientsQuery);
  const { data: products = [], isLoading: productsLoading } = useRecurringDepositProducts();

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["recurringdepositaccounts", "template", clientId, productId],
    queryFn: () => fetchRecurringDepositAccountTemplate({ clientId: clientId ? Number(clientId) : undefined, productId: productId ? Number(productId) : undefined }),
    enabled: !!clientId && !!productId,
    staleTime: 60_000,
  });

  const isLoading = officesLoading || clientsLoading || productsLoading;
  const clients = clientsData?.pageItems ?? [];

  const onSubmit = async (values: RDFormValues) => {
    const payload: Record<string, unknown> = {
      clientId: Number(values.clientId),
      productId: Number(values.productId),
      submittedOnDate: values.submittedOnDate,
      mandatoryRecommendedDepositAmount: Number(values.mandatoryRecommendedDepositAmount),
      depositPeriod: Number(values.depositPeriod),
      depositPeriodFrequencyId: Number(values.depositPeriodFrequencyId),
      isCalendarInherited: !!values.isCalendarInherited,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
      externalId: values.externalId || undefined,
      isMandatoryDeposit: !!values.isMandatoryDeposit,
      allowWithdrawal: !!values.allowWithdrawal,
      adjustAdvanceTowardsFuturePayments: !!values.adjustAdvanceTowardsFuturePayments,
    };

    if (!values.isCalendarInherited) {
      if (values.recurringFrequency) payload.recurringFrequency = Number(values.recurringFrequency);
      if (values.recurringFrequencyType) payload.recurringFrequencyType = Number(values.recurringFrequencyType);
    }
    if (values.expectedFirstDepositOnDate) payload.expectedFirstDepositOnDate = values.expectedFirstDepositOnDate;
    if (values.nominalAnnualInterestRate) payload.nominalAnnualInterestRate = Number(values.nominalAnnualInterestRate);
    if (values.interestCompoundingPeriodType) payload.interestCompoundingPeriodType = Number(values.interestCompoundingPeriodType);
    if (values.interestPostingPeriodType) payload.interestPostingPeriodType = Number(values.interestPostingPeriodType);
    if (values.interestCalculationType) payload.interestCalculationType = Number(values.interestCalculationType);
    if (values.interestCalculationDaysInYearType) payload.interestCalculationDaysInYearType = Number(values.interestCalculationDaysInYearType);
    if (values.lockinPeriodFrequency) payload.lockinPeriodFrequency = Number(values.lockinPeriodFrequency);
    if (values.lockinPeriodFrequencyType) payload.lockinPeriodFrequencyType = Number(values.lockinPeriodFrequencyType);
    if (values.fieldOfficerId) payload.fieldOfficerId = Number(values.fieldOfficerId);

    if (values.preClosurePenalApplicable) {
      payload.preClosurePenalApplicable = true;
      if (values.preClosurePenalInterest) payload.preClosurePenalInterest = Number(values.preClosurePenalInterest);
      if (values.preClosurePenalInterestOnTypeId) payload.preClosurePenalInterestOnTypeId = Number(values.preClosurePenalInterestOnTypeId);
    }
    if (values.withHoldTax) payload.withHoldTax = true;

    await createMutation.mutateAsync(payload);
    navigate("/deposits/recurring");
  };

  if (isLoading)
    return (
      <div className="max-w-4xl m-auto space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );

  return (
    <div className="max-w-4xl m-auto space-y-6 p-6">
      <PageHeader
        title="New Recurring Deposit"
        description="Open a recurring deposit account"
        actions={
          <Button variant="outline" onClick={() => navigate("/deposits/recurring")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Office & Client */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Wallet className="mr-2 inline h-5 w-5" />
              Office & Client
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Office *</Label>
              <Select value={officeId} onValueChange={(v) => { setValue("officeId", v, { shouldValidate: true }); setValue("clientId", ""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((o) => (<SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={(v) => setValue("clientId", v, { shouldValidate: true })} disabled={!officeId}>
                <SelectTrigger>
                  <SelectValue placeholder={!officeId ? "Select office first" : "Select client"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.displayName ?? `#${c.id}`}</SelectItem>))}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-sm text-red-500 mt-1">{errors.clientId.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Product */}
        <Card>
          <CardHeader>
            <CardTitle>Recurring Deposit Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Product *</Label>
              <Select value={productId} onValueChange={(v) => setValue("productId", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
              {errors.productId && <p className="text-sm text-red-500 mt-1">{errors.productId.message}</p>}
              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => window.open("/deposits/recurring-products", "_blank")}>
                <ExternalLink className="mr-1 h-3 w-3" />
                Create New Product
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Details */}
        <Card>
          <CardHeader>
            <CardTitle>Deposit Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="externalId">External ID</Label>
              <Input id="externalId" {...register("externalId")} placeholder="Optional" />
            </div>
            <div>
              <Label>Recurring Deposit Amount *</Label>
              <Input type="number" {...register("mandatoryRecommendedDepositAmount")} />
              {errors.mandatoryRecommendedDepositAmount && <p className="text-sm text-red-500 mt-1">{errors.mandatoryRecommendedDepositAmount.message}</p>}
            </div>
            <div>
              <Label>Period Length *</Label>
              <Input type="number" {...register("depositPeriod")} />
              {errors.depositPeriod && <p className="text-sm text-red-500 mt-1">{errors.depositPeriod.message}</p>}
            </div>
            <div>
              <Label>Period Frequency</Label>
              <Select value={watch("depositPeriodFrequencyId")} onValueChange={(v) => setValue("depositPeriodFrequencyId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPOSIT_PERIOD_FREQUENCIES.map((f) => (<SelectItem key={f.id} value={String(f.id)}>{f.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Submitted Date *</Label>
              <Input type="date" {...register("submittedOnDate")} />
              {errors.submittedOnDate && <p className="text-sm text-red-500 mt-1">{errors.submittedOnDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="fieldOfficerId">Field Officer ID</Label>
              <Input id="fieldOfficerId" type="number" {...register("fieldOfficerId")} placeholder="Optional" />
            </div>
          </CardContent>
        </Card>

        {/* Recurring Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Recurring Configuration</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 pt-2">
              <Switch id="isCalendarInherited" onCheckedChange={(v) => setValue("isCalendarInherited", v)} />
              <Label htmlFor="isCalendarInherited">Use Group Calendar</Label>
            </div>
            {!isCalendarInherited && (
              <>
                <div>
                  <Label>Deposit Every</Label>
                  <Input type="number" {...register("recurringFrequency")} placeholder="e.g. 1" />
                </div>
                <div>
                  <Label>Frequency Type</Label>
                  <Select value={watch("recurringFrequencyType")} onValueChange={(v) => setValue("recurringFrequencyType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RECURRING_DEPOSIT_FREQUENCY_TYPES.map((f) => (<SelectItem key={f.id} value={String(f.id)}>{f.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Switch id="isMandatoryDeposit" onCheckedChange={(v) => setValue("isMandatoryDeposit", v)} defaultChecked />
              <Label htmlFor="isMandatoryDeposit">Mandatory Deposit</Label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch id="allowWithdrawal" onCheckedChange={(v) => setValue("allowWithdrawal", v)} />
              <Label htmlFor="allowWithdrawal">Allow Withdrawal</Label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch id="adjustAdvanceTowardsFuturePayments" onCheckedChange={(v) => setValue("adjustAdvanceTowardsFuturePayments", v)} />
              <Label htmlFor="adjustAdvanceTowardsFuturePayments">Advance Payment Adjustment</Label>
            </div>
            <div>
              <Label htmlFor="expectedFirstDepositOnDate">First Deposit Expected On</Label>
              <Input id="expectedFirstDepositOnDate" type="date" {...register("expectedFirstDepositOnDate")} />
            </div>
          </CardContent>
        </Card>

        {/* Interest Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Interest Configuration</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Interest Rate (% annual)</Label>
              <Input type="number" step="0.01" {...register("nominalAnnualInterestRate")} placeholder={(template as any)?.nominalAnnualInterestRate != null ? String((template as any).nominalAnnualInterestRate) : ""} />
            </div>
            <div>
              <Label>Compounding Period</Label>
              <Select value={watch("interestCompoundingPeriodType")} onValueChange={(v) => setValue("interestCompoundingPeriodType", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{INTEREST_COMPOUNDING_OPTIONS.map((o) => (<SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Posting Period</Label>
              <Select value={watch("interestPostingPeriodType")} onValueChange={(v) => setValue("interestPostingPeriodType", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{INTEREST_POSTING_OPTIONS.map((o) => (<SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Calculation Type</Label>
              <Select value={watch("interestCalculationType")} onValueChange={(v) => setValue("interestCalculationType", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{INTEREST_CALCULATION_OPTIONS.map((o) => (<SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Days in Year</Label>
              <Select value={watch("interestCalculationDaysInYearType")} onValueChange={(v) => setValue("interestCalculationDaysInYearType", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{DAYS_IN_YEAR_OPTIONS.map((o) => (<SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lockinPeriodFrequency">Lock-in Period</Label>
              <div className="flex gap-2">
                <Input id="lockinPeriodFrequency" type="number" {...register("lockinPeriodFrequency")} placeholder="Period" className="flex-1" />
                <Select value={watch("lockinPeriodFrequencyType")} onValueChange={(v) => setValue("lockinPeriodFrequencyType", v)}>
                  <SelectTrigger className="w-28"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{LOCKIN_PERIOD_TYPE_OPTIONS.map((o) => (<SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pre-closure & Tax */}
        <Card>
          <CardHeader>
            <CardTitle>Pre-closure & Tax</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 pt-2">
              <Switch id="preClosurePenalApplicable" onCheckedChange={(v) => setValue("preClosurePenalApplicable", v)} />
              <Label htmlFor="preClosurePenalApplicable">Apply Pre-closure Penalty</Label>
            </div>
            {preClosurePenalApplicable && (
              <>
                <div>
                  <Label>Penalty Interest Rate (%)</Label>
                  <Input type="number" step="0.01" {...register("preClosurePenalInterest")} />
                </div>
                <div>
                  <Label>Penalty Applied On</Label>
                  <Select value={watch("preClosurePenalInterestOnTypeId")} onValueChange={(v) => setValue("preClosurePenalInterestOnTypeId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{PRE_CLOSURE_PENALTY_ON_OPTIONS.map((o) => (<SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Switch id="withHoldTax" onCheckedChange={(v) => setValue("withHoldTax", v)} />
              <Label htmlFor="withHoldTax">Withhold Tax</Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/deposits/recurring")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? "Creating..." : "Create RD"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateRecurringDepositPage;
