import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGLAccounts, useAccountingRules, useCreateJournalEntry } from "@/features/accounting";
import { CurrencySelect } from "@/components/shared/CurrencySelect";
import { OfficeSelect } from "@/components/shared/OfficeSelect";
import { currentDate } from "@/lib/utils";

interface EntryRow {
  glAccountId: number;
  amount: string;
}

const formatCurrency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(n);

const JournalEntryFormPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: glAccounts = [] } = useGLAccounts({ usage: 1, manualEntriesAllowed: true });
  const { data: rules = [] } = useAccountingRules();
  const createMutation = useCreateJournalEntry();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [header, setHeader] = useState({
    officeId: 0,
    transactionDate: currentDate(),
    currencyCode: "USD",
    referenceNumber: "",
    comments: "",
    accountingRuleId: 0,
  });
  const [debits, setDebits] = useState<EntryRow[]>([{ glAccountId: 0, amount: "" }]);
  const [credits, setCredits] = useState<EntryRow[]>([{ glAccountId: 0, amount: "" }]);

  const totalDebits = useMemo(() => debits.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0), [debits]);
  const totalCredits = useMemo(() => credits.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0), [credits]);
  const balanced = Math.abs(totalDebits - totalCredits) < 0.001 && totalDebits > 0;

  // Auto-populate debits/credits when an accounting rule is selected
  useEffect(() => {
    if (!header.accountingRuleId) return;
    const rule = rules.find((r) => r.id === header.accountingRuleId);
    if (!rule) return;
    if (rule.officeId) setHeader((h) => ({ ...h, officeId: rule.officeId }));
    const debitAccount = rule.debitAccounts?.[0]?.id;
    const creditAccount = rule.creditAccounts?.[0]?.id;
    if (debitAccount) setDebits((rows) => rows.map((r, i) => (i === 0 ? { ...r, glAccountId: debitAccount } : r)));
    if (creditAccount) setCredits((rows) => rows.map((r, i) => (i === 0 ? { ...r, glAccountId: creditAccount } : r)));
  }, [header.accountingRuleId, rules]);

  const updateRow = (side: "debit" | "credit", index: number, field: keyof EntryRow, value: string | number) => {
    const setter = side === "debit" ? setDebits : setCredits;
    setter((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addRow = (side: "debit" | "credit") => {
    const setter = side === "debit" ? setDebits : setCredits;
    setter((rows) => [...rows, { glAccountId: 0, amount: "" }]);
  };

  const removeRow = (side: "debit" | "credit", index: number) => {
    const setter = side === "debit" ? setDebits : setCredits;
    setter((rows) => rows.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!header.officeId) e.officeId = t("Office is required");
    if (!header.transactionDate) e.transactionDate = t("Date is required");
    if (!header.currencyCode) e.currencyCode = t("Currency is required");
    debits.forEach((r, i) => {
      if (!r.glAccountId) e[`debit_${i}_account`] = t("Account required");
      if (!(parseFloat(r.amount) > 0)) e[`debit_${i}_amount`] = t("Amount must be > 0");
    });
    credits.forEach((r, i) => {
      if (!r.glAccountId) e[`credit_${i}_account`] = t("Account required");
      if (!(parseFloat(r.amount) > 0)) e[`credit_${i}_amount`] = t("Amount must be > 0");
    });
    if (!balanced) e.balance = t("Total debits must equal total credits");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        officeId: header.officeId,
        transactionDate: currentDate(header.transactionDate),
        currencyCode: header.currencyCode,
        dateFormat: "yyyy-MM-dd",
        locale: "en",
        referenceNumber: header.referenceNumber || undefined,
        comments: header.comments || undefined,
        accountingRuleId: header.accountingRuleId || undefined,
        debits: debits.map((r) => ({ glAccountId: r.glAccountId, amount: parseFloat(r.amount) })),
        credits: credits.map((r) => ({ glAccountId: r.glAccountId, amount: parseFloat(r.amount) })),
      });
      navigate("/accounting/journal-entries");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const renderRows = (side: "debit" | "credit", rows: EntryRow[]) => (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_160px_40px] items-end gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("GL Account")}</label>
            <Select
              value={row.glAccountId ? String(row.glAccountId) : ""}
              onValueChange={(v) => updateRow(side, i, "glAccountId", Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select account")} />
              </SelectTrigger>
              <SelectContent>
                {glAccounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name} ({a.glCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[`${side}_${i}_account`] && <p className="text-xs text-red-500">{errors[`${side}_${i}_account`]}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t("Amount")}</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={row.amount}
              onChange={(e) => updateRow(side, i, "amount", e.target.value)}
              placeholder="0.00"
            />
            {errors[`${side}_${i}_amount`] && <p className="text-xs text-red-500">{errors[`${side}_${i}_amount`]}</p>}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => removeRow(side, i)}
            disabled={rows.length <= 1}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => addRow(side)}>
        <Plus className="mr-1 h-4 w-4" /> {t("Add")} {side === "debit" ? t("Debit") : t("Credit")}
      </Button>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl m-auto space-y-6">
      <PageHeader
        title={t("New Journal Entry")}
        description={t("Create a balanced manual journal entry (total debits must equal total credits).")}
        actions={
          <Button variant="outline" onClick={() => navigate("/accounting/journal-entries")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Entry Details")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <OfficeSelect
            value={header.officeId ? String(header.officeId) : ""}
            onChange={(v) => setHeader((h) => ({ ...h, officeId: Number(v) }))}
            error={errors.officeId}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Transaction Date")} *</label>
            <Input
              type="date"
              value={header.transactionDate}
              onChange={(e) => setHeader((h) => ({ ...h, transactionDate: e.target.value }))}
            />
            {errors.transactionDate && <p className="text-xs text-red-500">{errors.transactionDate}</p>}
          </div>
          <CurrencySelect value={header.currencyCode} onChange={(v) => setHeader((h) => ({ ...h, currencyCode: v }))} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Reference Number")}</label>
            <Input
              value={header.referenceNumber}
              onChange={(e) => setHeader((h) => ({ ...h, referenceNumber: e.target.value }))}
              placeholder={t("Optional")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Accounting Rule (auto-fill)")}</label>
            <Select
              value={header.accountingRuleId ? String(header.accountingRuleId) : ""}
              onValueChange={(v) => setHeader((h) => ({ ...h, accountingRuleId: Number(v) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("None")} />
              </SelectTrigger>
              <SelectContent>
                {rules.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="block text-sm font-medium">{t("Comments")}</label>
            <Textarea
              value={header.comments}
              onChange={(e) => setHeader((h) => ({ ...h, comments: e.target.value }))}
              rows={2}
              placeholder={t("Optional comments")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Debits")}</CardTitle>
          </CardHeader>
          <CardContent>{renderRows("debit", debits)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Credits")}</CardTitle>
          </CardHeader>
          <CardContent>{renderRows("credit", credits)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-6 text-sm">
            <span>
              {t("Total Debits:")}{" "}
              <span className="font-mono font-semibold">{formatCurrency(totalDebits, header.currencyCode)}</span>
            </span>
            <span>
              {t("Total Credits:")}{" "}
              <span className="font-mono font-semibold">{formatCurrency(totalCredits, header.currencyCode)}</span>
            </span>
            <span className={`flex items-center gap-1 font-medium ${balanced ? "text-emerald-600" : "text-red-500"}`}>
              <Scale className="h-4 w-4" />
              {balanced ? t("Balanced") : t("Out of balance")}
            </span>
          </div>
          {errors.balance && <p className="text-sm text-red-500">{errors.balance}</p>}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={() => navigate("/accounting/journal-entries")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("Cancel")}
        </Button>
        <Button onClick={handleSave} disabled={saving || !balanced} className="bg-[#D32F2F] hover:bg-red-700">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Posting…")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> {t("Post Entry")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default JournalEntryFormPage;
