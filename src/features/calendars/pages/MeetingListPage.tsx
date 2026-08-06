import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingList } from "../components/MeetingList";

const MeetingListPage: React.FC = () => {
  const { t } = useTranslation();
  const { entityType, entityId } = useParams<{ entityType: string; entityId: string }>();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Meetings")}
        description={t("Manage meetings for {{entityType}} #{{entityId}}", { entityType: entityType ?? "...", entityId: entityId ?? "..." })}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("Meetings")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingList entityType={entityType ?? ""} entityId={Number(entityId ?? 0)} />
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingListPage;
