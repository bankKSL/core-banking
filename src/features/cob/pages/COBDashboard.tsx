import { type FC } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Activity, ListOrdered, Play, Lock, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobNames, useOldestCOBClosed, useIsCatchUpRunning, useLockedLoans } from "../hooks/useCob";

const COBDashboard: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: jobNames } = useJobNames();
  const { data: oldestCob, isLoading: oldestLoading } = useOldestCOBClosed();
  const { data: catchUpStatus, isLoading: catchUpLoading } = useIsCatchUpRunning();

  const quickActions = [
    {
      label: t("Business Steps"),
      description: t("Configure business step order for COB jobs"),
      path: "/cob/steps",
      icon: ListOrdered,
      color: "text-blue-600",
    },
    {
      label: t("Catch-Up"),
      description: t("Trigger and monitor COB catch-up processing"),
      path: "/cob/catch-up",
      icon: Play,
      color: "text-emerald-600",
    },
    {
      label: t("Locked Loans"),
      description: t("View loans locked during COB processing"),
      path: "/cob/locked-loans",
      icon: Lock,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Close of Business")}
        description={t("Daily end-of-day batch processing for loan accounts — configure business steps, trigger catch-up, and monitor locks")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t("Configured Jobs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{jobNames?.businessJobs?.length ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">{jobNames?.businessJobs?.join(", ") || t("No jobs configured")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("Oldest COB Date")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {oldestLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : oldestCob ? (
              <div>
                <p className="text-sm font-medium">{oldestCob.cobBusinessDate}</p>
                <p className="text-xs text-gray-500 mt-1">{oldestCob.loanIds.length} {t("loan(s) behind")}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {t("All caught up")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {catchUpLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : catchUpStatus?.isCatchUpRunning ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
              {t("Catch-Up Status")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {catchUpLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : catchUpStatus?.isCatchUpRunning ? (
              <div>
                <Badge variant="warning" className="mb-1">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  {t("Running")}
                </Badge>
                {catchUpStatus.processingDate && (
                  <p className="text-xs text-gray-500 mt-1">{t("Processing")}: {catchUpStatus.processingDate}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {t("Idle")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Quick Actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#D32F2F]/30 hover:shadow-sm transition-all text-left dark:border-gray-700 dark:hover:border-[#D32F2F]/50"
                >
                  <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${action.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default COBDashboard;
