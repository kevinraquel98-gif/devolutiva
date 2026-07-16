import type { ReactNode } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Receipt,
  Upload,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export type TabKey =
  | "dashboard"
  | "fluxo"
  | "custos"
  | "contas"
  | "importar"
  | "crise";

const NAV: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "fluxo", label: "Fluxo de Caixa", icon: ArrowLeftRight },
  { key: "custos", label: "Custos Fixos/Variáveis", icon: Wallet },
  { key: "contas", label: "Contas a Pagar/Receber", icon: Receipt },
  { key: "importar", label: "Importar Extrato", icon: Upload },
  { key: "crise", label: "Modo Crise", icon: AlertTriangle },
];

export function Layout({
  active,
  onChange,
  children,
  headerRight,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  children: ReactNode;
  headerRight?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text flex">
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="px-5 py-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange flex items-center justify-center font-black text-black">
              $
            </div>
            <div>
              <p className="font-bold text-text leading-tight">Devolutiva</p>
              <p className="text-xs text-text-muted leading-tight">
                Financeira
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active === key
                  ? "bg-orange/15 text-orange-bright font-semibold border border-orange/30"
                  : "text-text-muted hover:text-text hover:bg-surface-2"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-border text-xs text-text-muted">
          Dados salvos localmente no seu navegador.
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface border-r border-border flex flex-col">
            <div className="px-5 py-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange flex items-center justify-center font-black text-black">
                  $
                </div>
                <p className="font-bold text-text">Devolutiva</p>
              </div>
              <button onClick={() => setMobileOpen(false)}>
                <X size={20} className="text-text-muted" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    onChange(key);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active === key
                      ? "bg-orange/15 text-orange-bright font-semibold border border-orange/30"
                      : "text-text-muted hover:text-text hover:bg-surface-2"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 md:px-8 py-4 border-b border-border bg-bg/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-text-muted"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <h1 className="text-base md:text-lg font-semibold">
              {NAV.find((n) => n.key === active)?.label}
            </h1>
          </div>
          {headerRight}
        </header>
        <main className="flex-1 px-4 md:px-8 py-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
