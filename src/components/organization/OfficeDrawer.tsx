import React from "react";
import { X, Building2, MapPin, Calendar, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Office } from "@/types";

interface OfficeDrawerProps {
  office: Office | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (office: Office) => void;
}

const OfficeDrawer: React.FC<OfficeDrawerProps> = ({ office, open, onClose, onEdit }) => {
  if (!office) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      {/* Side panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-xl transition-transform duration-300 dark:border-gray-700 dark:bg-gray-900",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950">
              <Building2 className="h-5 w-5 text-[#D32F2F]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{office.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Office #{office.id}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Separator />

        {/* Details */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <DetailRow icon={Building2} label="Full Name" value={office.nameDecorated} />
          <DetailRow icon={Hash} label="External ID" value={office.externalId || "—"} />
          <DetailRow icon={Calendar} label="Opening Date" value={office.openingDate} />
          <DetailRow icon={MapPin} label="Parent Office" value={office.parentName ?? "None (root)"} />
          <DetailRow icon={Hash} label="Hierarchy" value={office.hierarchy} />
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          {onEdit && (
            <Button className="w-full" onClick={() => onEdit(office)}>
              Edit Office
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

export default OfficeDrawer;
