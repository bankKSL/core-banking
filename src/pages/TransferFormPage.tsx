import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchOffices,
  fetchClientsByOffice,
  fetchClientAccounts2,
  createTransfer,
  buildTransferRequest,
} from "@/features/transfers";
import type { Office, ClientSummary, MiniAccount } from "@/features/transfers";

const STABLE_EMPTY_CLIENTS: ClientSummary[] = [];
const STABLE_EMPTY_ACCOUNTS: MiniAccount[] = [];

const ACCOUNT_TYPES = [
  { id: 1, label: "Loans" },
  { id: 2, label: "Savings" },
];

interface SideState {
  officeId: number | null;
  clientId: number | null;
  accountType: number | null;
  accountId: number | null;
}

const INITIAL_SIDE: SideState = { officeId: null, clientId: null, accountType: null, accountId: null };

const transferFormSchema = z.object({
  transferDate: z.string().min(1, "Transfer date is required"),
  transferAmount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => parseFloat(v) > 0, "Amount must be positive"),
  transferDescription: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

const TransferFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [from, setFrom] = useState<SideState>(INITIAL_SIDE);
  const [to, setTo] = useState<SideState>(INITIAL_SIDE);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      transferDate: "",
      transferAmount: "",
      transferDescription: "",
    },
  });

  // ─── Offices ─────────────────────────────────────────────────
  const { data: offices = [] } = useQuery({
    queryKey: ["offices"],
    queryFn: fetchOffices,
  });

  // ─── From Clients (derived from query, not stored in state) ──
  const fromClientsQuery = useQuery({
    queryKey: ["clientsByOffice", from.officeId],
    queryFn: () => fetchClientsByOffice(from.officeId!),
    enabled: !!from.officeId,
  });
  const fromClients: ClientSummary[] = fromClientsQuery.data ?? STABLE_EMPTY_CLIENTS;

  // ─── From Accounts (derived from query) ──────────────────────
  const fromAccountsQuery = useQuery({
    queryKey: ["clientAccounts", from.clientId],
    queryFn: () => fetchClientAccounts2(from.clientId!),
    enabled: !!from.clientId,
  });
  const fromAccounts: MiniAccount[] =
    from.accountType === 1
      ? (fromAccountsQuery.data?.loanAccounts ?? STABLE_EMPTY_ACCOUNTS)
      : from.accountType === 2
        ? (fromAccountsQuery.data?.savingsAccounts ?? STABLE_EMPTY_ACCOUNTS)
        : STABLE_EMPTY_ACCOUNTS;

  // ─── To Clients (derived from query) ─────────────────────────
  const toClientsQuery = useQuery({
    queryKey: ["clientsByOffice", to.officeId],
    queryFn: () => fetchClientsByOffice(to.officeId!),
    enabled: !!to.officeId,
  });
  const toClients: ClientSummary[] = toClientsQuery.data ?? STABLE_EMPTY_CLIENTS;

  // ─── To Accounts (derived from query) ────────────────────────
  const toAccountsQuery = useQuery({
    queryKey: ["clientAccounts", to.clientId],
    queryFn: () => fetchClientAccounts2(to.clientId!),
    enabled: !!to.clientId,
  });
  const toAccounts: MiniAccount[] =
    to.accountType === 1
      ? (toAccountsQuery.data?.loanAccounts ?? STABLE_EMPTY_ACCOUNTS)
      : to.accountType === 2
        ? (toAccountsQuery.data?.savingsAccounts ?? STABLE_EMPTY_ACCOUNTS)
        : STABLE_EMPTY_ACCOUNTS;

  // ─── Transfer mutation ──────────────────────────────────────
  const transferMutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] as any });
      navigate("/transfers/history");
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

  const onSubmit = async (values: TransferFormValues) => {
    const requestPayload = buildTransferRequest({
      fromOfficeId: from.officeId!,
      fromClientId: from.clientId!,
      fromAccountType: from.accountType!,
      fromAccountId: from.accountId!,
      toOfficeId: to.officeId!,
      toClientId: to.clientId!,
      toAccountType: to.accountType!,
      toAccountId: to.accountId!,
      transferDate: values.transferDate,
      transferAmount: parseFloat(values.transferAmount),
      transferDescription: values.transferDescription || "",
    });
    await transferMutation.mutateAsync(requestPayload);
  };

  const isValid =
    from.officeId &&
    from.clientId &&
    from.accountType &&
    from.accountId &&
    to.officeId &&
    to.clientId &&
    to.accountType &&
    to.accountId;

  const renderSide = (side: "from" | "to", state: SideState) => {
    const officesList = offices as Office[];
    const currentClients = side === "from" ? fromClients : toClients;
    const currentAccounts = side === "from" ? fromAccounts : toAccounts;

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
              {currentClients.map((c) => (
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
              {currentAccounts.map((a) => (
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
        title="New Account Transfer"
        description="Transfer funds between accounts"
        actions={
          <Button variant="outline" onClick={() => navigate("/transfers/history")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FROM Section */}
          <Card>
            <CardHeader>
              <CardTitle>From</CardTitle>
            </CardHeader>
            <CardContent>{renderSide("from", from)}</CardContent>
          </Card>

          {/* TO Section */}
          <Card>
            <CardHeader>
              <CardTitle>To</CardTitle>
            </CardHeader>
            <CardContent>{renderSide("to", to)}</CardContent>
          </Card>
        </div>

        {/* Bottom fields */}
        <Card className="mt-6">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transferDate">
                  Transfer Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transferDate"
                  type="date"
                  {...register("transferDate")}
                  error={errors.transferDate?.message}
                />
              </div>
              <div>
                <Label htmlFor="transferAmount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transferAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("transferAmount")}
                  error={errors.transferAmount?.message}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="transferDescription">Description</Label>
              <Textarea
                id="transferDescription"
                placeholder="Optional description"
                {...register("transferDescription")}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/transfers/history")}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid || transferMutation.isPending}>
                {transferMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Submit Transfer
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

export default TransferFormPage;
