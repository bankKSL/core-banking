import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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
    <div>
      <Label>{label}</Label>
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
        <div>
          <Label>{side === "from" ? "From" : "To"} Office *</Label>
          <Select
            value={state.officeId ? String(state.officeId) : ""}
            onValueChange={(v) => update("officeId", Number(v))}
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
        </div>
        <div>
          <Label>{side === "from" ? "From" : "To"} Client *</Label>
          <Select
            value={state.clientId ? String(state.clientId) : ""}
            onValueChange={(v) => update("clientId", Number(v))}
            disabled={!state.officeId}
          >
            <SelectTrigger>
              <SelectValue placeholder={state.officeId ? "Select client" : "Select office first"} />
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
        <div>
          <Label>{side === "from" ? "From" : "To"} Account Type *</Label>
          <Select
            value={state.accountType ? String(state.accountType) : ""}
            onValueChange={(v) => update("accountType", Number(v))}
            disabled={!state.clientId}
          >
            <SelectTrigger>
              <SelectValue placeholder={state.clientId ? "Select type" : "Select client first"} />
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
        <div>
          <Label>{side === "from" ? "From" : "To"} Account *</Label>
          <Select
            value={state.accountId ? String(state.accountId) : ""}
            onValueChange={(v) => update("accountId", Number(v))}
            disabled={!state.accountType}
          >
            <SelectTrigger>
              <SelectValue placeholder={state.accountType ? "Select account" : "Select type first"} />
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
          title={isEdit ? "Edit Standing Instruction" : "New Standing Instruction"}
          description="Loading form data..."
          actions={
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
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
        title={isEdit ? "Edit Standing Instruction" : "New Standing Instruction"}
        description="Create or edit a recurring transfer instruction"
        actions={
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
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
            <CardTitle>Instruction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siName">Name *</Label>
              <Input
                id="siName"
                {...register("name")}
                placeholder="e.g. Monthly savings transfer"
                error={errors.name?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderSelect(
                "Transfer Type",
                transferType,
                onTransferTypeChange,
                template?.transferTypeOptions ?? [],
                "Select type",
                isTemplateLoading,
              )}
              {renderSelect(
                "Instruction Type",
                instructionType,
                onInstructionTypeChange,
                template?.instructionTypeOptions ?? [],
                "Select type",
                isTemplateLoading,
              )}
              {renderSelect(
                "Priority",
                priority,
                onPriorityChange,
                template?.priorityOptions ?? [],
                "Select priority",
                isTemplateLoading,
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="siAmount">
                  Amount {instructionType === 1 && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="siAmount"
                  type="number"
                  step="0.01"
                  placeholder={instructionType === 2 ? "Auto-calculated from dues" : "0.00"}
                  {...register("amount")}
                  error={errors.amount?.message}
                  disabled={instructionType === 2}
                />
                {instructionType === 2 && (
                  <p className="text-xs text-gray-500 mt-1">Amount will be calculated from outstanding dues</p>
                )}
              </div>
              {renderSelect(
                "Recurrence Type",
                recurrenceType,
                onRecurrenceTypeChange,
                template?.recurrenceTypeOptions ?? [],
                "Select type",
                isTemplateLoading,
              )}
              {renderSelect(
                "Status",
                status,
                onStatusChange,
                template?.statusOptions ?? [],
                "Select status",
                isTemplateLoading,
              )}
            </div>

            {recurrenceType === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Recurrence Frequency *</Label>
                  <Select
                    value={recurrenceFrequency != null ? String(recurrenceFrequency) : ""}
                    onValueChange={(v) => onRecurrenceFrequencyChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
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
                <div>
                  <Label htmlFor="siRecInterval">Recurrence Interval *</Label>
                  <Input
                    id="siRecInterval"
                    type="number"
                    min="1"
                    placeholder="e.g. 1"
                    {...register("recurrenceInterval")}
                    error={errors.recurrenceInterval?.message}
                  />
                </div>
                {(recurrenceFrequency === 2 || recurrenceFrequency === 3) && (
                  <div>
                    <Label htmlFor="siRecOnDay">Recurrence On Day</Label>
                    <Input
                      id="siRecOnDay"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Day of month (1-31)"
                      {...register("recurrenceOnMonthDay")}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siValidFrom">
                  Valid From <span className="text-red-500">*</span>
                </Label>
                <Input id="siValidFrom" type="date" {...register("validFrom")} error={errors.validFrom?.message} />
              </div>
              <div>
                <Label htmlFor="siValidTill">Valid Till</Label>
                <Input id="siValidTill" type="date" {...register("validTill")} error={errors.validTill?.message} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>From</CardTitle>
            </CardHeader>
            <CardContent>{renderSidePanel("from", fromState, fromClients, fromAccounts, onFromChange)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>To</CardTitle>
            </CardHeader>
            <CardContent>{renderSidePanel("to", toState, toClients, toAccounts, onToChange)}</CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !fromState.accountId || !toState.accountId}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update Instruction" : "Create Instruction"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export { StandingInstructionForm };
