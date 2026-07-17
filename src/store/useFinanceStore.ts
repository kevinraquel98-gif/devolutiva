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
import { addMonthsISO, dueDateForMonthOffset, monthKey, todayISO } from "../lib/date";
import { costInstallmentIndexForMonth, isCostActiveInMonth } from "../lib/finance";

interface FinanceStore extends AppState {
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  addManyTransactions: (list: Omit<Transaction, "id">[]) => void;

  addMonthlyCost: (c: Omit<MonthlyCost, "id">) => void;
  updateMonthlyCost: (id: string, patch: Partial<MonthlyCost>) => void;
  removeMonthlyCost: (id: string) => void;

  addItem: (i: Omit<PayableReceivable, "id">) => void;
  addInstallmentPlan: (
    base: Omit<PayableReceivable, "id" | "dueDate" | "paid" | "description">,
    description: string,
    firstDueDate: string,
    totalInstallments: number,
    startIndex?: number
  ) => void;
  updateItem: (id: string, patch: Partial<PayableReceivable>) => void;
  removeItem: (id: string) => void;
  markItemPaid: (id: string, paidDate?: string) => void;
  markItemUnpaid: (id: string) => void;

  markCostPaid: (costId: string) => void;
  markCostUnpaid: (costId: string) => void;

  syncCostPayables: () => void;

  setInitialBalance: (value: number, date: string) => void;
  resetToSeed: () => void;
  clearAll: () => void;
}

const COST_SYNC_MONTHS_AHEAD = 3;

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
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

      addMonthlyCost: (c) => {
        set((s) => ({ monthlyCosts: [...s.monthlyCosts, { ...c, id: uid() }] }));
        get().syncCostPayables();
      },
      updateMonthlyCost: (id, patch) => {
        set((s) => ({
          monthlyCosts: s.monthlyCosts.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        }));
        get().syncCostPayables();
      },
      removeMonthlyCost: (id) => {
        set((s) => ({
          monthlyCosts: s.monthlyCosts.filter((c) => c.id !== id),
          items: s.items.filter(
            (i) => !(i.sourceCostId === id && !i.paid && i.dueDate >= todayISO())
          ),
        }));
      },

      addItem: (i) => set((s) => ({ items: [...s.items, { ...i, id: uid() }] })),

      addInstallmentPlan: (base, description, firstDueDate, totalInstallments, startIndex = 1) => {
        const groupId = uid();
        const count = totalInstallments - startIndex + 1;
        const newItems: PayableReceivable[] = Array.from({ length: count }, (_, i) => {
          const idx = startIndex + i;
          return {
            ...base,
            id: uid(),
            description: `${description} (${idx}/${totalInstallments})`,
            dueDate: addMonthsISO(firstDueDate, i),
            paid: false,
            installmentGroupId: groupId,
            installmentIndex: idx,
            installmentTotal: totalInstallments,
          };
        });
        set((s) => ({ items: [...s.items, ...newItems] }));
      },

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          transactions: s.transactions.map((t) => {
            const item = s.items.find((i) => i.id === id);
            if (!item?.paid || !item.transactionId || item.transactionId !== t.id)
              return t;
            const touchesLinkedFields =
              patch.amount !== undefined ||
              patch.description !== undefined ||
              patch.category !== undefined ||
              patch.type !== undefined;
            if (!touchesLinkedFields) return t;
            return {
              ...t,
              amount: patch.amount ?? t.amount,
              description: patch.description ?? t.description,
              category: patch.category ?? t.category,
              type: patch.type ? (patch.type === "pagar" ? "saida" : "entrada") : t.type,
            };
          }),
        })),

      removeItem: (id) =>
        set((s) => {
          const item = s.items.find((i) => i.id === id);
          return {
            items: s.items.filter((i) => i.id !== id),
            transactions: item?.transactionId
              ? s.transactions.filter((t) => t.id !== item.transactionId)
              : s.transactions,
          };
        }),

      markItemPaid: (id, paidDate) => {
        const item = get().items.find((i) => i.id === id);
        if (!item || item.paid) return;
        const date = paidDate ?? todayISO();
        const txId = uid();
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, paid: true, paidDate: date, transactionId: txId } : i
          ),
          transactions: [
            ...s.transactions,
            {
              id: txId,
              date,
              description: item.description,
              type: item.type === "pagar" ? "saida" : "entrada",
              category: item.category,
              amount: item.amount,
              status: "realizado",
            },
          ],
        }));
      },

      markItemUnpaid: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (!item || !item.paid) return;
        const txId = item.transactionId;
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? { ...i, paid: false, paidDate: undefined, transactionId: undefined }
              : i
          ),
          transactions: txId ? s.transactions.filter((t) => t.id !== txId) : s.transactions,
        }));
      },

      syncCostPayables: () => {
        const { monthlyCosts, items } = get();
        let nextItems = [...items];

        for (const cost of monthlyCosts) {
          for (let offset = 0; offset < COST_SYNC_MONTHS_AHEAD; offset++) {
            const dueDate = dueDateForMonthOffset(cost.dueDay, offset);
            const targetMonth = monthKey(dueDate);
            const shouldExist = isCostActiveInMonth(cost, targetMonth);
            const existingIdx = nextItems.findIndex(
              (i) => i.sourceCostId === cost.id && monthKey(i.dueDate) === targetMonth
            );
            const installmentIndex = costInstallmentIndexForMonth(cost, targetMonth);

            if (!shouldExist) {
              if (existingIdx !== -1 && !nextItems[existingIdx].paid) {
                nextItems.splice(existingIdx, 1);
              }
              continue;
            }

            if (existingIdx === -1) {
              nextItems.push({
                id: uid(),
                description: cost.name,
                counterparty: "",
                type: "pagar",
                category: cost.category,
                amount: cost.amount,
                dueDate,
                paid: false,
                sourceCostId: cost.id,
                installmentIndex: installmentIndex ?? undefined,
                installmentTotal: cost.installments?.total,
              });
            } else if (!nextItems[existingIdx].paid) {
              nextItems[existingIdx] = {
                ...nextItems[existingIdx],
                description: cost.name,
                category: cost.category,
                amount: cost.amount,
                installmentIndex: installmentIndex ?? undefined,
                installmentTotal: cost.installments?.total,
              };
            }
          }
        }

        const activeCostIds = new Set(monthlyCosts.map((c) => c.id));
        nextItems = nextItems.filter(
          (i) =>
            !i.sourceCostId ||
            activeCostIds.has(i.sourceCostId) ||
            i.paid ||
            i.dueDate < todayISO()
        );

        set({ items: nextItems });
      },

      markCostPaid: (costId) => {
        const { monthlyCosts, items } = get();
        const cost = monthlyCosts.find((c) => c.id === costId);
        if (!cost) return;
        const currentMonth = monthKey(todayISO());
        let item = items.find(
          (i) => i.sourceCostId === costId && monthKey(i.dueDate) === currentMonth
        );
        if (!item) {
          item = {
            id: uid(),
            description: cost.name,
            counterparty: "",
            type: "pagar",
            category: cost.category,
            amount: cost.amount,
            dueDate: dueDateForMonthOffset(cost.dueDay, 0),
            paid: false,
            sourceCostId: cost.id,
            installmentIndex: costInstallmentIndexForMonth(cost, currentMonth) ?? undefined,
            installmentTotal: cost.installments?.total,
          };
          set((s) => ({ items: [...s.items, item as PayableReceivable] }));
        }
        if (!item.paid) get().markItemPaid(item.id);
      },

      markCostUnpaid: (costId) => {
        const currentMonth = monthKey(todayISO());
        const item = get().items.find(
          (i) => i.sourceCostId === costId && monthKey(i.dueDate) === currentMonth
        );
        if (item?.paid) get().markItemUnpaid(item.id);
      },

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
      version: 2,
      migrate: (persisted) => {
        const state = persisted as AppState;
        return {
          ...state,
          monthlyCosts: (state.monthlyCosts ?? []).map((c) => ({
            ...c,
            dueDay: c.dueDay ?? 5,
          })),
          items: (state.items ?? []).map((i) => ({
            ...i,
            category: i.category ?? (i.type === "pagar" ? "Outros" : "Outras Receitas"),
          })),
        };
      },
    }
  )
);
