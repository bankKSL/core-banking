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
import { GroupListPage, GroupFormPage, GroupDetailPage } from "@/features/groups";
import { CenterListPage, CenterFormPage, CenterDetailPage } from "@/features/centers";
import DepositAccountsPage from "./pages/DepositAccountsPage";
import FixedDepositsPage from "./pages/FixedDepositsPage";
import CreateFixedDepositPage from "./pages/CreateFixedDepositPage";
import FixedDepositDetailPage from "./pages/FixedDepositDetailPage";
import FixedDepositProductsPage from "./pages/FixedDepositProductsPage";
import FixedDepositProductFormPage from "./pages/FixedDepositProductFormPage";
import FixedDepositProductDetailPage from "./pages/FixedDepositProductDetailPage";
import RecurringDepositsPage from "./pages/RecurringDepositsPage";
import CreateRecurringDepositPage from "./pages/CreateRecurringDepositPage";
import RecurringDepositDetailPage from "./pages/RecurringDepositDetailPage";
import RecurringDepositProductsPage from "./pages/RecurringDepositProductsPage";
import RecurringDepositProductFormPage from "./pages/RecurringDepositProductFormPage";
import RecurringDepositProductDetailPage from "./pages/RecurringDepositProductDetailPage";
import InterestRateChartListPage from "./pages/InterestRateChartListPage";
import InterestRateChartFormPage from "./pages/InterestRateChartFormPage";
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
import SavingsProductDetailPage from "./pages/SavingsProductDetailPage";
import AccountActionPage from "./pages/AccountActionPage";
import SavingsTransactionFormPage from "./pages/SavingsTransactionFormPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { useAuthStore } from "./store";
import ApiErrorHandler from "./components/shared/ApiErrorHandler";
import DepositAccountDetailPage from "./pages/DepositAccountDetailPage";
import TransferListPage from "./pages/TransferListPage";
import TransferFormPage from "./pages/TransferFormPage";
import StandingInstructionListPage from "@/features/standing-instructions/pages/StandingInstructionListPage";
import StandingInstructionFormPage from "@/features/standing-instructions/pages/StandingInstructionFormPage";
import StandingInstructionViewPage from "@/features/standing-instructions/pages/StandingInstructionViewPage";
import StandingInstructionHistoryPage from "@/features/standing-instructions/pages/StandingInstructionHistoryPage";
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
import {
  InteropDashboard,
  PartySearchPage,
  PartyRegisterPage,
  InteropTransferPage,
  InteropAccountDetailPage,
} from "@/features/interop";
import {
  COBDashboard,
  BusinessStepConfigPage,
  CatchUpPage,
  LockedLoansPage,
} from "@/features/cob";
import {
  ConfigurationDashboard,
  GlobalConfigPage,
  ExternalServicesPage,
  PasswordPolicyPage,
  BusinessDatePage,
} from "@/features/configuration";
import {
  CampaignListPage,
  CampaignFormPage,
  EmailCampaignFormPage,
  CampaignDetailPage,
} from "@/features/campaigns";
import OfficeListPage from "@/features/offices/pages/OfficeListPage";
import OfficeFormPage from "@/features/offices/pages/OfficeFormPage";
import OfficeTransactionListPage from "@/features/offices/pages/OfficeTransactionListPage";
import OfficeTransactionFormPage from "@/features/offices/pages/OfficeTransactionFormPage";
import StaffListPage from "@/features/staff/pages/StaffListPage";
import StaffFormPage from "@/features/staff/pages/StaffFormPage";
import HolidayListPage from "@/features/holidays/pages/HolidayListPage";
import HolidayFormPage from "@/features/holidays/pages/HolidayFormPage";
import CurrenciesPage from "@/features/currencies/pages/CurrenciesPage";
import FundListPage from "@/features/funds/pages/FundListPage";
import FundFormPage from "@/features/funds/pages/FundFormPage";
import PaymentTypeListPage from "@/features/payment-types/pages/PaymentTypeListPage";
import PaymentTypeFormPage from "@/features/payment-types/pages/PaymentTypeFormPage";
import WorkingDaysPage from "@/features/working-days/pages/WorkingDaysPage";
import CodeListPage from "@/features/codes/pages/CodeListPage";
import CodeFormPage from "@/features/codes/pages/CodeFormPage";
import CodeDetailPage from "@/features/codes/pages/CodeDetailPage";
import ChargeListPage from "@/features/charges/pages/ChargeListPage";
import ChargeFormPage from "@/features/charges/pages/ChargeFormPage";
import ShareProductListPage from "@/features/shares/pages/ShareProductListPage";
import ShareProductFormPage from "@/features/shares/pages/ShareProductFormPage";
import CalendarListPage from "@/features/calendars/pages/CalendarListPage";
import MeetingListPage from "@/features/calendars/pages/MeetingListPage";
import MeetingAttendancePage from "@/features/calendars/pages/MeetingAttendancePage";
import ShareAccountListPage from "@/features/shares/pages/ShareAccountListPage";
import ShareAccountFormPage from "@/features/shares/pages/ShareAccountFormPage";
import ShareAccountDetailPage from "@/features/shares/pages/ShareAccountDetailPage";
import DividendListPage from "@/features/shares/pages/DividendListPage";
import LoanReassignmentPage from "@/features/loans/pages/LoanReassignmentPage";

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
                  <Route path="/loans/reassign" element={<LoanReassignmentPage />} />
                  <Route path="/loans/:loanId/transactions/:transactionType" element={<LoanTransactionFormPage />} />
                  {/* Deposits */}
                  <Route path="/deposits/products" element={<SavingsProductsPage />} />
                  <Route path="/deposits/products/new" element={<SavingsProductFormPage />} />
                  <Route path="/deposits/products/edit/:id" element={<SavingsProductFormPage />} />
                  <Route path="/deposits/products/view/:id" element={<SavingsProductDetailPage />} />
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
                  <Route path="/deposits/fixed-products/new" element={<FixedDepositProductFormPage />} />
                  <Route path="/deposits/fixed-products/edit/:id" element={<FixedDepositProductFormPage />} />
                  <Route path="/deposits/fixed-products/view/:id" element={<FixedDepositProductDetailPage />} />
                  <Route path="/deposits/fixed/edit/:id" element={<CreateFixedDepositPage />} />
                  {/* Recurring Deposits */}
                  <Route path="/deposits/recurring" element={<RecurringDepositsPage />} />
                  <Route path="/deposits/recurring/new" element={<CreateRecurringDepositPage />} />
                  <Route path="/deposits/recurring/edit/:id" element={<CreateRecurringDepositPage />} />
                  <Route path="/deposits/recurring/:id" element={<RecurringDepositDetailPage />} />
                  <Route path="/deposits/recurring-products" element={<RecurringDepositProductsPage />} />
                  <Route path="/deposits/recurring-products/new" element={<RecurringDepositProductFormPage />} />
                  <Route path="/deposits/recurring-products/edit/:id" element={<RecurringDepositProductFormPage />} />
                  <Route path="/deposits/recurring-products/view/:id" element={<RecurringDepositProductDetailPage />} />
                  <Route path="/interest-rate-charts" element={<InterestRateChartListPage />} />
                  <Route path="/interest-rate-charts/new" element={<InterestRateChartFormPage />} />
                  <Route path="/interest-rate-charts/:id" element={<InterestRateChartFormPage />} />
                  <Route path="/shares/products" element={<ShareProductListPage />} />
                  <Route path="/shares/products/new" element={<ShareProductFormPage />} />
                  <Route path="/shares/products/edit/:id" element={<ShareProductFormPage />} />
                  <Route path="/shares/accounts" element={<ShareAccountListPage />} />
                  <Route path="/shares/accounts/new" element={<ShareAccountFormPage />} />
                  <Route path="/shares/accounts/:id" element={<ShareAccountDetailPage />} />
                  <Route path="/shares/accounts/edit/:id" element={<ShareAccountFormPage />} />
                  <Route path="/shares/dividends" element={<DividendListPage />} />
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
                  <Route path="/groups/:id" element={<GroupDetailPage />} />
                  {/* Centers */}
                  <Route path="/centers" element={<CenterListPage />} />
                  <Route path="/centers/new" element={<CenterFormPage />} />
                  <Route path="/centers/:id" element={<CenterDetailPage />} />
                  <Route path="/centers/edit/:id" element={<CenterFormPage />} />
                  {/* Clients */}
                  <Route path="/clients" element={<ClientListPage />} />
                  <Route path="/clients/new" element={<CreateClientPage />} />
                  <Route path="/clients/:id" element={<ClientDetailPage />} />
                  <Route path="/clients/:id/edit" element={<EditClientPage />} />
                  {/* Organization */}
                  <Route path="/offices" element={<OfficeListPage />} />
                  <Route path="/offices/new" element={<OfficeFormPage />} />
                  <Route path="/offices/edit/:id" element={<OfficeFormPage />} />
                  <Route path="/office-transactions" element={<OfficeTransactionListPage />} />
                  <Route path="/office-transactions/new" element={<OfficeTransactionFormPage />} />
                  <Route path="/staff" element={<StaffListPage />} />
                  <Route path="/staff/new" element={<StaffFormPage />} />
                  <Route path="/staff/edit/:id" element={<StaffFormPage />} />
                  <Route path="/holidays" element={<HolidayListPage />} />
                  <Route path="/holidays/new" element={<HolidayFormPage />} />
                  <Route path="/holidays/edit/:id" element={<HolidayFormPage />} />
                  <Route path="/currencies" element={<CurrenciesPage />} />
                  <Route path="/funds" element={<FundListPage />} />
                  <Route path="/funds/new" element={<FundFormPage />} />
                  <Route path="/funds/edit/:id" element={<FundFormPage />} />
                  <Route path="/payment-types" element={<PaymentTypeListPage />} />
                  <Route path="/payment-types/new" element={<PaymentTypeFormPage />} />
                  <Route path="/payment-types/edit/:id" element={<PaymentTypeFormPage />} />
                  <Route path="/working-days" element={<WorkingDaysPage />} />
                  <Route path="/codes" element={<CodeListPage />} />
                  <Route path="/codes/new" element={<CodeFormPage />} />
                  <Route path="/codes/:id" element={<CodeDetailPage />} />
                  <Route path="/codes/edit/:id" element={<CodeFormPage />} />
                  <Route path="/charges" element={<ChargeListPage />} />
                  <Route path="/charges/new" element={<ChargeFormPage />} />
                  <Route path="/charges/edit/:id" element={<ChargeFormPage />} />
                  {/* Transfers */}
                  <Route path="/transfers/history" element={<TransferListPage />} />
                  <Route path="/transfers/new" element={<TransferFormPage />} />
                  <Route path="/transfers/standing-instructions" element={<StandingInstructionListPage />} />
                  <Route path="/transfers/standing-instructions/new" element={<StandingInstructionFormPage />} />
                  <Route path="/transfers/standing-instructions/:id" element={<StandingInstructionViewPage />} />
                  <Route path="/transfers/standing-instructions/edit/:id" element={<StandingInstructionFormPage />} />
                  <Route path="/standing-instruction-history" element={<StandingInstructionHistoryPage />} />
                  {/* External Asset Owners (Investor Base) */}
                  <Route path="/external-asset-owners/owners" element={<ExternalAssetOwnerListPage />} />
                  <Route path="/external-asset-owners/new" element={<ExternalAssetOwnerFormPage />} />
                  <Route path="/external-asset-owners/transfers" element={<InvestorTransferListPage />} />
                  <Route path="/external-asset-owners/transfers/new" element={<InvestorTransferFormPage />} />
                  <Route
                    path="/external-asset-owners/loan-product/:loanProductId/attributes"
                    element={<LoanProductAttributesPage />}
                  />
                  {/* Interoperation (Mojaloop) */}
                  <Route path="/interop/dashboard" element={<InteropDashboard />} />
                  <Route path="/interop/party/search" element={<PartySearchPage />} />
                  <Route path="/interop/party/register" element={<PartyRegisterPage />} />
                  <Route path="/interop/transfers" element={<InteropTransferPage />} />
                  <Route path="/interop/account" element={<InteropAccountDetailPage />} />
                  {/* Close of Business (COB) */}
                  <Route path="/cob/dashboard" element={<COBDashboard />} />
                  <Route path="/cob/steps" element={<BusinessStepConfigPage />} />
                  <Route path="/cob/catch-up" element={<CatchUpPage />} />
                  <Route path="/cob/locked-loans" element={<LockedLoansPage />} />
                  {/* Configuration & Admin */}
                  <Route path="/configuration" element={<ConfigurationDashboard />} />
                  <Route path="/configuration/global" element={<GlobalConfigPage />} />
                  <Route path="/configuration/external-services" element={<ExternalServicesPage />} />
                  <Route path="/configuration/password-policy" element={<PasswordPolicyPage />} />
                  <Route path="/configuration/business-date" element={<BusinessDatePage />} />
                  {/* Campaigns (SMS / Email) */}
                  <Route path="/campaigns" element={<CampaignListPage />} />
                  <Route path="/campaigns/sms/new" element={<CampaignFormPage />} />
                  <Route path="/campaigns/email/new" element={<EmailCampaignFormPage />} />
                  <Route path="/campaigns/sms/:id" element={<CampaignDetailPage />} />
                  <Route path="/campaigns/email/:id" element={<CampaignDetailPage />} />
                  {/* Calendars & Meetings (entity-specific) */}
                  <Route path="/:entityType/:entityId/calendars" element={<CalendarListPage />} />
                  <Route path="/:entityType/:entityId/meetings" element={<MeetingListPage />} />
                  <Route path="/:entityType/:entityId/meetings/:meetingId/attendance" element={<MeetingAttendancePage />} />
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
