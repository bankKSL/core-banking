import React from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { STANDING_INSTRUCTION_STATUS_CONFIG } from "../constants/status";

interface StatusBadgeProps {
  status: { id: number; code?: string; value?: string };
}

const statusCodeMap: Record<number, string> = {
  1: "active",
  2: "disabled",
  3: "deleted",
};

const StandingInstructionStatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusCode = statusCodeMap[status.id] ?? "unknown";
  const config = STANDING_INSTRUCTION_STATUS_CONFIG[status.id];

  return <StatusBadge status={statusCode} label={config?.label ?? status.value ?? "Unknown"} />;
};

export { StandingInstructionStatusBadge };
