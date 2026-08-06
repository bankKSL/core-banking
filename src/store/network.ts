import { create } from "zustand";

export type NetworkErrorKind = "connection" | "timeout";

export interface NetworkError {
  kind: NetworkErrorKind;
  message: string;
  id: number;
}

interface NetworkState {
  error: NetworkError | null;
  reportNetworkError: (kind: NetworkErrorKind, message: string) => void;
  clearNetworkError: (id?: number) => void;
}

let nextId = 0;

export const useNetworkStore = create<NetworkState>((set) => ({
  error: null,
  reportNetworkError: (kind, message) => set({ error: { kind, message, id: ++nextId } }),
  clearNetworkError: (id) =>
    set((state) => (state.error && (id === undefined || state.error.id === id) ? { error: null } : state)),
}));
