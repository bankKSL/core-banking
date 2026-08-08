import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Database } from "lucide-react";
import { useDatatables, useDatatableEntries } from "@/features/datatables/hooks/useDatatables";

interface LoanDatatablesCardProps {
  loanId: number;
}

const LoanDatatablesCard: FC<LoanDatatablesCardProps> = ({ loanId }) => {
  const { t } = useTranslation();
  const { data: datatables = [], isLoading: dtLoading } = useDatatables("m_loan");

  if (dtLoading) return <Skeleton className="h-32 w-full" />;

  if (datatables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-[#D32F2F]" />
            {t("Data Tables")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{t("No data tables configured for loans.")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {datatables.map((dt: any) => (
        <DatatableSection key={dt.registeredTableName ?? dt.name} datatable={dt} entityId={loanId} />
      ))}
    </div>
  );
};

const DatatableSection: FC<{ datatable: any; entityId: number }> = ({ datatable, entityId }) => {
  const { t } = useTranslation();
  const tableName = datatable.registeredTableName ?? datatable.name;
  const { data: entries, isLoading } = useDatatableEntries(tableName, entityId, true);

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  const result = entries as unknown as { columnHeaders?: any[]; data?: any[] } | undefined;
  const columnHeaders = result?.columnHeaders ?? [];
  const dataRows = result?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-5 w-5 text-[#D32F2F]" />
          {datatable.name ?? tableName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dataRows.length === 0 ? (
          <p className="text-sm text-gray-500">{t("No entries.")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnHeaders.map((col: any, i: number) => (
                    <TableHead key={i}>{col.columnName}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataRows.map((row: any, i: number) => (
                  <TableRow key={i}>
                    {(row.row ?? []).map((cell: any, j: number) => (
                      <TableCell key={j} className="text-sm">{String(cell ?? "—")}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoanDatatablesCard;
