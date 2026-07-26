import {
  HashRouter as Router,
  // BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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
import BatchOperationsPage from "./pages/BatchOperationsPage";
import LoanProductsPage from "./pages/LoanProductsPage";
import LoanProductFormPage from "./pages/LoanProductFormPage";
import LoanProductViewPage from "./pages/LoanProductViewPage";
import {
  LoansListPage,
  LoanFormPage,
  LoanViewPage,
  LoanTransactionFormPage,
  RescheduleLoansPage,
  RescheduleLoanFormPage,
} from "@/features/loans";
import { GroupListPage, GroupFormPage } from "@/features/groups";
import DepositAccountsPage from "./pages/DepositAccountsPage";
import FixedDepositsPage from "./pages/FixedDepositsPage";
import CreateFixedDepositPage from "./pages/CreateFixedDepositPage";
import FixedDepositDetailPage from "./pages/FixedDepositDetailPage";
import FixedDepositProductsPage from "./pages/FixedDepositProductsPage";
import FixedDepositProductFormPage from "./pages/FixedDepositProductFormPage";
import RecurringDepositsPage from "./pages/RecurringDepositsPage";
import CreateRecurringDepositPage from "./pages/CreateRecurringDepositPage";
import RecurringDepositDetailPage from "./pages/RecurringDepositDetailPage";
import RecurringDepositProductsPage from "./pages/RecurringDepositProductsPage";
import RecurringDepositProductFormPage from "./pages/RecurringDepositProductFormPage";
import GLAccountsPage from "./pages/GLAccountsPage";
import GLAccountFormPage from "./pages/GLAccountFormPage";
import JournalEntriesPage from "./pages/JournalEntriesPage";
import JournalEntryFormPage from "./pages/JournalEntryFormPage";
import AccountingRulesPage from "./pages/AccountingRulesPage";
import AccountingRuleFormPage from "./pages/AccountingRuleFormPage";
import FinancialActivityMappingsPage from "./pages/FinancialActivityMappingsPage";
import AccountingClosuresPage from "./pages/AccountingClosuresPage";
import PeriodicAccrualPage from "./pages/PeriodicAccrualPage";
import ProvisioningEntriesPage from "./pages/ProvisioningEntriesPage";
import ExchangeRatePage from "./pages/ExchangeRatePage";
import ClientListPage from "@/features/clients/pages/ClientListPage";
import CreateClientPage from "@/features/clients/pages/CreateClientPage";
import ClientDetailPage from "@/features/clients/pages/ClientDetailPage";
import EditClientPage from "@/features/clients/pages/EditClientPage";
import ScoreGradePage from "./pages/ScoreGradePage";
import CreateDepositAccountPage from "./pages/CreateDepositAccountPage";
import SavingsProductsPage from "./pages/SavingsProductsPage";
import SavingsProductFormPage from "./pages/SavingsProductFormPage";
import AccountActionPage from "./pages/AccountActionPage";
import SavingsTransactionFormPage from "./pages/SavingsTransactionFormPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { useAuthStore } from "./store";
import ApiErrorHandler from "./components/shared/ApiErrorHandler";
import DepositAccountDetailPage from "./pages/DepositAccountDetailPage";
import TransferListPage from "./pages/TransferListPage";
import TransferFormPage from "./pages/TransferFormPage";
import StandingInstructionsPage from "./pages/StandingInstructionsPage";
import StandingInstructionFormPage from "./pages/StandingInstructionFormPage";
import StandingInstructionHistoryPage from "./pages/StandingInstructionHistoryPage";
import UserListPage from "@/features/admin/pages/UserListPage";
import TellerListPage from "@/features/tellers/pages/TellerListPage";
import TellerFormPage from "@/features/tellers/pages/TellerFormPage";
import TellerDetailPage from "@/features/tellers/pages/TellerDetailPage";
import UserFormPage from "@/features/admin/pages/UserFormPage";
import UserDetailPage from "@/features/admin/pages/UserDetailPage";
import RoleListPage from "@/features/admin/pages/RoleListPage";
import RoleFormPage from "@/features/admin/pages/RoleFormPage";
import RoleDetailPage from "@/features/admin/pages/RoleDetailPage";
import PermissionsPage from "@/features/admin/pages/PermissionsPage";
import { CollateralProductListPage, CollateralProductFormPage } from "@/features/collateral-products";
import {
  ExternalAssetOwnerListPage,
  ExternalAssetOwnerFormPage,
  TransferListPage as InvestorTransferListPage,
  TransferFormPage as InvestorTransferFormPage,
  LoanProductAttributesPage,
} from "@/features/external-asset-owners";

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
  return (
    <>
      <ApiErrorHandler />
      {children}
    </>
  );
}

function App() {
  return (
    // <BrowserRouter>
    <Router>
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
                  <Route path="/admin/batch-operations" element={<BatchOperationsPage />} />
                  {/* Admin — Users & Roles */}
                  <Route path="/admin/users" element={<UserListPage />} />
                  <Route path="/admin/users/new" element={<UserFormPage />} />
                  <Route path="/admin/users/edit/:id" element={<UserFormPage />} />
                  <Route path="/admin/users/:id" element={<UserDetailPage />} />
                  <Route path="/admin/roles" element={<RoleListPage />} />
                  <Route path="/admin/roles/new" element={<RoleFormPage />} />
                  <Route path="/admin/roles/edit/:id" element={<RoleFormPage />} />
                  <Route path="/admin/roles/:id" element={<RoleDetailPage />} />
                  <Route path="/admin/permissions" element={<PermissionsPage />} />
                  {/* Teller Management */}
                  <Route path="/tellers" element={<TellerListPage />} />
                  <Route path="/tellers/new" element={<TellerFormPage />} />
                  <Route path="/tellers/edit/:id" element={<TellerFormPage />} />
                  <Route path="/tellers/:id" element={<TellerDetailPage />} />
                  {/* Collateral Products */}
                  <Route path="/collateral-products" element={<CollateralProductListPage />} />
                  <Route path="/collateral-products/new" element={<CollateralProductFormPage />} />
                  <Route path="/collateral-products/edit/:id" element={<CollateralProductFormPage />} />
                  {/* Lending */}
                  <Route path="/lending/products" element={<LoanProductsPage />} />
                  <Route path="/lending/products/new" element={<LoanProductFormPage />} />
                  <Route path="/lending/products/edit/:id" element={<LoanProductFormPage />} />
                  <Route path="/lending/products/view/:id" element={<LoanProductViewPage />} />
                  {/* Loans (new module) */}
                  <Route path="/loans" element={<LoansListPage />} />
                  <Route path="/loans/create" element={<LoanFormPage />} />
                  <Route path="/loans/edit/:id" element={<LoanFormPage />} />
                  <Route path="/loans/view/:id" element={<LoanViewPage />} />
                  <Route path="/rescheduling" element={<RescheduleLoansPage />} />
                  <Route path="/rescheduling/new" element={<RescheduleLoanFormPage />} />
                  <Route path="/loans/:loanId/transactions/:transactionType" element={<LoanTransactionFormPage />} />
                  {/* Deposits */}
                  <Route path="/deposits/products" element={<SavingsProductsPage />} />
                  <Route path="/deposits/products/new" element={<SavingsProductFormPage />} />
                  <Route path="/deposits/products/edit/:id" element={<SavingsProductFormPage />} />
                  <Route path="/deposits/saving-accounts" element={<DepositAccountsPage />} />
                  <Route path="/deposits/saving-accounts/new" element={<CreateDepositAccountPage />} />
                  <Route path="/deposits/saving-accounts/edit/:id" element={<CreateDepositAccountPage />} />
                  <Route path="/deposits/saving-accounts/:id" element={<DepositAccountDetailPage />} />
                  <Route
                    path="/deposits/saving-accounts/:id/transactions/:command"
                    element={<SavingsTransactionFormPage />}
                  />
                  <Route path="/deposits/saving-accounts/:id/action/:command" element={<AccountActionPage />} />
                  <Route path="/deposits/:accountType/:accountId/action/:command" element={<AccountActionPage />} />
                  <Route path="/deposits/fixed" element={<FixedDepositsPage />} />
                  <Route path="/deposits/fixed/new" element={<CreateFixedDepositPage />} />
                  <Route path="/deposits/fixed/:id" element={<FixedDepositDetailPage />} />
                  <Route path="/deposits/fixed-products" element={<FixedDepositProductsPage />} />
                  <Route path="/deposits/fixed/edit/:id" element={<CreateFixedDepositPage />} />
                  <Route path="/deposits/fixed-products/new" element={<FixedDepositProductFormPage />} />
                  <Route path="/deposits/fixed-products/edit/:id" element={<FixedDepositProductFormPage />} />
                  {/* Recurring Deposits */}
                  <Route path="/deposits/recurring" element={<RecurringDepositsPage />} />
                  <Route path="/deposits/recurring/new" element={<CreateRecurringDepositPage />} />
                  <Route path="/deposits/recurring/edit/:id" element={<CreateRecurringDepositPage />} />
                  <Route path="/deposits/recurring/:id" element={<RecurringDepositDetailPage />} />
                  <Route path="/deposits/recurring-products" element={<RecurringDepositProductsPage />} />
                  <Route path="/deposits/recurring-products/new" element={<RecurringDepositProductFormPage />} />
                  <Route path="/deposits/recurring-products/edit/:id" element={<RecurringDepositProductFormPage />} />
                  {/* Accounting */}
                  <Route path="/accounting/gl-accounts" element={<GLAccountsPage />} />
                  <Route path="/accounting/gl-accounts/new" element={<GLAccountFormPage />} />
                  <Route path="/accounting/gl-accounts/edit/:id" element={<GLAccountFormPage />} />
                  <Route path="/accounting/journal-entries" element={<JournalEntriesPage />} />
                  <Route path="/accounting/journal-entries/new" element={<JournalEntryFormPage />} />
                  <Route path="/accounting/rules" element={<AccountingRulesPage />} />
                  <Route path="/accounting/rules/new" element={<AccountingRuleFormPage />} />
                  <Route path="/accounting/rules/edit/:id" element={<AccountingRuleFormPage />} />
                  <Route path="/accounting/financial-activity-mappings" element={<FinancialActivityMappingsPage />} />
                  <Route path="/accounting/closures" element={<AccountingClosuresPage />} />
                  <Route path="/accounting/periodic-accrual" element={<PeriodicAccrualPage />} />
                  <Route path="/accounting/provisioning-entries" element={<ProvisioningEntriesPage />} />
                  {/* Exchange Rates */}
                  <Route path="/exchange-rates" element={<ExchangeRatePage />} />
                  {/* CRM */}
                  <Route path="/score-grades" element={<ScoreGradePage />} />
                  {/* Groups */}
                  <Route path="/groups" element={<GroupListPage />} />
                  <Route path="/groups/create" element={<GroupFormPage />} />
                  <Route path="/groups/edit/:id" element={<GroupFormPage />} />
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
                  {/* External Asset Owners (Investor Base) */}
                  <Route path="/external-asset-owners/owners" element={<ExternalAssetOwnerListPage />} />
                  <Route path="/external-asset-owners/new" element={<ExternalAssetOwnerFormPage />} />
                  <Route path="/external-asset-owners/transfers" element={<InvestorTransferListPage />} />
                  <Route path="/external-asset-owners/transfers/new" element={<InvestorTransferFormPage />} />
                  <Route
                    path="/external-asset-owners/loan-product/:loanProductId/attributes"
                    element={<LoanProductAttributesPage />}
                  />
                </Routes>
              </AppLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
    // </BrowserRouter>
  );
}

export default App;
