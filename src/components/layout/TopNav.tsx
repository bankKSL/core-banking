import { type FC, useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, Menu, Moon, Sun, User, LogOut, ChevronDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore, useAuthStore } from "@/store";
import { useLogout } from "@/features/authentication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// ----- Breadcrumb path label mapping -----
const pathLabels: Record<string, string> = {
  "/": "Dashboard",
  "/campaign": "Campaign",
  "/category": "Category",
  "/products": "Products",
  "/conditions": "Conditions",
  "/formula-builder": "Formula Builder",
  "/actions": "Actions",
  "/simulation": "Simulation",
  "/execution-logs": "Execution Logs",
  "/audit-logs": "Audit Logs",
  "/exchange-rates": "Exchange Rates",
  "/lending/applications/new": "New Application",
  "/deposits/accounts/new": "New Account",
  "/settings": "Settings",
};

function useBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Dashboard", path: "/", active: true }];
  }

  const crumbs = [{ label: "Dashboard", path: "/", active: false }];

  let accumulatedPath = "";
  segments.forEach((segment, i) => {
    accumulatedPath += `/${segment}`;
    const label = pathLabels[accumulatedPath] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({
      label,
      path: accumulatedPath,
      active: i === segments.length - 1,
    });
  });

  return crumbs;
}

const TopNav: FC = () => {
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const breadcrumbs = useBreadcrumbs();

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <header className="sticky top-0 z-30 min-w-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Top bar */}
      <div className="flex justify-between items-center h-16 gap-4 px-6">
        {/* Left: hamburger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <Badge
                  variant="default"
                  size="sm"
                  rounded
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center px-1 text-[9px] leading-none"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <Bell className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p>No new notifications</p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2 rounded-lg p-1.5 transition-colors",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D32F2F]/50",
                )}
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar.png" alt="Admin User" />
                  <AvatarFallback className="bg-[#D32F2F]/10 text-[#D32F2F] text-xs font-semibold dark:bg-[#D32F2F]/20">AU</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 md:inline">Admin</span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-gray-400 md:inline" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span>{user?.username ?? "Admin User"}</span>
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{user?.officeName ?? "Head Office"}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 dark:text-red-400"
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Breadcrumb row */}
      <div className="border-t border-gray-100 px-6 py-2.5 dark:border-gray-800">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <BreadcrumbItem key={crumb.path}>
                  {!isLast ? (
                    <>
                      <BreadcrumbLink href={crumb.path} className="text-xs">
                        {crumb.label}
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  ) : (
                    <BreadcrumbPage className="text-xs font-semibold">{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
};

export default TopNav;
