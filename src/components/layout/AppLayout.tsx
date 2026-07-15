import { type FC, type ReactNode, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AppLayoutProps {
    children: ReactNode;
}

const AppLayout: FC<AppLayoutProps> = ({ children }) => {
    const { sidebarCollapsed, theme, setSidebarCollapsed } = useUIStore();

    // Sync theme class to <html>
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme]);

    // Close sidebar overlay on Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && !sidebarCollapsed && window.innerWidth < 1024) {
                setSidebarCollapsed(true);
            }
        },
        [sidebarCollapsed, setSidebarCollapsed],
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Close sidebar overlay on backdrop click (mobile)
    const handleBackdropClick = () => {
        if (window.innerWidth < 1024) {
            setSidebarCollapsed(true);
        }
    };

    // Auto-collapse sidebar on small screens initially
    useEffect(() => {
        function handleResize() {
            if (window.innerWidth < 1024 && !sidebarCollapsed) {
                setSidebarCollapsed(true);
            }
        }
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <TooltipProvider delayDuration={300} skipDelayDuration={0}>
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
                {/* Sidebar */}
                <Sidebar />

                {/* Mobile overlay backdrop */}
                {!sidebarCollapsed && (
                    <div
                        className="fixed inset-0 z-35 bg-black/50 backdrop-blur-sm lg:hidden"
                        onClick={handleBackdropClick}
                        aria-hidden="true"
                    />
                )}

                {/* Main content area */}
                <main
                    className={cn(
                        "flex min-h-screen flex-col transition-all duration-300 ease-in-out",
                        sidebarCollapsed ? "ml-18" : "ml-70",
                        "w-full",
                    )}
                >
                    <TopNav />

                    {/* Page content */}
                    <div className="flex-1 p-6">{children}</div>
                </main>
            </div>
        </TooltipProvider>
    );
};

export default AppLayout;
