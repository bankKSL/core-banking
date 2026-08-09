import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientImage, uploadClientImage, deleteClientImage, uploadClientTemplate } from "../api/images";
import type { ClientImageParams } from "../api/images";
import { clientKeys } from "./useClients";

export const clientImageKeys = {
  image: (clientId: number | string) => [...clientKeys.detail(clientId), "image"] as const,
};

export function useClientImage(clientId: number | string | undefined, params?: ClientImageParams) {
  return useQuery({
    queryKey: clientImageKeys.image(clientId!),
    queryFn: () => fetchClientImage(clientId!, params),
    enabled: !!clientId,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useUploadClientImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, file }: { clientId: number | string; file: File }) => uploadClientImage(clientId, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientImageKeys.image(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.clientId) });
    },
  });
}

export function useDeleteClientImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: number | string) => deleteClientImage(clientId),
    onSuccess: (_data, clientId) => {
      queryClient.invalidateQueries({ queryKey: clientImageKeys.image(clientId) });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(clientId) });
    },
  });
}

export function useUploadClientTemplate() {
  return useMutation({
    mutationFn: ({ file, legalFormType }: { file: File; legalFormType?: "PERSON" | "ENTITY" }) =>
      uploadClientTemplate(file, legalFormType),
  });
}
