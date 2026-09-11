import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware';
import { AccountService } from '@bindings/cyrene-launcher/internal/account-service';

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
    // Website policy (/admin/settings): may the gate be dismissed at all?
    // Persisted, so a launcher that already learned the answer keeps honouring
    // it while the site is unreachable — pulling the network is not a way past
    // a disabled skip button. Defaults to the website's own default.
    skipEnabled: boolean;
    setUser: (user: AccountUser | null) => void;
    setPending: (pending: boolean) => void;
    setChecking: (checking: boolean) => void;
    setSkipped: (skipped: boolean) => void;
    setGateError: (gateError: GateError) => void;
    refreshSkipEnabled: () => Promise<void>;
}

const useAccountStore = create<AccountState>()(
    persist(
        (set) => ({
            user: null,
            pending: false,
            checking: true,
            skipped: false,
            gateError: "",
            skipEnabled: true,
            setUser: (user) => set({ user, pending: false, ...(user ? { gateError: "" as GateError, skipped: false } : {}) }),
            setPending: (pending) => set({ pending }),
            setChecking: (checking) => set({ checking }),
            setSkipped: (skipped) => set({ skipped }),
            setGateError: (gateError) => set({ gateError }),
            refreshSkipEnabled: async () => {
                try {
                    const [fresh, config] = await AccountService.GetLauncherConfig()
                    if (fresh) set({ skipEnabled: config.skip_login_enabled })
                } catch {
                    // offline — keep the cached answer
                }
            },
        }),
        {
            name: 'account-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({ skipEnabled: s.skipEnabled }),
        }
    )
);

export default useAccountStore;
