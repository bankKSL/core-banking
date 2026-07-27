import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, UsersRound, Banknote, PiggyBank, Inbox } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { useSearch } from "../hooks/useSearch";
import type { SearchResult } from "../api/search";

const RESOURCE_OPTIONS = [
  { value: "clients", label: "Clients", icon: Users },
  { value: "groups", label: "Groups", icon: UsersRound },
  { value: "loans", label: "Loans", icon: Banknote },
  { value: "savings", label: "Savings", icon: PiggyBank },
] as const;

const ENTITY_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  clients: Users,
  groups: UsersRound,
  loans: Banknote,
  savings: PiggyBank,
};

const ENTITY_ROUTES: Record<string, string> = {
  clients: "/clients",
  loans: "/loans/view",
  groups: "/groups",
  savings: "/deposits/saving-accounts",
};

const ENTITY_LABELS: Record<string, string> = {
  clients: "Clients",
  groups: "Groups",
  loans: "Loans",
  savings: "Savings",
};

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedResources, setSelectedResources] = useState<string[]>(["clients", "groups", "loans", "savings"]);
  const [exactMatch, setExactMatch] = useState(false);

  const resourceParam = useMemo(() => selectedResources.join(","), [selectedResources]);

  const { data, isLoading, isError, refetch, isRefetching } = useSearch(query, resourceParam, exactMatch);

  const groupedResults = useMemo(() => {
    if (!data) return {};
    const groups: Record<string, SearchResult[]> = {};
    for (const item of data) {
      const key = item.entityType.toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [data]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
    },
    [],
  );

  const toggleResource = useCallback((value: string) => {
    setSelectedResources((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value],
    );
  }, []);

  const handleResultClick = useCallback(
    (item: SearchResult) => {
      const route = ENTITY_ROUTES[item.entityType.toLowerCase()];
      if (route) {
        navigate(`${route}/${item.entityId}`);
      }
    },
    [navigate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const target = e.target as HTMLInputElement;
        setQuery(target.value);
      }
    },
    [],
  );

  const resultCount = useMemo(() => data?.length ?? 0, [data]);

  const emptyState = useMemo(() => {
    if (!query) return { icon: <Search className="h-12 w-12" />, title: "Search", message: "Enter a search term to find clients, groups, loans, or savings accounts." };
    return { icon: <Inbox className="h-12 w-12" />, title: "No results found", message: "Try adjusting your search term or filters." };
  }, [query]);

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader title="Global Search" description="Search across clients, groups, loans, and savings accounts" />
        <ErrorState message="Failed to perform search." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Search"
        description="Search across clients, groups, loans, and savings accounts"
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, account number, or external ID..."
                defaultValue={query}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-20"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                Search
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {RESOURCE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedResources.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleResource(opt.value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-[#D32F2F] text-white"
                          : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Switch id="exact-match" checked={exactMatch} onCheckedChange={setExactMatch} />
                <Label htmlFor="exact-match" className="text-sm text-gray-500 cursor-pointer">
                  Exact match
                </Label>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-60" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!isLoading && resultCount === 0 && query && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 px-4">
              {emptyState.icon}
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">{emptyState.title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{emptyState.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && resultCount === 0 && !query && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Search className="h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Search</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter a search term to find clients, groups, loans, or savings accounts.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped Results */}
      {!isLoading && resultCount > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(groupedResults).map(([entityType, items]) => {
            const Icon = ENTITY_ICONS[entityType] ?? Search;
            const label = ENTITY_LABELS[entityType] ?? entityType;
            return (
              <Card key={entityType}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5" />
                    {label}
                    <span className="ml-auto text-sm font-normal text-gray-500">
                      {items.length} result{items.length !== 1 ? "s" : ""}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {items.map((item, idx) => {
                      const parentLabel = item.parentName
                        ? `${item.parentType?.toLowerCase() === "client" ? "Client" : "Group"}: ${item.parentName}`
                        : null;
                      return (
                        <div
                          key={`${item.entityType}-${item.entityId}-${idx}`}
                          className="flex cursor-pointer items-center gap-4 py-3 px-2 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          onClick={() => handleResultClick(item)}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                            <Icon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                {item.entityName}
                              </span>
                              <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-50 px-1.5 py-0 text-[10px] font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                {item.entityAccountNo}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                              {item.entityExternalId && <span>ID: {item.entityExternalId}</span>}
                              {item.entityStatus?.value && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span>{item.entityStatus.value}</span>
                                </>
                              )}
                              {parentLabel && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span>{parentLabel}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
