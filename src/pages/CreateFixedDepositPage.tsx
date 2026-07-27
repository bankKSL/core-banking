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
  createFixedDepositAccount,
  fetchFixedDepositAccountTemplate,
  useFixedDepositProducts,
  DEPOSIT_PERIOD_FREQUENCIES,
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
  { id: 7, label: "Bi-Annual" },
  { id: 8, label: "Daily" },
  { id: 9, label: "Weekly" },
  { id: 10, label: "Bi-Weekly" },
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

const MATURITY_INSTRUCTION_OPTIONS = [
  { id: 100, label: "Withdraw Deposit" },
  { id: 200, label: "Transfer to Savings" },
  { id: 300, label: "Reinvest Principal + Interest" },
  { id: 400, label: "Reinvest Principal Only" },
];

const PRE_CLOSURE_PENALTY_ON_OPTIONS = [
  { id: 1, label: "Whole Term" },
  { id: 2, label: "Till Premature Withdrawal" },
];

const fixedDepositSchema = z.object({
  officeId: z.string().min(1, "Office is required"),
  clientId: z.string().min(1, "Client is required"),
  productId: z.string().min(1, "Product is required"),
  externalId: z.string().optional(),
  depositAmount: z.string().min(1, "Deposit amount is required"),
  depositPeriod: z.string().min(1, "Period is required"),
  depositPeriodFrequencyId: z.string(),
  submittedOnDate: z.string().min(1, "Date is required"),
  nominalAnnualInterestRate: z.string().optional(),
  interestCompoundingPeriodType: z.string().optional(),
  interestPostingPeriodType: z.string().optional(),
  interestCalculationType: z.string().optional(),
  interestCalculationDaysInYearType: z.string().optional(),
  maturityInstructionId: z.string().optional(),
  preClosurePenalApplicable: z.boolean().optional(),
  preClosurePenalInterest: z.string().optional(),
  preClosurePenalInterestOnTypeId: z.string().optional(),
  transferInterestToSavings: z.boolean().optional(),
  linkedAccount: z.string().optional(),
  withHoldTax: z.boolean().optional(),
});

type FixedDepositFormValues = z.infer<typeof fixedDepositSchema>;

const CreateFixedDepositPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FixedDepositFormValues>({
    resolver: zodResolver(fixedDepositSchema) as any,
    defaultValues: {
      officeId: "",
      clientId: clientIdParam || "",
      productId: "",
      externalId: "",
      depositAmount: "",
      depositPeriod: "12",
      depositPeriodFrequencyId: "2",
      submittedOnDate: new Date().toISOString().split("T")[0],
      nominalAnnualInterestRate: "",
      interestCompoundingPeriodType: "",
      interestPostingPeriodType: "",
      interestCalculationType: "",
      interestCalculationDaysInYearType: "",
      maturityInstructionId: "",
      preClosurePenalApplicable: false,
      preClosurePenalInterest: "",
      preClosurePenalInterestOnTypeId: "",
      transferInterestToSavings: false,
      linkedAccount: "",
      withHoldTax: false,
    },
  });

  const officeId = watch("officeId");
  const clientId = watch("clientId");
  const productId = watch("productId");
  const preClosurePenalApplicable = watch("preClosurePenalApplicable");
  const maturityInstructionId = watch("maturityInstructionId");
  const transferInterestToSavings = watch("transferInterestToSavings");

  const { data: offices = [], isLoading: officesLoading } = useOffices();
  const clientsQuery = useMemo(
    () => (officeId && officeId !== "all" ? { officeId: Number(officeId) } : {}),
    [officeId],
  );
  const { data: clientsData, isLoading: clientsLoading } = useClients(clientsQuery);
  const { data: products = [], isLoading: productsLoading } = useFixedDepositProducts();

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["fixeddepositaccounts", "template", clientId, productId],
    queryFn: () =>
      fetchFixedDepositAccountTemplate(
        clientId ? Number(clientId) : undefined,
        productId ? Number(productId) : undefined,
      ),
    enabled: !!clientId && !!productId,
    staleTime: 60_000,
  });

  const isLoading = officesLoading || clientsLoading || productsLoading;
  const clients = clientsData?.pageItems ?? [];

  const onSubmit = async (values: FixedDepositFormValues) => {
    const payload: Record<string, unknown> = {
      clientId: Number(values.clientId),
      productId: Number(values.productId),
      submittedOnDate: values.submittedOnDate,
      depositAmount: Number(values.depositAmount),
      depositPeriod: Number(values.depositPeriod),
      depositPeriodFrequencyId: Number(values.depositPeriodFrequencyId),
      locale: "en",
      dateFormat: "yyyy-MM-dd",
      externalId: values.externalId || undefined,
    };

    if (values.nominalAnnualInterestRate) payload.nominalAnnualInterestRate = Number(values.nominalAnnualInterestRate);
    if (values.interestCompoundingPeriodType)
      payload.interestCompoundingPeriodType = Number(values.interestCompoundingPeriodType);
    if (values.interestPostingPeriodType) payload.interestPostingPeriodType = Number(values.interestPostingPeriodType);
    if (values.interestCalculationType) payload.interestCalculationType = Number(values.interestCalculationType);
    if (values.interestCalculationDaysInYearType)
      payload.interestCalculationDaysInYearType = Number(values.interestCalculationDaysInYearType);
    if (values.maturityInstructionId) payload.maturityInstructionId = Number(values.maturityInstructionId);
    if (values.transferInterestToSavings) payload.transferInterestToSavings = true;
    if (values.linkedAccount) payload.linkedAccount = Number(values.linkedAccount);
    if (values.withHoldTax) payload.withHoldTax = true;

    if (values.preClosurePenalApplicable) {
      payload.preClosurePenalApplicable = true;
      if (values.preClosurePenalInterest) payload.preClosurePenalInterest = Number(values.preClosurePenalInterest);
      if (values.preClosurePenalInterestOnTypeId)
        payload.preClosurePenalInterestOnTypeId = Number(values.preClosurePenalInterestOnTypeId);
    }

    if (values.maturityInstructionId === "200") {
      payload.transferToSavingsId = Number(values.linkedAccount);
    }

    await createFixedDepositAccount(payload);
    navigate("/deposits/fixed");
  };

  if (isLoading) {
    return (
      <div className=" m-auto space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl m-auto space-y-6 p-6">
      <PageHeader
        title="New Fixed Deposit"
        description="Open a fixed deposit account"
        actions={
          <Button variant="outline" onClick={() => navigate("/deposits/fixed")}>
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
              Office &amp; Client
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Office *</Label>
              <Select
                value={officeId}
                onValueChange={(v) => {
                  setValue("officeId", v, { shouldValidate: true });
                  setValue("clientId", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.officeId && <p className="text-sm text-red-500 mt-1">{errors.officeId.message}</p>}
            </div>
            <div>
              <Label>Client *</Label>
              <Select
                value={clientId}
                onValueChange={(v) => setValue("clientId", v, { shouldValidate: true })}
                disabled={!officeId || officeId === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!officeId ? "Select office first" : "Select client"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.displayName ?? `#${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-sm text-red-500 mt-1">{errors.clientId.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Product */}
        <Card>
          <CardHeader>
            <CardTitle>Fixed Deposit Product</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div>
              <Label>Product *</Label>
              <Select value={productId} onValueChange={(v) => setValue("productId", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productId && <p className="text-sm text-red-500 mt-1">{errors.productId.message}</p>}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs mt-1"
                onClick={() => window.open("/deposits/fixed-products", "_blank")}
              >
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
              <Input id="externalId" {...register("externalId")} placeholder="Optional external reference" />
            </div>
            <div>
              <Label>Deposit Amount *</Label>
              <Input type="number" {...register("depositAmount")} />
              {errors.depositAmount && <p className="text-sm text-red-500 mt-1">{errors.depositAmount.message}</p>}
            </div>
            <div>
              <Label>Period Length *</Label>
              <Input type="number" {...register("depositPeriod")} />
              {errors.depositPeriod && <p className="text-sm text-red-500 mt-1">{errors.depositPeriod.message}</p>}
            </div>
            <div>
              <Label>Frequency *</Label>
              <Select
                value={watch("depositPeriodFrequencyId")}
                onValueChange={(v) => setValue("depositPeriodFrequencyId", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPOSIT_PERIOD_FREQUENCIES.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Submitted Date *</Label>
              <Input type="date" {...register("submittedOnDate")} />
              {errors.submittedOnDate && <p className="text-sm text-red-500 mt-1">{errors.submittedOnDate.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Interest Configuration */}
        {template && (
          <Card>
            <CardHeader>
              <CardTitle>Interest Configuration</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nominal Annual Interest Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("nominalAnnualInterestRate")}
                  placeholder={String(template.nominalAnnualInterestRate ?? "")}
                />
              </div>
              <div>
                <Label>Compounding Period</Label>
                <Select
                  value={watch("interestCompoundingPeriodType")}
                  onValueChange={(v) => setValue("interestCompoundingPeriodType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={template.interestCompoundingPeriodType?.value ?? "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {INTEREST_COMPOUNDING_OPTIONS.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Posting Period</Label>
                <Select
                  value={watch("interestPostingPeriodType")}
                  onValueChange={(v) => setValue("interestPostingPeriodType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={template.interestPostingPeriodType?.value ?? "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {INTEREST_POSTING_OPTIONS.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Calculation Type</Label>
                <Select
                  value={watch("interestCalculationType")}
                  onValueChange={(v) => setValue("interestCalculationType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={template.interestCalculationType?.value ?? "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {INTEREST_CALCULATION_OPTIONS.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Days in Year</Label>
                <Select
                  value={watch("interestCalculationDaysInYearType")}
                  onValueChange={(v) => setValue("interestCalculationDaysInYearType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={template.interestCalculationDaysInYearType?.value ?? "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_IN_YEAR_OPTIONS.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maturity Instruction */}
        <Card>
          <CardHeader>
            <CardTitle>Maturity &amp; Pre-closure</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Maturity Instruction</Label>
              <Select value={maturityInstructionId} onValueChange={(v) => setValue("maturityInstructionId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select instruction" />
                </SelectTrigger>
                <SelectContent>
                  {MATURITY_INSTRUCTION_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {maturityInstructionId === "200" && (
              <div>
                <Label>Transfer to Savings Account ID</Label>
                <Input type="number" {...register("linkedAccount")} placeholder="Savings account ID" />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="preClosurePenalApplicable"
                onCheckedChange={(v) => setValue("preClosurePenalApplicable", v)}
                defaultChecked={template?.preClosurePenalApplicable ?? false}
              />
              <Label htmlFor="preClosurePenalApplicable">Apply Pre-closure Penalty</Label>
            </div>

            {preClosurePenalApplicable && (
              <>
                <div>
                  <Label>Penalty Interest Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("preClosurePenalInterest")}
                    placeholder={String(template?.preClosurePenalInterest ?? "")}
                  />
                </div>
                <div>
                  <Label>Penalty Applied On</Label>
                  <Select
                    value={watch("preClosurePenalInterestOnTypeId")}
                    onValueChange={(v) => setValue("preClosurePenalInterestOnTypeId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={template?.preClosurePenalInterestOnType?.value ?? "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      {PRE_CLOSURE_PENALTY_ON_OPTIONS.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="transferInterestToSavings"
                onCheckedChange={(v) => setValue("transferInterestToSavings", v)}
              />
              <Label htmlFor="transferInterestToSavings">Transfer Interest to Savings</Label>
            </div>

            {transferInterestToSavings && (
              <div>
                <Label>Linked Savings Account ID</Label>
                <Input type="number" {...register("linkedAccount")} placeholder="Linked account ID" />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Switch id="withHoldTax" onCheckedChange={(v) => setValue("withHoldTax", v)} />
              <Label htmlFor="withHoldTax">Withhold Tax</Label>
            </div>
          </CardContent>
        </Card>

        {/* Template Loading */}
        {templateLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading template defaults...
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/deposits/fixed")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? "Creating..." : "Create FD"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateFixedDepositPage;
