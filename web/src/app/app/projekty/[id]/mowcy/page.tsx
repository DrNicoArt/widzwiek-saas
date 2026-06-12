// Zakładka „Mówcy i dźwięki" została scalona z edytorem (Napisy, mówcy i dźwięki).
// Stare linki/zakładki przekierowujemy, aby nie zwracały 404.
import { redirect } from "next/navigation";

export default function MowcyRedirect({ params }: { params: { id: string } }) {
  redirect(`/app/projekty/${params.id}/napisy`);
}
