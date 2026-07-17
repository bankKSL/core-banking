import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import CampaignList from "./pages/CampaignList";
import CreateCampaign from "./pages/CreateCampaign";
import CategoryPage from "./pages/CategoryPage";
import ProductsPage from "./pages/ProductsPage";
import ConditionsPage from "./pages/ConditionsPage";
import FormulaBuilderPage from "./pages/FormulaBuilderPage";
import ActionsPage from "./pages/ActionsPage";
import SimulationPage from "./pages/SimulationPage";
import ExecutionLogsPage from "./pages/ExecutionLogsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import SettingsPage from "./pages/SettingsPage";
import LoanApplicationsPage from "./pages/LoanApplicationsPage";
import LoanProductsPage from "./pages/LoanProductsPage";
import RepaymentSchedulePage from "./pages/RepaymentSchedulePage";
import CollateralPage from "./pages/CollateralPage";
import DepositAccountsPage from "./pages/DepositAccountsPage";
import DepositTransactionsPage from "./pages/DepositTransactionsPage";
import WithdrawalsPage from "./pages/WithdrawalsPage";
import FixedDepositsPage from "./pages/FixedDepositsPage";
import ExchangeRatePage from "./pages/ExchangeRatePage";
import CustomerPage from "./pages/CustomerPage";
import ClientListPage from "@/features/clients/pages/ClientListPage";
import CreateClientPage from "@/features/clients/pages/CreateClientPage";
import ClientDetailPage from "@/features/clients/pages/ClientDetailPage";
import EditClientPage from "@/features/clients/pages/EditClientPage";
import ScoreGradePage from "./pages/ScoreGradePage";
import CreateLoanApplicationPage from "./pages/CreateLoanApplicationPage";
import CreateDepositAccountPage from "./pages/CreateDepositAccountPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { useAuthStore } from "./store";

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
                                    <Route path="/products" element={<ProductsPage />} />
                                    <Route path="/conditions" element={<ConditionsPage />} />
                                    <Route path="/formula-builder" element={<FormulaBuilderPage />} />
                                    <Route path="/actions" element={<ActionsPage />} />
                                    <Route path="/simulation" element={<SimulationPage />} />
                                    <Route path="/execution-logs" element={<ExecutionLogsPage />} />
                                    <Route path="/audit-logs" element={<AuditLogsPage />} />
                                    <Route path="/settings" element={<SettingsPage />} />
                                    {/* Lending */}
                                    <Route path="/lending/applications" element={<LoanApplicationsPage />} />
                                    <Route path="/lending/applications/new" element={<CreateLoanApplicationPage />} />
                                    <Route path="/lending/products" element={<LoanProductsPage />} />
                                    <Route path="/lending/repayments" element={<RepaymentSchedulePage />} />
                                    <Route path="/lending/collateral" element={<CollateralPage />} />
                                    {/* Deposits */}
                                    <Route path="/deposits/accounts" element={<DepositAccountsPage />} />
                                    <Route path="/deposits/accounts/new" element={<CreateDepositAccountPage />} />
                                    <Route path="/deposits/transactions" element={<DepositTransactionsPage />} />
                                    <Route path="/deposits/withdrawals" element={<WithdrawalsPage />} />
                                    <Route path="/deposits/fixed" element={<FixedDepositsPage />} />
                                    {/* Exchange Rates */}
                                    <Route path="/exchange-rates" element={<ExchangeRatePage />} />
                                    {/* CRM */}
                                    <Route path="/customers" element={<CustomerPage />} />
                                    <Route path="/score-grades" element={<ScoreGradePage />} />
                                    {/* Clients */}
                                    <Route path="/clients" element={<ClientListPage />} />
                                    <Route path="/clients/new" element={<CreateClientPage />} />
                                    <Route path="/clients/:id" element={<ClientDetailPage />} />
                                    <Route path="/clients/:id/edit" element={<EditClientPage />} />
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
