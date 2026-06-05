"use client";
import { motion } from "framer-motion";
import Icon, { type IconName } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { fadeUp } from "@/lib/motion";

export default function PageHeader({ icon, title, desc, demo = false }: { icon: IconName; title: string; desc?: string; demo?: boolean }) {
  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-6 flex items-start gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name={icon} size={22} /></span>
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
