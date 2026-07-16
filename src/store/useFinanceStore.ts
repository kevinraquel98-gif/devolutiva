import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState,
  MonthlyCost,
  PayableReceivable,
  Transaction,
} from "../types";
import { uid } from "../lib/id";
import { buildSeedState } from "./seed";
import { todayISO } from "../lib/date";

interface FinanceStore extends AppState {
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  addManyTransactions: (list: Omit<Transaction, "id">[]) => void;

  addMonthlyCost: (c: Omit<MonthlyCost, "id">) => void;
  updateMonthlyCost: (id: string, patch: Partial<MonthlyCost>) => void;
  removeMonthlyCost: (id: string) => void;

  addItem: (i: Omit<PayableReceivable, "id">) => void;
  updateItem: (id: string, patch: Partial<PayableReceivable>) => void;
  removeItem: (id: string) => void;

  setInitialBalance: (value: number, date: string) => void;
  resetToSeed: () => void;
  clearAll: () => void;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      ...buildSeedState(),

      addTransaction: (t) =>
        set((s) => ({ transactions: [...s.transactions, { ...t, id: uid() }] })),
      updateTransaction: (id, patch) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...patch } : t
          ),
        })),
      removeTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      addManyTransactions: (list) =>
        set((s) => ({
          transactions: [
            ...s.transactions,
            ...list.map((t) => ({ ...t, id: uid() })),
          ],
        })),

      addMonthlyCost: (c) =>
        set((s) => ({ monthlyCosts: [...s.monthlyCosts, { ...c, id: uid() }] })),
      updateMonthlyCost: (id, patch) =>
        set((s) => ({
          monthlyCosts: s.monthlyCosts.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),
      removeMonthlyCost: (id) =>
        set((s) => ({ monthlyCosts: s.monthlyCosts.filter((c) => c.id !== id) })),

      addItem: (i) => set((s) => ({ items: [...s.items, { ...i, id: uid() }] })),
      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      setInitialBalance: (value, date) =>
        set({ initialBalance: value, initialBalanceDate: date }),

      resetToSeed: () => set(buildSeedState()),
      clearAll: () =>
        set({
          initialBalance: 0,
          initialBalanceDate: todayISO(),
          transactions: [],
          monthlyCosts: [],
          items: [],
        }),
    }),
    {
      name: "devolutiva-financeira-storage",
      version: 1,
    }
  )
);
