export function sanitizeCsvValue(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
    return `'${str}`;
  }
  return str;
}

export function exportToCsv(
  headers: string[],
  rows: Array<Array<string | number | null>>,
  fileName: string,
  delimiter: string = ",",
): void {
  const sanitizedHeaders = headers.map(sanitizeCsvValue);
  const csvRows = rows.map((row) =>
    row.map((cell) => sanitizeCsvValue(cell)).join(delimiter),
  );
  const csvContent = [sanitizedHeaders.join(delimiter), ...csvRows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, fileName);
}

export function exportToXls(
  headers: string[],
  rows: Array<Array<string | number | null>>,
  fileName: string,
): void {
  const sanitizedHeaders = headers.map(sanitizeCsvValue);
  const csvRows = rows.map((row) =>
    row.map((cell) => sanitizeCsvValue(cell)).join("\t"),
  );
  const tsvContent = [sanitizedHeaders.join("\t"), ...csvRows].join("\r\n");

  const blob = new Blob([tsvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
  downloadBlob(blob, fileName);
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
