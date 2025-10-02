import { json, bad } from "../utils/http.js";
export function mountAdmin(router, env) {
  // TODO: JWT auth middleware
  router.on("POST", "/api/admin/product.create", async (req) => {
    const b = await req.json().catch(()=>null);
    if (!b?.name || !b?.price_cents || !b?.category) return bad("missing fields");
    await env.DB.prepare(
      `INSERT INTO products (name, slug, category, description, price_cents, member_price_cents, image_url, legal_flags, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    ).bind(b.name, (b.slug || b.name.toLowerCase().replace(/\s+/g,'-')),
           b.category, b.description || "", b.price_cents, b.member_price_cents ?? null,
           b.image_url || "", b.legal_flags || "", Date.now()).run();
    return json({ ok:true });
  });
}
