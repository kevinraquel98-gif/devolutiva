import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 ${
        glow ? "shadow-[0_0_40px_-12px_rgba(255,106,0,0.35)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg font-semibold text-text tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
  size = "md",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative" | "warning";
  size?: "md" | "lg";
}) {
  const toneClass =
    tone === "positive"
      ? "text-green"
      : tone === "negative"
      ? "text-red"
      : tone === "warning"
      ? "text-yellow"
      : "text-text";
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-text-muted font-medium">
        {label}
      </p>
      <p
        className={`mt-2 font-bold tabular-nums ${toneClass} ${
          size === "lg" ? "text-3xl" : "text-2xl"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </Card>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "warning" | "orange";
}) {
  const toneClass =
    tone === "positive"
      ? "bg-green/15 text-green border-green/30"
      : tone === "negative"
      ? "bg-red/15 text-red border-red/30"
      : tone === "warning"
      ? "bg-yellow/15 text-yellow border-yellow/30"
      : tone === "orange"
      ? "bg-orange/15 text-orange-bright border-orange/40"
      : "bg-surface-2 text-text-muted border-border";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
  disabled = false,
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const variantClass =
    variant === "primary"
      ? "bg-orange text-black hover:bg-orange-bright font-semibold"
      : variant === "danger"
      ? "bg-red/15 text-red border border-red/30 hover:bg-red/25"
      : variant === "ghost"
      ? "text-text-muted hover:text-text hover:bg-surface-2"
      : "bg-surface-2 text-text border border-border hover:border-orange-dim";
  const sizeClass = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/50 ${className}`}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  const { className = "", children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/50 ${className}`}
    >
      {children}
    </select>
  );
}

export function ProgressBar({
  value,
  max,
  tone = "orange",
}: {
  value: number;
  max: number;
  tone?: "orange" | "green" | "red";
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const toneClass =
    tone === "green" ? "bg-green" : tone === "red" ? "bg-red" : "bg-orange";
  return (
    <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
      <div
        className={`h-full rounded-full ${toneClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 text-text-muted text-sm">{text}</div>
  );
}
