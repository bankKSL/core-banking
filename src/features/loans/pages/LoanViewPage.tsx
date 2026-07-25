import { type FC, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLoan } from "../hooks/useLoan";
import { LOAN_STATUS_CONFIG, LOAN_STATUS_ID_MAP } from "../constants/status";
import LoanDetails from "../components/LoanDetails";
import LoanCommands from "../components/LoanCommands";
import LoanTransactionsTable from "../components/LoanTransactionsTable";
import LoanScheduleTable from "../components/LoanScheduleTable";
import LoanChargesCard from "../components/LoanChargesCard";
import LoanCollateralCard from "../components/LoanCollateralCard";
import LoanGuarantorsCard from "../components/LoanGuarantorsCard";
import LoanDelinquencyCard from "../components/LoanDelinquencyCard";

const LoanViewPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: loan, isLoading, isError, refetch, isRefetching } = useLoan(id);
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

  const currencyCode = loan.summary?.currency?.code ?? "USD";
  const schedulePeriods = loan.repaymentSchedule?.periods ?? [];
  const transactions = loan.transactions ?? [];
  const charges = loan.charges ?? [];
  const collateral = loan.collateral ?? [];
  const guarantors = loan.guarantors ?? [];

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
          <TabsTrigger value="charges">Charges ({charges.length})</TabsTrigger>
          <TabsTrigger value="collateral">Collateral ({collateral.length})</TabsTrigger>
          <TabsTrigger value="guarantors">Guarantors ({guarantors.length})</TabsTrigger>
          <TabsTrigger value="delinquency">Delinquency</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <LoanDetails loan={loan} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <LoanTransactionsTable transactions={transactions} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <LoanScheduleTable periods={schedulePeriods} currencyCode={currencyCode} />
        </TabsContent>

        <TabsContent value="charges" className="mt-4">
          <LoanChargesCard loanId={loan.id} currencyCode={currencyCode} charges={charges} />
        </TabsContent>

        <TabsContent value="collateral" className="mt-4">
          <LoanCollateralCard loanId={loan.id} currencyCode={currencyCode} collateral={collateral} />
        </TabsContent>

        <TabsContent value="guarantors" className="mt-4">
          <LoanGuarantorsCard loanId={loan.id} currencyCode={currencyCode} guarantors={guarantors} />
        </TabsContent>

        <TabsContent value="delinquency" className="mt-4">
          <LoanDelinquencyCard loan={loan} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoanViewPage;
