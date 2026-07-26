import { type FC } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import DocumentList from "../components/DocumentList";

const DocumentListPage: FC = () => {
  const { entityType, entityId } = useParams<{ entityType: string; entityId: string }>();

  if (!entityType || !entityId) {
    return (
      <div className="p-6">
        <ErrorState title="Invalid URL" message="Entity type and ID are required." />
      </div>
    );
  }

  const numericId = Number(entityId);
  if (isNaN(numericId)) {
    return (
      <div className="p-6">
        <ErrorState title="Invalid ID" message="Entity ID must be a number." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Documents"
        description={`Managing documents for ${entityType}/${entityId}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
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
