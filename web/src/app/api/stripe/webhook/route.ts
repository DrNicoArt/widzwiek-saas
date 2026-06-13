// Webhook Stripe — SZKIELET. Weryfikuje podpis (krytyczne dla bezpieczeństwa) bez zależności od SDK
// (node:crypto). Aktualizacje bazy (subscriptions/entitlements/invoices) idą przez SERVICE ROLE
// Supabase — patrz TODO. Wymaga STRIPE_WEBHOOK_SECRET. Runtime Node (surowe body + crypto).
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Weryfikacja nagłówka Stripe-Signature: "t=<ts>,v1=<hmac>", HMAC-SHA256 z `${t}.${payload}`.
function verify(payload: string, header: string | null, secret: string, toleranceSec = 300): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = parts["t"]; const v1 = parts["v1"];
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false; // ochrona przed replay
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1)); } catch { return false; }
}

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook nieskonfigurowany", { status: 503 });

  const payload = await req.text(); // surowe body — wymagane do weryfikacji podpisu
  if (!verify(payload, req.headers.get("stripe-signature"), secret)) {
    return new Response("Nieprawidłowy podpis", { status: 400 });
  }

  const event = JSON.parse(payload) as { type: string; data: { object: Record<string, unknown> } };
  switch (event.type) {
    case "checkout.session.completed":
      // TODO: powiąż session.client_reference_id (org_id) z customer/subscription; utwórz subscriptions (service role)
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // TODO: zaktualizuj subscriptions.status/current_period_end i entitlements organizacji
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      // TODO: dopisz invoices (append-only) + zaktualizuj stan konta
      break;
    default:
      break; // pozostałe zdarzenia ignorujemy
  }
  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "content-type": "application/json" } });
}
