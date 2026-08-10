import React, { useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { StandingInstructionForm } from "../components/StandingInstructionForm";
import {
  useStandingInstruction,
  useTemplate,
  useCreateStandingInstruction,
  useUpdateStandingInstruction,
  standingInstructionKeys,
} from "../hooks/useStandingInstructions";
import { fetchTemplate, parseDate } from "../api/standing-instructions";
import type { OfficeOption, ClientOption, AccountOption } from "../types/standing-instruction.types";

interface SideState {
  officeId: number | null;
  clientId: number | null;
  accountType: number | null;
  accountId: number | null;
}

function formatDateInput(dateVal: number[] | null | undefined): string {
  const d = parseDate(dateVal);
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

const StandingInstructionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [from, setFrom] = useState<SideState>({ officeId: null, clientId: null, accountType: null, accountId: null });
  const [to, setTo] = useState<SideState>({ officeId: null, clientId: null, accountType: null, accountId: null });
  const [transferType, setTransferType] = useState<number>(1);
  const [instructionType, setInstructionType] = useState<number>(1);
  const [priority, setPriority] = useState<number>(3);
  const [recurrenceType, setRecurrenceType] = useState<number>(1);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<number | null>(null);
  const [status, setStatus] = useState<number>(1);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: template, isLoading: isTemplateLoading } = useTemplate();
  const { data: existingInstruction, isLoading: isInstructionLoading } = useStandingInstruction(
    id ? Number(id) : undefined,
  );

  const fromClientQuery = useQuery({
    queryKey: standingInstructionKeys.template({ fromOfficeId: from.officeId! }),
    queryFn: () => fetchTemplate({ fromOfficeId: from.officeId! }),
    enabled: !!from.officeId,
  });

  const fromAccountQuery = useQuery({
    queryKey: standingInstructionKeys.template({ fromOfficeId: from.officeId!, fromClientId: from.clientId! }),
    queryFn: () => fetchTemplate({ fromOfficeId: from.officeId!, fromClientId: from.clientId! }),
    enabled: !!from.officeId && !!from.clientId,
  });

  const toClientQuery = useQuery({
    queryKey: standingInstructionKeys.template({ toOfficeId: to.officeId! }),
    queryFn: () => fetchTemplate({ toOfficeId: to.officeId! }),
    enabled: !!to.officeId,
  });

  const toAccountQuery = useQuery({
    queryKey: standingInstructionKeys.template({ toOfficeId: to.officeId!, toClientId: to.clientId! }),
    queryFn: () => fetchTemplate({ toOfficeId: to.officeId!, toClientId: to.clientId! }),
    enabled: !!to.officeId && !!to.clientId,
  });

  const filteredFromClients: ClientOption[] = from.officeId
    ? (fromClientQuery.data?.fromClientOptions ?? [])
    : (template?.fromClientOptions ?? []);

  const filteredFromAccounts: AccountOption[] = from.clientId
    ? (fromAccountQuery.data?.fromAccountOptions ?? [])
    : (template?.fromAccountOptions ?? []);

  const filteredToClients: ClientOption[] = to.officeId
    ? (toClientQuery.data?.toClientOptions ?? [])
    : (template?.toClientOptions ?? []);

  const filteredToAccounts: AccountOption[] = to.clientId
    ? (toAccountQuery.data?.toAccountOptions ?? [])
    : (template?.toAccountOptions ?? []);

  const updateSide = useCallback((side: "from" | "to", field: keyof SideState, value: number | null) => {
    const updater = side === "from" ? setFrom : setTo;
    updater((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "officeId") {
        next.clientId = null;
        next.accountType = null;
        next.accountId = null;
      } else if (field === "clientId") {
        next.accountType = null;
        next.accountId = null;
      } else if (field === "accountType") {
        next.accountId = null;
      }
      return next;
    });
  }, []);

  const offices: OfficeOption[] = (template?.fromOfficeOptions ?? []) as OfficeOption[];

  const defaultValues = existingInstruction
    ? {
        name: existingInstruction.name ?? "",
        amount: existingInstruction.amount ? String(existingInstruction.amount) : "",
        validFrom: formatDateInput(existingInstruction.validFrom),
        validTill: formatDateInput(existingInstruction.validTill) || "",
      }
    : undefined;

  const isExistingLoaded = !!existingInstruction;

  const fromVal = useMemo(
    () =>
      isExistingLoaded
        ? {
            officeId: existingInstruction!.fromOffice?.id ?? null,
            clientId: existingInstruction!.fromClient?.id ?? null,
            accountType: existingInstruction!.fromAccountType?.id ?? null,
            accountId: existingInstruction!.fromAccount?.id ?? null,
          }
        : from,
    [isExistingLoaded, existingInstruction, from],
  );

  const toVal = useMemo(
    () =>
      isExistingLoaded
        ? {
            officeId: existingInstruction!.toOffice?.id ?? null,
            clientId: existingInstruction!.toClient?.id ?? null,
            accountType: existingInstruction!.toAccountType?.id ?? null,
            accountId: existingInstruction!.toAccount?.id ?? null,
          }
        : to,
    [isExistingLoaded, existingInstruction, to],
  );

  const transferTypeVal = useMemo(
    () => (isExistingLoaded ? (existingInstruction!.transferType?.id ?? 1) : transferType),
    [isExistingLoaded, existingInstruction, transferType],
  );
  const instructionTypeVal = useMemo(
    () => (isExistingLoaded ? (existingInstruction!.instructionType?.id ?? 1) : instructionType),
    [isExistingLoaded, existingInstruction, instructionType],
  );
  const priorityVal = useMemo(
    () => (isExistingLoaded ? (existingInstruction!.priority?.id ?? 3) : priority),
    [isExistingLoaded, existingInstruction, priority],
  );
  const recurrenceTypeVal = useMemo(
    () => (isExistingLoaded ? (existingInstruction!.recurrenceType?.id ?? 1) : recurrenceType),
    [isExistingLoaded, existingInstruction, recurrenceType],
  );
  const recurrenceFrequencyVal = useMemo(
    () => (isExistingLoaded ? (existingInstruction!.recurrenceFrequency?.id ?? null) : recurrenceFrequency),
    [isExistingLoaded, existingInstruction, recurrenceFrequency],
  );
  const statusVal = useMemo(
    () => (isExistingLoaded ? (existingInstruction!.status?.id ?? 1) : status),
    [isExistingLoaded, existingInstruction, status],
  );

  const createMutation = useCreateStandingInstruction();
  const updateMutation = useUpdateStandingInstruction();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      setMutationError(null);
      try {
        const payload = {
          ...values,
          fromOfficeId: fromVal.officeId,
          fromClientId: fromVal.clientId,
          fromAccountType: fromVal.accountType,
          fromAccountId: fromVal.accountId,
          toOfficeId: toVal.officeId,
          toClientId: toVal.clientId,
          toAccountType: toVal.accountType,
          toAccountId: toVal.accountId,
          transferType: transferTypeVal,
          instructionType: instructionTypeVal,
          priority: priorityVal,
          recurrenceType: recurrenceTypeVal,
          recurrenceFrequency: recurrenceFrequencyVal,
          status: statusVal,
        };

        if (isEdit) {
          await updateMutation.mutateAsync({ id: Number(id), values: payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
        navigate("/transfers/standing-instructions");
      } catch (err: unknown) {
        const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
        const msg = error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to save standing instruction.";
        setMutationError(msg);
      }
    },
    [
      fromVal,
      toVal,
      transferTypeVal,
      instructionTypeVal,
      priorityVal,
      recurrenceTypeVal,
      recurrenceFrequencyVal,
      statusVal,
      isEdit,
      id,
      createMutation,
      updateMutation,
      navigate,
    ],
  );

  if (isInstructionLoading) {
    return (
      <div className="p-6 max-w-5xl m-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96" />
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <StandingInstructionForm
      template={template}
      isTemplateLoading={isTemplateLoading}
      fromClients={filteredFromClients}
      toClients={filteredToClients}
      fromAccounts={filteredFromAccounts}
      toAccounts={filteredToAccounts}
      fromState={fromVal}
      toState={toVal}
      offices={offices}
      defaultValues={defaultValues}
      mutationError={mutationError}
      isSubmitting={isSubmitting}
      isEdit={isEdit}
      onFromChange={(field, value) => {
        if (isExistingLoaded) return;
        updateSide("from", field, value);
      }}
      onToChange={(field, value) => {
        if (isExistingLoaded) return;
        updateSide("to", field, value);
      }}
      onTransferTypeChange={(v) => {
        if (!isExistingLoaded) setTransferType(v);
      }}
      onInstructionTypeChange={(v) => {
        if (!isExistingLoaded) setInstructionType(v);
      }}
      onPriorityChange={(v) => {
        if (!isExistingLoaded) setPriority(v);
      }}
      onRecurrenceTypeChange={(v) => {
        if (!isExistingLoaded) setRecurrenceType(v);
      }}
      onRecurrenceFrequencyChange={(v) => {
        if (!isExistingLoaded) setRecurrenceFrequency(v);
      }}
      onStatusChange={(v) => {
        if (!isExistingLoaded) setStatus(v);
      }}
      transferType={transferTypeVal}
      instructionType={instructionTypeVal}
      priority={priorityVal}
      recurrenceType={recurrenceTypeVal}
      recurrenceFrequency={recurrenceFrequencyVal}
      status={statusVal}
      onBack={() => navigate("/transfers/standing-instructions")}
      onSubmit={handleSubmit}
    />
  );
};

export default StandingInstructionFormPage;
