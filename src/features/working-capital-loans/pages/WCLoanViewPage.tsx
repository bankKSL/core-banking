import { type FC, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, RefreshCw, CheckCircle2, DollarSign, Pause, CalendarClock, TrendingUp, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  useWCLoan,
  useApproveWCLoan,
  useDisburseWCLoan,
  useWCRepayment,
  useAmortizationSchedule,
  useDelinquencyRangeSchedule,
  useWCDelinquencyTags,
  useWCLoanTransactions,
  useCreateDelinquencyAction,
  useUpdatePaymentRate,
  useRateChangeHistory,
  WC_LOAN_STATUS_CONFIG,
  WC_LOAN_CODE_TO_KEY,
  WC_LOAN_STATUS_ID_MAP,
} from "../index";
import { formatDate, formatMoney } from "../utils/format";

const today = () => new Date().toISOString().split("T")[0];

const WCLoanViewPage: FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess } = useToast();
  const { data: loan, isLoading, isError, refetch, isRefetching } = useWCLoan(id);
  const [activeTab, setActiveTab] = useState("details");

  const approveMut = useApproveWCLoan();
  const disburseMut = useDisburseWCLoan();
  const repaymentMut = useWCRepayment();
  const pauseMut = useCreateDelinquencyAction();
  const rescheduleMut = useCreateDelinquencyAction();
  const rateChangeMut = useUpdatePaymentRate();

  const { data: amortSchedule = [] } = useAmortizationSchedule(id ? Number(id) : undefined);
  const { data: delinqSchedule = [] } = useDelinquencyRangeSchedule(id ? Number(id) : undefined);
  const { data: delinqTags = [] } = useWCDelinquencyTags(id ? Number(id) : undefined);
  const { data: transactions = [] } = useWCLoanTransactions(id ? Number(id) : undefined);
  const { data: rateChanges = [] } = useRateChangeHistory(id ? Number(id) : undefined);

  const [approveOpen, setApproveOpen] = useState(false);
  const [disburseOpen, setDisburseOpen] = useState(false);
  const [repayOpen, setRepayOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rateChangeOpen, setRateChangeOpen] = useState(false);

  const [approveDate, setApproveDate] = useState(today());
  const [approveAmount, setApproveAmount] = useState("");
  const [disburseDate, setDisburseDate] = useState(today());
  const [disburseAmount, setDisburseAmount] = useState("");
  const [repayDate, setRepayDate] = useState(today());
  const [repayAmount, setRepayAmount] = useState("");
  const [pauseStart, setPauseStart] = useState(today());
  const [pauseEnd, setPauseEnd] = useState("");
  const [rescheduleMinPayment, setRescheduleMinPayment] = useState("");
  const [rescheduleFrequency, setRescheduleFrequency] = useState("");
  const [newRate, setNewRate] = useState("");
  const [rateNote, setRateNote] = useState("");

  const handleSuccess = useCallback(() => { refetch(); }, [refetch]);

  if (isLoading) {
    return (
      <div className="max-w-6xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError || !loan) {
    return (
      <div className="p-6">
        <ErrorState title={t("Failed to load loan")} message={t("Could not load loan details.")} onRetry={() => refetch()} />
      </div>
    );
  }

  const rawCode = loan.status?.code;
  const statusCode = (rawCode && WC_LOAN_CODE_TO_KEY[rawCode]) ?? rawCode ?? WC_LOAN_STATUS_ID_MAP[loan.status?.id ?? -1] ?? "";
  const statusCfg = WC_LOAN_STATUS_CONFIG[statusCode];
  const currencyCode = loan.summary?.currency?.code ?? "USD";
  const statusId = loan.status?.id;
  const isPending = statusId === 100;
  const isApproved = statusId === 200;
  const isActive = statusId === 300;

  const isMutating = approveMut.isPending || disburseMut.isPending || repaymentMut.isPending || pauseMut.isPending || rescheduleMut.isPending || rateChangeMut.isPending;

  const handleApprove = async () => {
    await approveMut.mutateAsync({ loanId: Number(id), payload: { approvedOnDate: approveDate, approvedLoanAmount: approveAmount ? Number(approveAmount) : loan.principal, expectedDisbursementDate: approveDate, dateFormat: "yyyy-MM-dd", locale: "en" } });
    toastSuccess(t("Loan approved"));
    setApproveOpen(false);
    handleSuccess();
  };

  const handleDisburse = async () => {
    await disburseMut.mutateAsync({ loanId: Number(id), payload: { actualDisbursementDate: disburseDate, transactionAmount: disburseAmount ? Number(disburseAmount) : loan.approvedPrincipal ?? loan.principal, dateFormat: "yyyy-MM-dd", locale: "en" } });
    toastSuccess(t("Loan disbursed"));
    setDisburseOpen(false);
    handleSuccess();
  };

  const handleRepay = async () => {
    await repaymentMut.mutateAsync({ loanId: Number(id), payload: { transactionDate: repayDate, transactionAmount: Number(repayAmount), dateFormat: "yyyy-MM-dd", locale: "en" } });
    toastSuccess(t("Repayment recorded"));
    setRepayOpen(false);
    handleSuccess();
  };

  const handlePause = async () => {
    await pauseMut.mutateAsync({ loanId: Number(id), payload: { action: "pause", startDate: pauseStart, endDate: pauseEnd, dateFormat: "yyyy-MM-dd", locale: "en" } });
    toastSuccess(t("Delinquency tracking paused"));
    setPauseOpen(false);
    handleSuccess();
  };

  const handleReschedule = async () => {
    await rescheduleMut.mutateAsync({ loanId: Number(id), payload: { action: "reschedule", minimumPayment: rescheduleMinPayment ? Number(rescheduleMinPayment) : undefined, minimumPaymentType: "FLAT", frequency: rescheduleFrequency ? Number(rescheduleFrequency) : undefined, frequencyType: "DAYS", locale: "en" } });
    toastSuccess(t("Payment rescheduled"));
    setRescheduleOpen(false);
    handleSuccess();
  };

  const handleRateChange = async () => {
    await rateChangeMut.mutateAsync({ loanId: Number(id), payload: { periodPaymentRate: Number(newRate), note: rateNote || undefined, locale: "en" } });
    toastSuccess(t("Payment rate updated"));
    setRateChangeOpen(false);
    handleSuccess();
  };

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={`${t("Working Capital Loan")} ${loan.accountNo ?? `#${loan.id}`}`}
        description={`${loan.loanProductName} — ${loan.clientName ?? `Client #${loan.clientId}`}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusCfg?.variant === "success" ? "success" : statusCfg?.variant === "error" ? "error" : statusCfg?.variant === "warning" ? "warning" : "default"}>
              {statusCfg?.label ?? statusCode}
            </Badge>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" onClick={() => navigate("/working-capital-loans")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {isPending && (
          <Button variant="outline" size="sm" onClick={() => { setApproveAmount(String(loan.principal)); setApproveOpen(true); }} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <CheckCircle2 className="mr-1 h-4 w-4" /> {t("Approve")}
          </Button>
        )}
        {isApproved && (
          <Button variant="outline" size="sm" onClick={() => { setDisburseAmount(String(loan.approvedPrincipal ?? loan.principal)); setDisburseOpen(true); }} className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <DollarSign className="mr-1 h-4 w-4" /> {t("Disburse")}
          </Button>
        )}
        {isActive && (
          <>
            <Button variant="outline" size="sm" onClick={() => setRepayOpen(true)} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              <DollarSign className="mr-1 h-4 w-4" /> {t("Repayment")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPauseOpen(true)}>
              <Pause className="mr-1 h-4 w-4" /> {t("Pause Delinquency")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(true)}>
              <CalendarClock className="mr-1 h-4 w-4" /> {t("Reschedule")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRateChangeOpen(true)}>
              <TrendingUp className="mr-1 h-4 w-4" /> {t("Change Rate")}
            </Button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{t("Principal")}</p>
            <p className="text-2xl font-bold font-mono">{formatMoney(loan.principal, currencyCode)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{t("Outstanding")}</p>
            <p className="text-2xl font-bold font-mono">{formatMoney(loan.summary?.principalOutstanding ?? loan.totalOutstanding ?? 0, currencyCode)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{t("Total Paid")}</p>
            <p className="text-2xl font-bold font-mono">{formatMoney(loan.summary?.principalPaid ?? loan.totalPrincipalPaid ?? 0, currencyCode)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">{t("Delinquent Days")}</p>
            <p className="text-2xl font-bold font-mono">{loan.delinquent?.delinquentDays ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="details">{t("General")}</TabsTrigger>
          <TabsTrigger value="amortization">{t("Amortization")} ({amortSchedule.length})</TabsTrigger>
          <TabsTrigger value="delinquency">{t("Delinquency Schedule")} ({delinqSchedule.length})</TabsTrigger>
          <TabsTrigger value="transactions">{t("Transactions")} ({transactions.length})</TabsTrigger>
          <TabsTrigger value="tags">{t("Delinquency Tags")} ({delinqTags.length})</TabsTrigger>
          <TabsTrigger value="rates">{t("Rate Changes")} ({rateChanges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("Loan Information")}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Account No")}</span><span className="font-mono">{loan.accountNo ?? "—"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">{t("External ID")}</span><span>{loan.externalId ?? "—"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Product")}</span><span>{loan.loanProductName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Client")}</span><span>{loan.clientName ?? `#${loan.clientId}`}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Submitted")}</span><span>{formatDate(loan.timeline?.submittedOnDate)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Disbursed")}</span><span>{formatDate(loan.timeline?.actualDisbursementDate)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Approved")}</span><span>{formatMoney(loan.approvedPrincipal, currencyCode)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Grace Days")}</span><span>{loan.delinquencyGraceDays ?? "—"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Delinquency Start")}</span><span>{loan.delinquencyStartType ?? "—"}</span></div>
              {loan.delinquencyRange && (
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Delinquency Range")}</span><Badge variant="warning" size="sm">{loan.delinquencyRange.classification}</Badge></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amortization" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("EIR Amortization Schedule")}</CardTitle></CardHeader>
            <CardContent className="p-0">
              {amortSchedule.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No schedule data available.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{t("From")}</TableHead>
                        <TableHead>{t("Due")}</TableHead>
                        <TableHead>{t("Expected")}</TableHead>
                        <TableHead>{t("Paid")}</TableHead>
                        <TableHead>{t("Outstanding")}</TableHead>
                        <TableHead>{t("EIR")}</TableHead>
                        <TableHead>{t("Status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {amortSchedule.map((entry) => (
                        <TableRow key={entry.period}>
                          <TableCell>{entry.period}</TableCell>
                          <TableCell>{formatDate(entry.fromDate)}</TableCell>
                          <TableCell>{formatDate(entry.dueDate)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(entry.expectedAmount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(entry.paidAmount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(entry.outstandingAmount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">{entry.eir != null ? `${entry.eir.toFixed(4)}%` : "—"}</TableCell>
                          <TableCell>
                            <Badge variant={entry.minPaymentCriteriaMet ? "success" : "warning"} size="sm">
                              {entry.minPaymentCriteriaMet ? t("Met") : t("Pending")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delinquency" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("Delinquency Range Schedule")}</CardTitle></CardHeader>
            <CardContent className="p-0">
              {delinqSchedule.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No delinquency schedule data.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{t("From")}</TableHead>
                        <TableHead>{t("To")}</TableHead>
                        <TableHead>{t("Expected")}</TableHead>
                        <TableHead>{t("Paid")}</TableHead>
                        <TableHead>{t("Outstanding")}</TableHead>
                        <TableHead>{t("Status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {delinqSchedule.map((entry) => (
                        <TableRow key={entry.period}>
                          <TableCell>{entry.period}</TableCell>
                          <TableCell>{formatDate(entry.fromDate)}</TableCell>
                          <TableCell>{formatDate(entry.toDate)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(entry.expectedAmount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(entry.paidAmount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(entry.outstandingAmount, currencyCode)}</TableCell>
                          <TableCell>
                            <Badge variant={entry.minPaymentCriteriaMet ? "success" : entry.delinquencyStatus ? "error" : "warning"} size="sm">
                              {entry.minPaymentCriteriaMet ? t("Met") : entry.delinquencyStatus ?? t("Pending")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("Transaction History")}</CardTitle></CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No transactions yet.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{t("Type")}</TableHead>
                        <TableHead>{t("Date")}</TableHead>
                        <TableHead>{t("Amount")}</TableHead>
                        <TableHead>{t("Principal")}</TableHead>
                        <TableHead>{t("Interest")}</TableHead>
                        <TableHead>{t("Balance")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                          <TableCell>{tx.type?.value ?? tx.type?.code}</TableCell>
                          <TableCell>{formatDate(tx.date)}</TableCell>
                          <TableCell className="font-mono font-semibold">{formatMoney(tx.amount, currencyCode)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(tx.principalPortion, currencyCode)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(tx.interestPortion, currencyCode)}</TableCell>
                          <TableCell className="font-mono">{formatMoney(tx.outstandingLoanBalance, currencyCode)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("Delinquency Tag History")}</CardTitle></CardHeader>
            <CardContent className="p-0">
              {delinqTags.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No delinquency tags recorded.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Classification")}</TableHead>
                        <TableHead>{t("Added On")}</TableHead>
                        <TableHead>{t("Lifted On")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {delinqTags.map((tag) => (
                        <TableRow key={tag.id}>
                          <TableCell><Badge variant="warning" size="sm">{tag.classification ?? `#${tag.tagId ?? tag.id}`}</Badge></TableCell>
                          <TableCell>{formatDate(tag.addedOnDate)}</TableCell>
                          <TableCell>{tag.liftedOnDate ? formatDate(tag.liftedOnDate) : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("Rate Change History")}</CardTitle></CardHeader>
            <CardContent className="p-0">
              {rateChanges.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No rate changes recorded.")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{t("Rate (%)")}</TableHead>
                        <TableHead>{t("From Date")}</TableHead>
                        <TableHead>{t("Created")}</TableHead>
                        <TableHead>{t("Note")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateChanges.map((rc) => (
                        <TableRow key={rc.id}>
                          <TableCell>{rc.id}</TableCell>
                          <TableCell className="font-mono font-semibold">{rc.periodPaymentRate}%</TableCell>
                          <TableCell>{formatDate(rc.fromDate)}</TableCell>
                          <TableCell>{formatDate(rc.createdOnDate)}</TableCell>
                          <TableCell className="text-sm text-gray-500">{rc.note ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={approveOpen} onOpenChange={(o) => !o && setApproveOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Approve Loan")}</DialogTitle>
            <DialogDescription>{t("Confirm approval date and amount.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Approval Date")}</label>
              <Input type="date" value={approveDate} onChange={(e) => setApproveDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Approved Amount")}</label>
              <Input type="number" step="0.01" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={isMutating}>{t("Cancel")}</Button>
              <Button onClick={handleApprove} disabled={isMutating}>{approveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("Approve")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={disburseOpen} onOpenChange={(o) => !o && setDisburseOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Disburse Loan")}</DialogTitle>
            <DialogDescription>{t("Confirm disbursement date and amount.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Disbursement Date")}</label>
              <Input type="date" value={disburseDate} onChange={(e) => setDisburseDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")}</label>
              <Input type="number" step="0.01" value={disburseAmount} onChange={(e) => setDisburseAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDisburseOpen(false)} disabled={isMutating}>{t("Cancel")}</Button>
              <Button onClick={handleDisburse} disabled={isMutating}>{disburseMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("Disburse")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={repayOpen} onOpenChange={(o) => !o && setRepayOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Make Repayment")}</DialogTitle>
            <DialogDescription>{t("Record a repayment transaction.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Transaction Date")}</label>
              <Input type="date" value={repayDate} onChange={(e) => setRepayDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")}</label>
              <Input type="number" step="0.01" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRepayOpen(false)} disabled={isMutating}>{t("Cancel")}</Button>
              <Button onClick={handleRepay} disabled={isMutating}>{repaymentMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("Repay")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pauseOpen} onOpenChange={(o) => !o && setPauseOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Pause Delinquency Tracking")}</DialogTitle>
            <DialogDescription>{t("Freeze delinquency evaluation during the specified period.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Start Date")}</label>
              <Input type="date" value={pauseStart} onChange={(e) => setPauseStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("End Date")}</label>
              <Input type="date" value={pauseEnd} onChange={(e) => setPauseEnd(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPauseOpen(false)} disabled={isMutating}>{t("Cancel")}</Button>
              <Button onClick={handlePause} disabled={isMutating || !pauseEnd}>{pauseMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("Pause")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={(o) => !o && setRescheduleOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Reschedule Minimum Payment")}</DialogTitle>
            <DialogDescription>{t("Modify payment terms without affecting EIR amortization.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Minimum Payment")}</label>
              <Input type="number" step="0.01" value={rescheduleMinPayment} onChange={(e) => setRescheduleMinPayment(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Frequency (days)")}</label>
              <Input type="number" value={rescheduleFrequency} onChange={(e) => setRescheduleFrequency(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRescheduleOpen(false)} disabled={isMutating}>{t("Cancel")}</Button>
              <Button onClick={handleReschedule} disabled={isMutating}>{rescheduleMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("Reschedule")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rateChangeOpen} onOpenChange={(o) => !o && setRateChangeOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Change Payment Rate")}</DialogTitle>
            <DialogDescription>{t("Recalculate EIR and amortization from the change date forward.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("New Period Payment Rate (%)")}</label>
              <Input type="number" step="0.01" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Note")}</label>
              <Textarea value={rateNote} onChange={(e) => setRateNote(e.target.value)} rows={2} placeholder={t("Optional reason...")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRateChangeOpen(false)} disabled={isMutating}>{t("Cancel")}</Button>
              <Button onClick={handleRateChange} disabled={isMutating || !newRate}>{rateChangeMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("Update Rate")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WCLoanViewPage;
