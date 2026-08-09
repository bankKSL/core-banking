import { type FC, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Download, Loader2, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUploadStaffTemplate } from "../hooks/useStaff";
import { downloadStaffTemplate } from "../api/staff";

const StaffBulkImport: FC = () => {
  const { t } = useTranslation();
  const uploadMutation = useUploadStaffTemplate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

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
      if (ext !== "xls" && ext !== "xlsx") {
        setFileError(t("Invalid file type. Please select an Excel file (.xls or .xlsx)."));
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    },
    [t],
  );

  const handleDownloadTemplate = useCallback(async () => {
    setDownloading(true);
    try {
      const blob = await downloadStaffTemplate(undefined, "dd MMMM yyyy");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "staff_import_template.xls";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setFileError(t("Failed to download template. Please try again."));
    } finally {
      setDownloading(false);
    }
  }, [t]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        locale: "en",
        dateFormat: "dd MMMM yyyy",
      });
      setImportResult(result);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // error handled by mutation state
    }
  }, [selectedFile, uploadMutation]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedFile(null);
    setFileError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
        <Upload className="mr-1 h-4 w-4" />
        {t("Bulk Import")}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {t("Staff Bulk Import")}
            </DialogTitle>
            <DialogDescription>
              {t("Download the template, fill in staff data, and upload the file to import staff members in bulk.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {importResult !== null ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{t("Import completed successfully")}</span>
                </div>
                <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                  {t("Resource ID")}: <span className="font-mono font-semibold">{importResult}</span>
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    disabled={downloading}
                    className="w-full"
                  >
                    {downloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {t("Download Import Template")}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t("File")} *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-[#D32F2F] hover:file:bg-red-100 cursor-pointer"
                  />
                  <p className="text-xs text-gray-400">
                    {t("Accepted format")}: .xls, .xlsx (MS Excel)
                  </p>
                  {fileError && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {fileError}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeDialog}>
                    {t("Cancel")}
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="bg-[#D32F2F] hover:bg-red-700"
                  >
                    {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("Upload")}
                  </Button>
                </div>

                {uploadMutation.isError && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {uploadMutation.error instanceof Error
                      ? uploadMutation.error.message
                      : t("Upload failed. Please check the file format.")}
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

export default StaffBulkImport;
