import { type FC, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Loader2, User, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useClientImage, useUploadClientImage, useDeleteClientImage } from "../hooks/useClientImages";
import type { Client } from "../types/client";

const ACCEPTED_TYPES = ["image/gif", "image/jpeg", "image/png"];

interface ClientImageProps {
  client: Client;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { avatar: "h-10 w-10", preview: "h-24 w-24", icon: "h-5 w-5" },
  md: { avatar: "h-16 w-16", preview: "h-32 w-32", icon: "h-7 w-7" },
  lg: { avatar: "h-24 w-24", preview: "h-40 w-40", icon: "h-10 w-10" },
};

const ClientImage: FC<ClientImageProps> = ({ client, size = "md" }) => {
  const { t } = useTranslation();
  const { data: imageDataUrl, isLoading } = useClientImage(client.imagePresent ? client.id : undefined);
  const uploadMutation = useUploadClientImage();
  const deleteMutation = useDeleteClientImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sizes = sizeMap[size];

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    await uploadMutation.mutateAsync({ clientId: client.id, file: selectedFile });
    setDialogOpen(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedFile, uploadMutation, client.id]);

  const handleDelete = useCallback(async () => {
    await deleteMutation.mutateAsync(client.id);
    setShowDeleteConfirm(false);
  }, [deleteMutation, client.id]);

  const openDialog = useCallback(() => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const hasImage = client.imagePresent && imageDataUrl;

  return (
    <>
      <div className="relative group inline-block">
        <Avatar className={`${sizes.avatar} cursor-pointer`} onClick={openDialog}>
          {isLoading ? (
            <AvatarFallback>
              <Loader2 className={`${sizes.icon} animate-spin text-gray-400`} />
            </AvatarFallback>
          ) : hasImage ? (
            <AvatarImage src={imageDataUrl} alt={client.displayName ?? "Client"} />
          ) : (
            <AvatarFallback>
              <User className={`${sizes.icon} text-gray-400`} />
            </AvatarFallback>
          )}
        </Avatar>
        <button
          type="button"
          onClick={openDialog}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-colors"
          aria-label={t("clients.image.changePhoto")}
        >
          <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("clients.image.title")}</DialogTitle>
            <DialogDescription>{t("clients.image.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar className={`${sizes.preview} rounded-xl`}>
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt="Preview" />
                ) : hasImage ? (
                  <AvatarImage src={imageDataUrl} alt={client.displayName ?? "Client"} />
                ) : (
                  <AvatarFallback>
                    <User className={`${sizes.icon} text-gray-400`} />
                  </AvatarFallback>
                )}
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-[#D32F2F] hover:file:bg-red-100 cursor-pointer"
              />
              <p className="text-xs text-gray-400">{t("clients.image.acceptedFormats")}: GIF, JPEG, PNG</p>
            </div>
            <div className="flex items-center justify-between gap-2">
              {hasImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {t("clients.image.removePhoto")}
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={closeDialog}>
                  {t("clients.image.cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="bg-[#D32F2F] hover:bg-red-700"
                >
                  {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("clients.image.upload")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("clients.image.removePhoto")}
        description={t("clients.image.removeConfirmation")}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={t("clients.image.remove")}
        loading={deleteMutation.isPending}
      />
    </>
  );
};

export default ClientImage;
