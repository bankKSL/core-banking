import { type FC, useState, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Megaphone,
    Tags,
    Package,
    Filter,
    Calculator,
    Play,
    FlaskConical,
    FileText,
    ShieldCheck,
    Settings,
    ChevronDown,
    Landmark,
    Banknote,
    CalendarClock,
    Briefcase,
    Wallet,
    ArrowUpCircle,
    Receipt,
    PiggyBank,
    Globe,
    Users,
    UserCheck,
    Shield,
    LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
    label: string;
    path: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface NavSectionConfig {
    id: string;
    title: string;
    items: NavItem[];
    defaultOpen?: boolean;
}

const sections: NavSectionConfig[] = [
    {
        id: "dashboard",
        title: "Dashboard",
        defaultOpen: true,
        items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard }],
    },
    {
        id: "lending",
        title: "Lending",
        defaultOpen: true,
        items: [
            { label: "Loan Applications", path: "/lending/applications", icon: Banknote },
            { label: "Loan Products", path: "/lending/products", icon: Briefcase },
            { label: "Repayment Schedule", path: "/lending/repayments", icon: CalendarClock },
            { label: "Collateral", path: "/lending/collateral", icon: Landmark },
        ],
    },
    {
        id: "deposits",
        title: "Deposits",
        defaultOpen: true,
        items: [
            { label: "Deposit Accounts", path: "/deposits/accounts", icon: PiggyBank },
            { label: "Savings Products", path: "/deposits/products", icon: LayoutGrid },
            { label: "Transactions", path: "/deposits/transactions", icon: Receipt },
            { label: "Withdrawals", path: "/deposits/withdrawals", icon: ArrowUpCircle },
            { label: "Fixed Deposits", path: "/deposits/fixed", icon: Wallet },
        ],
    },
    {
        id: "treasury",
        title: "Treasury",
        defaultOpen: true,
        items: [{ label: "Exchange Rates", path: "/exchange-rates", icon: Globe }],
    },
    {
        id: "crm",
        title: "CRM",
        defaultOpen: true,
        items: [
            { label: "Clients", path: "/clients", icon: Users },
            { label: "Customers", path: "/customers", icon: UserCheck },
            { label: "Score Grade", path: "/score-grade", icon: Shield },
        ],
    },
    {
        id: "formula-engine",
        title: "Formula Engine",
        defaultOpen: true,
        items: [
            { label: "Campaign", path: "/campaign", icon: Megaphone },
            { label: "Category", path: "/category", icon: Tags },
            { label: "Products", path: "/products", icon: Package },
            { label: "Conditions", path: "/conditions", icon: Filter },
            { label: "Formula Builder", path: "/formula-builder", icon: Calculator },
            { label: "Actions", path: "/actions", icon: Play },
            { label: "Simulation", path: "/simulation", icon: FlaskConical },
            { label: "Execution Logs", path: "/execution-logs", icon: FileText },
            { label: "Audit Logs", path: "/audit-logs", icon: ShieldCheck },
        ],
    },
];

// ─── NavItemLink sub-component ─────────────────────────────────
interface NavItemLinkProps {
    item: NavItem;
    collapsed: boolean;
    isActive: (path: string) => boolean;
}

const NavItemLink: FC<NavItemLinkProps> = ({ item, collapsed, isActive }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

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
    isActive: (path: string) => boolean;
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

    const isActive = useCallback(
        (path: string) => {
            if (path === "/") return location.pathname === "/";
            return location.pathname.startsWith(path);
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
            style={!drawerMode ? ({ "--sidebar-width": sidebarCollapsed ? "4.5rem" : "17.5rem" } as React.CSSProperties) : undefined}
        >
            {/* Logo area */}
            <div
                className={cn(
                    "flex h-16 shrink-0 items-center border-b border-gray-200 px-4 dark:border-gray-700",
                    sidebarCollapsed ? "justify-center" : "justify-between",
                )}
            >
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D32F2F]">
                            <LayoutDashboard className="h-4.5 w-4.5 text-white" />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">Insee Hub</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Dashboard</span>
                        </div>
                    </div>
                )}
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

            {/* Bottom: Settings */}
            <div className="shrink-0 px-3 pb-4">
                <Separator className="mb-3" />
                <TooltipProvider delayDuration={300} skipDelayDuration={0}>
                    <ul className="flex flex-col gap-1">
                        {bottomNavItems.map((item) => (
                            <NavItemLink key={item.path} item={item} collapsed={sidebarCollapsed} isActive={isActive} />
                        ))}
                    </ul>
                </TooltipProvider>
            </div>
        </aside>
    );
};

export default Sidebar;
