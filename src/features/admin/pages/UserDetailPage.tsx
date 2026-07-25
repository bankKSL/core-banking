import { type FC, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Lock, User, Mail, Building2, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useUser, useDeleteUser, useChangePassword } from "../hooks/useUsers";

const InfoRow: FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <span className="mt-0.5 text-gray-400">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const UserDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading, isError, refetch } = useUser(id);
  const deleteMutation = useDeleteUser();
  const changePwdMutation = useChangePassword();
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!user || !newPassword || newPassword !== repeatPassword) return;
    await changePwdMutation.mutateAsync({
      userId: user.id,
      payload: { password: newPassword, repeatPassword },
    });
    setPwdDialogOpen(false);
    setNewPassword("");
    setRepeatPassword("");
  };

  if (isLoading)
    return (
      <div className="p-6 max-w-2xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  if (isError || !user)
    return (
      <div className="p-6">
        <p className="text-red-600">User not found.</p>
        <Button variant="outline" className="mt-2" onClick={() => navigate("/admin/users")}>
          Back
        </Button>
      </div>
    );

  return (
    <div className="p-6 max-w-2xl m-auto space-y-6">
      <PageHeader
        title={user.username}
        description={`${user.firstname} ${user.lastname}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={user.isActive !== false ? "success" : "error"} size="sm">
              {user.isActive !== false ? "Active" : "Disabled"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setPwdDialogOpen(true)}>
              <Lock className="mr-1 h-4 w-4" />
              Change Password
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/users/edit/${user.id}`)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)} className="text-red-600">
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/users")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              User Info
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow icon={<User className="h-4 w-4" />} label="Username" value={user.username} />
            <InfoRow icon={<User className="h-4 w-4" />} label="First Name" value={user.firstname} />
            <InfoRow icon={<User className="h-4 w-4" />} label="Last Name" value={user.lastname} />
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email ?? "—"} />
            <InfoRow
              icon={<Building2 className="h-4 w-4" />}
              label="Office"
              value={user.officeName ?? `#${user.officeId}`}
            />
            <InfoRow icon={<Shield className="h-4 w-4" />} label="Staff ID" value={user.staffId ?? "—"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles & Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<Shield className="h-4 w-4" />}
              label="Roles"
              value={user?.roles?.map((r) => r.name).join(", ") || "—"}
            />
            <InfoRow
              icon={<Lock className="h-4 w-4" />}
              label="Password Never Expires"
              value={user.passwordNeverExpires ? "Yes" : "No"}
            />
            <InfoRow
              icon={<Lock className="h-4 w-4" />}
              label="Login Retry Lock"
              value={user.isLoginRetriesEnabled ? "Enabled" : "Disabled"}
            />
            <InfoRow
              icon={<Lock className="h-4 w-4" />}
              label="Password Reset Allowed"
              value={user.isPasswordResetAllowed ? "Yes" : "No"}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={pwdDialogOpen} onOpenChange={setPwdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Set a new password for {user.username}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="repeatPassword">Repeat Password</Label>
              <Input
                id="repeatPassword"
                type="password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={!newPassword || newPassword !== repeatPassword || changePwdMutation.isPending}
            >
              {changePwdMutation.isPending && <span className="mr-2 animate-spin">⏳</span>}
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(user.id);
          navigate("/admin/users");
        }}
        title="Delete User"
        description={`Delete ${user.username}? The account will be disabled.`}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
};

export default UserDetailPage;
