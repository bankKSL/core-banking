import React from "react";
import { ChevronRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Office } from "@/types";

interface OfficeBreadcrumbProps {
  office: Office | null;
  offices: Office[];
  onNavigate?: (office: Office) => void;
}

/** Build breadcrumb trail from an office's hierarchy up to root */
const OfficeBreadcrumb: React.FC<OfficeBreadcrumbProps> = ({ office, offices, onNavigate }) => {
  if (!office) return null;

  // Parse hierarchy (e.g. ".1.3.5.") to get ancestor ids
  const hierarchyParts = office.hierarchy.split(".").filter(Boolean).map(Number);

  const ancestors = hierarchyParts
    .slice(0, -1) // exclude self
    .map((id) => offices.find((o) => o.id === id))
    .filter(Boolean) as Office[];

  const trail = [...ancestors, office];

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Office breadcrumb">
      {trail.map((step, idx) => (
        <React.Fragment key={step.id}>
          {idx > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          <button
            onClick={() => onNavigate?.(step)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
              idx === trail.length - 1
                ? "font-semibold text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400",
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            {step.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default OfficeBreadcrumb;
