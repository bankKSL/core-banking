import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Search, User, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { partySearchSchema, type PartySearchFormValues } from "../schemas/interop.schema";
import { usePartyLookup } from "../hooks/useInterop";
import { IDENTIFIER_TYPE_OPTIONS } from "../types/interop";

const PartySearchPage: FC = () => {
  const navigate = useNavigate();
  const [searchIdType, setSearchIdType] = useState<string>("");
  const [searchIdValue, setSearchIdValue] = useState<string>("");
  const [searched, setSearched] = useState(false);

  const { data: party, isLoading } = usePartyLookup(
    searched ? searchIdType : undefined,
    searched ? searchIdValue : undefined,
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PartySearchFormValues>({
    resolver: zodResolver(partySearchSchema),
    defaultValues: { idType: "MSISDN", idValue: "", subIdOrType: "" },
  });

  const onSubmit = (values: PartySearchFormValues) => {
    setSearchIdType(values.idType);
    setSearchIdValue(values.idValue);
    setSearched(true);
  };

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title="Lookup Party"
        description="Find an account by secondary identifier (MSISDN, email, IBAN, etc.)"
        actions={
          <Button variant="outline" onClick={() => navigate("/interop/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search by Identifier</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Identifier Type *</Label>
                <Select onValueChange={(v) => setValue("idType", v)} defaultValue="MSISDN">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {IDENTIFIER_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.idType && <p className="text-xs text-red-500 mt-1">{errors.idType.message}</p>}
              </div>
              <div>
                <Label htmlFor="idValue">Identifier Value *</Label>
                <Input id="idValue" {...register("idValue")} placeholder="e.g. 254700111222" />
                {errors.idValue && <p className="text-xs text-red-500 mt-1">{errors.idValue.message}</p>}
              </div>
              <div className="flex items-end">
                <Button type="submit" className="bg-[#D32F2F] hover:bg-red-700 w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      )}

      {searched && !isLoading && party && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Party Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <User className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium">{party.displayName ?? "Unknown"}</p>
                  <p className="text-sm text-gray-500 font-mono">{party.accountId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">External Account ID</p>
                  <p className="font-mono text-sm">{party.accountId}</p>
                </div>
                {party.identifierType && (
                  <div>
                    <p className="text-xs text-gray-500">Identifier Type</p>
                    <Badge variant="info">{party.identifierType}</Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/interop/account?id=${party.accountId}`)}>
                  View Account
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/interop/transfers?accountId=${party.accountId}`)}
                >
                  New Transfer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {searched && !isLoading && !party && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No party found with the specified identifier.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PartySearchPage;
