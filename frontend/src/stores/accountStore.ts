import { create } from 'zustand'

export interface AccountUser {
    id: string;
    name: string;
    image: string;
    role: string;
}

// Why the gate is blocking: offline = can't reach the server,
// banned/pending = server rejected the account, failed = generic login error.
export type GateError = "" | "offline" | "banned" | "pending" | "failed";

interface AccountState {
    user: AccountUser | null;
    // True while waiting for the user to approve the sign-in in the browser.
    pending: boolean;
    // True while the persisted session is being restored on startup.
    checking: boolean;
    // User dismissed the gate to continue without signing in (per session).
    skipped: boolean;
    gateError: GateError;
    setUser: (user: AccountUser | null) => void;
    setPending: (pending: boolean) => void;
    setChecking: (checking: boolean) => void;
    setSkipped: (skipped: boolean) => void;
    setGateError: (gateError: GateError) => void;
}

const useAccountStore = create<AccountState>((set) => ({
    user: null,
    pending: false,
    checking: true,
    skipped: false,
    gateError: "",
    setUser: (user) => set({ user, pending: false, ...(user ? { gateError: "" as GateError, skipped: false } : {}) }),
    setPending: (pending) => set({ pending }),
    setChecking: (checking) => set({ checking }),
    setSkipped: (skipped) => set({ skipped }),
    setGateError: (gateError) => set({ gateError }),
}));

export default useAccountStore;
