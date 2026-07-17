import type { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientSchema, type CreateClientFormValues } from "../schemas/client.schema";
import type { ClientTemplate, Client } from "../types/client";

interface ClientFormProps {
    template?: ClientTemplate;
    client?: Client;
    onSubmit: (values: CreateClientFormValues) => Promise<void>;
    isSubmitting: boolean;
    error?: string | null;
    mode: "create" | "edit";
}

const ClientForm: FC<ClientFormProps> = ({ template, client, onSubmit, isSubmitting, error, mode }) => {
    const defaultDate = new Date().toISOString().split("T")[0];

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<CreateClientFormValues>({
        resolver: zodResolver(createClientSchema),
        defaultValues: {
            firstname: client?.firstname ?? "",
            middlename: client?.middlename ?? "",
            lastname: client?.lastname ?? "",
            fullname: client?.fullname ?? "",
            officeId: client?.officeId ?? undefined,
            staffId: client?.staffId ?? null,
            groupId: null,
            dateOfBirth: client?.dateOfBirth ? client.dateOfBirth.split("T")[0] : "",
            genderId: client?.gender?.id ?? null,
            legalFormId: null,
            externalId: client?.externalId ?? "",
            mobileNo: client?.mobileNo ?? "",
            emailAddress: client?.emailAddress ?? "",
            activationDate: client?.activationDate ? client.activationDate.split("T")[0] : mode === "create" ? defaultDate : "",
            submittedOnDate: defaultDate,
            dateFormat: "yyyy-MM-dd",
            locale: "en",
            active: mode === "create" ? false : (client?.active ?? false),
        },
    });

    const onFormSubmit = async (values: CreateClientFormValues) => {
        const cleaned = {
            ...values,
            middlename: values.middlename || undefined,
            fullname: values.fullname || undefined,
            dateOfBirth: values.dateOfBirth || undefined,
            externalId: values.externalId || undefined,
            mobileNo: values.mobileNo || undefined,
            emailAddress: values.emailAddress || undefined,
            activationDate: mode === "edit" && !values.activationDate ? undefined : values.activationDate || undefined,
            staffId: values.staffId ?? undefined,
            genderId: values.genderId ?? undefined,
            legalFormId: values.legalFormId ?? undefined,
            groupId: values.groupId ?? undefined,
        };
        await onSubmit(cleaned as CreateClientFormValues);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-8">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    {error}
                </div>
            )}

            <button onClick={() => console.log(errors)} type="button">
                Log Values
            </button>

            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="firstname">First Name *</Label>
                        <Input
                            id="firstname"
                            {...register("firstname")}
                            disabled={isSubmitting}
                            className={errors.firstname ? "border-red-300" : ""}
                        />
                        {errors.firstname && <p className="text-xs text-red-500">{errors.firstname.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="middlename">Middle Name</Label>
                        <Input id="middlename" {...register("middlename")} disabled={isSubmitting} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="lastname">Last Name *</Label>
                        <Input
                            id="lastname"
                            {...register("lastname")}
                            disabled={isSubmitting}
                            className={errors.lastname ? "border-red-300" : ""}
                        />
                        {errors.lastname && <p className="text-xs text-red-500">{errors.lastname.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="fullname">Full Name</Label>
                        <Input id="fullname" {...register("fullname")} disabled={isSubmitting} placeholder="Required for organizations" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} disabled={isSubmitting} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Gender</Label>
                        <Select
                            disabled={isSubmitting}
                            value={client?.gender?.id ? String(client.gender.id) : undefined}
                            onValueChange={(v) => setValue("genderId", Number(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={"1"}>Male</SelectItem>
                                <SelectItem value={"2"}>Female</SelectItem>
                                {template?.genderOptions?.map((g) => (
                                    <SelectItem key={g.id} value={String(g.id)}>
                                        {g.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Organization */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Organization</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="officeId">Office *</Label>
                        <Select
                            disabled={isSubmitting || mode === "edit"}
                            value={client?.officeId ? String(client.officeId) : undefined}
                            onValueChange={(v) => setValue("officeId", Number(v))}
                        >
                            <SelectTrigger className={errors.officeId ? "border-red-300" : ""}>
                                <SelectValue placeholder="Select office" />
                            </SelectTrigger>
                            <SelectContent>
                                {template?.officeOptions?.map((o) => (
                                    <SelectItem key={o.id} value={String(o.id)}>
                                        {o.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.officeId && <p className="text-xs text-red-500">{errors.officeId.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Staff</Label>
                        <Select
                            disabled={isSubmitting}
                            value={client?.staffId ? String(client.staffId) : undefined}
                            onValueChange={(v) => setValue("staffId", Number(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select staff" />
                            </SelectTrigger>
                            <SelectContent>
                                {template?.staffOptions?.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.displayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="groupId">Group ID</Label>
                        <Input
                            id="groupId"
                            type="number"
                            placeholder="Leave empty for standalone client"
                            disabled={isSubmitting}
                            {...register("groupId", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="mobileNo">Mobile Number</Label>
                        <Input id="mobileNo" {...register("mobileNo")} disabled={isSubmitting} placeholder="+1234567890" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="emailAddress">Email</Label>
                        <Input
                            id="emailAddress"
                            type="email"
                            {...register("emailAddress")}
                            disabled={isSubmitting}
                            placeholder="client@example.com"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="externalId">External ID</Label>
                        <Input id="externalId" {...register("externalId")} disabled={isSubmitting} />
                    </div>
                </CardContent>
            </Card>

            {/* Activation */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Activation</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {mode === "create" && (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="submittedOnDate">Submitted On</Label>
                            <Input id="submittedOnDate" type="date" {...register("submittedOnDate")} disabled={isSubmitting} />
                        </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="activationDate">Activation Date</Label>
                        <Input id="activationDate" type="date" {...register("activationDate")} disabled={isSubmitting} />
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {mode === "create" ? "Creating..." : "Saving..."}
                        </span>
                    ) : mode === "create" ? (
                        "Create Client"
                    ) : (
                        "Save Changes"
                    )}
                </Button>
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => window.history.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
};

export default ClientForm;
