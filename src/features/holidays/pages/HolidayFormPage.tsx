import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/shared/ErrorState";
import { useOffices } from "@/hooks/useOffices";
import {
  useHoliday,
  useHolidayTemplate,
  useCreateHoliday,
  useUpdateHoliday,
} from "../hooks/useHolidays";
import { parseFineractDate } from "../api/holidays";
import type { EnumOption } from "../types/holiday.types";

function formatDateInput(dateVal: number[] | null | undefined): string {
  const d = parseFineractDate(dateVal);
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

const HolidayFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reschedulingType, setReschedulingType] = useState<number | null>(null);
  const [repaymentsRescheduledTo, setRepaymentsRescheduledTo] = useState("");
  const [selectedOfficeIds, setSelectedOfficeIds] = useState<number[]>([]);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: template, isLoading: isTemplateLoading } = useHolidayTemplate();
  const { data: existingHoliday, isLoading: isHolidayLoading } = useHoliday(
    id ? Number(id) : undefined,
  );
  const { data: offices = [], isLoading: officesLoading } = useOffices();

  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const reschedulingTypeOptions: EnumOption[] = useMemo(
    () => template?.reschedulingTypeOptions ?? [],
    [template],
  );

  useEffect(() => {
    if (existingHoliday) {
      setName(existingHoliday.name);
      setDescription(existingHoliday.description ?? "");
      setFromDate(formatDateInput(existingHoliday.fromDate));
      setToDate(formatDateInput(existingHoliday.toDate));
      setReschedulingType(existingHoliday.reschedulingType?.id ?? null);
      setRepaymentsRescheduledTo(formatDateInput(existingHoliday.repaymentsRescheduledTo));
      setSelectedOfficeIds(existingHoliday.offices?.map((o) => o.id) ?? []);
    }
  }, [existingHoliday]);

  const selectedReschedulingTypeOption = useMemo(
    () => reschedulingTypeOptions.find((o) => o.id === reschedulingType),
    [reschedulingTypeOptions, reschedulingType],
  );

  const isSpecificDate = useMemo(() => {
    if (!selectedReschedulingTypeOption) return false;
    const val = (
      selectedReschedulingTypeOption.value ?? selectedReschedulingTypeOption.code ?? ""
    ).toLowerCase();
    return val.includes("specific") || val.includes("date");
  }, [selectedReschedulingTypeOption]);

  const handleOfficeToggle = useCallback((officeId: number) => {
    setSelectedOfficeIds((prev) =>
      prev.includes(officeId)
        ? prev.filter((oid) => oid !== officeId)
        : [...prev, officeId],
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMutationError(null);

      const payload: Record<string, unknown> = {
        name,
        description: description || undefined,
        fromDate,
        toDate,
        reschedulingType,
        offices: selectedOfficeIds,
      };

      if (isSpecificDate && repaymentsRescheduledTo) {
        payload.repaymentsRescheduledTo = repaymentsRescheduledTo;
      }

      try {
        if (isEdit) {
          await updateMutation.mutateAsync({ id: Number(id), values: payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
        navigate("/holidays");
      } catch (err: unknown) {
        const error = err as {
          response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } };
        };
        const msg =
          error?.response?.data?.errors?.[0]?.defaultUserMessage ??
          "Failed to save holiday.";
        setMutationError(msg);
      }
    },
    [
      name,
      description,
      fromDate,
      toDate,
      reschedulingType,
      selectedOfficeIds,
      isSpecificDate,
      repaymentsRescheduledTo,
      isEdit,
      id,
      createMutation,
      updateMutation,
      navigate,
    ],
  );

  const isLoading = isTemplateLoading || isHolidayLoading || officesLoading;

  if (isLoading) {
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
    <div className="p-6 max-w-5xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Holiday" : "New Holiday"}
        description="Create or edit a bank holiday"
        actions={
          <Button variant="outline" onClick={() => navigate("/holidays")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        {mutationError && (
          <div className="mb-6">
            <ErrorState message={mutationError} />
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Holiday Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="holidayName">Name *</Label>
              <Input
                id="holidayName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. New Year's Day"
              />
            </div>

            <div>
              <Label htmlFor="holidayDescription">Description</Label>
              <Textarea
                id="holidayDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="holidayFromDate">From Date *</Label>
                <Input
                  id="holidayFromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="holidayToDate">To Date *</Label>
                <Input
                  id="holidayToDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Rescheduling Type *</Label>
              <Select
                value={reschedulingType != null ? String(reschedulingType) : ""}
                onValueChange={(v) => setReschedulingType(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rescheduling type" />
                </SelectTrigger>
                <SelectContent>
                  {reschedulingTypeOptions.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.value ?? opt.code ?? String(opt.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isSpecificDate && (
              <div>
                <Label htmlFor="holidayRepaymentsRescheduledTo">
                  Repayments Rescheduled To
                </Label>
                <Input
                  id="holidayRepaymentsRescheduledTo"
                  type="date"
                  value={repaymentsRescheduledTo}
                  onChange={(e) => setRepaymentsRescheduledTo(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label>Offices *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1 max-h-60 overflow-y-auto border rounded-md p-3">
                {offices.map((office) => {
                  const checked = selectedOfficeIds.includes(office.id);
                  return (
                    <div key={office.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`office-${office.id}`}
                        checked={checked}
                        onCheckedChange={() => handleOfficeToggle(office.id)}
                      />
                      <label
                        htmlFor={`office-${office.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {office.name}
                      </label>
                    </div>
                  );
                })}
                {offices.length === 0 && (
                  <p className="text-sm text-gray-500 col-span-full">
                    No offices available.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/holidays")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />{" "}
                {isEdit ? "Update Holiday" : "Create Holiday"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HolidayFormPage;
