import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware';
import { NewsService } from '@bindings/cyrene-launcher/internal/news-service';

interface NewsState {
    // Newest server announcement timestamp the user has seen (unix seconds).
    lastReadServerTimestamp: number;
    // Newest timestamp available remotely; > lastRead → unread badge.
    latestServerTimestamp: number;
    markServerRead: () => void;
    checkServerNews: () => Promise<void>;
}

const useNewsStore = create<NewsState>()(
    persist(
        (set, get) => ({
            lastReadServerTimestamp: 0,
            latestServerTimestamp: 0,
            markServerRead: () => set({ lastReadServerTimestamp: get().latestServerTimestamp }),
            checkServerNews: async () => {
                try {
                    const [ok, items] = await NewsService.GetCustomNews()
                    if (!ok || !items?.length) return
                    set({ latestServerTimestamp: Math.max(...items.map(i => i.timestamp)) })
                } catch {
                    // offline / not configured — keep silent
                }
            },
        }),
        {
            name: 'news-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({ lastReadServerTimestamp: s.lastReadServerTimestamp }),
        }
    )
);

export const hasUnreadServerNews = (s: Pick<NewsState, 'lastReadServerTimestamp' | 'latestServerTimestamp'>) =>
    s.latestServerTimestamp > s.lastReadServerTimestamp

export default useNewsStore;
