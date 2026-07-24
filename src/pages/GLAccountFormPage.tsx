import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, BookOpen } from "lucide-react";
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
  useGLAccount,
  useGLAccountTemplate,
  useCreateGLAccount,
  useUpdateGLAccount,
  GL_ACCOUNT_TYPE,
  GL_ACCOUNT_TYPE_LABELS,
  GL_ACCOUNT_USAGE,
  GL_ACCOUNT_USAGE_LABELS,
} from "@/features/accounting";
import type { CodeValueData, GLAccountData } from "@/features/accounting";

const HEADER_OPTIONS_BY_TYPE: Record<number, keyof GLAccountData> = {
  [GL_ACCOUNT_TYPE.ASSET]: "assetHeaderAccountOptions",
  [GL_ACCOUNT_TYPE.LIABILITY]: "liabilityHeaderAccountOptions",
  [GL_ACCOUNT_TYPE.EQUITY]: "equityHeaderAccountOptions",
  [GL_ACCOUNT_TYPE.INCOME]: "incomeHeaderAccountOptions",
  [GL_ACCOUNT_TYPE.EXPENSE]: "expenseHeaderAccountOptions",
};

const TAG_OPTIONS_BY_TYPE: Record<number, keyof GLAccountData> = {
  [GL_ACCOUNT_TYPE.ASSET]: "allowedAssetsTagOptions",
  [GL_ACCOUNT_TYPE.LIABILITY]: "allowedLiabilitiesTagOptions",
  [GL_ACCOUNT_TYPE.EQUITY]: "allowedEquityTagOptions",
  [GL_ACCOUNT_TYPE.INCOME]: "allowedIncomeTagOptions",
  [GL_ACCOUNT_TYPE.EXPENSE]: "allowedExpensesTagOptions",
};

const GLAccountFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: existing, isLoading: accountLoading } = useGLAccount(id, isEdit);
  const { data: template, isLoading: templateLoading } = useGLAccountTemplate();
  const createMutation = useCreateGLAccount();
  const updateMutation = useUpdateGLAccount();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    glCode: "",
    type: GL_ACCOUNT_TYPE.ASSET as number,
    usage: GL_ACCOUNT_USAGE.DETAIL as number,
    manualEntriesAllowed: true,
    disabled: false,
    parentId: 0,
    tagId: 0,
    description: "",
  });

  useEffect(() => {
    if (!existing || !isEdit) return;
    setForm({
      name: existing.name ?? "",
      glCode: existing.glCode ?? "",
      type: existing.type?.id ?? GL_ACCOUNT_TYPE.ASSET,
      usage: existing.usage?.id ?? GL_ACCOUNT_USAGE.DETAIL,
      manualEntriesAllowed: existing.manualEntriesAllowed ?? true,
      disabled: existing.disabled ?? false,
      parentId: existing.parentId ?? 0,
      tagId: existing.tagId?.id ?? 0,
      description: existing.description ?? "",
    });
  }, [existing, isEdit]);

  const updateForm = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const parentOptions: GLAccountData[] = useMemo(() => {
    if (!template) return [];
    const key = HEADER_OPTIONS_BY_TYPE[form.type];
    return (template[key] as GLAccountData[] | undefined) ?? [];
  }, [template, form.type]);

  const tagOptions: CodeValueData[] = useMemo(() => {
    if (!template) return [];
    const key = TAG_OPTIONS_BY_TYPE[form.type];
    return (template[key] as CodeValueData[] | undefined) ?? [];
  }, [template, form.type]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.name.length > 200) e.name = "Name must be 200 characters or less";
    if (!form.glCode.trim()) e.glCode = "GL Code is required";
    if (form.glCode.length > 45) e.glCode = "GL Code must be 45 characters or less";
    if (form.description.length > 500) e.description = "Description must be 500 characters or less";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: id!,
          payload: {
            name: form.name,
            description: form.description || undefined,
            manualEntriesAllowed: form.manualEntriesAllowed,
            disabled: form.disabled,
            parentId: form.parentId || undefined,
            tagId: form.tagId || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: form.name,
          glCode: form.glCode,
          type: form.type,
          usage: form.usage,
          manualEntriesAllowed: form.manualEntriesAllowed,
          parentId: form.parentId || undefined,
          tagId: form.tagId || undefined,
          description: form.description || undefined,
        });
      }
      navigate("/accounting/gl-accounts");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if ((isEdit && accountLoading) || templateLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit GL Account" : "Create GL Account"}
        description="Configure a general ledger account in the chart of accounts."
        actions={
          <Button variant="outline" onClick={() => navigate("/accounting/gl-accounts")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Account Name *</Label>
            <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} error={errors.name} />
          </div>
          <div className="space-y-1.5">
            <Label>GL Code *</Label>
            <Input
              value={form.glCode}
              onChange={(e) => updateForm("glCode", e.target.value)}
              error={errors.glCode}
              disabled={isEdit}
              placeholder="e.g. 100001"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Account Type *</Label>
            <Select value={String(form.type)} onValueChange={(v) => updateForm("type", Number(v))} disabled={isEdit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GL_ACCOUNT_TYPE_LABELS).map(([typeId, label]) => (
                  <SelectItem key={typeId} value={typeId}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Usage *</Label>
            <Select value={String(form.usage)} onValueChange={(v) => updateForm("usage", Number(v))} disabled={isEdit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GL_ACCOUNT_USAGE_LABELS).map(([usageId, label]) => (
                  <SelectItem key={usageId} value={usageId}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="manualEntriesAllowed"
              checked={form.manualEntriesAllowed}
              onCheckedChange={(c) => updateForm("manualEntriesAllowed", c === true)}
            />
            <Label htmlFor="manualEntriesAllowed" className="cursor-pointer">
              Manual journal entries allowed
            </Label>
          </div>
          {isEdit && (
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="disabled"
                checked={form.disabled}
                onCheckedChange={(c) => updateForm("disabled", c === true)}
              />
              <Label htmlFor="disabled" className="cursor-pointer">
                Disable account
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hierarchy &amp; Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Parent Account</Label>
            <Select value={String(form.parentId)} onValueChange={(v) => updateForm("parentId", Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="None (top level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None (top level)</SelectItem>
                {parentOptions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} ({p.glCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tag</Label>
            <Select value={String(form.tagId)} onValueChange={(v) => updateForm("tagId", Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="No tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No tag</SelectItem>
                {tagOptions.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={3}
              placeholder="Optional description"
              error={errors.description}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={() => navigate("/accounting/gl-accounts")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-[#D32F2F] hover:bg-red-700">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> {isEdit ? "Save Changes" : "Create Account"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GLAccountFormPage;
