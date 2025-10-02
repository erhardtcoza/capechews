import { json, bad } from "../utils/http.js";
import { createYocoPaymentLink } from "../utils/yoco.js";

export function mountCheckout(router, env) {
  // POST /api/checkout -> { cart_id, shipping:{name,phone,address} }
  router.on("POST", "/api/checkout", async (req) => {
    const body = await req.json().catch(()=>null);
    if (!body?.cart_id) return bad("cart_id required");

    const cart = await env.DB.prepare(`SELECT * FROM carts WHERE id=?1`).bind(body.cart_id).first();
    if (!cart) return bad("Cart not found", 404);

    // Create order
    const orderId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO orders (id, user_id, status, items_json, subtotal_cents, discount_cents, total_cents, currency,
                           shipping_name, shipping_phone, shipping_address, created_at)
       VALUES (?1, NULL, 'pending', ?2, ?3, 0, ?3, 'ZAR', ?4, ?5, ?6, ?7)`
    ).bind(orderId, cart.items_json, cart.total_cents,
           body.shipping?.name || '', body.shipping?.phone || '', body.shipping?.address || '',
           Date.now()).run();

    const pay = await createYocoPaymentLink(env, {
      amount_cents: cart.total_cents,
      currency: "ZAR",
      description: `CapeChews Order ${orderId}`,
      reference: orderId
    });

    await env.DB.prepare(`UPDATE orders SET yoco_payment_id=?1, yoco_link_url=?2 WHERE id=?3`)
                 .bind(pay.id, pay.url, orderId).run();

    return json({ ok:true, order_id: orderId, payment: pay });
  });
}
