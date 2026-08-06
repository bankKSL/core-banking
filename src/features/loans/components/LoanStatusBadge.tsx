import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LOAN_STATUS_CONFIG } from "../constants/status";

interface LoanStatusBadgeProps {
  code?: string;
  size?: "sm" | "md" | "lg";
}

const LoanStatusBadge: FC<LoanStatusBadgeProps> = ({ code, size = "md" }) => {
  const { t } = useTranslation();
  if (!code) return <span className="text-sm text-gray-400">—</span>;
  const cfg = LOAN_STATUS_CONFIG[code];
  if (cfg) {
    return <StatusBadge status={cfg.variant} label={cfg.label} size={size} />;
  }
  return <StatusBadge status={t(code)} size={size} />;
};

export default LoanStatusBadge;
