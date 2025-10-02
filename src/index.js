import { Router } from "./router.js";
import { bindEnv } from "./env.js";
import { json, text } from "./utils/http.js";

import { mountShop } from "./routes/shop.js";
import { mountCart } from "./routes/cart.js";
import { mountCheckout } from "./routes/checkout.js";
import { mountYocoWebhook } from "./routes/webhooks.yoco.js";
import { mountWhatsApp } from "./routes/whatsapp.js";
import { mountMemberships } from "./routes/memberships.js";
import { mountAdmin } from "./routes/admin.js";

export default {
  async fetch(request, rawEnv, ctx) {
    const env = bindEnv(rawEnv);
    const url = new URL(request.url);
    const router = new Router();

    // APIs
    mountShop(router, env);
    mountCart(router, env);
    mountCheckout(router, env);
    mountYocoWebhook(router, env);
    mountWhatsApp(router, env);
    mountMemberships(router, env);
    mountAdmin(router, env);

    // Static pages (super simple)
    if (url.pathname === "/") return text("CapeChews Home (replace with UI)");
    if (url.pathname === "/shop") return text("Shop page placeholder");
    if (url.pathname === "/memberships") return text("Memberships page placeholder");

    const handler = router.match(request.method, url.pathname);
    if (handler) return handler(request, env, ctx);

    return new Response("Not found", { status: 404 });
  }
};
