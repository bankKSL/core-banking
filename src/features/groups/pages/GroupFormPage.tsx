import { type FC, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useOffices } from "@/hooks/useOffices";
import { useGroup } from "../hooks/useGroup";
import { useCreateGroup } from "../hooks/useCreateGroup";
import { useUpdateGroup } from "../hooks/useUpdateGroup";
import { useActivateGroup } from "../hooks/useGroupCommands";
import GroupForm from "../components/GroupForm";
import type { CreateGroupFormValues } from "../schemas/group.schema";

const GroupFormPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { data: offices = [], isLoading: officesLoading } = useOffices();
  const { data: group, isLoading: groupLoading } = useGroup(id);
  const createMutation = useCreateGroup();
  const updateMutation = useUpdateGroup();
  const activateMutation = useActivateGroup();

  // Persisted `active` flag from the server — decides whether Activate is offered.
  // Tracked locally so a successful activation updates the UI in place (no navigation).
  const [activatedInPlace, setActivatedInPlace] = useState(false);
  const originalActive = activatedInPlace || (group?.active ?? false);

  const isLoading = officesLoading || (isEditMode && groupLoading);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = useCallback(
    async (values: CreateGroupFormValues) => {
      if (isEditMode && id) {
        // Only the name is editable on update (PutGroupsGroupIdRequest = { name? })
        await updateMutation.mutateAsync({ groupId: Number(id), payload: { name: values.name } });
        navigate("/groups");
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          officeId: values.officeId,
          active: values.active,
          activationDate: values.active ? values.activationDate : undefined,
          externalId: values.externalId || undefined,
        });
        navigate("/groups");
      }
    },
    [createMutation, updateMutation, navigate, isEditMode, id],
  );

  const handleActivate = useCallback(
    async (activationDate: string) => {
      if (!id) return;
      await activateMutation.mutateAsync({ groupId: Number(id), payload: { activationDate } });
      // Update in place — the Activate button disappears without navigation
      setActivatedInPlace(true);
    },
    [activateMutation, id],
  );

  const error =
    createMutation.error?.message ?? updateMutation.error?.message ?? activateMutation.error?.message ?? null;

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="rounded-xl border p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto">
      <PageHeader
        title={isEditMode ? "Edit Group" : "Create Group"}
        description={
          isEditMode ? `Editing group ${group?.name ?? `#${id}`}` : "Register a new self-help group in Fineract"
        }
        actions={
          <Button variant="outline" onClick={() => navigate("/groups")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Button>
        }
      />
      {(createMutation.isError || updateMutation.isError) && (
        <div className="mb-4">
          <ErrorState
            title="Failed to save group"
            message={error ?? "An unexpected error occurred."}
            onRetry={() => {
              createMutation.reset();
              updateMutation.reset();
            }}
          />
        </div>
      )}
      <GroupForm
        offices={offices}
        group={group}
        originalActive={originalActive}
        mode={isEditMode ? "edit" : "create"}
        onSubmit={handleSubmit}
        onActivate={handleActivate}
        isSubmitting={isSubmitting}
        isActivating={activateMutation.isPending}
        error={activateMutation.isError ? error : null}
      />
    </div>
  );
};

export default GroupFormPage;
