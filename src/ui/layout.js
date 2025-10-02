export const layout = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;background:#fff;color:#111}
  header,footer{padding:12px 16px;border-bottom:1px solid #eee}
  a{color:inherit;text-decoration:none}
  .container{max-width:960px;margin:0 auto;padding:16px}
  .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
  .card{border:1px solid #eee;border-radius:10px;padding:12px}
  .price{font-weight:600}
  .age{background:#111;color:#fff;padding:8px 12px;border-radius:8px;margin:8px 0;display:inline-block}
</style></head>
<body>
<header><div class="container"><a href="/">CapeChews</a> • <a href="/shop">Shop</a> • <a href="/memberships">Memberships</a></div></header>
<main><div class="container">${body}</div></main>
<footer><div class="container">© ${new Date().getFullYear()} CapeChews • 18+ only</div></footer>
</body></html>`;
