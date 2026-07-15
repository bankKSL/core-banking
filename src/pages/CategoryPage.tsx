import React, { useMemo, useState, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categories as initialCategories } from "@/mock/data";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<Category["type"], string> = {
    interest: "Interest",
    fee: "Fee",
    cashback: "Cashback",
    reward: "Reward",
    penalty: "Penalty",
    loan: "Loan",
    deposit: "Deposit",
};

const TYPE_COLORS: Record<Category["type"], string> = {
    interest: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    fee: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    cashback: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    reward: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    penalty: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    loan: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    deposit: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const EMPTY_FORM = { name: "", type: "interest" as Category["type"], description: "" };

const CategoryPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return categories.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                TYPE_LABELS[c.type].toLowerCase().includes(q),
        );
    }, [categories, search]);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setDialogOpen(true);
    };

    const openEdit = (cat: Category) => {
        setEditingId(cat.id);
        setForm({ name: cat.name, type: cat.type, description: cat.description });
        setErrors({});
        setDialogOpen(true);
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = "Name is required";
        if (!form.description.trim()) e.description = "Description is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = useCallback(() => {
        if (!validate()) return;
        const now = new Date().toISOString();
        if (editingId) {
            setCategories((prev) =>
                prev.map((c) =>
                    c.id === editingId
                        ? { ...c, name: form.name.trim(), type: form.type, description: form.description.trim(), updatedAt: now }
                        : c,
                ),
            );
        } else {
            const newCat: Category = {
                id: `cat-${Date.now()}`,
                name: form.name.trim(),
                type: form.type,
                description: form.description.trim(),
                isActive: true,
                createdAt: now,
                updatedAt: now,
            };
            setCategories((prev) => [...prev, newCat]);
        }
        setDialogOpen(false);
    }, [editingId, form]);

    const handleDelete = useCallback(() => {
        if (!deleteTarget) return;
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
    }, [deleteTarget]);

    const columns: ColumnDef<Category>[] = [
        {
            key: "name",
            header: "Name",
            cell: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.name}</span>,
        },
        {
            key: "type",
            header: "Type",
            cell: (row) => (
                <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", TYPE_COLORS[row.type])}>
                    {TYPE_LABELS[row.type]}
                </span>
            ),
        },
        { key: "description", header: "Description" },
        {
            key: "isActive",
            header: "Status",
            cell: (row) => <StatusBadge status={row.isActive ? "active" : "inactive"} />,
        },
        {
            key: "actions",
            header: "Actions",
            cell: (row) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            openEdit(row);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(row);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Category Management"
                description="Manage campaign categories and their types"
                actions={
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Category
                    </Button>
                }
            />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Categories</CardTitle>
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search categories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={filtered} emptyState={{ message: "No categories found" }} />
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Category" : "New Category"}</DialogTitle>
                        <DialogDescription>
                            {editingId ? "Update the category details below." : "Fill in the details to create a new category."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <Input
                            label="Name"
                            placeholder="Category name"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            error={errors.name}
                        />
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">Type</label>
                            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as Category["type"] }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Textarea
                            label="Description"
                            placeholder="Brief description"
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            error={errors.description}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>{editingId ? "Save Changes" : "Create"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Category"
                description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
            />
        </div>
    );
};

export default CategoryPage;
