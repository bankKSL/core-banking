import React, { useState, useMemo, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, Users, UserCheck, ShieldAlert, Building2, Phone, Mail, MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { customers } from "@/mock/data";
import type { Customer, CustomerStatus, KycStatus, RiskRating, CustomerType } from "@/types";

const PAGE_SIZE = 8;

const kycColors: Record<KycStatus, string> = {
    verified: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    expired: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const riskColors: Record<RiskRating, string> = {
    low: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const emptyCustomer: Omit<Customer, "id" | "createdAt" | "updatedAt"> = {
    customerId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    nationalId: "",
    customerType: "individual",
    status: "active",
    kycStatus: "pending",
    riskRating: "low",
    address: { street: "", city: "", state: "", country: "", postalCode: "" },
    branchName: "",
    relationshipManager: "",
    onboardingDate: new Date().toISOString().split("T")[0],
};

const CustomerPage: React.FC = () => {
    const [data, setData] = useState<Customer[]>(customers);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [selectedTab, setSelectedTab] = useState("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
    const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
    const [form, setForm] = useState<Omit<Customer, "id" | "createdAt" | "updatedAt">>(emptyCustomer);

    const stats = useMemo(
        () => ({
            total: data.length,
            active: data.filter((c) => c.status === "active").length,
            business: data.filter((c) => c.customerType === "business").length,
            pendingKyc: data.filter((c) => c.kycStatus === "pending").length,
        }),
        [data],
    );

    const filtered = useMemo(() => {
        let result = data;
        if (selectedTab === "active") result = result.filter((c) => c.status === "active");
        else if (selectedTab === "inactive") result = result.filter((c) => c.status === "inactive" || c.status === "suspended");
        const q = search.toLowerCase();
        if (q)
            result = result.filter(
                (c) =>
                    `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
                    c.customerId.toLowerCase().includes(q) ||
                    c.email.toLowerCase().includes(q),
            );
        if (typeFilter !== "all") result = result.filter((c) => c.customerType === typeFilter);
        if (statusFilter !== "all") result = result.filter((c) => c.status === statusFilter);
        return result;
    }, [data, search, typeFilter, statusFilter, selectedTab]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginated = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyCustomer);
        setDialogOpen(true);
    };

    const openEdit = (c: Customer) => {
        setEditingId(c.id);
        setForm({
            customerId: c.customerId,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            dateOfBirth: c.dateOfBirth,
            gender: c.gender,
            nationalId: c.nationalId,
            customerType: c.customerType,
            status: c.status,
            kycStatus: c.kycStatus,
            riskRating: c.riskRating,
            address: { ...c.address },
            branchName: c.branchName,
            relationshipManager: c.relationshipManager,
            onboardingDate: c.onboardingDate,
            notes: c.notes,
        });
        setDialogOpen(true);
    };

    const handleSave = useCallback(() => {
        if (!form.firstName || !form.lastName) return;
        if (editingId) {
            setData((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...form, updatedAt: new Date().toISOString() } : c)));
        } else {
            const newCust: Customer = {
                ...form,
                id: `cust-${Date.now()}`,
                customerId: `CUST-${100000 + data.length + 1}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setData((prev) => [newCust, ...prev]);
        }
        setDialogOpen(false);
    }, [form, editingId, data.length]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setData((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
    };

    const columns: ColumnDef<Customer>[] = [
        {
            key: "customerId",
            header: "ID",
            sortable: true,
            accessorFn: (c) => <span className="font-mono text-xs text-gray-500">{c.customerId}</span>,
        },
        {
            key: "name",
            header: "Customer",
            sortable: true,
            accessorFn: (c) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {c.firstName} {c.lastName}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail className="h-3 w-3" />
                        {c.email}
                    </span>
                </div>
            ),
        },
        {
            key: "customerType",
            header: "Type",
            sortable: true,
            accessorFn: (c) => (
                <span
                    className={
                        c.customerType === "business"
                            ? "inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }
                >
                    {c.customerType}
                </span>
            ),
        },
        { key: "status", header: "Status", sortable: true, accessorFn: (c) => <StatusBadge status={c.status} /> },
        {
            key: "kycStatus",
            header: "KYC",
            sortable: true,
            accessorFn: (c) => <Badge className={kycColors[c.kycStatus]}>{c.kycStatus}</Badge>,
        },
        {
            key: "riskRating",
            header: "Risk",
            sortable: true,
            accessorFn: (c) => <Badge className={riskColors[c.riskRating]}>{c.riskRating}</Badge>,
        },
        { key: "branchName", header: "Branch", sortable: true, accessorFn: (c) => <span className="text-sm">{c.branchName}</span> },
        {
            key: "actions",
            header: "",
            accessorFn: (c) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                            setViewCustomer(c);
                        }}
                    >
                        <Users className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteTarget(c)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: "w-28",
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Customers"
                description="Manage customer profiles, KYC status, and risk ratings"
                actions={
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Button>
                }
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Customers" value={stats.total} icon={Users} variant="default" />
                <StatCard title="Active" value={stats.active} icon={UserCheck} variant="success" />
                <StatCard title="Business" value={stats.business} icon={Building2} variant="warning" />
                <StatCard title="KYC Pending" value={stats.pendingKyc} icon={ShieldAlert} variant="error" />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Customer List</CardTitle>
                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search name, ID, email..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9"
                            />
                        </div>
                        <Select
                            value={typeFilter}
                            onValueChange={(v) => {
                                setTypeFilter(v);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="individual">Individual</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs
                        value={selectedTab}
                        onValueChange={(v) => {
                            setSelectedTab(v);
                            setPage(1);
                        }}
                    >
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">All ({data.length})</TabsTrigger>
                            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                            <TabsTrigger value="inactive">Inactive/Suspended</TabsTrigger>
                        </TabsList>
                        <TabsContent value={selectedTab}>
                            <DataTable columns={columns} data={paginated} emptyState={{ message: "No customers found" }} />
                            {filtered.length > PAGE_SIZE && (
                                <div className="mt-4">
                                    <Pagination
                                        currentPage={safePage}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                        totalItems={filtered.length}
                                        pageSize={PAGE_SIZE}
                                    />
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* View Customer Dialog */}
            <Dialog
                open={!!viewCustomer}
                onOpenChange={(v) => {
                    if (!v) setViewCustomer(null);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {viewCustomer?.firstName} {viewCustomer?.lastName}
                        </DialogTitle>
                        <DialogDescription>
                            {viewCustomer?.customerId} · {viewCustomer?.customerType}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {viewCustomer?.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {viewCustomer?.phone}
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <span>
                                {viewCustomer?.address.street}, {viewCustomer?.address.city}, {viewCustomer?.address.state},{" "}
                                {viewCustomer?.address.country}
                            </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <StatusBadge status={viewCustomer?.status ?? "active"} />
                            <Badge className={kycColors[viewCustomer?.kycStatus ?? "pending"]}>{viewCustomer?.kycStatus}</Badge>
                            <Badge className={riskColors[viewCustomer?.riskRating ?? "low"]}>{viewCustomer?.riskRating} risk</Badge>
                        </div>
                        {viewCustomer?.notes && <p className="text-xs text-gray-500 italic mt-2">Note: {viewCustomer.notes}</p>}
                        <div className="text-xs text-gray-400 pt-2 border-t">
                            <div>National ID: {viewCustomer?.nationalId}</div>
                            <div>DOB: {viewCustomer?.dateOfBirth}</div>
                            <div>
                                Branch: {viewCustomer?.branchName} · RM: {viewCustomer?.relationshipManager}
                            </div>
                            <div>Onboarded: {viewCustomer?.onboardingDate}</div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewCustomer(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Customer" : "Add Customer"}</DialogTitle>
                        <DialogDescription>{editingId ? "Update customer details below." : "Register a new customer."}</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div>
                            <label className="text-sm font-medium">First Name *</label>
                            <Input
                                className="mt-1"
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Last Name *</label>
                            <Input
                                className="mt-1"
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                className="mt-1"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Phone</label>
                            <Input className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Date of Birth</label>
                            <Input
                                className="mt-1"
                                type="date"
                                value={form.dateOfBirth}
                                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Gender</label>
                            <Select value={form.gender} onValueChange={(v: "male" | "female" | "other") => setForm({ ...form, gender: v })}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium">National ID</label>
                            <Input
                                className="mt-1"
                                value={form.nationalId}
                                onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Type</label>
                            <Select value={form.customerType} onValueChange={(v: CustomerType) => setForm({ ...form, customerType: v })}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="individual">Individual</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select value={form.status} onValueChange={(v: CustomerStatus) => setForm({ ...form, status: v })}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">KYC Status</label>
                            <Select value={form.kycStatus} onValueChange={(v: KycStatus) => setForm({ ...form, kycStatus: v })}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Risk Rating</label>
                            <Select value={form.riskRating} onValueChange={(v: RiskRating) => setForm({ ...form, riskRating: v })}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium">Street Address</label>
                            <Input
                                className="mt-1"
                                value={form.address.street}
                                onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">City</label>
                            <Input
                                className="mt-1"
                                value={form.address.city}
                                onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">State/Province</label>
                            <Input
                                className="mt-1"
                                value={form.address.state}
                                onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Country</label>
                            <Input
                                className="mt-1"
                                value={form.address.country}
                                onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Postal Code</label>
                            <Input
                                className="mt-1"
                                value={form.address.postalCode}
                                onChange={(e) => setForm({ ...form, address: { ...form.address, postalCode: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Branch</label>
                            <Input
                                className="mt-1"
                                value={form.branchName}
                                onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Relationship Manager</label>
                            <Input
                                className="mt-1"
                                value={form.relationshipManager}
                                onChange={(e) => setForm({ ...form, relationshipManager: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Onboarding Date</label>
                            <Input
                                className="mt-1"
                                type="date"
                                value={form.onboardingDate}
                                onChange={(e) => setForm({ ...form, onboardingDate: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium">Notes</label>
                            <Input
                                className="mt-1"
                                value={form.notes ?? ""}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>{editingId ? "Save Changes" : "Register Customer"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(v) => {
                    if (!v) setDeleteTarget(null);
                }}
                title="Delete Customer"
                description={`Are you sure you want to delete ${deleteTarget?.firstName} ${deleteTarget?.lastName} (${deleteTarget?.customerId})? This action cannot be undone.`}
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    );
};

export default CustomerPage;
