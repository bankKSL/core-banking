import React, { useMemo, useState } from "react";
import { Search, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { campaigns } from "@/mock/data";
import type { CampaignAction, ActionType, Campaign } from "@/types";

interface FlatAction extends CampaignAction {
  campaignId: string;
  campaignName: string;
  campaignStatus: Campaign["status"];
}

const actionColorMapSpec: Record<ActionType, { bg: string; text: string; label: string }> = {
  set_interest_rate: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-400",
    label: "Set Interest Rate",
  },
  apply_cashback: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-800 dark:text-emerald-400",
    label: "Apply Cashback",
  },
  waive_fee: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-400",
    label: "Waive Fee",
  },
  add_reward_points: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-800 dark:text-purple-400",
    label: "Add Reward Points",
  },
  apply_penalty: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-400",
    label: "Apply Penalty",
  },
  adjust_limit: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-800 dark:text-indigo-400",
    label: "Adjust Limit",
  },
};

const ActionsPage: React.FC = () => {
  const [search, setSearch] = useState("");

  const allActions: FlatAction[] = useMemo(() => {
    return campaigns.flatMap((c) =>
      c.actions.map((action) => ({
        ...action,
        campaignId: c.id,
        campaignName: c.name,
        campaignStatus: c.status,
      })),
    );
  }, []);

  const filteredActions = useMemo(() => {
    const q = search.toLowerCase();
    return allActions.filter(
      (a) =>
        a.campaignName.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.target.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.value.toLowerCase().includes(q),
    );
  }, [allActions, search]);

  const actionColumns: ColumnDef<FlatAction>[] = [
    {
      key: "campaignName",
      header: "Campaign Name",
      cell: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.campaignName}</span>,
    },
    {
      key: "type",
      header: "Action Type",
      cell: (row) => {
        const spec = actionColorMapSpec[row.type];
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${spec.bg} ${spec.text}`}
          >
            {spec.label}
          </span>
        );
      },
    },
    {
      key: "target",
      header: "Target",
      cell: (row) => <span className="text-sm">{row.target}</span>,
    },
    {
      key: "value",
      header: "Value",
      cell: (row) => (
        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono font-semibold">
          {row.value}
        </code>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 max-w-75 truncate block">{row.description}</span>
      ),
    },
    {
      key: "campaignStatus",
      header: "Campaign Status",
      cell: (row) => <StatusBadge status={row.campaignStatus} size="sm" />,
    },
  ];

  const stats = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    allActions.forEach((a) => {
      typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    });
    return { total: allActions.length, typeCounts };
  }, [allActions]);

  return (
    <div className="space-y-6">
      <PageHeader title="Actions" description="Campaign Actions Configuration" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(actionColorMapSpec).map(([type, spec]) => (
          <Card key={type} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <p className={`text-xs font-medium ${spec.text} mb-1`}>{spec.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.typeCounts[type] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#D32F2F]" />
            All Actions ({filteredActions.length})
          </CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search actions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={actionColumns}
            data={filteredActions}
            emptyState={{
              title: "No actions found",
              message: search ? "Try adjusting your search query." : "No campaign actions have been configured yet.",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionsPage;
