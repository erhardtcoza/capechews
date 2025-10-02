import { json, bad, ok } from "../utils/http.js";
import { hmacVerifySHA256 } from "../utils/crypto.js";
import { sendWhatsApp } from "../utils/whatsapp.js";

export function mountYocoWebhook(router, env) {
  // POST /api/webhooks/yoco
  router.on("POST", "/api/webhooks/yoco", async (req) => {
    const signature = req.headers.get("x-yoco-signature"); // confirm actual header from Yoco docs
    const payload = await req.text(); // raw body for HMAC
    const verified = await hmacVerifySHA256(env.YOCO_WEBHOOK_SECRET, payload, signature || "");
    if (!verified) return bad("Invalid signature", 401);

    const event = JSON.parse(payload);
    const kind = event?.type || event?.event || "";
    const orderId = event?.metadata?.reference || event?.reference || null;
    const amount = event?.amount || 0;
    const status = kind.includes("success") ? "success" : (kind.includes("failed") ? "failed" : "created");

    if (!orderId) return bad("Missing reference/orderId", 400);

    await env.DB.prepare(
      `INSERT INTO payments (order_id, provider, provider_ref, status, amount_cents, raw_json, created_at)
       VALUES (?1, 'yoco', ?2, ?3, ?4, ?5, ?6)`
    ).bind(orderId, event?.id || kind, status, amount, JSON.stringify(event), Date.now()).run();

    if (status === "success") {
      await env.DB.prepare(`UPDATE orders SET status='paid', updated_at=?2 WHERE id=?1`)
                   .bind(orderId, Date.now()).run();

      // Optional: fetch customer phone from order or user
      const order = await env.DB.prepare(`SELECT shipping_phone FROM orders WHERE id=?1`).bind(orderId).first();
      if (order?.shipping_phone) {
        await sendWhatsApp(env, order.shipping_phone, `Payment received ✅\nOrder: ${orderId}\nThanks for shopping at CapeChews!`);
      }
    }

    return ok();
  });
}
