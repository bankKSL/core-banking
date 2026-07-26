import { type FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Globe,
  ShieldCheck,
  Calendar,
  Database,
  Mail,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfigSection {
  label: string;
  description: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

const sections: ConfigSection[] = [
  {
    label: "Global Configuration",
    description: "Manage system-wide settings and feature flags",
    path: "/configuration/global",
    icon: Settings,
    color: "text-blue-600",
  },
  {
    label: "External Services",
    description: "Configure S3, SMTP, SMS, and Notification services",
    path: "/configuration/external-services",
    icon: Globe,
    color: "text-emerald-600",
  },
  {
    label: "Password Policy",
    description: "View and change the active password validation policy",
    path: "/configuration/password-policy",
    icon: ShieldCheck,
    color: "text-purple-600",
  },
  {
    label: "Business Date",
    description: "View and update business dates",
    path: "/configuration/business-date",
    icon: Calendar,
    color: "text-orange-600",
  },
  {
    label: "Cache Management",
    description: "View and switch cache implementation",
    path: "/configuration/cache",
    icon: Database,
    color: "text-cyan-600",
  },
  {
    label: "Email Configuration",
    description: "Configure SMTP email settings",
    path: "/configuration/email",
    icon: Mail,
    color: "text-rose-600",
  },
  {
    label: "External Events",
    description: "Toggle external event type configurations",
    path: "/configuration/external-events",
    icon: Zap,
    color: "text-amber-600",
  },
];

const ConfigurationDashboard: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Configuration & Admin"
        description="Manage global settings, external services, password policies, and system configuration"
      />
      <Card>
        <CardHeader>
          <CardTitle>Configuration Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.path}
                  type="button"
                  onClick={() => navigate(section.path)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#D32F2F]/30 hover:shadow-sm transition-all text-left dark:border-gray-700 dark:hover:border-[#D32F2F]/50"
                >
                  <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${section.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{section.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationDashboard;
