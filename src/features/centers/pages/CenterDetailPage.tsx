import { type FC, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Users, Link2, Unlink, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCenter, useActivateCenter, useCloseCenter, useAssociateGroups, useDisassociateGroups } from "../hooks/useCenters";
import { fetchGroups } from "@/features/groups";
import type { CenterData } from "../api/centers";

const statusVariant: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  "centerStatusType.pending": "info",
  "centerStatusType.active": "success",
  "centerStatusType.closed": "default",
};

const statusLabel: Record<string, string> = {
  "centerStatusType.pending": "Pending",
  "centerStatusType.active": "Active",
  "centerStatusType.closed": "Closed",
};

const closeCenterSchema = z.object({
  closureReasonId: z.string().min(1, "Closure reason ID is required"),
});

const associateGroupsSchema = z.object({
  groupIds: z.array(z.number()).min(1, "Select at least one group"),
});

type CloseCenterFormValues = z.infer<typeof closeCenterSchema>;
type AssociateGroupsFormValues = z.infer<typeof associateGroupsSchema>;

const CenterDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const centerId = id ? Number(id) : undefined;

  const { data: center, isLoading, isError, error, refetch } = useCenter(centerId);
  const activateMutation = useActivateCenter();
  const closeMutation = useCloseCenter();
  const associateMutation = useAssociateGroups();
  const disassociateMutation = useDisassociateGroups();

  const [associateOpen, setAssociateOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [allGroups, setAllGroups] = useState<Array<{ id: number; name: string; officeName: string }>>([]);
  const [disassociateIds, setDisassociateIds] = useState<number[]>([]);

  const closeForm = useForm<CloseCenterFormValues>({
    resolver: zodResolver(closeCenterSchema),
    defaultValues: { closureReasonId: "" },
  });

  const associateForm = useForm<AssociateGroupsFormValues>({
    resolver: zodResolver(associateGroupsSchema),
    defaultValues: { groupIds: [] },
  });

  const handleOpenAssociate = useCallback(async () => {
    setAssociateOpen(true);
    associateForm.reset({ groupIds: [] });
    try {
      const res = await fetchGroups({ limit: 1000, offset: 0, paged: true });
      setAllGroups((res.pageItems ?? []).map((g) => ({ id: g.id!, name: g.name ?? "", officeName: g.officeName ?? "" })));
    } catch {
      setAllGroups([]);
    }
  }, [associateForm]);

  const handleActivate = useCallback(async () => {
    if (!centerId) return;
    await activateMutation.mutateAsync({ id: centerId, activationDate: new Date().toISOString().split("T")[0] });
  }, [centerId, activateMutation]);

  const onCloseSubmit = useCallback(
    async (values: CloseCenterFormValues) => {
      if (!centerId) return;
      await closeMutation.mutateAsync({
        id: centerId,
        payload: { closureReasonId: Number(values.closureReasonId), closureDate: new Date().toISOString().split("T")[0] },
      });
      closeForm.reset();
      setCloseOpen(false);
    },
    [centerId, closeMutation, closeForm],
  );

  const onAssociateSubmit = useCallback(
    async (values: AssociateGroupsFormValues) => {
      if (!centerId || values.groupIds.length === 0) return;
      await associateMutation.mutateAsync({ centerId, groupIds: values.groupIds });
      associateForm.reset();
      setAssociateOpen(false);
    },
    [centerId, associateMutation, associateForm],
  );

  const handleDisassociate = useCallback(async () => {
    if (!centerId || disassociateIds.length === 0) return;
    await disassociateMutation.mutateAsync({ centerId, groupIds: disassociateIds });
    setDisassociateIds([]);
  }, [centerId, disassociateIds, disassociateMutation]);

  const toggleDisassociateSelection = (groupId: number) => {
    setDisassociateIds((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId],
    );
  };

  const groupMemberColumns: ColumnDef<CenterData>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => <span className="font-medium">{row.name ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      cell: (row) => {
        const code = row.status?.code ?? "";
        return (
          <Badge variant={statusVariant[code] ?? "default"} size="sm">
            {statusLabel[code] ?? row.status?.value ?? "Unknown"}
          </Badge>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl m-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load center"
          message={error?.message ?? "An unexpected error occurred."}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!center) return null;

  const statusCode = center.status?.code ?? "";
  const isPending = statusCode === "centerStatusType.pending";
  const isActive = statusCode === "centerStatusType.active";
  const groupMembers = center.groupMembers ?? [];

  const availableGroups = allGroups.filter(
    (g) => !groupMembers.some((m) => m.id === g.id),
  );

  const selectedGroupIds = associateForm.watch("groupIds");

  return (
    <div className="p-6 max-w-5xl m-auto space-y-6">
      <PageHeader
        title={center.name ?? `Center #${center.id}`}
        description={`Account: ${center.accountNo ?? "—"}`}
        actions={
          <div className="flex items-center gap-2">
            {isPending && (
              <Button
                onClick={handleActivate}
                disabled={activateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {activateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Activate
              </Button>
            )}
            {isActive && (
              <Button
                variant="outline"
                className="border-red-600 text-red-700 hover:bg-red-50"
                onClick={() => setCloseOpen(true)}
              >
                Close
              </Button>
            )}
            {isActive && (
              <Button variant="outline" onClick={handleOpenAssociate}>
                <Users className="mr-2 h-4 w-4" />
                Associate Groups
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate("/centers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{center.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account No</span>
              <span className="font-medium">{center.accountNo ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">External ID</span>
              <span className="font-medium">{center.externalId ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Office</span>
              <span className="font-medium">{center.officeName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Staff</span>
              <span className="font-medium">{center.staffName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <Badge variant={statusVariant[statusCode] ?? "default"} size="sm">
                {statusLabel[statusCode] ?? center.status?.value ?? "Unknown"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hierarchy</span>
              <span className="font-medium">{center.hierarchy ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Active</span>
              <span className="font-medium">{center.active ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Activation Date</span>
              <span className="font-medium">{center.activationDate ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Submitted On</span>
              <span className="font-medium">{center.timeline?.submittedOnDate ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Activated On</span>
              <span className="font-medium">{center.timeline?.activatedOnDate ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Closed On</span>
              <span className="font-medium">{center.timeline?.closedOnDate ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Child Groups</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/centers/${center.id}/calendars`)}>
              <Calendar className="mr-1.5 h-4 w-4" />
              Calendars
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/centers/${center.id}/meetings`)}>
              <Users className="mr-1.5 h-4 w-4" />
              Meetings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groupMembers.length > 0 ? (
            <>
              <DataTable
                columns={groupMemberColumns}
                data={groupMembers}
                idAccessor={(row) => String(row.id)}
                emptyState={{ message: "No groups associated." }}
                onRowClick={(row) => navigate(`/groups/edit/${row.id}`)}
              />
              {disassociateIds.length > 0 && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="border-red-600 text-red-700 hover:bg-red-50"
                    onClick={handleDisassociate}
                    disabled={disassociateMutation.isPending}
                  >
                    {disassociateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Unlink className="mr-2 h-4 w-4" />
                    )}
                    Disassociate Selected ({disassociateIds.length})
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">No child groups associated with this center.</p>
          )}
        </CardContent>
      </Card>

      {closeMutation.isError && (
        <ErrorState
          title="Failed to close center"
          message={closeMutation.error instanceof Error ? closeMutation.error.message : "An unexpected error occurred."}
          onRetry={() => closeMutation.reset()}
        />
      )}

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Center</DialogTitle>
          </DialogHeader>
          <form onSubmit={closeForm.handleSubmit(onCloseSubmit)}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Closure Reason ID</label>
                <Input
                  type="number"
                  placeholder="Enter closure reason ID"
                  {...closeForm.register("closureReasonId")}
                  error={closeForm.formState.errors.closureReasonId?.message}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCloseOpen(false); closeForm.reset(); }}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={closeMutation.isPending}
                variant="destructive"
              >
                {closeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Confirm Close
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {associateMutation.isError && (
        <ErrorState
          title="Failed to associate groups"
          message={associateMutation.error instanceof Error ? associateMutation.error.message : "An unexpected error occurred."}
          onRetry={() => associateMutation.reset()}
        />
      )}

      <Dialog open={associateOpen} onOpenChange={setAssociateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Associate Groups</DialogTitle>
          </DialogHeader>
          <form onSubmit={associateForm.handleSubmit(onAssociateSubmit)}>
            <Controller
              name="groupIds"
              control={associateForm.control}
              render={({ field }) => (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {availableGroups.length === 0 ? (
                    <p className="text-sm text-gray-500">No groups available to associate.</p>
                  ) : (
                    availableGroups.map((group) => (
                      <label
                        key={group.id}
                        className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <input
                          type="checkbox"
                          checked={field.value.includes(group.id)}
                          onChange={() => {
                            const updated = field.value.includes(group.id)
                              ? field.value.filter((id: number) => id !== group.id)
                              : [...field.value, group.id];
                            field.onChange(updated);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-[#D32F2F] focus:ring-[#D32F2F]"
                        />
                        <div>
                          <p className="text-sm font-medium">{group.name}</p>
                          <p className="text-xs text-gray-500">{group.officeName}</p>
                        </div>
                      </label>
                    ))
                  )}
                  {associateForm.formState.errors.groupIds && (
                    <p className="text-xs text-red-500">{associateForm.formState.errors.groupIds.message}</p>
                  )}
                </div>
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setAssociateOpen(false); associateForm.reset(); }}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={selectedGroupIds.length === 0 || associateMutation.isPending}
                className="bg-[#D32F2F] hover:bg-red-700"
              >
                {associateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Link2 className="mr-2 h-4 w-4" />
                )}
                Associate ({selectedGroupIds.length})
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CenterDetailPage;
