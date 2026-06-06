// Stary globalny route — w architekturze project-centric przekierowujemy w odpowiednie miejsce.
import { redirect } from "next/navigation";
export default function Page() {
  redirect("/app/projekty/p1/napisy");
}
