"use client";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import Icon, { type IconName } from "./Icon";

export default function StatTile({
  label, value, icon, tone = "info",
}: { label: string; value: string | number; icon: IconName; tone?: "info" | "ok" | "warn" }) {
  const c = { info: "text-brand-600 bg-brand-50", ok: "text-ok bg-ok/10", warn: "text-warn bg-warn/10" }[tone];
  return (
    <motion.div variants={fadeUp} className="rounded-2xl border border-hair bg-white/90 p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${c}`}><Icon name={icon} size={18} /></span>
      </div>
      <div className="mt-2 text-3xl font-medium tnum text-graphite">{value}</div>
    </motion.div>
  );
}
