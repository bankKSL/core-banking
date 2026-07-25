import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  proposeClientTransfer,
  acceptClientTransfer,
  rejectClientTransfer,
  withdrawClientTransfer,
  proposeAndAcceptClientTransfer,
} from "../api/client";
import {
  type ClientProposeTransferRequest,
  type ClientAcceptTransferRequest,
  type ClientTransferActionRequest,
} from "../types/client";
import { clientKeys } from "./useClients";

/**
 * Client lifecycle hooks for the office-transfer commands.
 * Each invalidates the detail + list queries on success.
 */

export function useProposeClientTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: number | string; payload: ClientProposeTransferRequest }) =>
      proposeClientTransfer(clientId, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      qc.invalidateQueries({ queryKey: clientKeys.detail(v.clientId) });
    },
  });
}

export function useAcceptClientTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      payload = {},
    }: {
      clientId: number | string;
      payload?: ClientAcceptTransferRequest;
    }) => acceptClientTransfer(clientId, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      qc.invalidateQueries({ queryKey: clientKeys.detail(v.clientId) });
    },
  });
}

export function useRejectClientTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      payload = {},
    }: {
      clientId: number | string;
      payload?: ClientTransferActionRequest;
    }) => rejectClientTransfer(clientId, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      qc.invalidateQueries({ queryKey: clientKeys.detail(v.clientId) });
    },
  });
}

export function useWithdrawClientTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      payload = {},
    }: {
      clientId: number | string;
      payload?: ClientTransferActionRequest;
    }) => withdrawClientTransfer(clientId, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      qc.invalidateQueries({ queryKey: clientKeys.detail(v.clientId) });
    },
  });
}

export function useProposeAndAcceptClientTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: number | string; payload: ClientProposeTransferRequest }) =>
      proposeAndAcceptClientTransfer(clientId, payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
      qc.invalidateQueries({ queryKey: clientKeys.detail(v.clientId) });
    },
  });
}
