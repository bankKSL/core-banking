import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAccountingRule,
  useAccountingRuleTemplate,
  useCreateAccountingRule,
  useUpdateAccountingRule,
} from "@/features/accounting";

type SelectionMode = "account" | "tags";

const AccountingRuleFormPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: existing, isLoading: ruleLoading } = useAccountingRule(id, isEdit);
  const { data: template, isLoading: templateLoading } = useAccountingRuleTemplate();
  const createMutation = useCreateAccountingRule();
  const updateMutation = useUpdateAccountingRule();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [debitMode, setDebitMode] = useState<SelectionMode>("account");
  const [creditMode, setCreditMode] = useState<SelectionMode>("account");
  const [form, setForm] = useState({
    name: "",
    officeId: 0,
    description: "",
    accountToDebit: 0,
    accountToCredit: 0,
    debitTagIds: [] as number[],
    creditTagIds: [] as number[],
    allowMultipleDebitEntries: false,
    allowMultipleCreditEntries: false,
  });

  useEffect(() => {
    if (!existing || !isEdit) return;
    const debitTags = existing.debitTags?.map((t) => t.tag?.id).filter(Boolean) ?? [];
    const creditTags = existing.creditTags?.map((t) => t.tag?.id).filter(Boolean) ?? [];
    setForm({
      name: existing.name ?? "",
      officeId: existing.officeId ?? 0,
      description: existing.description ?? "",
      accountToDebit: existing.debitAccounts?.[0]?.id ?? 0,
      accountToCredit: existing.creditAccounts?.[0]?.id ?? 0,
      debitTagIds: debitTags,
      creditTagIds: creditTags,
      allowMultipleDebitEntries: existing.allowMultipleDebitEntries ?? false,
      allowMultipleCreditEntries: existing.allowMultipleCreditEntries ?? false,
    });
    if (debitTags.length > 0) setDebitMode("tags");
    if (creditTags.length > 0) setCreditMode("tags");
  }, [existing, isEdit]);

  const updateForm = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const toggleTag = (field: "debitTagIds" | "creditTagIds", tagId: number) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(tagId) ? f[field].filter((t) => t !== tagId) : [...f[field], tagId],
    }));
  };

  const offices = template?.allowedOffices ?? [];
  const accounts = template?.allowedAccounts ?? [];
  const debitTagOptions = template?.allowedDebitTagOptions ?? [];
  const creditTagOptions = template?.allowedCreditTagOptions ?? [];

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("Name is required");
    if (!form.officeId) e.officeId = t("Office is required");
    if (debitMode === "account" && !form.accountToDebit) e.accountToDebit = t("Debit account is required");
    if (debitMode === "tags" && form.debitTagIds.length === 0) e.debitTags = t("Select at least one debit tag");
    if (creditMode === "account" && !form.accountToCredit) e.accountToCredit = t("Credit account is required");
    if (creditMode === "tags" && form.creditTagIds.length === 0) e.creditTags = t("Select at least one credit tag");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        officeId: form.officeId,
        description: form.description || undefined,
        ...(debitMode === "account"
          ? { accountToDebit: form.accountToDebit }
          : { debitTags: form.debitTagIds.map((tagId) => ({ tagId })) }),
        ...(creditMode === "account"
          ? { accountToCredit: form.accountToCredit }
          : { creditTags: form.creditTagIds.map((tagId) => ({ tagId })) }),
        allowMultipleDebitEntries: form.allowMultipleDebitEntries,
        allowMultipleCreditEntries: form.allowMultipleCreditEntries,
      };
      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/accounting/rules");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if ((isEdit && ruleLoading) || templateLoading) {
    return (
      <div className="max-w-6xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const renderTagMultiSelect = (
    field: "debitTagIds" | "creditTagIds",
    options: { id: number; name: string }[],
    selected: number[],
  ) => (
    <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3 dark:border-gray-700">
      {options.length === 0 && <p className="text-sm text-gray-400">{t("No tag options available.")}</p>}
      {options.map((t) => (
        <label key={t.id} className="flex items-center gap-2 text-sm">
          <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggleTag(field, t.id)} />
          {t.name}
        </label>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Accounting Rule") : t("Create Accounting Rule")}
        description={t("Define a debit/credit template for non-accountant users.")}
        actions={
          <Button variant="outline" onClick={() => navigate("/accounting/rules")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Basic Information")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("Rule Name")} *</Label>
            <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} error={errors.name} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Office")} *</Label>
            <Select
              value={form.officeId ? String(form.officeId) : ""}
              onValueChange={(v) => updateForm("officeId", Number(v))}
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
            {errors.officeId && <p className="text-xs text-red-500">{errors.officeId}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>{t("Description")}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={2}
              placeholder={t("Optional description")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("Debit Selection")}</CardTitle>
            <Select value={debitMode} onValueChange={(v) => setDebitMode(v as SelectionMode)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="account">{t("Single Account")}</SelectItem>
                <SelectItem value="tags">{t("Tag Based")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {debitMode === "account" ? (
            <div className="space-y-1.5">
              <Label>{t("Account to Debit")} *</Label>
              <Select
                value={form.accountToDebit ? String(form.accountToDebit) : ""}
                onValueChange={(v) => updateForm("accountToDebit", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select account")} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} ({a.glCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountToDebit && <p className="text-xs text-red-500">{errors.accountToDebit}</p>}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>{t("Debit Tags")} *</Label>
              {renderTagMultiSelect("debitTagIds", debitTagOptions, form.debitTagIds)}
              {errors.debitTags && <p className="text-xs text-red-500">{errors.debitTags}</p>}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.allowMultipleDebitEntries}
                  onCheckedChange={(c) => updateForm("allowMultipleDebitEntries", c === true)}
                />
                {t("Allow multiple debit entries")}
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("Credit Selection")}</CardTitle>
            <Select value={creditMode} onValueChange={(v) => setCreditMode(v as SelectionMode)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="account">{t("Single Account")}</SelectItem>
                <SelectItem value="tags">{t("Tag Based")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {creditMode === "account" ? (
            <div className="space-y-1.5">
              <Label>{t("Account to Credit")} *</Label>
              <Select
                value={form.accountToCredit ? String(form.accountToCredit) : ""}
                onValueChange={(v) => updateForm("accountToCredit", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select account")} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} ({a.glCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountToCredit && <p className="text-xs text-red-500">{errors.accountToCredit}</p>}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>{t("Credit Tags")} *</Label>
              {renderTagMultiSelect("creditTagIds", creditTagOptions, form.creditTagIds)}
              {errors.creditTags && <p className="text-xs text-red-500">{errors.creditTags}</p>}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.allowMultipleCreditEntries}
                  onCheckedChange={(c) => updateForm("allowMultipleCreditEntries", c === true)}
                />
                {t("Allow multiple credit entries")}
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={() => navigate("/accounting/rules")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("Cancel")}
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-[#D32F2F] hover:bg-red-700">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Saving…")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> {isEdit ? t("Save Changes") : t("Create Rule")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AccountingRuleFormPage;
