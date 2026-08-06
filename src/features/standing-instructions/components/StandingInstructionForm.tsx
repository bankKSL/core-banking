import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  standingInstructionFormSchema,
  type StandingInstructionFormValues,
} from "../schemas/standing-instruction.schema";
import type {
  StandingInstructionTemplate,
  OfficeOption,
  ClientOption,
  AccountOption,
  EnumOption,
} from "../types/standing-instruction.types";
import { ACCOUNT_TYPE_LABELS } from "../constants/status";

interface SideState {
  officeId: number | null;
  clientId: number | null;
  accountType: number | null;
  accountId: number | null;
}

interface StandingInstructionFormProps {
  template: StandingInstructionTemplate | undefined;
  isTemplateLoading: boolean;
  fromClients: ClientOption[];
  toClients: ClientOption[];
  fromAccounts: AccountOption[];
  toAccounts: AccountOption[];
  fromState: SideState;
  toState: SideState;
  offices: OfficeOption[];
  defaultValues?: Partial<StandingInstructionFormValues>;
  mutationError: string | null;
  isSubmitting: boolean;
  isEdit: boolean;
  onFromChange: (field: keyof SideState, value: number | null) => void;
  onToChange: (field: keyof SideState, value: number | null) => void;
  onTransferTypeChange: (value: number) => void;
  onInstructionTypeChange: (value: number) => void;
  onPriorityChange: (value: number) => void;
  onRecurrenceTypeChange: (value: number) => void;
  onRecurrenceFrequencyChange: (value: number | null) => void;
  onStatusChange: (value: number) => void;
  transferType: number;
  instructionType: number;
  priority: number;
  recurrenceType: number;
  recurrenceFrequency: number | null;
  status: number;
  onBack: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}

const StandingInstructionForm: React.FC<StandingInstructionFormProps> = ({
  template,
  isTemplateLoading,
  fromClients,
  toClients,
  fromAccounts,
  toAccounts,
  fromState,
  toState,
  offices,
  defaultValues,
  mutationError,
  isSubmitting,
  isEdit,
  onFromChange,
  onToChange,
  onTransferTypeChange,
  onInstructionTypeChange,
  onPriorityChange,
  onRecurrenceTypeChange,
  onRecurrenceFrequencyChange,
  onStatusChange,
  priority,
  transferType,
  instructionType,
  recurrenceType,
  recurrenceFrequency,
  status,
  onBack,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StandingInstructionFormValues>({
    resolver: zodResolver(standingInstructionFormSchema),
    defaultValues: {
      name: "",
      validFrom: "",
      validTill: "",
      ...defaultValues,
    },
  });

  const renderSelect = (
    label: string,
    value: number | null,
    onChange: (v: number) => void,
    options: EnumOption[],
    placeholder: string,
    disabled = false,
    disabledPlaceholder?: string,
  ) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      <Select value={value ? String(value) : ""} onValueChange={(v) => onChange(Number(v))} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={disabled && disabledPlaceholder ? disabledPlaceholder : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={String(opt.id)}>
              {opt.value ?? opt.code ?? String(opt.id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderSidePanel = (
    side: "from" | "to",
    state: SideState,
    clients: ClientOption[],
    accounts: AccountOption[],
    onChange: (field: keyof SideState, value: number | null) => void,
  ) => {
    const update = (field: keyof SideState, value: number | null) => {
      onChange(field, value);
    };

    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">{side === "from" ? t("From") : t("To")} {t("Office")} *</label>
          <Select
            value={state.officeId ? String(state.officeId) : ""}
            onValueChange={(v) => update("officeId", Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("Select office")} />
            </SelectTrigger>
            <SelectContent>
              {offices.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">{side === "from" ? t("From") : t("To")} {t("Client")} *</label>
          <Select
            value={state.clientId ? String(state.clientId) : ""}
            onValueChange={(v) => update("clientId", Number(v))}
            disabled={!state.officeId}
          >
            <SelectTrigger>
              <SelectValue placeholder={state.officeId ? t("Select client") : t("Select office first")} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">{side === "from" ? t("From") : t("To")} {t("Account Type")} *</label>
          <Select
            value={state.accountType ? String(state.accountType) : ""}
            onValueChange={(v) => update("accountType", Number(v))}
            disabled={!state.clientId}
          >
            <SelectTrigger>
              <SelectValue placeholder={state.clientId ? t("Select type") : t("Select client first")} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">{side === "from" ? t("From") : t("To")} {t("Account")} *</label>
          <Select
            value={state.accountId ? String(state.accountId) : ""}
            onValueChange={(v) => update("accountId", Number(v))}
            disabled={!state.accountType}
          >
            <SelectTrigger>
              <SelectValue placeholder={state.accountType ? t("Select account") : t("Select type first")} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.accountNo} — {a.productName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  if (isTemplateLoading) {
    return (
      <div className="p-6 max-w-5xl m-auto space-y-6">
        <PageHeader
          title={isEdit ? t("Edit Standing Instruction") : t("New Standing Instruction")}
          description={t("Loading form data...")}
          actions={
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
          }
        />
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Standing Instruction") : t("New Standing Instruction")}
        description={t("Create or edit a recurring transfer instruction")}
        actions={
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      <form onSubmit={handleSubmit((values) => onSubmit(values as unknown as Record<string, unknown>))}>
        {mutationError && (
          <div className="mb-6">
            <ErrorState message={mutationError} />
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("Instruction Details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Name")} *</label>
              <Input {...register("name")} placeholder={t("e.g. Monthly savings transfer")} error={errors.name?.message} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderSelect(
                t("Transfer Type"),
                transferType,
                onTransferTypeChange,
                template?.transferTypeOptions ?? [],
                t("Select type"),
                isTemplateLoading,
              )}
              {renderSelect(
                t("Instruction Type"),
                instructionType,
                onInstructionTypeChange,
                template?.instructionTypeOptions ?? [],
                t("Select type"),
                isTemplateLoading,
              )}
              {renderSelect(
                t("Priority"),
                priority,
                onPriorityChange,
                template?.priorityOptions ?? [],
                t("Select priority"),
                isTemplateLoading,
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  {t("Amount")} {instructionType === 1 && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={instructionType === 2 ? t("Auto-calculated from dues") : "0.00"}
                  {...register("amount")}
                  error={errors.amount?.message}
                  disabled={instructionType === 2}
                />
                {instructionType === 2 && (
                  <p className="text-xs text-gray-500 mt-1">{t("Amount will be calculated from outstanding dues")}</p>
                )}
              </div>
              {renderSelect(
                t("Recurrence Type"),
                recurrenceType,
                onRecurrenceTypeChange,
                template?.recurrenceTypeOptions ?? [],
                t("Select type"),
                isTemplateLoading,
              )}
              {renderSelect(
                t("Status"),
                status,
                onStatusChange,
                template?.statusOptions ?? [],
                t("Select status"),
                isTemplateLoading,
              )}
            </div>

            {recurrenceType === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Recurrence Frequency")} *</label>
                  <Select
                    value={recurrenceFrequency != null ? String(recurrenceFrequency) : ""}
                    onValueChange={(v) => onRecurrenceFrequencyChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select frequency")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(template?.recurrenceFrequencyOptions ?? []).map((opt) => (
                        <SelectItem key={opt.id} value={String(opt.id)}>
                          {opt.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Recurrence Interval")} *</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder={t("e.g. 1")}
                    {...register("recurrenceInterval")}
                    error={errors.recurrenceInterval?.message}
                  />
                </div>
                {(recurrenceFrequency === 2 || recurrenceFrequency === 3) && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">{t("Recurrence On Day")}</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder={t("Day of month (1-31)")}
                      {...register("recurrenceOnMonthDay")}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  {t("Valid From")} <span className="text-red-500">*</span>
                </label>
                <Input type="date" {...register("validFrom")} error={errors.validFrom?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Valid Till")}</label>
                <Input type="date" {...register("validTill")} error={errors.validTill?.message} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("From")}</CardTitle>
            </CardHeader>
            <CardContent>{renderSidePanel("from", fromState, fromClients, fromAccounts, onFromChange)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("To")}</CardTitle>
            </CardHeader>
            <CardContent>{renderSidePanel("to", toState, toClients, toAccounts, onToChange)}</CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting || !fromState.accountId || !toState.accountId}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Saving…")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? t("Update Instruction") : t("Create Instruction")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export { StandingInstructionForm };
