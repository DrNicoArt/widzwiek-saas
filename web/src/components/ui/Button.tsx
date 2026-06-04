"use client";
// Przycisk: warianty primary/secondary/ghost, press-scale, focus-ring, stan loading.
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { pressTap, spring } from "@/lib/motion";
import Icon, { type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost";
const styles: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-white text-graphite border border-hair hover:bg-brand-50",
  ghost: "bg-transparent text-brand-700 hover:bg-brand-50",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant; icon?: IconName; loading?: boolean; children?: ReactNode;
};

export default function Button({
  variant = "primary", icon, loading = false, children, className = "", disabled, ...rest
}: Props) {
  return (
    <motion.button
      whileTap={pressTap} transition={spring} disabled={disabled || loading}
      className={[
        "focusring inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5",
        "text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant], className,
      ].join(" ")}
      {...(rest as any)}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : icon ? (
        <Icon name={icon} size={18} />
      ) : null}
      {children}
    </motion.button>
  );
}
