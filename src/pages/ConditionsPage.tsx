import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { campaigns } from "@/mock/data";
import type { EligibilityRule, Campaign } from "@/types";

interface FlatRule extends EligibilityRule {
  campaignId: string;
  campaignName: string;
  campaignStatus: Campaign["status"];
}

const ConditionsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const allRules: FlatRule[] = useMemo(() => {
    return campaigns.flatMap((c) =>
      c.eligibilityRules.map((rule) => ({
        ...rule,
        campaignId: c.id,
        campaignName: c.name,
        campaignStatus: c.status,
      })),
    );
  }, []);

  const filteredRules = useMemo(() => {
    const q = search.toLowerCase();
    return allRules.filter(
      (r) =>
        r.campaignName.toLowerCase().includes(q) ||
        r.field.toLowerCase().includes(q) ||
        r.operator.toLowerCase().includes(q) ||
        r.value.toLowerCase().includes(q),
    );
  }, [allRules, search]);

  const ruleColumns: ColumnDef<FlatRule>[] = [
    {
      key: "campaignName",
      header: "Campaign Name",
      cell: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.campaignName}</span>,
    },
    {
      key: "field",
      header: "Rule Field",
      cell: (row) => (
        <Badge variant="info" size="sm">
          {row.field}
        </Badge>
      ),
    },
    {
      key: "operator",
      header: "Operator",
      cell: (row) => (
        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">{row.operator}</code>
      ),
    },
    {
      key: "value",
      header: "Value",
      cell: (row) => <span className="font-mono text-sm">{row.value}</span>,
    },
    {
      key: "logicalOperator",
      header: "Logical Operator",
      cell: (row) =>
        row.logicalOperator ? (
          <Badge variant={row.logicalOperator === "AND" ? "info" : "warning"} size="sm">
            {row.logicalOperator}
          </Badge>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      key: "campaignStatus",
      header: "Campaign Status",
      cell: (row) => <StatusBadge status={row.campaignStatus} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Conditions" description="Eligibility Rules & Condition Groups" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All Rules</TabsTrigger>
            <TabsTrigger value="byCampaign">By Campaign</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search rules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Eligibility Rules ({filteredRules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={ruleColumns}
                data={filteredRules}
                emptyState={{
                  title: "No rules found",
                  message: search ? "Try adjusting your search query." : "No eligibility rules have been defined yet.",
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="byCampaign">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {campaigns.map((campaign) => (
                  <AccordionItem key={campaign.id} value={campaign.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3 text-left">
                        <span className="font-medium">{campaign.name}</span>
                        <StatusBadge status={campaign.status} size="sm" />
                        <span className="text-xs text-gray-500">
                          ({campaign.eligibilityRules.length} rule
                          {campaign.eligibilityRules.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {campaign.eligibilityRules.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center">
                          No eligibility rules defined for this campaign.
                        </p>
                      ) : (
                        <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                                  Field
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                                  Operator
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                                  Value
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                                  Logical Op
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {campaign.eligibilityRules.map((rule, idx) => (
                                <tr key={rule.id} className="border-t border-gray-100 dark:border-gray-700">
                                  <td className="px-4 py-2">
                                    <Badge variant="info" size="sm">
                                      {rule.field}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2">
                                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">
                                      {rule.operator}
                                    </code>
                                  </td>
                                  <td className="px-4 py-2 font-mono">{rule.value}</td>
                                  <td className="px-4 py-2">
                                    {rule.logicalOperator ? (
                                      <Badge variant={rule.logicalOperator === "AND" ? "info" : "warning"} size="sm">
                                        {rule.logicalOperator}
                                      </Badge>
                                    ) : (
                                      <span className="text-gray-400 text-xs">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConditionsPage;
