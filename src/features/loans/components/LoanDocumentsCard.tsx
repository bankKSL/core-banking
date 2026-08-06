import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Upload, Loader2, Download, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useLoanDocuments, useUploadLoanDocument, useDeleteLoanDocument } from "../hooks/useLoanDocuments";
import { downloadLoanDocument } from "../api/loanDocuments";
import type { LoanDocument } from "../api/loanDocuments";

interface LoanDocumentsCardProps {
  loanId: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatFileType(mime: string): string {
  if (!mime) return "—";
  return mime.split("/").pop()?.toUpperCase() ?? mime;
}

const LoanDocumentsCard: FC<LoanDocumentsCardProps> = ({ loanId }) => {
  const { t } = useTranslation();
  const documentsQuery = useLoanDocuments(loanId);
  const documents = documentsQuery.data ?? [];

  const uploadMutation = useUploadLoanDocument();
  const deleteMutation = useDeleteLoanDocument();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LoanDocument | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");

  const isMutating = uploadMutation.isPending || deleteMutation.isPending;

  const openUpload = () => {
    setUploadFile(null);
    setUploadName("");
    setUploadDescription("");
    setUploadOpen(true);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) return;
    await uploadMutation.mutateAsync({
      loanId,
      file: uploadFile,
      name: uploadName.trim(),
      description: uploadDescription.trim() || undefined,
    });
    setUploadOpen(false);
  };

  const handleDownload = async (doc: LoanDocument) => {
    try {
      const blob = await downloadLoanDocument(loanId, doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName || doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({ loanId, docId: deleteTarget.id });
    setDeleteTarget(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            {t("Documents")} ({documents.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openUpload}>
            <Upload className="mr-1 h-4 w-4" />
            {t("Upload Document")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No documents attached to this loan.")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Description")}</TableHead>
                  <TableHead className="text-right">{t("Size")}</TableHead>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="text-sm font-medium">{doc.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{doc.description ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatFileSize(doc.size)}</TableCell>
                    <TableCell className="text-sm">{formatFileType(doc.type)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(doc)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload document dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Upload Document")}</DialogTitle>
            <DialogDescription>{t("Attach a document to this loan.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="uploadFile">
                {t("File")} *
              </label>
              <Input
                id="uploadFile"
                type="file"
                disabled={isMutating}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setUploadFile(file);
                  if (file && !uploadName) setUploadName(file.name);
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="uploadName">
                {t("Name")} *
              </label>
              <Input
                id="uploadName"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                disabled={isMutating}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium" htmlFor="uploadDescription">
                {t("Description")}
              </label>
              <Input
                id="uploadDescription"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                disabled={isMutating}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleUpload} disabled={isMutating || !uploadFile || !uploadName.trim()}>
                {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Upload")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete document confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("Delete Document")}
        description={`${t("Remove")} ${deleteTarget?.name} ${t("from this loan? This cannot be undone.")}`}
        confirmLabel={t("Delete")}
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default LoanDocumentsCard;
export type { LoanDocumentsCardProps };
