"use client";
import { motion } from "framer-motion";
import Icon, { type IconName } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { fadeUp, spring } from "@/lib/motion";

export default function PageHeader({ icon, title, desc, demo = false }: { icon: IconName; title: string; desc?: string; demo?: boolean }) {
  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-6 flex items-start gap-3">
      <motion.span
        initial={{ scale: 0.7, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={spring}
        className="relative grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <Icon name={icon} size={22} />
        <motion.span aria-hidden className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent-500 ring-2 ring-white"
          animate={{ scale: [1, 1.35, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
      </motion.span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium text-graphite">{title}</h1>
          {demo && <Badge tone="info" icon="sparkles">dane demo</Badge>}
        </div>
        {desc && <p className="mt-1 max-w-2xl text-sm text-muted">{desc}</p>}
      </div>
    </motion.div>
  );
}
