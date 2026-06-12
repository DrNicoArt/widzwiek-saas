"use client";
// Cockpit sidebar — logotyp z brand.config + nawigacja (etykiety przez i18n).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import BrandLogo from "@/components/brand/BrandLogo";
import Icon, { type IconName } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/Badge";
import { BRAND } from "@/lib/brand";
import { useT } from "@/lib/i18n";

const BUILD = "brand-i18n";

export default function Sidebar({ workerUp }: { workerUp: boolean | null }) {
  const pathname = usePathname();
  const t = useT();
  const NAV: { href: string; label: string; icon: IconName }[] = [
    { href: "/app", label: t.nav.overview, icon: "grid" },
    { href: "/app/studio", label: t.nav.studio, icon: "captions" },
    { href: "/app/plan", label: t.nav.plan, icon: "card" },
    { href: "/app/ustawienia", label: t.nav.settings, icon: "settings" },
  ];
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : href === "/app/studio" ? (pathname.startsWith("/app/studio") || pathname.startsWith("/app/projekty") || pathname.startsWith("/app/skaner")) : pathname.startsWith(href));
  return (
    <aside className="relative hidden w-[248px] shrink-0 flex-col overflow-hidden border-r border-hair/70 bg-white/55 backdrop-blur-xl lg:flex">
      <div className="px-5 pb-3 pt-6"><Link href="/" aria-label={t.sidebar.home}><BrandLogo width="170" /></Link></div>

      <nav className="relative z-10 mt-2 flex-1 px-3">
        {NAV.map((it) => {
          const active = isActive(it.href);
          return (
            <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
              className={[
                "relative mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focusring",
                active ? "bg-brand-50/80 font-medium text-brand-700" : "text-graphite hover:translate-x-0.5 hover:bg-brand-50/60",
              ].join(" ")}>
              {active && <motion.span layoutId="navactive" className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r bg-gradient-to-b from-brand-500 to-accent-500" />}
              <Icon name={it.icon} size={19} className={active ? "text-brand-600" : "text-muted"} />
              <span className="flex-1">{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <img src={BRAND.assets.sygnet} alt="" aria-hidden draggable={false}
        className="pointer-events-none absolute -bottom-6 -left-10 w-[150%] max-w-none opacity-[0.06]" />

      <div className="relative z-10 border-t border-hair/70 px-5 py-4">
        <div className="rounded-xl bg-white/60 px-3 py-2.5 ring-1 ring-hair/60">
          <StatusDot tone={workerUp === false ? "err" : workerUp ? "ok" : "neutral"}
            label={workerUp === false ? t.status.offline : workerUp ? t.status.online : t.status.connecting} />
          <p className="mt-1 text-[11px] text-muted">{t.sidebar.build} <span className="font-mono">{BUILD}</span></p>
        </div>
      </div>
    </aside>
  );
}
