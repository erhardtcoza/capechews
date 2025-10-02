import { json } from "../utils/http.js";
export function mountMemberships(router, env) {
  router.on("GET", "/api/memberships", async () => {
    const rows = await env.DB.prepare(`SELECT tier, price_cents, duration_months, perks_json FROM memberships WHERE active=1`).all();
    return json({ ok:true, memberships: rows.results || [] });
  });
}
