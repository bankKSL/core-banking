import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: {
        direction: "up" | "down";
        percentage: string | number;
    };
    variant?: "default" | "success" | "warning" | "error";
    className?: string;
}

const variantStyles: Record<NonNullable<StatCardProps["variant"]>, { iconBg: string; iconColor: string; trendGood: "up" | "down" }> = {
    default: {
        iconBg: "bg-[#D32F2F]/10 dark:bg-[#D32F2F]/20",
        iconColor: "text-[#D32F2F]",
        trendGood: "up",
    },
    success: {
        iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        trendGood: "up",
    },
    warning: {
        iconBg: "bg-amber-100 dark:bg-amber-900/30",
        iconColor: "text-amber-600 dark:text-amber-400",
        trendGood: "down",
    },
    error: {
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        trendGood: "down",
    },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, variant = "default", className }) => {
    const styles = variantStyles[variant];
    const trendIsPositive = trend?.direction === styles.trendGood;

    return (
        <Card
            className={cn(
                "rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800",
                className,
            )}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                        <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{value}</p>
                        {trend && (
                            <div className="flex items-center gap-1.5">
                                {trendIsPositive ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                                )}
                                <span
                                    className={cn(
                                        "text-sm font-medium",
                                        trendIsPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                                    )}
                                >
                                    {trend.percentage}%
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">vs last period</span>
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", styles.iconBg)}>
                            <Icon className={cn("h-6 w-6", styles.iconColor)} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export { StatCard };
export type { StatCardProps };
