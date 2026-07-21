import { type FC, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import type { ColumnDef } from "@/components/shared/DataTable";
import { useClientFamilyMembers, useClientFamilyMemberTemplate, useCreateClientFamilyMember, useUpdateClientFamilyMember, useDeleteClientFamilyMember } from "../hooks/useClientFamilyMembers";
import type { ClientFamilyMember } from "../api/family-members";

const familyMemberSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    relationshipId: z.number({ message: "Relationship is required" }),
    genderId: z.number({ message: "Gender is required" }),
    dateOfBirth: z.string().optional(),
    mobileNumber: z.string().optional(),
    isDependent: z.boolean().optional(),
});

type FamilyMemberFormValues = z.infer<typeof familyMemberSchema>;

interface ClientFamilyMembersProps { clientId: number }

const ClientFamilyMembers: FC<ClientFamilyMembersProps> = ({ clientId }) => {
    const { data: members, isLoading } = useClientFamilyMembers(clientId);
    const { data: template } = useClientFamilyMemberTemplate(clientId);
    const createMutation = useCreateClientFamilyMember();
    const updateMutation = useUpdateClientFamilyMember();
    const deleteMutation = useDeleteClientFamilyMember();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FamilyMemberFormValues>({
        resolver: zodResolver(familyMemberSchema),
    });

    const openCreate = useCallback(() => {
        setEditingId(null);
        reset({ firstName: "", lastName: "", relationshipId: undefined as any, genderId: undefined as any, dateOfBirth: "", mobileNumber: "", isDependent: false });
        setDialogOpen(true);
    }, [reset]);

    const openEdit = useCallback((m: ClientFamilyMember) => {
        setEditingId(m.id);
        const dob = Array.isArray(m.dateOfBirth) ? `${m.dateOfBirth[0]}-${String(m.dateOfBirth[1]).padStart(2,"0")}-${String(m.dateOfBirth[2]).padStart(2,"0")}` : m.dateOfBirth ?? "";
        reset({
            firstName: m.firstName, lastName: m.lastName,
            relationshipId: m.relationshipId ?? m.relationship?.id,
            genderId: m.genderId ?? m.gender?.id,
            dateOfBirth: dob, mobileNumber: m.mobileNumber ?? "", isDependent: m.isDependent ?? false,
        });
        setDialogOpen(true);
    }, [reset]);

    const onSubmit = useCallback(async (values: FamilyMemberFormValues) => {
        const payload = { ...values, dateOfBirth: values.dateOfBirth || undefined, mobileNumber: values.mobileNumber || undefined };
        if (editingId) {
            await updateMutation.mutateAsync({ clientId, familyMemberId: editingId, payload });
        } else {
            await createMutation.mutateAsync({ clientId, payload: payload as any });
        }
        setDialogOpen(false);
    }, [clientId, editingId, createMutation, updateMutation]);

    const handleDelete = useCallback(async () => {
        if (!deleteId) return;
        await deleteMutation.mutateAsync({ clientId, familyMemberId: deleteId });
        setDeleteId(null);
    }, [clientId, deleteId, deleteMutation]);

    const columns: ColumnDef<ClientFamilyMember>[] = [
        { key: "firstName", header: "Name", accessorFn: (row) => <span className="text-sm font-medium">{row.firstName} {row.lastName}</span> },
        { key: "relationship", header: "Relationship", accessorFn: (row) => <span className="text-sm">{row.relationship?.name ?? row.relationship?.value ?? "—"}</span> },
        { key: "gender", header: "Gender", accessorFn: (row) => <span className="text-sm">{row.gender?.name ?? row.gender?.value ?? "—"}</span> },
        { key: "age", header: "Age", accessorFn: (row) => <span className="text-sm">{row.age ?? "—"}</span> },
        { key: "isDependent", header: "Dependent", accessorFn: (row) => row.isDependent ? <Badge variant="info" size="sm">Yes</Badge> : <span className="text-sm text-gray-400">No</span> },
        { key: "mobileNumber", header: "Mobile", accessorFn: (row) => <span className="text-sm">{row.mobileNumber ?? "—"}</span> },
        { key: "actions", header: "Actions", accessorFn: (row) => (
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
        )},
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2"><Users className="h-5 w-5" />Family Members</h3>
                <Button onClick={openCreate} size="sm"><Plus className="mr-1 h-4 w-4" />Add Member</Button>
            </div>
            <Card><CardContent className="p-0">
                <DataTable columns={columns} data={members ?? []} loading={isLoading} minWidth={700}
                    emptyState={{ icon: <Users className="h-8 w-8 text-gray-300" />, message: "No family members." }} />
            </CardContent></Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editingId ? "Edit Family Member" : "Add Family Member"}</DialogTitle><DialogDescription>Enter family member details.</DialogDescription></DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input id="firstName" {...register("firstName")} />
                                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input id="lastName" {...register("lastName")} />
                                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label>Relationship *</Label>
                                <Select onValueChange={(v) => setValue("relationshipId", Number(v), { shouldValidate: true })}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{template?.relationshipIdOptions?.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                                </Select>
                                {errors.relationshipId && <p className="text-xs text-red-500">{errors.relationshipId.message}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Gender *</Label>
                                <Select onValueChange={(v) => setValue("genderId", Number(v), { shouldValidate: true })}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{template?.genderIdOptions?.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
                                </Select>
                                {errors.genderId && <p className="text-xs text-red-500">{errors.genderId.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="mobileNumber">Mobile Number</Label>
                                <Input id="mobileNumber" {...register("mobileNumber")} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch id="isDependent" onCheckedChange={(v) => setValue("isDependent", v)} />
                            <Label htmlFor="isDependent">Is Dependent</Label>
                        </div>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#D32F2F] hover:bg-red-700">
                            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingId ? "Update" : "Create"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Family Member"
                description="Are you sure? This cannot be undone." onConfirm={handleDelete} variant="destructive" confirmLabel="Delete" loading={deleteMutation.isPending} />
        </div>
    );
};

export default ClientFamilyMembers;
