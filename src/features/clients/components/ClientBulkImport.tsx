import { type FC, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUploadClientTemplate } from "../hooks/useClientImages";

const ClientBulkImport: FC = () => {
  const { t } = useTranslation();
  const uploadMutation = useUploadClientTemplate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [legalFormType, setLegalFormType] = useState<"PERSON" | "ENTITY" | "">("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<number | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setFileError(null);
      setImportResult(null);
      if (!file) {
        setSelectedFile(null);
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "xls") {
        setFileError(t("clients.bulkImport.invalidFileType"));
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    },
    [t],
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        legalFormType: legalFormType || undefined,
      });
      setImportResult(result.importDocumentId);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // error handled by mutation state
    }
  }, [selectedFile, legalFormType, uploadMutation]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedFile(null);
    setLegalFormType("");
    setFileError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
        <Upload className="mr-1 h-4 w-4" />
        {t("clients.bulkImport.title")}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {t("clients.bulkImport.title")}
            </DialogTitle>
            <DialogDescription>{t("clients.bulkImport.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {importResult !== null ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{t("clients.bulkImport.uploadSuccess")}</span>
                </div>
                <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                  {t("clients.bulkImport.importDocumentId")}:{" "}
                  <span className="font-mono font-semibold">{importResult}</span>
                </p>
                <p className="mt-2 text-xs text-green-500 dark:text-green-400">
                  {t("clients.bulkImport.processingAsync")}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{t("clients.bulkImport.legalFormType")}</Label>
                  <Select value={legalFormType} onValueChange={(v) => setLegalFormType(v as "PERSON" | "ENTITY" | "")}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("clients.bulkImport.selectLegalForm")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERSON">{t("clients.bulkImport.person")}</SelectItem>
                      <SelectItem value="ENTITY">{t("clients.bulkImport.entity")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("clients.bulkImport.file")} *</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-[#D32F2F] hover:file:bg-red-100 cursor-pointer"
                  />
                  <p className="text-xs text-gray-400">{t("clients.bulkImport.acceptedFormat")}: .xls (MS Excel)</p>
                  {fileError && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {fileError}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeDialog}>
                    {t("clients.bulkImport.cancel")}
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="bg-[#D32F2F] hover:bg-red-700"
                  >
                    {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("clients.bulkImport.upload")}
                  </Button>
                </div>

                {uploadMutation.isError && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {uploadMutation.error instanceof Error
                      ? uploadMutation.error.message
                      : t("clients.bulkImport.uploadError")}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientBulkImport;
