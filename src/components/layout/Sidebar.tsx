import { type FC, useState, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  DollarSign,
  Calculator,
  Play,
  FileText,
  ShieldCheck,
  Settings,
  ChevronDown,
  Banknote,
  Briefcase,
  Building2,
  Wallet,
  PiggyBank,
  Globe,
  Users,
  Shield,
  LayoutGrid,
  Calendar,
  ArrowRightLeft,
  Terminal,
  UsersRound,
  BookOpen,
  Scale,
  Gem,
  Link2,
  Lock,
  CalendarClock,
  UserCog,
  KeyRound,
  Activity,
  UserPlus,
  Eye,
  Search,
  ListOrdered,
  CreditCard,
  ToggleLeft,
  Repeat,
  Percent,
  Handshake,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  exact?: boolean;
  translationKey?: string;
}

interface NavSectionConfig {
  id: string;
  title: string;
  titleKey: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const getSections = (t: (key: string) => string): NavSectionConfig[] => [
  {
    id: "dashboard",
    title: t("Dashboard"),
    titleKey: "Dashboard",
    defaultOpen: true,
    items: [{ label: t("Dashboard"), path: "/", icon: LayoutDashboard, translationKey: "Dashboard" }],
  },
  {
    id: "lending",
    title: t("Loans"),
    titleKey: "Loans",
    defaultOpen: true,
    items: [
      { label: t("Loans"), path: "/loans", icon: Banknote, exact: true, translationKey: "Loans" },
      { label: t("Loan Products"), path: "/lending/products", icon: Briefcase, translationKey: "Loan Products" },
      { label: t("Working Capital Loans"), path: "/working-capital-loans", icon: TrendingUp, translationKey: "Working Capital Loans" },
      { label: t("WC Loan Products"), path: "/working-capital-loans/products", icon: TrendingUp, translationKey: "WC Loan Products" },
      { label: t("Loan Originators"), path: "/loan-originators", icon: Handshake, translationKey: "Loan Originators" },
      { label: t("Collateral Products"), path: "/collateral-products", icon: Gem, translationKey: "Collateral Products" },
      { label: t("External Asset Owners"), path: "/external-asset-owners/owners", icon: UsersRound, translationKey: "External Asset Owners" },
      { label: t("Transfers (Investor)"), path: "/external-asset-owners/transfers", icon: ArrowRightLeft, translationKey: "Transfers (Investor)" },
      { label: t("Reschedule Requests"), path: "/rescheduling", icon: CalendarClock, translationKey: "Reschedule Requests" },
      { label: t("Bulk Reassignment"), path: "/loans/reassign", icon: ArrowRightLeft, translationKey: "Bulk Reassignment" },
    ],
  },
  {
    id: "deposits",
    title: t("Deposits"),
    titleKey: "Deposits",
    defaultOpen: true,
    items: [
      { label: t("Savings Accounts"), path: "/deposits/saving-accounts", icon: PiggyBank, translationKey: "Savings Accounts" },
      { label: t("Fixed Deposits"), path: "/deposits/fixed", icon: Wallet, translationKey: "Fixed Deposits" },
      { label: t("Recurring Deposits"), path: "/deposits/recurring", icon: Calendar, translationKey: "Recurring Deposits" },
      { label: t("Savings Accounts Products"), path: "/deposits/products", icon: LayoutGrid, translationKey: "Savings Accounts Products" },
      { label: t("Fixed Deposits Products"), path: "/deposits/fixed-products", icon: Calendar, translationKey: "Fixed Deposits Products" },
      { label: t("Recurring Deposit Products"), path: "/deposits/recurring-products", icon: LayoutGrid, translationKey: "Recurring Deposit Products" },
      { label: t("Interest Rate Charts"), path: "/interest-rate-charts", icon: Percent, translationKey: "Interest Rate Charts" },
    ],
  },
  {
    id: "shares",
    title: t("Shares"),
    titleKey: "Shares",
    defaultOpen: true,
    items: [
      { label: t("Share Products"), path: "/shares/products", icon: LayoutGrid, translationKey: "Share Products" },
      { label: t("Share Accounts"), path: "/shares/accounts", icon: Users, translationKey: "Share Accounts" },
      { label: t("Dividends"), path: "/shares/dividends", icon: DollarSign, translationKey: "Dividends" },
    ],
  },
  {
    id: "accounting",
    title: t("Accounting"),
    titleKey: "Accounting",
    defaultOpen: true,
    items: [
      { label: t("Chart of Accounts"), path: "/accounting/gl-accounts", icon: BookOpen, translationKey: "Chart of Accounts" },
      { label: t("Journal Entries"), path: "/accounting/journal-entries", icon: FileText, translationKey: "Journal Entries" },
      { label: t("Accounting Rules"), path: "/accounting/rules", icon: Scale, translationKey: "Accounting Rules" },
      { label: t("Activity Mappings"), path: "/accounting/financial-activity-mappings", icon: Link2, translationKey: "Activity Mappings" },
      { label: t("Closures"), path: "/accounting/closures", icon: Lock, translationKey: "Closures" },
      { label: t("Periodic Accrual"), path: "/accounting/periodic-accrual", icon: CalendarClock, translationKey: "Periodic Accrual" },
      { label: t("Provisioning"), path: "/accounting/provisioning-entries", icon: ShieldCheck, translationKey: "Provisioning" },
      { label: t("Provisioning Categories"), path: "/provisioning-categories", icon: LayoutGrid, translationKey: "Provisioning Categories" },
      { label: t("Provisioning Criteria"), path: "/provisioning-criteria", icon: ListOrdered, translationKey: "Provisioning Criteria" },
      { label: t("Tax Components"), path: "/taxes/components", icon: Percent, translationKey: "Tax Components" },
      { label: t("Tax Groups"), path: "/taxes/groups", icon: LayoutGrid, translationKey: "Tax Groups" },
    ],
  },
  {
    id: "treasury",
    title: t("Treasury"),
    titleKey: "Treasury",
    defaultOpen: true,
    items: [
      { label: t("Exchange Rates"), path: "/exchange-rates", icon: Globe, translationKey: "Exchange Rates" },
    ],
  },
  {
    id: "transfers",
    title: t("Transfers"),
    titleKey: "Transfers",
    defaultOpen: true,
    items: [
      { label: t("Transfer History"), path: "/transfers/history", icon: ArrowRightLeft, translationKey: "Transfer History" },
      { label: t("New Transfer"), path: "/transfers/new", icon: ArrowRightLeft, translationKey: "New Transfer" },
      { label: t("Standing Instructions"), path: "/transfers/standing-instructions", icon: FileText, translationKey: "Standing Instructions" },
      { label: t("SI History"), path: "/standing-instruction-history", icon: Repeat, translationKey: "SI History" },
    ],
  },
  {
    id: "crm",
    title: t("CRM"),
    titleKey: "CRM",
    defaultOpen: true,
    items: [
      { label: t("Global Search"), path: "/search", icon: Search, translationKey: "Global Search" },
      { label: t("Clients"), path: "/clients", icon: Users, translationKey: "Clients" },
      { label: t("Groups"), path: "/groups", icon: UsersRound, translationKey: "Groups" },
      { label: t("Centers"), path: "/centers", icon: Building2, translationKey: "Centers" },
      { label: t("Score Grade"), path: "/score-grades", icon: Shield, translationKey: "Score Grade" },
    ],
  },
  {
    id: "organization",
    title: t("Organization"),
    titleKey: "Organization",
    defaultOpen: true,
    items: [
      { label: t("Branches (Offices)"), path: "/offices", icon: Building2, translationKey: "Branches (Offices)" },
      { label: t("Office Transactions"), path: "/office-transactions", icon: ArrowRightLeft, translationKey: "Office Transactions" },
      { label: t("Staff"), path: "/staff", icon: Users, translationKey: "Staff" },
      { label: t("Holidays"), path: "/holidays", icon: Calendar, translationKey: "Holidays" },
      { label: t("Currencies"), path: "/currencies", icon: Wallet, translationKey: "Currencies" },
      { label: t("Funds"), path: "/funds", icon: Banknote, translationKey: "Funds" },
      { label: t("Payment Types"), path: "/payment-types", icon: CreditCard, translationKey: "Payment Types" },
      { label: t("Charges"), path: "/charges", icon: Calculator, translationKey: "Charges" },
      { label: t("Working Days"), path: "/working-days", icon: CalendarClock, translationKey: "Working Days" },
      { label: t("Codes"), path: "/codes", icon: ListOrdered, translationKey: "Codes" },
    ],
  },
  {
    id: "marketing",
    title: t("Marketing"),
    titleKey: "Marketing",
    defaultOpen: true,
    items: [
      { label: t("Campaigns"), path: "/campaigns", icon: Megaphone, translationKey: "Campaigns" },
    ],
  },
  {
    id: "configuration",
    title: t("Configuration"),
    titleKey: "Configuration",
    defaultOpen: true,
    items: [
      { label: t("Dashboard"), path: "/configuration", icon: Settings, translationKey: "Dashboard" },
      { label: t("Global Config"), path: "/configuration/global", icon: ToggleLeft, translationKey: "Global Config" },
      { label: t("External Services"), path: "/configuration/external-services", icon: Globe, translationKey: "External Services" },
      { label: t("Password Policy"), path: "/configuration/password-policy", icon: ShieldCheck, translationKey: "Password Policy" },
      { label: t("Business Date"), path: "/configuration/business-date", icon: Calendar, translationKey: "Business Date" },
    ],
  },
  {
    id: "reports",
    title: t("Reports & Data"),
    titleKey: "Reports & Data",
    defaultOpen: true,
    items: [
      { label: t("Reports"), path: "/reports", icon: FileText, translationKey: "Reports" },
      { label: t("Adhoc Queries"), path: "/adhoc-queries", icon: Calculator, translationKey: "Adhoc Queries" },
      { label: t("Datatables"), path: "/datatables", icon: LayoutGrid, translationKey: "Datatables" },
      { label: t("Entity Checks"), path: "/entity-datatable-checks", icon: ShieldCheck, translationKey: "Entity Checks" },
    ],
  },
  {
    id: "cob",
    title: t("Close of Business"),
    titleKey: "Close of Business",
    defaultOpen: true,
    items: [
      { label: t("Dashboard"), path: "/cob/dashboard", icon: Activity, translationKey: "Dashboard" },
      { label: t("Business Steps"), path: "/cob/steps", icon: ListOrdered, translationKey: "Business Steps" },
      { label: t("Catch-Up"), path: "/cob/catch-up", icon: Play, translationKey: "Catch-Up" },
      { label: t("Locked Loans"), path: "/cob/locked-loans", icon: Lock, translationKey: "Locked Loans" },
    ],
  },
  {
    id: "interop",
    title: t("Interoperation"),
    titleKey: "Interoperation",
    defaultOpen: true,
    items: [
      { label: t("Dashboard"), path: "/interop/dashboard", icon: Activity, translationKey: "Dashboard" },
      { label: t("Lookup Party"), path: "/interop/party/search", icon: Search, translationKey: "Lookup Party" },
      { label: t("Register Identifier"), path: "/interop/party/register", icon: UserPlus, translationKey: "Register Identifier" },
      { label: t("Transfers"), path: "/interop/transfers", icon: ArrowRightLeft, translationKey: "Transfers" },
      { label: t("Account Details"), path: "/interop/account", icon: Eye, translationKey: "Account Details" },
    ],
  },
  {
    id: "administration",
    title: t("Administration"),
    titleKey: "Administration",
    defaultOpen: true,
    items: [
      { label: t("Users"), path: "/admin/users", icon: UserCog, translationKey: "Users" },
      { label: t("Roles"), path: "/admin/roles", icon: ShieldCheck, translationKey: "Roles" },
      { label: t("Permissions"), path: "/admin/permissions", icon: KeyRound, translationKey: "Permissions" },
      { label: t("Tellers"), path: "/tellers", icon: Banknote, translationKey: "Tellers" },
      { label: t("Batch Operations"), path: "/admin/batch-operations", icon: Terminal, translationKey: "Batch Operations" },
    ],
  },
  {
    id: "logs",
    title: t("Logs"),
    titleKey: "Logs",
    defaultOpen: true,
    items: [
      { label: t("Audit Logs"), path: "/audit-logs", icon: ShieldCheck, translationKey: "Audit Logs" },
    ],
  },
];

// ─── NavItemLink sub-component ─────────────────────────────────
interface NavItemLinkProps {
  item: NavItem;
  collapsed: boolean;
  isActive: (path: string, exact?: boolean) => boolean;
}

const NavItemLink: FC<NavItemLinkProps> = ({ item, collapsed, isActive }) => {
  const Icon = item.icon;
  const active = isActive(item.path, item.exact);

  const link = (
    <NavLink
      to={item.path}
      className={cn(
        "group relative flex items-center rounded-lg transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D32F2F]/50",
        collapsed ? "h-10 w-10 justify-center" : "h-10 gap-3 px-3",
        active
          ? "bg-[#D32F2F]/10 text-[#D32F2F] dark:bg-[#D32F2F]/20 dark:text-[#D32F2F]"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-0.75 -translate-x-3.25 -translate-y-1/2 rounded-r-full bg-[#D32F2F]" />
      )}
      <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", active && "scale-110")} />
      {!collapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="z-50 ml-2">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return <li>{link}</li>;
};

// ─── NavSection sub-component ─────────────────────────────────
interface NavSectionProps {
  section: NavSectionConfig;
  collapsed: boolean;
  isActive: (path: string, exact?: boolean) => boolean;
}

const NavSection: FC<NavSectionProps> = ({ section, collapsed, isActive }) => {
  const [open, setOpen] = useState(section.defaultOpen ?? true);
  const anyActive = section.items.some((item) => isActive(item.path));

  // Auto-open when a child is active
  const isExpanded = collapsed ? false : open || anyActive;

  const toggleOpen = useCallback(() => {
    if (!collapsed) setOpen((prev) => !prev);
  }, [collapsed]);

  return (
    <div className="px-3 pb-1">
      {/* Section header */}
      {!collapsed && (
        <button
          onClick={toggleOpen}
          className={cn(
            "mb-1 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left transition-colors",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
          )}
        >
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wider transition-colors",
              anyActive ? "text-[#D32F2F]" : "text-gray-400 dark:text-gray-500",
            )}
          >
            {section.title}
          </span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 text-gray-400 transition-transform duration-200", isExpanded && "rotate-180")}
          />
        </button>
      )}
      {collapsed && <Separator className="mb-3" />}

      {/* Items */}
      {(isExpanded || collapsed) && (
        <TooltipProvider delayDuration={300} skipDelayDuration={0}>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => (
              <NavItemLink key={item.path} item={item} collapsed={collapsed} isActive={isActive} />
            ))}
          </ul>
        </TooltipProvider>
      )}
    </div>
  );
};

// ─── Sidebar ───────────────────────────────────────────────────
const bottomNavItems: NavItem[] = [{ label: "Settings", path: "/settings", icon: Settings }];

interface SidebarProps {
  drawerMode?: boolean;
  drawerOpen?: boolean;
}

const Sidebar: FC<SidebarProps> = ({ drawerMode = false, drawerOpen = false }) => {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const location = useLocation();
  const { t } = useTranslation();
  const sections = getSections(t);

  const isActive = useCallback(
    (path: string, exact?: boolean) => {
      if (path === "/") return location.pathname === "/";
      if (exact) return location.pathname === path;
      // Exact match or next char is "/" to avoid prefix collisions
      // e.g. /deposits/fixed should NOT match /deposits/fixed-products
      return location.pathname === path || location.pathname.startsWith(path + "/");
    },
    [location.pathname],
  );

  // In drawer mode, always show full sidebar (never collapsed)
  const collapsed = drawerMode ? false : sidebarCollapsed;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-900",
        // Desktop: width-based collapse
        !drawerMode && (sidebarCollapsed ? "w-18" : "w-70"),
        // Mobile drawer: translate-based slide-in
        drawerMode && "w-70",
        drawerMode && (drawerOpen ? "translate-x-0" : "-translate-x-full"),
        // On desktop, drawer mode should not apply
        "lg:translate-x-0",
        // When drawerMode is off on desktop, use width-based
        !drawerMode && "lg:w-(--sidebar-width)",
      )}
      style={
        !drawerMode
          ? ({ "--sidebar-width": sidebarCollapsed ? "4.5rem" : "17.5rem" } as React.CSSProperties)
          : undefined
      }
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-gray-200 px-4 dark:border-gray-700",
          sidebarCollapsed ? "justify-center" : "justify-between",
        )}
      >
        {/* {!sidebarCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
              <img src="/insee.png" alt="" />
            </div>

            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">Insee Hub</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Dashboard</span>
            </div>
          </div>
        )} */}
        {sidebarCollapsed && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D32F2F]">
            <LayoutDashboard className="h-4.5 w-4.5 text-white" />
          </div>
        )}
      </div>

      {/* Scrollable navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {sections.map((section) => (
          <NavSection key={section.id} section={section} collapsed={sidebarCollapsed} isActive={isActive} />
        ))}
      </nav>

      {/* TODO: Delete if do not need */}
      {/* Bottom: Settings */}
      {/* <div className="shrink-0 px-3 pb-4">
        <Separator className="mb-3" />
        <TooltipProvider delayDuration={300} skipDelayDuration={0}>
          <ul className="flex flex-col gap-1">
            {bottomNavItems.map((item) => (
              <NavItemLink key={item.path} item={item} collapsed={sidebarCollapsed} isActive={isActive} />
            ))}
          </ul>
        </TooltipProvider>
      </div> */}
    </aside>
  );
};

export default Sidebar;
