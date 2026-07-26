import { type FC } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import NoteList from "../components/NoteList";

const NoteListPage: FC = () => {
  const { resourceType, resourceId } = useParams<{ resourceType: string; resourceId: string }>();

  if (!resourceType || !resourceId) {
    return (
      <div className="p-6">
        <ErrorState title="Invalid URL" message="Resource type and ID are required." />
      </div>
    );
  }

  const numericId = Number(resourceId);
  if (isNaN(numericId)) {
    return (
      <div className="p-6">
        <ErrorState title="Invalid ID" message="Resource ID must be a number." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Notes"
        description={`Managing notes for ${resourceType}/${resourceId}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        }
      />
      <div className="mt-6">
        <NoteList resourceType={resourceType} resourceId={numericId} />
      </div>
    </div>
  );
};

export default NoteListPage;
