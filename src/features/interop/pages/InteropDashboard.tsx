import { type FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Search,
  UserPlus,
  ArrowRightLeft,
  Eye,
  HandCoins,
  Landmark,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHealthCheck } from "../hooks/useInterop";

const quickActions = [
  {
    label: "Lookup Party",
    description: "Find account by MSISDN, email, or other identifier",
    path: "/interop/party/search",
    icon: Search,
    color: "text-blue-600",
  },
  {
    label: "Register Identifier",
    description: "Link an identifier to a savings account",
    path: "/interop/party/register",
    icon: UserPlus,
    color: "text-emerald-600",
  },
  {
    label: "Create Transfer",
    description: "Quote, prepare, and commit a transfer",
    path: "/interop/transfers",
    icon: ArrowRightLeft,
    color: "text-purple-600",
  },
  {
    label: "Account Details",
    description: "View account info, identifiers, transactions, KYC",
    path: "/interop/account",
    icon: Eye,
    color: "text-orange-600",
  },
  {
    label: "Disburse Loan",
    description: "Disburse a loan by external account ID",
    path: "/interop/loan/disburse",
    icon: HandCoins,
    color: "text-cyan-600",
  },
  {
    label: "Loan Repayment",
    description: "Make a loan repayment by external account ID",
    path: "/interop/loan/repayment",
    icon: Landmark,
    color: "text-rose-600",
  },
];

const InteropDashboard: FC = () => {
  const navigate = useNavigate();
  const { data: health, isLoading: healthLoading } = useHealthCheck();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Interoperation"
        description="Mojaloop-compatible digital financial services — party management, quotes, transfers, and loan operations"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Service Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </div>
            ) : health === "OK" ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Operational ({health})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Unavailable</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#D32F2F]/30 hover:shadow-sm transition-all text-left dark:border-gray-700 dark:hover:border-[#D32F2F]/50"
                >
                  <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${action.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
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

export default InteropDashboard;
