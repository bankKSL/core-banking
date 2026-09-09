import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useRunPentahoReport } from "../hooks/useReports";

interface PentahoOutputProps {
  dataObject: {
    formData: Record<string, string>;
    report: { name: string; type: string };
    decimalChoice: string;
  };
}

export function PentahoOutput({ dataObject }: PentahoOutputProps) {
  const { t } = useTranslation();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const pentahoMutation = useRunPentahoReport();
  const blobUrlRef = useRef<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    pentahoMutation.mutate(
      {
        reportName: dataObject.report.name,
        params: dataObject.formData,
        locale: "en",
        dateFormat: "dd MMMM yyyy",
      },
      {
        onSuccess: (blob) => {
          const outputType = dataObject.formData["output-type"];
          const mimeType = outputType === "PDF" ? "application/pdf" : "application/octet-stream";
          const typedBlob = new Blob([blob], { type: mimeType });
          const url = URL.createObjectURL(typedBlob);
          blobUrlRef.current = url;
          setPdfUrl(url);
        },
      },
    );

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [dataObject.formData, dataObject.report.name, pentahoMutation]);

  if (pentahoMutation.isPending) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#D32F2F]" />
        <span className="ml-3 text-gray-600">{t("Loading report...")}</span>
      </div>
    );
  }

  if (pentahoMutation.isError) {
    return (
      <div className="text-center py-16">
        <div className="text-red-500">{t("Failed to load report")}</div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t("No report content available")}
      </div>
    );
  }

  return (
    <div className="relative">
      <iframe
        src={pdfUrl}
        className="w-full border rounded-lg"
        style={{ height: "70vh" }}
        title="Pentaho Report Output"
      />
    </div>
  );
}
