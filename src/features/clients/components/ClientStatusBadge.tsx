import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { CLIENT_STATUS_CONFIG } from "../constants/status";

interface ClientStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-5 px-2 text-[10px] gap-0.5",
  md: "h-6 px-2.5 text-xs gap-1",
  lg: "h-8 px-3 text-sm gap-1.5",
};

const ClientStatusBadge: FC<ClientStatusBadgeProps> = ({ status, size = "md", className }) => {
  const config = CLIENT_STATUS_CONFIG[status] ?? { variant: "default" as const, label: status };

  return (
    <Badge variant={config.variant} size={size} rounded className={className}>
      {config.label}
    </Badge>
  );
};

export default ClientStatusBadge;
