// src/routes/admin.js
import { json, bad } from "../utils/http.js";

/** ---- tiny auth helper (header-based) ---- */
function requireAdmin(req, env) {
  const key = req.headers.get("x-admin-key") || req.headers.get("X-Admin-Key");
  return key && env.ADMIN_KEY && key === env.ADMIN_KEY;
}

export function mountAdmin(router, env) {
  // ------- PRODUCTS -------
  // GET /api/admin/products
  router.on("GET", "/api/admin/products", async (req) => {
    if (!requireAdmin(req, env)) return bad("unauthorized", 401);
    const rows = await env.DB.prepare(
      `SELECT id, name, slug, category, price_cents, member_price_cents, image_url, legal_flags, created_at, updated_at
       FROM products ORDER BY id DESC`
    ).all();
    return json({ ok: true, products: rows.results || [] });
  });

  // POST /api/admin/product.create
  router.on("POST", "/api/admin/product.create", async (req) => {
    if (!requireAdmin(req, env)) return bad("unauthorized", 401);
    const b = await req.json().catch(()=>null);
    if (!b?.name || !b?.price_cents || !b?.category) return bad("missing fields");

    const slug = (b.slug || b.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await env.DB.prepare(
      `INSERT INTO products (name, slug, category, description, price_cents, member_price_cents, image_url, legal_flags, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    ).bind(
      b.name, slug, b.category, b.description || "", b.price_cents,
      b.member_price_cents ?? null, b.image_url || "", b.legal_flags || "", Date.now()
    ).run();

    return json({ ok: true });
  });

  // PUT /api/admin/product.update
  router.on("PUT", "/api/admin/product.update", async (req) => {
    if (!requireAdmin(req, env)) return bad("unauthorized", 401);
    const b = await req.json().catch(()=>null);
    if (!b?.id) return bad("id required");

    await env.DB.prepare(
      `UPDATE products SET
         name=COALESCE(?2,name),
         slug=COALESCE(?3,slug),
         category=COALESCE(?4,category),
         description=COALESCE(?5,description),
         price_cents=COALESCE(?6,price_cents),
         member_price_cents=?7,
         image_url=COALESCE(?8,image_url),
         legal_flags=COALESCE(?9,legal_flags),
         updated_at=?10
       WHERE id=?1`
    ).bind(
      b.id, b.name ?? null, b.slug ?? null, b.category ?? null, b.description ?? null,
      b.price_cents ?? null, (b.member_price_cents === undefined ? null : b.member_price_cents),
      b.image_url ?? null, b.legal_flags ?? null, Date.now()
    ).run();

    return json({ ok: true });
  });

  // DELETE /api/admin/product.delete?id=123
  router.on("DELETE", "/api/admin/product.delete", async (req) => {
    if (!requireAdmin(req, env)) return bad("unauthorized", 401);
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return bad("id required");
    await env.DB.prepare(`DELETE FROM products WHERE id=?1`).bind(id).run();
    return json({ ok: true });
  });

  // ------- ORDERS -------
  // GET /api/admin/orders?status=pending
  router.on("GET", "/api/admin/orders", async (req) => {
    if (!requireAdmin(req, env)) return bad("unauthorized", 401);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    let q = `SELECT id, status, total_cents, currency, shipping_name, shipping_phone, created_at, updated_at
             FROM orders`;
    const args = [];
    if (status) { q += ` WHERE status=?1`; args.push(status); }
    q += ` ORDER BY created_at DESC LIMIT 200`;
    const rows = await env.DB.prepare(q).bind(...args).all();
    return json({ ok: true, orders: rows.results || [] });
  });

  // POST /api/admin/order.update  -> { id, status }
  router.on("POST", "/api/admin/order.update", async (req) => {
    if (!requireAdmin(req, env)) return bad("unauthorized", 401);
    const b = await req.json().catch(()=>null);
    if (!b?.id || !b?.status) return bad("id and status required");
    const allowed = new Set(["pending","paid","packing","shipped","delivered","cancelled"]);
    if (!allowed.has(b.status)) return bad("invalid status");
    await env.DB.prepare(`UPDATE orders SET status=?2, updated_at=?3 WHERE id=?1`)
      .bind(b.id, b.status, Date.now()).run();
    return json({ ok: true });
  });
}
