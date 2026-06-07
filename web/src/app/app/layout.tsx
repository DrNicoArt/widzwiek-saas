// Layout sekcji roboczej /app — cockpit (AppShell). Strona / nie używa tego layoutu.
import AppShell from "@/components/shell/AppShell";

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
