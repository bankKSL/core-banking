import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  rejectClient,
  withdrawClient,
  closeClient,
  reactivateClient,
  undoRejectClient,
  undoWithdrawClient,
} from "../api/client";
import { clientKeys } from "./useClients";

export function useRejectClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: number | string) => rejectClient(clientId),
    onSuccess: (_data, clientId) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(clientId) });
    },
  });
}

export function useWithdrawClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: number | string) => withdrawClient(clientId),
    onSuccess: (_data, clientId) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(clientId) });
    },
  });
}

export function useCloseClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      ...payload
    }: {
      clientId: number | string;
      closureDate?: string;
      dateFormat?: string;
      locale?: string;
    }) => closeClient(clientId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.clientId) });
    },
  });
}

export function useReactivateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: number | string) => reactivateClient(clientId),
    onSuccess: (_data, clientId) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(clientId) });
    },
  });
}

export function useUndoRejectClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: number | string) => undoRejectClient(clientId),
    onSuccess: (_data, clientId) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(clientId) });
    },
  });
}

export function useUndoWithdrawClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: number | string) => undoWithdrawClient(clientId),
    onSuccess: (_data, clientId) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(clientId) });
    },
  });
}
