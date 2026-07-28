import { type FC, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  CheckCircle2,
  Trash2,
  Calendar,
  CalendarClock,
  UserPlus,
  UserX,
  ShieldPlus,
  ShieldX,
  XCircle,
  Plus,
  Info,
  Clock,
  Users,
  Shield,
  UserCircle,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGroup } from "../hooks/useGroup";
import { useGroupAccounts } from "../hooks/useGroupAccounts";
import {
  useActivateGroup,
  useDeleteGroup,
  useCloseGroup,
  useAssociateClients,
  useDisassociateClients,
  useAssignStaff,
  useUnassignStaff,
  useAssignRole,
  useUnassignRole,
} from "../hooks/useGroupCommands";
import GroupStatusBadge from "../components/GroupStatusBadge";
import { resolveGroupStatusLabel } from "../constants/status";
import type { GroupRoleData, GroupClosureReason } from "../types/group";

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "—");

const closeGroupSchema = z.object({
  closureDate: z.string().min(1, "Closure date is required"),
  closureReasonId: z.string().min(1, "Closure reason is required"),
});

const addClientSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
});

const assignStaffSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
});

const assignRoleSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

const GroupDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: group, isLoading, isError, refetch } = useGroup(id);
  const { data: accounts, isLoading: accountsLoading } = useGroupAccounts(id);

  const activateMutation = useActivateGroup();
  const deleteMutation = useDeleteGroup();
  const closeMutation = useCloseGroup();
  const associateMutation = useAssociateClients();
  const disassociateMutation = useDisassociateClients();
  const assignStaffMutation = useAssignStaff();
  const unassignStaffMutation = useUnassignStaff();
  const assignRoleMutation = useAssignRole();
  const unassignRoleMutation = useUnassignRole();

  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [showAssignStaffDialog, setShowAssignStaffDialog] = useState(false);
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false);

  const [clientSearch, setClientSearch] = useState("");

  const closeForm = useForm({
    resolver: zodResolver(closeGroupSchema),
    defaultValues: { closureDate: "", closureReasonId: "" },
  });

  const addClientForm = useForm({
    resolver: zodResolver(addClientSchema),
    defaultValues: { clientId: "" },
  });

  const assignStaffForm = useForm({
    resolver: zodResolver(assignStaffSchema),
    defaultValues: { staffId: "" },
  });

  const assignRoleForm = useForm({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: { clientId: "", roleId: "" },
  });

  const statusLabel = resolveGroupStatusLabel(group?.status);
  const isPending = group?.status?.id === 100 || group?.status?.code === "grouping.status.pending";
  const isActive = group?.status?.id === 300 || group?.status?.code === "grouping.status.active";
  const isClosed = group?.status?.id === 600 || group?.status?.code === "grouping.status.closed";

  const clientMembers = group?.clientMembers ?? [];
  const groupRoles = group?.groupRoles ?? [];
  const closureReasons = group?.closureReasons ?? [];

  const handleActivate = useCallback(async () => {
    if (!group?.id) return;
    await activateMutation.mutateAsync({ groupId: group.id });
    setShowActivateConfirm(false);
    refetch();
  }, [group, activateMutation, refetch]);

  const handleDelete = useCallback(async () => {
    if (!group?.id) return;
    try {
      await deleteMutation.mutateAsync(group.id);
      navigate("/groups");
    } catch { /* handled */ }
  }, [group, deleteMutation, navigate]);

  const onCloseSubmit = useCallback(
    async (values: { closureDate: string; closureReasonId: string }) => {
      if (!group?.id) return;
      await closeMutation.mutateAsync({
        groupId: group.id,
        payload: { closureDate: values.closureDate, closureReasonId: Number(values.closureReasonId) },
      });
      closeForm.reset();
      setShowCloseDialog(false);
      refetch();
    },
    [group, closeMutation, closeForm, refetch],
  );

  const handleRemoveClient = useCallback(async (clientId: number) => {
    if (!group?.id) return;
    await disassociateMutation.mutateAsync({ groupId: group.id, clientIds: [clientId] });
    refetch();
  }, [group, disassociateMutation, refetch]);

  const onAddClientSubmit = useCallback(
    async (values: { clientId: string }) => {
      if (!group?.id) return;
      await associateMutation.mutateAsync({ groupId: group.id, clientIds: [Number(values.clientId)] });
      addClientForm.reset();
      setClientSearch("");
      setShowAddClientDialog(false);
      refetch();
    },
    [group, associateMutation, addClientForm, refetch],
  );

  const onAssignStaffSubmit = useCallback(
    async (values: { staffId: string }) => {
      if (!group?.id) return;
      await assignStaffMutation.mutateAsync({ groupId: group.id, staffId: Number(values.staffId) });
      assignStaffForm.reset();
      setShowAssignStaffDialog(false);
      refetch();
    },
    [group, assignStaffMutation, assignStaffForm, refetch],
  );

  const handleUnassignStaff = useCallback(async () => {
    if (!group?.id || !group.staffId) return;
    await unassignStaffMutation.mutateAsync({ groupId: group.id, staffId: group.staffId });
    refetch();
  }, [group, unassignStaffMutation, refetch]);

  const onAssignRoleSubmit = useCallback(
    async (values: { clientId: string; roleId: string }) => {
      if (!group?.id) return;
      await assignRoleMutation.mutateAsync({
        groupId: group.id,
        clientId: Number(values.clientId),
        roleId: Number(values.roleId),
      });
      assignRoleForm.reset();
      setShowAssignRoleDialog(false);
      refetch();
    },
    [group, assignRoleMutation, assignRoleForm, refetch],
  );

  const handleUnassignRole = useCallback(async (role: GroupRoleData) => {
    if (!group?.id) return;
    await unassignRoleMutation.mutateAsync({ groupId: group.id, roleId: role.id });
    refetch();
  }, [group, unassignRoleMutation, refetch]);

  const filteredClients = clientMembers.filter(
    (c) => !clientSearch || c.displayName?.toLowerCase().includes(clientSearch.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-6" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 rounded-xl border p-6">
              <Skeleton className="h-5 w-32" />
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load group" message="Could not fetch group details." onRetry={() => refetch()} />
      </div>
    );
  }

  const clientColumns: ColumnDef<(typeof clientMembers)[number]>[] = [
    { key: "displayName", header: "Client Name", cell: (r) => r.displayName ?? `#${r.id}` },
    { key: "accountNo", header: "Account No", cell: (r) => r.accountNo ?? "—" },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      className: "text-right",
      headerClassName: "text-right",
      cell: (r) => (
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); handleRemoveClient(r.id); }}
          disabled={disassociateMutation.isPending}
        >
          <UserX className="mr-1 h-3.5 w-3.5" />
          Remove
        </Button>
      ),
    },
  ];

  const roleColumns: ColumnDef<GroupRoleData>[] = [
    { key: "clientName", header: "Client Name", cell: (r) => r.clientName ?? `#${r.clientId}` },
    { key: "role", header: "Role", cell: (r) => r.role?.name ?? "—" },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      className: "text-right",
      headerClassName: "text-right",
      cell: (r) => (
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); handleUnassignRole(r); }}
          disabled={unassignRoleMutation.isPending}
        >
          <ShieldX className="mr-1 h-3.5 w-3.5" />
          Unassign
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={group.name ?? `Group #${group.id}`}
        description={group.accountNo ? `Account #${group.accountNo}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <GroupStatusBadge status={group.status} size="lg" />
            {isPending && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActivateConfirm(true)}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Activate
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(`/groups/edit/${group.id}`)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/groups/${group.id}/calendars`)}>
              <Calendar className="mr-1 h-4 w-4" />
              Calendars
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/groups/${group.id}/meetings`)}>
              <CalendarClock className="mr-1 h-4 w-4" />
              Meetings
            </Button>
            {isPending && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            )}
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCloseDialog(true)}
                className="text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <XCircle className="mr-1 h-4 w-4" />
                Close
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/groups")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              Group Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium">{group.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Account No</span>
              <span className="text-sm font-medium">{group.accountNo ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Office</span>
              <span className="text-sm font-medium">{group.officeName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Staff</span>
              <span className="text-sm font-medium">{group.staffName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">External ID</span>
              <span className="text-sm font-medium">{group.externalId ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Hierarchy</span>
              <span className="text-sm font-mono">{group.hierarchy ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Activation Date</span>
              <span className="text-sm font-medium">{formatDate(group.activationDate ?? group.timeline?.activatedOnDate)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Submitted On</span>
              <span className="text-sm font-medium">{formatDate(group.submittedDate ?? group.timeline?.submittedOnDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Activated On</span>
              <span className="text-sm font-medium">{formatDate(group.timeline?.activatedOnDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Closed On</span>
              <span className="text-sm font-medium">{formatDate(group.timeline?.closedOnDate)}</span>
            </div>
            {group.collectionMeetingCalendar && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Meeting Calendar</span>
                <span className="text-sm font-medium">{group.collectionMeetingCalendar.title ?? `#${group.collectionMeetingCalendar.id}`}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Client Members ({clientMembers.length})
          </CardTitle>
          {isActive && (
            <Button variant="outline" size="sm" onClick={() => setShowAddClientDialog(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Client
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={clientColumns}
            data={clientMembers}
            emptyState={{ title: "No client members", message: "This group has no client members yet." }}
            idAccessor={(r) => String(r.id)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Roles ({groupRoles.length})
          </CardTitle>
          {isActive && (
            <Button variant="outline" size="sm" onClick={() => setShowAssignRoleDialog(true)}>
              <ShieldPlus className="mr-1 h-4 w-4" />
              Assign Role
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={roleColumns}
            data={groupRoles}
            emptyState={{ title: "No roles assigned", message: "No roles have been assigned to group members." }}
            idAccessor={(r) => String(r.id)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="h-4 w-4" />
            Staff Assignment
          </CardTitle>
          <div className="flex items-center gap-2">
            {isActive && (
              <>
                {group.staffId ? (
                  <Button variant="outline" size="sm" onClick={handleUnassignStaff} disabled={unassignStaffMutation.isPending}>
                    <UserX className="mr-1 h-4 w-4" />
                    Unassign Staff
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowAssignStaffDialog(true)}>
                    <UserPlus className="mr-1 h-4 w-4" />
                    Assign Staff
                  </Button>
                )}
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {group.staffName ? (
              <>Current staff: <span className="font-medium">{group.staffName}</span></>
            ) : (
              "No staff assigned to this group."
            )}
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Group"
        description={`Delete ${group.name}? Only pending groups with no members can be deleted. This cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={showActivateConfirm}
        onOpenChange={setShowActivateConfirm}
        title="Activate Group"
        description={`Activate ${group.name}? The group will become active.`}
        onConfirm={handleActivate}
        variant="default"
      />

      {closeMutation.isError && (
        <ErrorState
          title="Failed to close group"
          message={closeMutation.error instanceof Error ? closeMutation.error.message : "An unexpected error occurred."}
          onRetry={() => closeMutation.reset()}
        />
      )}

      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={closeForm.handleSubmit(onCloseSubmit)}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Closure Date</label>
                <Input type="date" {...closeForm.register("closureDate")} error={closeForm.formState.errors.closureDate?.message} />
              </div>
              <div className="space-y-1.5">
                <Label>Closure Reason</Label>
                <Controller
                  name="closureReasonId"
                  control={closeForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {closureReasons.map((r: GroupClosureReason) => (
                          <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {closeForm.formState.errors.closureReasonId && (
                  <p className="text-xs text-red-500">{closeForm.formState.errors.closureReasonId.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCloseDialog(false); closeForm.reset(); }}>Cancel</Button>
              <Button type="submit" disabled={closeMutation.isPending}>
                {closeMutation.isPending ? "Closing..." : "Close Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {associateMutation.isError && (
        <ErrorState
          title="Failed to add client"
          message={associateMutation.error instanceof Error ? associateMutation.error.message : "An unexpected error occurred."}
          onRetry={() => associateMutation.reset()}
        />
      )}

      <Dialog open={showAddClientDialog} onOpenChange={setShowAddClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client to Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={addClientForm.handleSubmit(onAddClientSubmit)}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Search Client</Label>
                <Input
                  placeholder="Type to search..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Select Client</Label>
                <Controller
                  name="clientId"
                  control={addClientForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredClients.length > 0 ? (
                          filteredClients.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.displayName ?? `#${c.id}`}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No clients found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {addClientForm.formState.errors.clientId && (
                  <p className="text-xs text-red-500">{addClientForm.formState.errors.clientId.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddClientDialog(false); addClientForm.reset(); setClientSearch(""); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={addClientForm.watch("clientId") === "" || associateMutation.isPending}>
                {associateMutation.isPending ? "Adding..." : "Add Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {assignStaffMutation.isError && (
        <ErrorState
          title="Failed to assign staff"
          message={assignStaffMutation.error instanceof Error ? assignStaffMutation.error.message : "An unexpected error occurred."}
          onRetry={() => assignStaffMutation.reset()}
        />
      )}

      <Dialog open={showAssignStaffDialog} onOpenChange={setShowAssignStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff to Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={assignStaffForm.handleSubmit(onAssignStaffSubmit)}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Staff ID</label>
                <Input
                  type="number"
                  placeholder="Enter staff ID"
                  {...assignStaffForm.register("staffId")}
                  error={assignStaffForm.formState.errors.staffId?.message}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAssignStaffDialog(false); assignStaffForm.reset(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignStaffMutation.isPending}>
                {assignStaffMutation.isPending ? "Assigning..." : "Assign Staff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {assignRoleMutation.isError && (
        <ErrorState
          title="Failed to assign role"
          message={assignRoleMutation.error instanceof Error ? assignRoleMutation.error.message : "An unexpected error occurred."}
          onRetry={() => assignRoleMutation.reset()}
        />
      )}

      <Dialog open={showAssignRoleDialog} onOpenChange={setShowAssignRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
          </DialogHeader>
          <form onSubmit={assignRoleForm.handleSubmit(onAssignRoleSubmit)}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Controller
                  name="clientId"
                  control={assignRoleForm.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientMembers.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.displayName ?? `#${c.id}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {assignRoleForm.formState.errors.clientId && (
                  <p className="text-xs text-red-500">{assignRoleForm.formState.errors.clientId.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Role ID</label>
                <Input
                  type="number"
                  placeholder="Enter role ID"
                  {...assignRoleForm.register("roleId")}
                  error={assignRoleForm.formState.errors.roleId?.message}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAssignRoleDialog(false); assignRoleForm.reset(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignRoleMutation.isPending}>
                {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {deleteMutation.isError && (
        <ErrorState
          title="Failed to delete group"
          message={deleteMutation.error instanceof Error ? deleteMutation.error.message : "An unexpected error occurred."}
          onRetry={() => deleteMutation.reset()}
        />
      )}
    </div>
  );
};

export default GroupDetailPage;
