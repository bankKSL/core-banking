import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import GroupTable from "../components/GroupTable";
import { useGroups } from "../hooks/useGroups";
import { GROUPS_PAGE_SIZE } from "../constants/status";

type SortField = "name" | "officeName";
type SortDirection = "asc" | "desc";

const GroupListPage: FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Server-side search / sort / pagination — one request per change
  const queryParams = useMemo(
    () => ({
      offset: (page - 1) * GROUPS_PAGE_SIZE,
      limit: GROUPS_PAGE_SIZE,
      paged: true as const,
      name: search || undefined,
      orderBy: sortField,
      sortOrder: sortDirection.toUpperCase() as "ASC" | "DESC",
    }),
    [page, search, sortField, sortDirection],
  );

  const { data, isLoading, isError, error, refetch } = useGroups(queryParams);

  const groups = useMemo(() => data?.pageItems ?? [], [data]);
  const totalRecords = data?.totalFilteredRecords ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / GROUPS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Groups"
          description="Manage self-help groups in Fineract"
          actions={
            <Button onClick={() => navigate("/groups/create")} className="bg-[#D32F2F] hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" /> Create Group
            </Button>
          }
        />
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm">Failed to load groups. {error?.message ?? "Please try again."}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        description="Manage self-help groups in Fineract"
        actions={
          <Button onClick={() => navigate("/groups/create")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> Create Group
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Groups</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by group name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={`${sortField}:${sortDirection}`}
              onValueChange={(v) => {
                const [field, dir] = v.split(":") as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(dir);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name:asc">Name (A → Z)</SelectItem>
                <SelectItem value="name:desc">Name (Z → A)</SelectItem>
                <SelectItem value="officeName:asc">Office (A → Z)</SelectItem>
                <SelectItem value="officeName:desc">Office (Z → A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <GroupTable data={groups} />
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalItems={totalRecords}
                    pageSize={GROUPS_PAGE_SIZE}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupListPage;
