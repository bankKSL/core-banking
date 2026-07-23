import { type FC, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, DollarSign, Landmark } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLoan } from "../hooks/useLoan";
import { useRepaymentSchedule } from "../hooks/useRepaymentSchedule";
import { LOAN_STATUS_CONFIG, LOAN_STATUS_ID_MAP } from "../constants/status";
import LoanDetails from "../components/LoanDetails";
import LoanCommands from "../components/LoanCommands";
import LoanTransactionsTable from "../components/LoanTransactionsTable";

const formatCurrency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);

const LoanViewPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: loan, isLoading, isError, refetch, isRefetching } = useLoan(id);
  const { data: scheduleData } = useRepaymentSchedule(id ? Number(id) : undefined);
  const [activeTab, setActiveTab] = useState("details");

  const handleSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !loan) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load loan"
          message="Could not load loan details. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const statusCode = loan.status?.code ?? LOAN_STATUS_ID_MAP[loan.status?.id ?? -1] ?? "";
  const statusCfg = LOAN_STATUS_CONFIG[statusCode];

  const schedulePeriods = scheduleData?.repaymentSchedule ?? loan.repaymentSchedule ?? [];
  const transactions = loan.transactions ?? [];

  return (
    <div className="p-6 max-w-6xl m-auto space-y-6">
      <PageHeader
        title={`Loan ${loan.accountNo ?? `#${loan.id}`}`}
        description={`${loan.loanProductName} — ${loan.clientName ?? `Client #${loan.clientId}`}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant={
                statusCfg?.variant === "success"
                  ? "success"
                  : statusCfg?.variant === "error"
                    ? "error"
                    : statusCfg?.variant === "warning"
                      ? "warning"
                      : "default"
              }
            >
              {statusCfg?.label ?? statusCode}
            </Badge>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" onClick={() => navigate("/loans")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      <LoanCommands loan={loan} onSuccess={handleSuccess} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">General</TabsTrigger>
          <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
          <TabsTrigger value="schedule">Schedule ({schedulePeriods.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0">
          <LoanDetails loan={loan} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-0">
          <LoanTransactionsTable transactions={transactions} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-0">
          {schedulePeriods.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800">
              No repayment schedule available.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Due Date</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Principal</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Interest</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Total Due</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Paid</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Outstanding</th>
                  </tr>
                </thead>
                {/* <tbody>
                                    {schedulePeriods?.map((p: any, i: number) => (
                                        <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 font-mono text-xs">{p.period}</td>
                                            <td className="px-4 py-3">{new Date(p.dueDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(p.principalOriginalDue)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-amber-600">{formatCurrency(p.interestOriginalDue)}</td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(p.totalDueForPeriod)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-600">{formatCurrency(p.totalPaidForPeriod)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-red-600">{formatCurrency(p.totalOutstandingForPeriod)}</td>
                                        </tr>
                                    ))}
                                </tbody> */}
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoanViewPage;
