import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Megaphone, Mail, Eye, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSmsCampaigns,
  useDeleteSmsCampaign,
  useEmailCampaigns,
  useDeleteEmailCampaign,
} from "../hooks/useCampaigns";
import {
  STATUS_LABELS,
  TRIGGER_TYPE_LABELS,
  CAMPAIGN_TYPE_LABELS,
  type SmsCampaign,
  type EmailCampaign,
} from "../types/campaign";

const SmsCampaignTable: FC<{ onView: (id: number) => void }> = ({ onView }) => {
  const { data: campaigns = [], isLoading } = useSmsCampaigns();
  const deleteMutation = useDeleteSmsCampaign();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SmsCampaign | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => c.campaignName.toLowerCase().includes(q) || c.reportName?.toLowerCase().includes(q));
  }, [campaigns, search]);

  const columns: ColumnDef<SmsCampaign>[] = [
    {
      key: "campaignName",
      header: "Name",
      cell: (r) => <span className="font-medium">{r.campaignName}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={STATUS_LABELS[r.status]?.toLowerCase() ?? "unknown"} />,
    },
    {
      key: "triggerType",
      header: "Trigger",
      cell: (r) => <Badge>{TRIGGER_TYPE_LABELS[r.triggerType] ?? r.triggerType}</Badge>,
    },
    {
      key: "campaignType",
      header: "Type",
      cell: (r) => CAMPAIGN_TYPE_LABELS[r.campaignType] ?? r.campaignType,
    },
    {
      key: "message",
      header: "Message",
      cell: (r) => <span className="text-xs max-w-50 truncate block">{r.message}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => onView(r.id)}>
            <Eye className="h-4 w-4" />
          </Button>
          {r.status === 600 && (
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search SMS campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={{ icon: <Megaphone className="h-8 w-8 text-gray-300" />, message: "No SMS campaigns found." }}
          minWidth={700}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Delete Campaign"
        description={`Delete "${deleteTarget?.campaignName}"? Campaign must be closed.`}
        variant="destructive"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

const EmailCampaignTable: FC<{ onView: (id: number) => void }> = ({ onView }) => {
  const { data: campaigns = [], isLoading } = useEmailCampaigns();
  const deleteMutation = useDeleteEmailCampaign();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EmailCampaign | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => c.campaignName.toLowerCase().includes(q));
  }, [campaigns, search]);

  const columns: ColumnDef<EmailCampaign>[] = [
    {
      key: "campaignName",
      header: "Name",
      cell: (r) => <span className="font-medium">{r.campaignName}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={STATUS_LABELS[r.status]?.toLowerCase() ?? "unknown"} />,
    },
    {
      key: "emailSubject",
      header: "Subject",
      cell: (r) => <span className="text-xs max-w-50 truncate block">{r.emailSubject}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => onView(r.id)}>
            <Eye className="h-4 w-4" />
          </Button>
          {r.status === 600 && (
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search email campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={{ icon: <Mail className="h-8 w-8 text-gray-300" />, message: "No email campaigns found." }}
          minWidth={700}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Delete Campaign"
        description={`Delete "${deleteTarget?.campaignName}"? Campaign must be closed.`}
        variant="destructive"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

const CampaignListPage: FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("sms");

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Campaigns"
        description="Manage SMS and email marketing campaigns"
        actions={
          <Button
            onClick={() => navigate(tab === "sms" ? "/campaigns/sms/new" : "/campaigns/email/new")}
            className="bg-[#D32F2F] hover:bg-red-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="px-6 pt-4">
              <TabsList>
                <TabsTrigger value="sms" className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  SMS Campaigns
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Campaigns
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="p-6">
              <TabsContent value="sms">
                <SmsCampaignTable onView={(id) => navigate(`/campaigns/sms/${id}`)} />
              </TabsContent>
              <TabsContent value="email">
                <EmailCampaignTable onView={(id) => navigate(`/campaigns/email/${id}`)} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignListPage;
