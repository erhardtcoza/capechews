// src/ui/admin.js
export function adminHTML() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CapeChews Admin</title>
<style>
  :root { --bg:#0b0c0e; --card:#121317; --muted:#2a2d36; --txt:#e8e9ee; --acc:#E10600; }
  body{margin:0;font-family:ui-sans-serif,system-ui;background:var(--bg);color:var(--txt)}
  header{padding:14px 18px;border-bottom:1px solid var(--muted);display:flex;gap:12px;align-items:center}
  header h1{font-size:16px;margin:0}
  .container{max-width:1100px;margin:0 auto;padding:18px}
  .row{display:flex;gap:18px;flex-wrap:wrap}
  .card{background:var(--card);border:1px solid var(--muted);border-radius:12px;padding:16px;flex:1 1 520px}
  input,select,button,textarea{background:#0f1116;color:var(--txt);border:1px solid var(--muted);border-radius:10px;padding:10px}
  button{cursor:pointer}
  table{width:100%;border-collapse:collapse;margin-top:10px}
  th,td{border-bottom:1px solid var(--muted);padding:8px 6px;font-size:14px}
  .tag{padding:2px 8px;border-radius:999px;background:#1a1c23;font-size:12px}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .danger{background:#2a1313;border-color:#5a1a1a}
  .accent{background:var(--acc);border-color:var(--acc);color:#fff}
  .actions{display:flex;gap:6px}
</style>
</head>
<body>
<header>
  <h1>🛠️ CapeChews Admin</h1>
  <div class="tag" id="statusTag">Disconnected</div>
</header>

<div class="container">
  <div class="row">
    <section class="card" id="prodCard">
      <h2>Products</h2>
      <div class="grid">
        <input id="p_name" placeholder="Name">
        <input id="p_slug" placeholder="Slug (optional)">
        <select id="p_category">
          <option value="gummies">gummies</option>
          <option value="beverages">beverages</option>
          <option value="candies">candies</option>
        </select>
        <input id="p_price" type="number" placeholder="Price cents (e.g. 19900)">
        <input id="p_member_price" type="number" placeholder="Member price cents (optional)">
        <input id="p_image" placeholder="Image URL">
        <input id="p_flags" placeholder="Legal flags (CBD/THC)">
      </div>
      <textarea id="p_desc" rows="3" placeholder="Description" style="margin-top:8px;width:100%"></textarea>
      <div class="actions" style="margin-top:10px">
        <button class="accent" onclick="createProduct()">Create</button>
        <button onclick="fetchProducts()">Refresh</button>
      </div>
      <table id="prodTable">
        <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Member</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
    </section>

    <section class="card" id="ordersCard">
      <h2>Orders</h2>
      <div class="actions">
        <select id="o_status">
          <option value="">All</option>
          <option>pending</option><option>paid</option><option>packing</option>
          <option>shipped</option><option>delivered</option><option>cancelled</option>
        </select>
        <button onclick="fetchOrders()">Load</button>
      </div>
      <table id="ordersTable">
        <thead><tr><th>ID</th><th>Status</th><th>Total</th><th>Phone</th><th>Created</th><th>→</th></tr></thead>
        <tbody></tbody>
      </table>
    </section>
  </div>
</div>

<script>
  const BASE = location.origin;
  const KEY = (sessionStorage.getItem("ADMIN_KEY") || document.currentScript.getAttribute("data-key")) || (()=>{
    const k = prompt("Enter Admin Key (x-admin-key):");
    if (k) sessionStorage.setItem("ADMIN_KEY", k);
    return k || "";
  })();

  document.getElementById("statusTag").textContent = KEY ? "Key loaded" : "No key";

  async function api(path, opts={}) {
    const res = await fetch(BASE + path, {
      ...opts,
      headers: { "content-type":"application/json", "x-admin-key": KEY, ...(opts.headers||{}) }
    });
    if (!res.ok) { const t = await res.text(); throw new Error(t); }
    return res.json();
  }

  // PRODUCTS
  async function fetchProducts(){
    const data = await api("/api/admin/products");
    const tb = document.querySelector("#prodTable tbody");
    tb.innerHTML = "";
    for (const p of data.products) {
      const tr = document.createElement("tr");
      tr.innerHTML = \`
        <td>\${p.id}</td>
        <td contenteditable="true" data-field="name">\${p.name}</td>
        <td contenteditable="true" data-field="category">\${p.category}</td>
        <td contenteditable="true" data-field="price_cents">\${p.price_cents}</td>
        <td contenteditable="true" data-field="member_price_cents">\${p.member_price_cents ?? ""}</td>
        <td class="actions">
          <button onclick="saveProduct(\${p.id}, this)">Save</button>
          <button class="danger" onclick="deleteProduct(\${p.id})">Delete</button>
        </td>\`;
      tb.appendChild(tr);
    }
  }
  async function createProduct(){
    const body = {
      name: val("#p_name"),
      slug: val("#p_slug") || undefined,
      category: val("#p_category"),
      description: val("#p_desc"),
      price_cents: Number(val("#p_price")),
      member_price_cents: val("#p_member_price") ? Number(val("#p_member_price")) : undefined,
      image_url: val("#p_image"),
      legal_flags: val("#p_flags")
    };
    await api("/api/admin/product.create", { method:"POST", body: JSON.stringify(body) });
    clearForm(); fetchProducts();
  }
  async function saveProduct(id, btn){
    const tr = btn.closest("tr");
    const body = {
      id,
      name: td(tr,"name"),
      category: td(tr,"category"),
      price_cents: Number(td(tr,"price_cents")),
      member_price_cents: td(tr,"member_price_cents") === "" ? null : Number(td(tr,"member_price_cents"))
    };
    await api("/api/admin/product.update", { method:"PUT", body: JSON.stringify(body) });
    fetchProducts();
  }
  async function deleteProduct(id){
    if (!confirm("Delete product " + id + "?")) return;
    await api("/api/admin/product.delete?id=" + id, { method:"DELETE" });
    fetchProducts();
  }

  // ORDERS
  async function fetchOrders(){
    const st = document.getElementById("o_status").value;
    const data = await api("/api/admin/orders" + (st? ("?status="+encodeURIComponent(st)) : ""));
    const tb = document.querySelector("#ordersTable tbody");
    tb.innerHTML = "";
    for (const o of data.orders) {
      const tr = document.createElement("tr");
      const created = new Date(o.created_at).toLocaleString();
      tr.innerHTML = \`
        <td>\${o.id}</td>
        <td>
          <select data-id="\${o.id}" onchange="updateOrderStatus(this)">
            \${["pending","paid","packing","shipped","delivered","cancelled"].map(s => \`<option \${s===o.status?"selected":""}>\${s}</option>\`).join("")}
          </select>
        </td>
        <td>R \${(o.total_cents/100).toFixed(2)}</td>
        <td>\${o.shipping_phone || ""}</td>
        <td>\${created}</td>
        <td><button onclick="copyId('\${o.id}')">Copy ID</button></td>\`;
      tb.appendChild(tr);
    }
  }
  async function updateOrderStatus(sel){
    const id = sel.getAttribute("data-id");
    const status = sel.value;
    await api("/api/admin/order.update", { method:"POST", body: JSON.stringify({ id, status }) });
  }

  // helpers
  function val(q){ return document.querySelector(q).value.trim(); }
  function td(tr, f){ return tr.querySelector(\`[data-field="\${f}"]\`).textContent.trim(); }
  function clearForm(){ for (const id of ["#p_name","#p_slug","#p_desc","#p_price","#p_member_price","#p_image","#p_flags"]) document.querySelector(id).value=""; }
  function copyId(s){ navigator.clipboard.writeText(s); }

  // initial load
  fetchProducts(); fetchOrders();
</script>
</body></html>`;
}
