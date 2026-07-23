import { type FC, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import type { ColumnDef } from "@/components/shared/DataTable";
import {
  useClientAddresses,
  useClientAddressTemplate,
  useCreateClientAddress,
  useUpdateClientAddress,
  useDeleteClientAddress,
} from "../hooks/useClientAddresses";
import type { ClientAddress } from "../api/addresses";

const addressSchema = z.object({
  addressTypeId: z.number().optional(),
  street: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  stateProvinceId: z.number().optional(),
  countryId: z.number().optional(),
  postalCode: z.string().optional(),
  isActive: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface ClientAddressesProps {
  clientId: number;
}

const ClientAddresses: FC<ClientAddressesProps> = ({ clientId }) => {
  const { data: addresses, isLoading } = useClientAddresses(clientId);
  const { data: template } = useClientAddressTemplate();
  const createMutation = useCreateClientAddress();
  const updateMutation = useUpdateClientAddress();
  const deleteMutation = useDeleteClientAddress();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
  });

  const openCreate = useCallback(() => {
    setEditingAddressId(null);
    reset({});
    setDialogOpen(true);
  }, [reset]);

  const openEdit = useCallback(
    (addr: ClientAddress) => {
      setEditingAddressId(addr.addressId);
      reset({
        addressTypeId: addr.addressTypeId,
        street: addr.street ?? "",
        addressLine1: addr.addressLine1 ?? "",
        addressLine2: addr.addressLine2 ?? "",
        city: addr.city ?? "",
        stateProvinceId: addr.stateProvinceId,
        countryId: addr.countryId,
        postalCode: addr.postalCode ?? "",
        isActive: addr.isActive ?? true,
      });
      setDialogOpen(true);
    },
    [reset],
  );

  const onSubmit = useCallback(
    async (values: AddressFormValues) => {
      if (editingAddressId) {
        await updateMutation.mutateAsync({ clientId, addressId: editingAddressId, payload: values });
      } else {
        await createMutation.mutateAsync({ clientId, addressTypeId: values.addressTypeId ?? 1, payload: values });
      }
      setDialogOpen(false);
    },
    [clientId, editingAddressId, createMutation, updateMutation],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ clientId, addressId: deleteId });
    setDeleteId(null);
  }, [clientId, deleteId, deleteMutation]);

  const columns: ColumnDef<ClientAddress>[] = [
    {
      key: "addressType",
      header: "Type",
      accessorFn: (row) => <span className="text-sm font-medium">{row.addressType ?? "—"}</span>,
    },
    {
      key: "addressLine1",
      header: "Address",
      accessorFn: (row) => (
        <span className="text-sm">
          {row.addressLine1 ?? row.street ?? "—"}
          {row.city ? `, ${row.city}` : ""}
        </span>
      ),
    },
    {
      key: "postalCode",
      header: "Postal Code",
      accessorFn: (row) => <span className="text-sm">{row.postalCode ?? "—"}</span>,
    },
    {
      key: "isActive",
      header: "Active",
      accessorFn: (row) =>
        row.isActive ? (
          <Badge variant="success" size="sm">
            Active
          </Badge>
        ) : (
          <Badge variant="default" size="sm">
            Inactive
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      accessorFn: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(row.addressId);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Addresses
        </h3>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Address
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={addresses ?? []}
            loading={isLoading}
            minWidth={600}
            emptyState={{ icon: <MapPin className="h-8 w-8 text-gray-300" />, message: "No addresses found." }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAddressId ? "Edit Address" : "Add Address"}</DialogTitle>
            <DialogDescription>Enter address details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Address Type</Label>
                <Select
                  defaultValue={String(template?.addressTypeIdOptions?.[0]?.id ?? "")}
                  onValueChange={(v) => setValue("addressTypeId", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {template?.addressTypeIdOptions?.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="street">Street</Label>
                <Input id="street" {...register("street")} placeholder="Street address" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input id="addressLine1" {...register("addressLine1")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input id="addressLine2" {...register("addressLine2")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>State/Province</Label>
                <Select onValueChange={(v) => setValue("stateProvinceId", Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {template?.stateProvinceIdOptions?.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Country</Label>
                <Select onValueChange={(v) => setValue("countryId", Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {template?.countryIdOptions?.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" {...register("postalCode")} />
              </div>
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#D32F2F] hover:bg-red-700"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingAddressId ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Address"
        description="Are you sure? This cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ClientAddresses;
