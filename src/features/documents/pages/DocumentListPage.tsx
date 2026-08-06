import { type FC } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import DocumentList from "../components/DocumentList";

const DocumentListPage: FC = () => {
  const { t } = useTranslation();
  const { entityType, entityId } = useParams<{ entityType: string; entityId: string }>();

  if (!entityType || !entityId) {
    return (
      <div className="p-6">
        <ErrorState title={t("Invalid URL")} message={t("Entity type and ID are required.")} />
      </div>
    );
  }

  const numericId = Number(entityId);
  if (isNaN(numericId)) {
    return (
      <div className="p-6">
        <ErrorState title={t("Invalid ID")} message={t("Entity ID must be a number.")} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title={t("Documents")}
        description={`${t("Managing documents for")} ${entityType}/${entityId}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("Back")}
          </Button>
        }
      />
      <div className="mt-6">
        <DocumentList entityType={entityType} entityId={numericId} />
      </div>
    </div>
  );
};

export default DocumentListPage;
