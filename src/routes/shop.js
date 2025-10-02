import { json, bad } from "../utils/http.js";

export function mountShop(router, env) {
  // GET /api/shop/products?category=gummies
  router.on("GET", "/api/shop/products", async (req) => {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    let q = `SELECT id,name,slug,category,price_cents,member_price_cents,image_url FROM products`;
    const args = [];
    if (category) { q += ` WHERE category=?1`; args.push(category); }
    const rows = await env.DB.prepare(q).bind(...args).all();
    return json({ ok:true, products: rows.results || [] });
  });

  // GET /api/shop/product/:slug  (simple path match)
  router.on("GET", "/api/shop/product", async (req) => {
    const slug = new URL(req.url).searchParams.get("slug");
    if (!slug) return bad("slug required");
    const row = await env.DB.prepare(
      `SELECT * FROM products WHERE slug=?1 LIMIT 1`
    ).bind(slug).first();
    if (!row) return bad("Not found", 404);
    return json({ ok:true, product: row });
  });
}
