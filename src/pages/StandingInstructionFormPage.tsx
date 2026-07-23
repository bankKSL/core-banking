import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

const StandingInstructionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [from, setFrom] = useState<SideState>(useSideState());
  const [to, setTo] = useState<SideState>(useSideState());
  const [name, setName] = useState("");
  const [transferType, setTransferType] = useState<number>(1);
  const [amount, setAmount] = useState<number | "">("");
  const [instructionType, setInstructionType] = useState<number>(1);
  const [priority, setPriority] = useState<number>(2);
  const [recurrenceType, setRecurrenceType] = useState<number>(1);
  const [status, setStatus] = useState<number>(1);
  const [validFrom, setValidFrom] = useState("");
  const [validTill, setValidTill] = useState("");

  // ─── Load existing instruction (edit mode) ───────────────────
  const { data: existingInstruction } = useQuery({
    queryKey: ["standingInstruction", id],
    queryFn: () => fetchStandingInstruction(id!),
    enabled: isEdit,
  });

  // Populate form when existing instruction loads
  useEffect(() => {
    if (!existingInstruction) return;
    setName(existingInstruction.name ?? "");
    setTransferType(existingInstruction.transferType?.id ?? 1);
    setAmount(existingInstruction.amount ?? "");
    setInstructionType(existingInstruction.instructionType?.id ?? 1);
    setPriority(existingInstruction.priority?.id ?? 2);
    setRecurrenceType(existingInstruction.recurrenceType?.id ?? 1);
    setStatus(existingInstruction.status === "Active" ? 1 : 1);

    const fromOff = existingInstruction.fromOffice?.id ?? null;
    const fromCl = existingInstruction.fromClientId ?? null;
    const fromAT = existingInstruction.fromAccountType ?? null;
    const fromAc = existingInstruction.fromAccountId ?? null;
    const toOff = existingInstruction.toOffice?.id ?? null;
    const toCl = existingInstruction.toClientId ?? null;
    const toAT = existingInstruction.toAccountType ?? null;
    const toAc = existingInstruction.toAccountId ?? null;

    setFrom({
      officeId: fromOff,
      clientId: fromCl,
      accountType: fromAT,
      accountId: fromAc,
      clients: [],
      accounts: [],
    });
    setTo({
      officeId: toOff,
      clientId: toCl,
      accountType: toAT,
      accountId: toAc,
      clients: [],
      accounts: [],
    });
    setValidFrom(formatDateInput(existingInstruction.validFrom));
    setValidTill(formatDateInput(existingInstruction.validTill));
  }, [existingInstruction]);

  // ─── Offices ─────────────────────────────────────────────────
  const { data: offices = [] } = useQuery({
    queryKey: ["offices"],
    queryFn: fetchOffices,
  });

  // ─── From Clients ────────────────────────────────────────────
  const { data: fromClients = [] } = useQuery({
    queryKey: ["clientsByOffice", from.officeId],
    queryFn: () => fetchClientsByOffice(from.officeId!),
    enabled: !!from.officeId,
  });

  useEffect(() => {
    setFrom((prev) => ({ ...prev, clients: fromClients, clientId: prev.clientId, accountId: null }));
  }, [fromClients]);

  // ─── From Accounts ───────────────────────────────────────────
  const { data: fromAccountsData } = useQuery({
    queryKey: ["clientAccounts", from.clientId],
    queryFn: () => fetchClientAccounts2(from.clientId!),
    enabled: !!from.clientId,
  });

  useEffect(() => {
    const accounts =
      from.accountType === 1
        ? (fromAccountsData?.loanAccounts ?? [])
        : from.accountType === 2
          ? (fromAccountsData?.savingsAccounts ?? [])
          : [];
    setFrom((prev) => ({ ...prev, accounts }));
  }, [fromAccountsData, from.accountType]);

  // ─── To Clients ──────────────────────────────────────────────
  const { data: toClients = [] } = useQuery({
    queryKey: ["clientsByOffice", to.officeId],
    queryFn: () => fetchClientsByOffice(to.officeId!),
    enabled: !!to.officeId,
  });

  useEffect(() => {
    setTo((prev) => ({ ...prev, clients: toClients, clientId: prev.clientId, accountId: null }));
  }, [toClients]);

  // ─── To Accounts ─────────────────────────────────────────────
  const { data: toAccountsData } = useQuery({
    queryKey: ["clientAccounts", to.clientId],
    queryFn: () => fetchClientAccounts2(to.clientId!),
    enabled: !!to.clientId,
  });

  useEffect(() => {
    const accounts =
      to.accountType === 1
        ? (toAccountsData?.loanAccounts ?? [])
        : to.accountType === 2
          ? (toAccountsData?.savingsAccounts ?? [])
          : [];
    setTo((prev) => ({ ...prev, accounts }));
  }, [toAccountsData, to.accountType]);

  // ─── Mutation ────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async () => {
      if (
        !from.officeId ||
        !from.clientId ||
        !from.accountType ||
        !from.accountId ||
        !to.officeId ||
        !to.clientId ||
        !to.accountType ||
        !to.accountId ||
        !name ||
        !amount ||
        !validFrom
      ) {
        throw new Error("All required fields must be filled");
      }
      const payload = buildStandingInstructionRequest({
        name,
        fromOfficeId: from.officeId,
        fromClientId: from.clientId,
        fromAccountType: from.accountType,
        fromAccountId: from.accountId,
        toOfficeId: to.officeId,
        toClientId: to.clientId,
        toAccountType: to.accountType,
        toAccountId: to.accountId,
        transferType,
        amount: Number(amount),
        instructionType,
        priority,
        recurrenceType,
        status,
        validFrom,
        validTill: validTill || undefined,
      });
      if (isEdit) {
        return updateStandingInstruction(id!, payload);
      }
      return createStandingInstruction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standingInstructions"] });
      navigate("/transfers/standing-instructions");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const updateSide = (side: "from" | "to", field: keyof SideState, value: number | null) => {
    const setter = side === "from" ? setFrom : setTo;
    setter((prev) => ({ ...prev, [field]: value }));
  };

  const renderSide = (side: "from" | "to", state: SideState) => (
    <div className="space-y-4">
      <div>
        <Label>Office</Label>
        <Select
          value={state.officeId ? String(state.officeId) : ""}
          onValueChange={(v) => updateSide(side, "officeId", Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Office" />
          </SelectTrigger>
          <SelectContent>
            {offices.map((o: Office) => (
              <SelectItem key={o.id} value={String(o.id)}>
                {o.nameDecorated || o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Client</Label>
        <Select
          value={state.clientId ? String(state.clientId) : ""}
          onValueChange={(v) => updateSide(side, "clientId", Number(v))}
          disabled={!state.officeId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Client" />
          </SelectTrigger>
          <SelectContent>
            {state.clients.map((c: ClientSummary) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Account Type</Label>
        <Select
          value={state.accountType ? String(state.accountType) : ""}
          onValueChange={(v) => updateSide(side, "accountType", Number(v))}
          disabled={!state.clientId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((at) => (
              <SelectItem key={at.id} value={String(at.id)}>
                {at.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Account</Label>
        <Select
          value={state.accountId ? String(state.accountId) : ""}
          onValueChange={(v) => updateSide(side, "accountId", Number(v))}
          disabled={!state.accountType}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Account" />
          </SelectTrigger>
          <SelectContent>
            {state.accounts.map((a: MiniAccount) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.accountNo} - {a.productName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const isValid =
    from.officeId &&
    from.clientId &&
    from.accountType &&
    from.accountId &&
    to.officeId &&
    to.clientId &&
    to.accountType &&
    to.accountId &&
    name &&
    amount !== "" &&
    validFrom;

  return (
    <div className="p-6 max-w-5xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Standing Instruction" : "New Standing Instruction"}
        description="Create or update a recurring transfer instruction"
        actions={
          <Button variant="outline" onClick={() => navigate("/transfers/standing-instructions")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div>
              <Label htmlFor="siName">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="siName"
                placeholder="Instruction name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* From / To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Instruction Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instruction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="siAmount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="siAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                  required
                />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Input
                  id="siValidFrom"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="siValidTill">Valid Till</Label>
                <Input id="siValidTill" type="date" value={validTill} onChange={(e) => setValidTill(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
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
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default StandingInstructionFormPage;
