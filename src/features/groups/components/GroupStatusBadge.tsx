import { type FC } from "react";
import { Badge } from "@/components/ui/badge";
import type { GroupStatus } from "../types/group";
import { GROUP_STATUS_CONFIG, resolveGroupStatusLabel } from "../constants/status";

interface GroupStatusBadgeProps {
  status?: GroupStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const GroupStatusBadge: FC<GroupStatusBadgeProps> = ({ status, className, size = "md" }) => {
  const label = resolveGroupStatusLabel(status);
  const config: { variant: "success" | "warning" | "error" | "info" | "default"; label: string } = {
    variant: "default",
    label,
  };
  if (status?.code && GROUP_STATUS_CONFIG[status.code]) {
    config.variant = GROUP_STATUS_CONFIG[status.code].variant;
  } else if (GROUP_STATUS_CONFIG[label.toLowerCase()]) {
    config.variant = GROUP_STATUS_CONFIG[label.toLowerCase()].variant;
  }

  return (
    <Badge variant={config.variant} size={size} rounded className={className}>
      {label}
    </Badge>
  );
};

export default GroupStatusBadge;
export type { GroupStatusBadgeProps };
