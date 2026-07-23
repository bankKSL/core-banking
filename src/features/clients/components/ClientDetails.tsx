import type { FC } from "react";
import { User, Phone, Mail, Calendar, Clock, Hash, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "../types/client";
import ClientStatusBadge from "./ClientStatusBadge";
import { getClientDisplayName, getClientStatus, formatClientDate, calculateAge } from "../utils/client";

interface ClientDetailsProps {
  client: Client;
}

const InfoRow: FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <span className="mt-0.5 text-gray-400">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const ClientDetails: FC<ClientDetailsProps> = ({ client }) => {
  const status = getClientStatus(client);
  const displayName = getClientDisplayName(client);
  const age = calculateAge(client?.dateOfBirth);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="h-4 w-4 text-gray-400" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow icon={<Hash className="h-4 w-4" />} label="Client ID" value={client.id} />
          <InfoRow icon={<Hash className="h-4 w-4" />} label="Account Number" value={client.accountNo ?? "—"} />
          <InfoRow icon={<Hash className="h-4 w-4" />} label="External ID" value={client.externalId ?? "—"} />
          <InfoRow icon={<Hash className="h-4 w-4" />} label="Status" value={<ClientStatusBadge status={status} />} />
          <InfoRow icon={<Building2 className="h-4 w-4" />} label="Office" value={client.officeName ?? "—"} />
          <InfoRow icon={<User className="h-4 w-4" />} label="Staff" value={client.staffName ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-gray-400" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow icon={<User className="h-4 w-4" />} label="Full Name" value={displayName} />
          <InfoRow icon={<User className="h-4 w-4" />} label="First Name" value={client.firstname ?? "—"} />
          <InfoRow icon={<User className="h-4 w-4" />} label="Middle Name" value={client.middlename ?? "—"} />
          <InfoRow icon={<User className="h-4 w-4" />} label="Last Name" value={client.lastname ?? "—"} />
          <InfoRow icon={<User className="h-4 w-4" />} label="Gender" value={client.gender?.name ?? "—"} />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Date of Birth"
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
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Mobile Number" value={client.mobileNo ?? "—"} />
          <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={client.emailAddress ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-gray-400" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Submitted On"
            value={formatClientDate(client.timeline?.submittedOnDate)}
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Activated On"
            value={formatClientDate(client.activationDate ?? client.timeline?.activatedOnDate)}
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Closed On"
            value={formatClientDate(client.timeline?.closedOnDate)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDetails;
