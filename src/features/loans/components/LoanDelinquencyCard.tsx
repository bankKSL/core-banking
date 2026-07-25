import type { FC } from "react";
import { AlertCircle, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Loan } from "../types/loan";
import { useDelinquencyTags } from "../hooks/useDelinquencyTags";
import { formatFineractDate, formatMoney } from "../utils/format";

interface LoanDelinquencyCardProps {
  loan: Loan;
}

const LoanDelinquencyCard: FC<LoanDelinquencyCardProps> = ({ loan }) => {
  const tagsQuery = useDelinquencyTags(loan.id);
  const tags = tagsQuery.data ?? [];

  const delinquent = loan.delinquent;
  const range = loan.delinquencyRange;
  const currencyCode = loan.summary?.currency?.code ?? "USD";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            Delinquency Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">In Arrears</span>
            <Badge variant={loan.inArrears ? "error" : "success"} size="sm">
              {loan.inArrears ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">NPA</span>
            <Badge variant={loan.isNPA ? "error" : "success"} size="sm">
              {loan.isNPA ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Days Delinquent</span>
            <span className="font-mono">{delinquent?.delinquentDays ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Delinquent Amount</span>
            <span className="font-mono text-red-600">{formatMoney(delinquent?.delinquentAmount ?? 0, currencyCode)}</span>
          </div>
          {range && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Delinquency Range</span>
              <Badge variant="warning" size="sm">
                {range.classification}
              </Badge>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Last Repayment</span>
            <span>{formatFineractDate(delinquent?.lastRepaymentDate ?? loan.summary?.lastRepaymentDate)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-400" />
            Delinquency Tag History ({tags.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tagsQuery.isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 animate-pulse rounded" />
              ))}
            </div>
          ) : tags.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">No delinquency tags recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classification</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead>Lifted On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Badge variant="warning" size="sm">
                        {tag.classification ?? `#${tag.tagId ?? tag.id}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatFineractDate(tag.addedOnDate)}</TableCell>
                    <TableCell className="text-sm">{tag.liftedOnDate ? formatFineractDate(tag.liftedOnDate) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanDelinquencyCard;
export type { LoanDelinquencyCardProps };
