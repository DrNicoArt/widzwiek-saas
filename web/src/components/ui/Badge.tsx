"use client";
// Badge / StatusPill — statusy z subtelną zmianą stanu (status transition).
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export type Tone = "ok" | "warn" | "err" | "info" | "neutral";
const tones: Record<Tone, string> = {
  ok: "bg-ok/10 text-ok",
  warn: "bg-warn/10 text-warn",
  err: "bg-err/10 text-err",
  info: "bg-brand-50 text-brand-700",
  neutral: "bg-slate-100 text-muted",
};

export function Badge({ tone = "neutral", icon, children }: { tone?: Tone; icon?: IconName; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

export function StatusDot({ tone = "ok", label }: { tone?: Tone; label: string }) {
  const dot: Record<Tone, string> = {
    ok: "bg-ok", warn: "bg-warn", err: "bg-err", info: "bg-brand-600", neutral: "bg-slate-400",
  };
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <motion.span
        className={`h-2 w-2 rounded-full ${dot[tone]}`}
        animate={tone === "ok" ? { scale: [1, 1.25, 1] } : undefined}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      {label}
    </span>
  );
}
