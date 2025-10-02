// src/index.js
import { Router } from "./router.js";
import { bindEnv } from "./env.js";
import { text } from "./utils/http.js";

import { mountShop } from "./routes/shop.js";
import { mountCart } from "./routes/cart.js";
import { mountCheckout } from "./routes/checkout.js";
import { mountYocoWebhook } from "./routes/webhooks.yoco.js";
import { mountWhatsApp } from "./routes/whatsapp.js";
import { mountMemberships } from "./routes/memberships.js";
import { mountAdmin } from "./routes/admin.js";

import { adminHTML } from "./ui/admin.js";

/* ------------------------------- CORS helpers ------------------------------ */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, x-admin-key, X-Admin-Key, Authorization",
};
function isApiPath(pathname) {
  return pathname.startsWith("/api/");
}
function withCORS(resp) {
  const r = new Response(resp.body, resp);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => r.headers.set(k, v));
  return r;
}
function preflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/* --------------------------------- Worker --------------------------------- */
export default {
  async fetch(request, rawEnv, ctx) {
    const env = bindEnv(rawEnv);
    const url = new URL(request.url);
    const router = new Router();

    // Mount API routes (they close over env)
    mountShop(router, env);
    mountCart(router, env);
    mountCheckout(router, env);
    mountYocoWebhook(router, env);
    mountWhatsApp(router, env);
    mountMemberships(router, env);
    mountAdmin(router, env);

    try {
      // Health endpoints
      if (url.pathname === "/health") return text("ok");
      if (url.pathname === "/diag") {
        return new Response(
          JSON.stringify({
            ok: true,
            ts: Date.now(),
            site: env.SITE_URL || null,
            legal_thc: env.LEGAL_THC,
            age_min: env.AGE_MIN,
          }),
          { headers: { "content-type": "application/json" } }
        );
      }

      // Admin UI (require x-admin-key just to render the page)
      if (url.pathname === "/admin") {
        const key =
          request.headers.get("x-admin-key") ||
          request.headers.get("X-Admin-Key");
        if (!key) {
          return new Response(
            "Admin key required in 'x-admin-key' header to view UI.",
            { status: 401 }
          );
        }
        if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
          return new Response("Invalid admin key.", { status: 403 });
        }
        return new Response(adminHTML(), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }

      // Simple public pages (replace with real UI when ready)
      if (url.pathname === "/") return text("CapeChews Home");
      if (url.pathname === "/shop") return text("Shop page");
      if (url.pathname === "/memberships") return text("Memberships page");

      // CORS preflight for /api/*
      if (request.method === "OPTIONS" && isApiPath(url.pathname)) {
        return preflight();
      }

      // Route to API handlers
      const handler = router.match(request.method, url.pathname);
      if (handler) {
        const resp = await handler(request);
        return isApiPath(url.pathname) ? withCORS(resp) : resp;
      }

      return new Response("Not found", { status: 404 });
    } catch (err) {
      const body =
        env?.DEBUG === "true"
          ? `Internal Error: ${err?.message || err}`
          : "Internal Error";
      const resp = new Response(body, { status: 500 });
      return isApiPath(url.pathname) ? withCORS(resp) : resp;
    }
  },
};
