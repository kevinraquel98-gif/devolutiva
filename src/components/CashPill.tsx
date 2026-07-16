import { useFinanceStore } from "../store/useFinanceStore";
import { getCashPosition } from "../lib/finance";
import { formatBRL } from "../lib/format";

export function CashPill() {
  const state = useFinanceStore();
  const cash = getCashPosition(state);
  const positive = cash >= 0;
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-4 py-2 ${
        positive
          ? "border-orange/40 bg-orange/10"
          : "border-red/40 bg-red/10"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full glow-pulse ${
          positive ? "bg-orange" : "bg-red"
        }`}
      />
      <span className="text-xs text-text-muted hidden sm:inline">
        Caixa hoje
      </span>
      <span
        className={`font-bold tabular-nums text-sm ${
          positive ? "text-orange-bright" : "text-red"
        }`}
      >
        {formatBRL(cash)}
      </span>
    </div>
  );
}
