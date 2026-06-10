import { create } from 'zustand'

export interface AccountUser {
    id: string;
    name: string;
    image: string;
    role: string;
}

interface AccountState {
    user: AccountUser | null;
    // True while waiting for the user to approve the sign-in in the browser.
    pending: boolean;
    setUser: (user: AccountUser | null) => void;
    setPending: (pending: boolean) => void;
}

const useAccountStore = create<AccountState>((set) => ({
    user: null,
    pending: false,
    setUser: (user) => set({ user, pending: false }),
    setPending: (pending) => set({ pending }),
}));

export default useAccountStore;
