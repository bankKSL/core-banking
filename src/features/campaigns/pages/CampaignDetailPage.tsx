import { type FC, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  XCircle,
  RotateCcw,
  Trash2,
  Loader2,
  Megaphone,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useSmsCampaign,
  useActivateSmsCampaign,
  useCloseSmsCampaign,
  useReactivateSmsCampaign,
  useDeleteSmsCampaign,
  useEmailCampaign,
  useActivateEmailCampaign,
  useCloseEmailCampaign,
  useReactivateEmailCampaign,
  useDeleteEmailCampaign,
} from "../hooks/useCampaigns";
import {
  STATUS_LABELS,
  TRIGGER_TYPE_LABELS,
  CAMPAIGN_TYPE_LABELS,
} from "../types/campaign";

const CampaignDetailPage: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const numericId = id ? Number(id) : undefined;
  const isSms = location.pathname.includes("/sms/");

  const smsQuery = useSmsCampaign(isSms ? numericId : undefined);
  const emailQuery = useEmailCampaign(!isSms ? numericId : undefined);
  const campaign = isSms ? smsQuery.data : emailQuery.data;
  const isLoading = isSms ? smsQuery.isLoading : emailQuery.isLoading;

  const activateSms = useActivateSmsCampaign();
  const closeSms = useCloseSmsCampaign();
  const reactivateSms = useReactivateSmsCampaign();
  const deleteSms = useDeleteSmsCampaign();
  const activateEmail = useActivateEmailCampaign();
  const closeEmail = useCloseEmailCampaign();
  const reactivateEmail = useReactivateEmailCampaign();
  const deleteEmail = useDeleteEmailCampaign();

  const [actionDialog, setActionDialog] = useState<"activate" | "close" | null>(null);
  const [actionDate, setActionDate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(false);

  const status = campaign?.status;

  const handleAction = async () => {
    if (!numericId || !actionDialog || !actionDate) return;
    const payload = {
      [actionDialog === "activate" ? "activationDate" : "closureDate"]: actionDate,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    };
    if (isSms) {
      if (actionDialog === "activate") await activateSms.mutateAsync({ id: numericId, payload });
      else await closeSms.mutateAsync({ id: numericId, payload });
    } else {
      if (actionDialog === "activate") await activateEmail.mutateAsync({ id: numericId, payload });
      else await closeEmail.mutateAsync({ id: numericId, payload });
    }
    setActionDialog(null);
    setActionDate("");
  };

  const handleReactivate = async () => {
    if (!numericId) return;
    const payload = { activationDate: new Date().toISOString().split("T")[0], locale: "en", dateFormat: "yyyy-MM-dd" };
    if (isSms) await reactivateSms.mutateAsync({ id: numericId, payload });
    else await reactivateEmail.mutateAsync({ id: numericId, payload });
  };

  const handleDelete = async () => {
    if (!numericId) return;
    if (isSms) await deleteSms.mutateAsync(numericId);
    else await deleteEmail.mutateAsync(numericId);
    navigate("/campaigns");
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 max-w-4xl m-auto">
        <PageHeader title="Campaign Not Found" description="The requested campaign does not exist." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={campaign.campaignName}
        description={`${isSms ? "SMS" : "Email"} campaign details and management`}
        actions={
          <Button variant="outline" onClick={() => navigate("/campaigns")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <StatusBadge status={STATUS_LABELS[status!]?.toLowerCase() ?? "unknown"} size="lg" />
        {status === 100 && (
          <Button size="sm" onClick={() => setActionDialog("activate")} className="bg-emerald-600 hover:bg-emerald-700">
            <Play className="mr-1 h-4 w-4" /> Activate
          </Button>
        )}
        {status === 300 && (
          <Button size="sm" variant="outline" onClick={() => setActionDialog("close")}>
            <XCircle className="mr-1 h-4 w-4" /> Close
          </Button>
        )}
        {status === 600 && (
          <>
            <Button size="sm" onClick={handleReactivate} className="bg-[#D32F2F] hover:bg-red-700">
              <RotateCcw className="mr-1 h-4 w-4" /> Reactivate
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(true)}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Campaign Type</p>
              <p className="text-sm font-medium">
                {isSms
                  ? CAMPAIGN_TYPE_LABELS[(campaign as any).campaignType] ?? (campaign as any).campaignType
                  : "Email"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Trigger Type</p>
              <p className="text-sm font-medium">
                {TRIGGER_TYPE_LABELS[(campaign as any).triggerType] ?? (campaign as any).triggerType ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <StatusBadge status={STATUS_LABELS[status!]?.toLowerCase() ?? "unknown"} />
            </div>
            {isSms ? (
              <>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Message</p>
                  <p className="text-sm">{(campaign as any).message ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Business Rule</p>
                  <p className="text-sm">{(campaign as any).reportName ?? (campaign as any).runReportId ?? "—"}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-gray-500">Subject</p>
                  <p className="text-sm">{(campaign as any).emailSubject ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Message</p>
                  <p className="text-sm">{(campaign as any).emailMessage ?? "—"}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === "activate" ? "Activate Campaign" : "Close Campaign"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="actionDate">
                {actionDialog === "activate" ? "Activation Date *" : "Closure Date *"}
              </Label>
              <Input
                id="actionDate"
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={!actionDate}
                className="bg-[#D32F2F] hover:bg-red-700"
              >
                {actionDialog === "activate" ? "Activate" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget}
        onOpenChange={setDeleteTarget}
        onConfirm={handleDelete}
        title="Delete Campaign"
        description={`Delete "${campaign.campaignName}"? This action cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
};

export default CampaignDetailPage;
