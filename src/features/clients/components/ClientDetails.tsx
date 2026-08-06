import type { FC } from "react";
import { User, Phone, Mail, Calendar, Clock, Hash, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "../types/client";
import ClientStatusBadge from "./ClientStatusBadge";
import { getClientDisplayName, getClientStatus, formatClientDate, calculateAge } from "../utils/client";
import { useTranslation } from "react-i18next";

interface ClientDetailsProps {
  client: Client;
}

const InfoRow: FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <span className="mt-0.5 text-gray-400">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="text-sm text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  </div>
);

const ClientDetails: FC<ClientDetailsProps> = ({ client }) => {
  const { t } = useTranslation();
  const status = getClientStatus(client);
  const displayName = getClientDisplayName(client);
  const age = calculateAge(client?.dateOfBirth);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="h-4 w-4 text-gray-400" />
            {t("Basic Information")}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow icon={<Hash className="h-4 w-4" />} label={t("Client ID")} value={client.id} />
          <InfoRow icon={<Hash className="h-4 w-4" />} label={t("Account Number")} value={client.accountNo ?? "—"} />
          <InfoRow icon={<Hash className="h-4 w-4" />} label={t("External ID")} value={client.externalId ?? "—"} />
          <InfoRow icon={<Hash className="h-4 w-4" />} label={t("Status")} value={<ClientStatusBadge status={status} />} />
          <InfoRow icon={<Building2 className="h-4 w-4" />} label={t("Office")} value={client.officeName ?? "—"} />
          <InfoRow icon={<User className="h-4 w-4" />} label={t("Staff")} value={client.staffName ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-gray-400" />
            {t("Personal Information")}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow icon={<User className="h-4 w-4" />} label={t("Full Name")} value={displayName} />
          <InfoRow icon={<User className="h-4 w-4" />} label={t("First Name")} value={client.firstname ?? "—"} />
          <InfoRow icon={<User className="h-4 w-4" />} label={t("Middle Name")} value={client.middlename ?? "—"} />
          <InfoRow icon={<User className="h-4 w-4" />} label={t("Last Name")} value={client.lastname ?? "—"} />
          <InfoRow icon={<User className="h-4 w-4" />} label={t("Gender")} value={client.gender?.name ?? "—"} />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label={t("Date of Birth")}
            value={
              client.dateOfBirth
                ? `${formatClientDate(client.dateOfBirth)}${age !== null ? ` (${age} years)` : ""}`
                : "—"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-gray-400" />
            {t("Contact Information")}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow icon={<Phone className="h-4 w-4" />} label={t("Mobile Number")} value={client.mobileNo ?? "—"} />
          <InfoRow icon={<Mail className="h-4 w-4" />} label={t("Email")} value={client.emailAddress ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-gray-400" />
            {t("Timeline")}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label={t("Submitted On")}
            value={formatClientDate(client.timeline?.submittedOnDate)}
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label={t("Activated On")}
            value={formatClientDate(client.activationDate ?? client.timeline?.activatedOnDate)}
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label={t("Closed On")}
            value={formatClientDate(client.timeline?.closedOnDate)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDetails;
