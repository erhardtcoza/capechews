import { json, bad } from "../utils/http.js";

export function mountCart(router, env) {
  // POST /api/cart -> { items:[{product_id, qty}], membership_tier }
  router.on("POST", "/api/cart", async (req) => {
    const body = await req.json().catch(()=>null);
    if (!body?.items?.length) return bad("items required");
    const id = crypto.randomUUID();

    // very light total calc; production should fetch real product prices
    let total = 0;
    for (const i of body.items) {
      const p = await env.DB.prepare(`SELECT price_cents, member_price_cents FROM products WHERE id=?1`)
                              .bind(i.product_id).first();
      if (!p) return bad("invalid product");
      const price = body.membership_tier && p.member_price_cents != null ? p.member_price_cents : p.price_cents;
      total += price * (i.qty || 1);
    }

    await env.DB.prepare(
      `INSERT INTO carts (id, user_id, items_json, total_cents, membership_tier, created_at)
       VALUES (?1, NULL, ?2, ?3, ?4, ?5)`
    ).bind(id, JSON.stringify(body.items), total, body.membership_tier || 'free', Date.now()).run();

    return json({ ok:true, cart_id: id, total_cents: total });
  });
}
