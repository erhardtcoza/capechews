import { json, ok, bad } from "../utils/http.js";
import { sendWhatsApp } from "../utils/whatsapp.js";
import { createYocoPaymentLink } from "../utils/yoco.js";

export function mountWhatsApp(router, env) {
  // GET for webhook verification
  router.on("GET", "/api/whatsapp/webhook", async (req) => {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) return new Response(challenge, { status:200 });
    return bad("verify failed", 403);
  });

  // POST inbound messages
  router.on("POST", "/api/whatsapp/webhook", async (req) => {
    const data = await req.json().catch(()=>null);
    // Parse basic text message
    const msg = data?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = msg?.from; // msisdn
    const text = msg?.text?.body?.trim().toLowerCase();

    if (from && text) {
      await env.DB.prepare(`INSERT INTO messages (from_number, body, direction, timestamp)
                            VALUES (?1, ?2, 'incoming', ?3)`)
                  .bind(from, text, Date.now()).run();

      // Very simple “order” intent demo
      if (text.includes("order")) {
        // create trivial order (replace with real carting flow)
        const orderId = crypto.randomUUID();
        const total_cents = 19900; // R199 demo
        await env.DB.prepare(
          `INSERT INTO orders (id, status, items_json, subtotal_cents, total_cents, currency, shipping_phone, created_at)
           VALUES (?1, 'pending', ?2, ?3, ?3, 'ZAR', ?4, ?5)`
        ).bind(orderId, JSON.stringify([{ product_id: 1, qty: 1 }]), total_cents, from, Date.now()).run();

        const pay = await createYocoPaymentLink(env, {
          amount_cents: total_cents,
          description: `CapeChews Order ${orderId}`,
          reference: orderId
        });

        await env.DB.prepare(`UPDATE orders SET yoco_payment_id=?1, yoco_link_url=?2 WHERE id=?3`)
                     .bind(pay.id, pay.url, orderId).run();

        await sendWhatsApp(env, from, `Great! Your order is created.\nPay here: ${pay.url}\nRef: ${orderId}`);
        return ok();
      }

      await sendWhatsApp(env, from,
        "Hi! Reply with 'order' to start a quick purchase, or visit our shop online: " + (env.SITE_URL || ""));
    }

    return ok();
  });
}
