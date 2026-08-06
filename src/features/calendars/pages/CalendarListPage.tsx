import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarList } from "../components/CalendarList";

const CalendarListPage: React.FC = () => {
  const { t } = useTranslation();
  const { entityType, entityId } = useParams<{ entityType: string; entityId: string }>();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Calendars")}
        description={t("Manage calendars for {{entityType}} #{{entityId}}", { entityType: entityType ?? "...", entityId: entityId ?? "..." })}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("Calendars")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarList entityType={entityType ?? ""} entityId={Number(entityId ?? 0)} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarListPage;
