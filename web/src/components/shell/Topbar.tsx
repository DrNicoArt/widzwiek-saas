"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

export default function Topbar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/app/projekty?q=${encodeURIComponent(q.trim())}` : "/app/projekty");
  }
  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-hair/60 bg-white/45 px-6 py-3 backdrop-blur-xl">
      <div className="min-w-0">
        <p className="truncate text-xs uppercase tracking-wide text-muted">Pracownia napisów</p>
        <h1 className="truncate text-[15px] font-medium text-graphite">Dzień dobry 👋</h1>
      </div>
      <Link href="/app/studio" className="focusring ml-auto inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"><Icon name="upload" size={17} /> <span className="hidden sm:inline">Nowy materiał</span></Link>
      <form onSubmit={submit} className="hidden items-center md:flex">
        <div className="relative">
          <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj materiałów…"
            aria-label="Szukaj materiałów" className="focusring h-10 w-64 rounded-xl border border-hair/70 bg-white/70 pl-10 pr-3 text-sm outline-none placeholder:text-muted/70" />
        </div>
      </form>
      <button className="focusring grid h-10 w-10 place-items-center rounded-xl border border-hair/70 bg-white/70 text-muted hover:bg-brand-50" aria-label="Powiadomienia (demo)" title="Powiadomienia (demo)">
        <Icon name="bell" size={19} />
      </button>
      <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-sm font-medium text-white" title="Konto demo" aria-hidden>AN</div>
    </header>
  );
}
