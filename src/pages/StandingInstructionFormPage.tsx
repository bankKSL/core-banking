import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchOffices,
  fetchClientsByOffice,
  fetchClientAccounts2,
  fetchStandingInstruction,
  createStandingInstruction,
  updateStandingInstruction,
  buildStandingInstructionRequest,
  parseDate,
} from "@/features/transfers";
import type { Office, ClientSummary, MiniAccount } from "@/features/transfers";

const ACCOUNT_TYPES = [
  { id: 1, label: "Loans" },
  { id: 2, label: "Savings" },
];

const TRANSFER_TYPES = [{ id: 1, label: "Normal" }];
const INSTRUCTION_TYPES = [{ id: 1, label: "Open" }];
const PRIORITIES = [{ id: 2, label: "Urgent" }];
const RECURRENCE_TYPES = [{ id: 1, label: "Periodic" }];
const STATUS_OPTIONS = [{ id: 1, label: "Active" }];

interface SideState {
  officeId: number | null;
  clientId: number | null;
  accountType: number | null;
  accountId: number | null;
  clients: ClientSummary[];
  accounts: MiniAccount[];
}

function useSideState(): SideState {
  return { officeId: null, clientId: null, accountType: null, accountId: null, clients: [], accounts: [] };
}

function formatDateInput(dateVal: number[] | undefined): string {
  const d = parseDate(dateVal);
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

const standingInstructionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => parseFloat(v) > 0, "Amount must be positive"),
  validFrom: z.string().min(1, "Valid from date is required"),
  validTill: z.string().optional(),
});

type StandingInstructionFormValues = z.infer<typeof standingInstructionSchema>;

const StandingInstructionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [from, setFrom] = useState<SideState>(useSideState());
  const [to, setTo] = useState<SideState>(useSideState());
  const [transferType, setTransferType] = useState<number>(1);
  const [instructionType, setInstructionType] = useState<number>(1);
  const [priority, setPriority] = useState<number>(2);
  const [recurrenceType, setRecurrenceType] = useState<number>(1);
  const [status, setStatus] = useState<number>(1);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StandingInstructionFormValues>({
    resolver: zodResolver(standingInstructionSchema),
    defaultValues: {
      name: "",
      amount: "",
      validFrom: "",
      validTill: "",
    },
  });

  // ─── Load existing instruction (edit mode) ───────────────────
  const { data: existingInstruction } = useQuery({
    queryKey: ["standingInstruction", id],
    queryFn: () => fetchStandingInstruction(id!),
    enabled: isEdit,
  });

  // Populate form when existing instruction loads
  useEffect(() => {
    if (!existingInstruction) return;
    reset({
      name: existingInstruction.name ?? "",
      amount: existingInstruction.amount ? String(existingInstruction.amount) : "",
      validFrom: formatDateInput(existingInstruction.validFrom),
      validTill: formatDateInput(existingInstruction.validTill) || "",
    });
    setTransferType(existingInstruction.transferType?.id ?? 1);
    setInstructionType(existingInstruction.instructionType?.id ?? 1);
    setPriority(existingInstruction.priority?.id ?? 2);
    setRecurrenceType(existingInstruction.recurrenceType?.id ?? 1);
    setStatus(existingInstruction.status === "Active" ? 1 : 1);

    const fromOff = existingInstruction.fromOffice?.id;
    const fromCli = existingInstruction.fromClientId;
    const fromAcctType = existingInstruction.fromAccountType;
    const fromAcctId = existingInstruction.fromAccountId;

    const toOff = existingInstruction.toOffice?.id;
    const toCli = existingInstruction.toClientId;
    const toAcctType = existingInstruction.toAccountType;
    const toAcctId = existingInstruction.toAccountId;

    setFrom({
      officeId: fromOff ?? null,
      clientId: fromCli ?? null,
      accountType: fromAcctType ?? null,
      accountId: fromAcctId ?? null,
      clients: [],
      accounts: [],
    });
    setTo({
      officeId: toOff ?? null,
      clientId: toCli ?? null,
      accountType: toAcctType ?? null,
      accountId: toAcctId ?? null,
      clients: [],
      accounts: [],
    });
  }, [existingInstruction, reset]);

  // ─── Offices ─────────────────────────────────────────────────
  const { data: offices = [] } = useQuery({
    queryKey: ["offices"],
    queryFn: fetchOffices,
  });

  // ─── From Clients ────────────────────────────────────────────
  const fromClientsQuery = useQuery({
    queryKey: ["clientsByOffice", from.officeId],
    queryFn: () => fetchClientsByOffice(from.officeId!),
    enabled: !!from.officeId,
  });

  // ─── From Accounts ───────────────────────────────────────────
  const fromAccountsQuery = useQuery({
    queryKey: ["clientAccounts", from.clientId],
    queryFn: () => fetchClientAccounts2(from.clientId!),
    enabled: !!from.clientId,
  });
  const fromAccts: MiniAccount[] =
    from.accountType === 1
      ? (fromAccountsQuery.data?.loanAccounts ?? [])
      : from.accountType === 2
        ? (fromAccountsQuery.data?.savingsAccounts ?? [])
        : [];

  // ─── To Clients ──────────────────────────────────────────────
  const toClientsQuery = useQuery({
    queryKey: ["clientsByOffice", to.officeId],
    queryFn: () => fetchClientsByOffice(to.officeId!),
    enabled: !!to.officeId,
  });

  // ─── To Accounts ─────────────────────────────────────────────
  const toAccountsQuery = useQuery({
    queryKey: ["clientAccounts", to.clientId],
    queryFn: () => fetchClientAccounts2(to.clientId!),
    enabled: !!to.clientId,
  });
  const toAccts: MiniAccount[] =
    to.accountType === 1
      ? (toAccountsQuery.data?.loanAccounts ?? [])
      : to.accountType === 2
        ? (toAccountsQuery.data?.savingsAccounts ?? [])
        : [];

  // ─── Mutation ─────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (values: StandingInstructionFormValues) => {
      const payload = buildStandingInstructionRequest({
        name: values.name,
        amount: parseFloat(values.amount),
        transferType,
        instructionType,
        priority,
        recurrenceType,
        status,
        validFrom: values.validFrom,
        validTill: values.validTill || undefined,
        fromOfficeId: from.officeId!,
        fromClientId: from.clientId!,
        fromAccountType: from.accountType!,
        fromAccountId: from.accountId!,
        toOfficeId: to.officeId!,
        toClientId: to.clientId!,
        toAccountType: to.accountType!,
        toAccountId: to.accountId!,
      });
      if (isEdit) {
        await updateStandingInstruction(id!, payload);
      } else {
        await createStandingInstruction(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standingInstructions"] as any });
      navigate("/transfers/standing-instructions");
    },
  });

  const updateSide = (side: "from" | "to", field: keyof SideState, value: number | null) => {
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
  };

  const isValid = from.accountId && to.accountId;

  const renderSide = (side: "from" | "to", state: SideState) => {
    const officesList = offices as Office[];
    const currentClients = (side === "from" ? fromClientsQuery.data : toClientsQuery.data) ?? [];
    const currentAccounts = side === "from" ? fromAccts : toAccts;

    return (
      <div className="space-y-4">
        <div>
          <Label>Office *</Label>
          <Select
            value={state.officeId ? String(state.officeId) : ""}
            onValueChange={(v) => updateSide(side, "officeId", Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select office" />
            </SelectTrigger>
            <SelectContent>
              {officesList.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Client *</Label>
          <Select
            value={state.clientId ? String(state.clientId) : ""}
            onValueChange={(v) => updateSide(side, "clientId", Number(v))}
            disabled={!state.officeId}
          >
            <SelectTrigger>
              <SelectValue placeholder={state.officeId ? "Select client" : "Select office first"} />
            </SelectTrigger>
            <SelectContent>
              {currentClients.map((c: ClientSummary) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Account Type *</Label>
          <Select
            value={state.accountType ? String(state.accountType) : ""}
            onValueChange={(v) => updateSide(side, "accountType", Number(v))}
            disabled={!state.clientId}
          >
            <SelectTrigger>
              <SelectValue placeholder={state.clientId ? "Select type" : "Select client first"} />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Account *</Label>
          <Select
            value={state.accountId ? String(state.accountId) : ""}
            onValueChange={(v) => updateSide(side, "accountId", Number(v))}
            disabled={!state.accountType}
          >
            <SelectTrigger>
              <SelectValue placeholder={state.accountType ? "Select account" : "Select type first"} />
            </SelectTrigger>
            <SelectContent>
              {currentAccounts.map((a: MiniAccount) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.accountNo ?? `#${a.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Standing Instruction" : "New Standing Instruction"}
        description="Create or edit a recurring transfer instruction"
        actions={
          <Button variant="outline" onClick={() => navigate("/transfers/standing-instructions")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        {/* Name */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Transfer Type</Label>
                <Select value={String(transferType)} onValueChange={(v) => setTransferType(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFER_TYPES.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Instruction Type</Label>
                <Select value={String(instructionType)} onValueChange={(v) => setInstructionType(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUCTION_TYPES.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siAmount">Amount *</Label>
                <Input
                  id="siAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("amount")}
                  error={errors.amount?.message}
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={String(priority)} onValueChange={(v) => setPriority(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Recurrence Type</Label>
                <Select value={String(recurrenceType)} onValueChange={(v) => setRecurrenceType(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_TYPES.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={String(status)} onValueChange={(v) => setStatus(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siValidFrom">
                  Valid From <span className="text-red-500">*</span>
                </Label>
                <Input id="siValidFrom" type="date" {...register("validFrom")} error={errors.validFrom?.message} />
              </div>
              <div>
                <Label htmlFor="siValidTill">Valid Till</Label>
                <Input id="siValidTill" type="date" {...register("validTill")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* From / To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>From</CardTitle>
            </CardHeader>
            <CardContent>{renderSide("from", from)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>To</CardTitle>
            </CardHeader>
            <CardContent>{renderSide("to", to)}</CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/transfers/standing-instructions")}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid || mutation.isPending}>
            {mutation.isPending ? (
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

export default StandingInstructionFormPage;
