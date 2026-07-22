import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import CampaignList from "./pages/CampaignList";
import CreateCampaign from "./pages/CreateCampaign";
import CategoryPage from "./pages/CategoryPage";
import ConditionsPage from "./pages/ConditionsPage";
import FormulaBuilderPage from "./pages/FormulaBuilderPage";
import ActionsPage from "./pages/ActionsPage";
import SimulationPage from "./pages/SimulationPage";
import ExecutionLogsPage from "./pages/ExecutionLogsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import SettingsPage from "./pages/SettingsPage";
import LoanProductsPage from "./pages/LoanProductsPage";
import RepaymentSchedulePage from "./pages/RepaymentSchedulePage";
import CollateralPage from "./pages/CollateralPage";
import {
    LoansListPage,
    LoanFormPage,
    LoanViewPage,
    LoanTransactionFormPage,
} from "@/features/loans";
import DepositAccountsPage from "./pages/DepositAccountsPage";
import FixedDepositsPage from "./pages/FixedDepositsPage";
import CreateFixedDepositPage from "./pages/CreateFixedDepositPage";
import FixedDepositDetailPage from "./pages/FixedDepositDetailPage";
import FixedDepositProductsPage from "./pages/FixedDepositProductsPage";
import ExchangeRatePage from "./pages/ExchangeRatePage";
import ClientListPage from "@/features/clients/pages/ClientListPage";
import CreateClientPage from "@/features/clients/pages/CreateClientPage";
import ClientDetailPage from "@/features/clients/pages/ClientDetailPage";
import EditClientPage from "@/features/clients/pages/EditClientPage";
import ScoreGradePage from "./pages/ScoreGradePage";
import CreateDepositAccountPage from "./pages/CreateDepositAccountPage";
import SavingsProductsPage from "./pages/SavingsProductsPage";
import AccountActionPage from "./pages/AccountActionPage";
import SavingsTransactionFormPage from "./pages/SavingsTransactionFormPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { useAuthStore } from "./store";
import DepositAccountDetailPage from "./pages/DepositAccountDetailPage";
import TransferListPage from "./pages/TransferListPage";
import TransferFormPage from "./pages/TransferFormPage";
import StandingInstructionsPage from "./pages/StandingInstructionsPage";
import StandingInstructionFormPage from "./pages/StandingInstructionFormPage";
import StandingInstructionHistoryPage from "./pages/StandingInstructionHistoryPage";

/** Redirect authenticated users away from /login to dashboard */
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    if (isAuthenticated) return <Navigate to="/" replace />;
    return <>{children}</>;
}

/** Protect routes: redirect unauthenticated users to /login */
function RequireAuth({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public: Login page */}
                <Route
                    path="/login"
                    element={
                        <RedirectIfAuth>
                            <LoginPage />
                        </RedirectIfAuth>
                    }
                />

                {/* Public: Forgot password page */}
                <Route
                    path="/forgot-password"
                    element={
                        <RedirectIfAuth>
                            <ForgotPasswordPage />
                        </RedirectIfAuth>
                    }
                />

                {/* Protected: All app routes wrapped in AppLayout */}
                <Route
                    path="/*"
                    element={
                        <RequireAuth>
                            <AppLayout>
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/campaign" element={<CampaignList />} />
                                    <Route path="/campaign/new" element={<CreateCampaign />} />
                                    <Route path="/category" element={<CategoryPage />} />
                                    <Route path="/conditions" element={<ConditionsPage />} />
                                    <Route path="/formula-builder" element={<FormulaBuilderPage />} />
                                    <Route path="/actions" element={<ActionsPage />} />
                                    <Route path="/simulation" element={<SimulationPage />} />
                                    <Route path="/execution-logs" element={<ExecutionLogsPage />} />
                                    <Route path="/audit-logs" element={<AuditLogsPage />} />
                                    <Route path="/settings" element={<SettingsPage />} />
                                    {/* Lending */}
                                    <Route path="/lending/products" element={<LoanProductsPage />} />
                                    <Route path="/lending/repayments" element={<RepaymentSchedulePage />} />
                                    <Route path="/lending/collateral" element={<CollateralPage />} />
                                    {/* Loans (new module) */}
                                    <Route path="/loans" element={<LoansListPage />} />
                                    <Route path="/loans/create" element={<LoanFormPage />} />
                                    <Route path="/loans/edit/:id" element={<LoanFormPage />} />
                                    <Route path="/loans/view/:id" element={<LoanViewPage />} />
                                    <Route path="/loans/:loanId/transactions/:transactionType" element={<LoanTransactionFormPage />} />
                                    {/* Deposits */}
                                    <Route path="/deposits/products" element={<SavingsProductsPage />} />
                                    <Route path="/deposits/products/new" element={<SavingsProductsPage />} />
                                    <Route path="/deposits/products/edit/:id" element={<SavingsProductsPage />} />
                                    <Route path="/deposits/saving-accounts" element={<DepositAccountsPage />} />
                                    <Route path="/deposits/saving-accounts/new" element={<CreateDepositAccountPage />} />
                                    <Route path="/deposits/saving-accounts/edit/:id" element={<CreateDepositAccountPage />} />
                                    <Route path="/deposits/saving-accounts/:id" element={<DepositAccountDetailPage />} />
                                    <Route path="/deposits/saving-accounts/:id/transactions/:command" element={<SavingsTransactionFormPage />} />
                                    <Route path="/deposits/saving-accounts/:id/action/:command" element={<AccountActionPage />} />
                                    <Route path="/deposits/:accountType/:accountId/action/:command" element={<AccountActionPage />} />
                                    <Route path="/deposits/fixed" element={<FixedDepositsPage />} />
                                    <Route path="/deposits/fixed/new" element={<CreateFixedDepositPage />} />
                                    <Route path="/deposits/fixed/:id" element={<FixedDepositDetailPage />} />
                                    <Route path="/deposits/fixed-products" element={<FixedDepositProductsPage />} />
                                    <Route path="/deposits/fixed/edit/:id" element={<CreateFixedDepositPage />} />
                                    <Route path="/deposits/fixed-products/new" element={<FixedDepositProductsPage />} />
                                    <Route path="/deposits/fixed-products/edit/:id" element={<FixedDepositProductsPage />} />
                                    {/* Exchange Rates */}
                                    <Route path="/exchange-rates" element={<ExchangeRatePage />} />
                                    {/* CRM */}
                                    <Route path="/score-grades" element={<ScoreGradePage />} />
                                    {/* Clients */}
                                    <Route path="/clients" element={<ClientListPage />} />
                                    <Route path="/clients/new" element={<CreateClientPage />} />
                                    <Route path="/clients/:id" element={<ClientDetailPage />} />
                                    <Route path="/clients/:id/edit" element={<EditClientPage />} />
                                    {/* Transfers */}
                                    <Route path="/transfers/history" element={<TransferListPage />} />
                                    <Route path="/transfers/new" element={<TransferFormPage />} />
                                    <Route path="/transfers/standing-instructions" element={<StandingInstructionsPage />} />
                                    <Route path="/transfers/standing-instructions/new" element={<StandingInstructionFormPage />} />
                                    <Route path="/transfers/standing-instructions/edit/:id" element={<StandingInstructionFormPage />} />
                                    <Route path="/transfers/standing-instructions/history" element={<StandingInstructionHistoryPage />} />
                                </Routes>
                            </AppLayout>
                        </RequireAuth>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
