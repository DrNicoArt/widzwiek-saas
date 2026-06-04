"use client";
// Szkielet aplikacji: sidebar + topbar + treść. Splash na starcie, baner offline,
// poll zdrowia workera (kontekst dla całego UI). Desktop-first.
import { AnimatePresence } from "framer-motion";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { checkHealth } from "@/lib/api";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Splash from "./Splash";
import OfflineBanner from "./OfflineBanner";

const WorkerCtx = createContext<boolean | null>(null);
export const useWorkerUp = () => useContext(WorkerCtx);

export default function AppShell({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [workerUp, setWorkerUp] = useState<boolean | null>(null);

  const ping = () => checkHealth().then(setWorkerUp).catch(() => setWorkerUp(false));

  useEffect(() => {
    ping();
    const id = setInterval(ping, 15000);
    const t = setTimeout(() => setBooting(false), 1200);
    return () => { clearInterval(id); clearTimeout(t); };
  }, []);

  return (
    <WorkerCtx.Provider value={workerUp}>
      <AnimatePresence>{booting && <Splash key="splash" />}</AnimatePresence>
      <div className="flex min-h-dvh">
        <Sidebar workerUp={workerUp} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          {workerUp === false && <OfflineBanner onRetry={ping} />}
          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </WorkerCtx.Provider>
  );
}
