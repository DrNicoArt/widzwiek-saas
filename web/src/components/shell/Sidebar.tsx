"use client";
// Cockpit sidebar — większy oficjalny logotyp + realna nawigacja (osobne podstrony /app/*).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import BrandLogo from "@/components/brand/BrandLogo";
import Icon, { type IconName } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/Badge";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/app", label: "Przegląd", icon: "grid" },
  { href: "/app/studio", label: "Nowy materiał", icon: "upload" },
  { href: "/app/projekty", label: "Projekty", icon: "folder" },
  { href: "/app/napisy", label: "Napisy", icon: "captions" },
  { href: "/app/mowcy", label: "Mówcy i dźwięki", icon: "users" },
  { href: "/app/eksporty", label: "Eksporty", icon: "download" },
  { href: "/app/plan", label: "Plan i płatności", icon: "card" },
  { href: "/app/integracje", label: "Integracje", icon: "plug" },
  { href: "/app/ustawienia", label: "Ustawienia", icon: "settings" },
];

export default function Sidebar({ workerUp }: { workerUp: boolean | null }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
  return (
    <aside className="relative hidden w-[248px] shrink-0 flex-col overflow-hidden border-r border-hair/70 bg-white/55 backdrop-blur-xl lg:flex">
      <div className="px-5 pb-3 pt-6"><Link href="/" aria-label="Widźwięk — strona główna"><BrandLogo width="170" /></Link></div>

      <nav className="relative z-10 mt-2 flex-1 px-3">
        {NAV.map((it) => {
          const active = isActive(it.href);
          return (
            <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
              className={[
                "relative mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focusring",
                active ? "bg-brand-50/80 font-medium text-brand-700" : "text-graphite hover:bg-brand-50/60",
              ].join(" ")}>
              {active && <motion.span layoutId="navactive" className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r bg-brand-600" />}
              <Icon name={it.icon} size={19} className={active ? "text-brand-600" : "text-muted"} />
              <span className="flex-1">{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <img src="/brand/sygnet.svg" alt="" aria-hidden draggable={false}
        className="pointer-events-none absolute -bottom-6 -left-10 w-[150%] max-w-none opacity-[0.06]" />

      <div className="relative z-10 border-t border-hair/70 px-5 py-4">
        <div className="rounded-xl bg-white/60 px-3 py-2.5 ring-1 ring-hair/60">
          <StatusDot tone={workerUp === false ? "err" : workerUp ? "ok" : "neutral"}
            label={workerUp === false ? "worker offline" : workerUp ? "system online" : "łączenie…"} />
          <p className="mt-1 text-[11px] text-muted">Widźwięk Pracownia · demo</p>
        </div>
      </div>
    </aside>
  );
}
