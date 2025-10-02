-- Users & auth
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  phone TEXT,
  whatsapp_msisdn TEXT,
  membership_tier TEXT DEFAULT 'free', -- free|member|vip
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

-- Membership plans
CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier TEXT UNIQUE NOT NULL,          -- free|member|vip
  price_cents INTEGER DEFAULT 0,
  duration_months INTEGER DEFAULT 1,
  perks_json TEXT,                    -- JSON blob
  active INTEGER DEFAULT 1
);

-- Product catalog
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,             -- gummies|beverages|candies
  description TEXT,
  price_cents INTEGER NOT NULL,
  member_price_cents INTEGER,         -- optional for member/vip
  image_url TEXT,
  legal_flags TEXT,                   -- e.g., "CBD", "THC"
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

-- Inventory/batches (optional expiry tracking)
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  sku TEXT,
  batch_code TEXT,
  expiry_date TEXT,                   -- ISO date
  stock INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Carts (KV can hold sessions; D1 stores server-side snapshots)
CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,                -- uuid
  user_id INTEGER,
  items_json TEXT NOT NULL,           -- [{product_id, qty, price_cents}]
  total_cents INTEGER NOT NULL,
  membership_tier TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,                -- uuid
  user_id INTEGER,
  status TEXT NOT NULL,               -- pending|paid|packing|shipped|delivered|cancelled
  items_json TEXT NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  yoco_payment_id TEXT,
  yoco_link_url TEXT,
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Payments (webhook-auditable)
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  provider TEXT NOT NULL,             -- yoco
  provider_ref TEXT,                  -- event/id
  status TEXT NOT NULL,               -- created|success|failed|refunded
  amount_cents INTEGER NOT NULL,
  raw_json TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- WhatsApp message log
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_number TEXT NOT NULL,
  body TEXT NOT NULL,
  direction TEXT NOT NULL,            -- incoming|outgoing
  order_id TEXT,
  media_url TEXT,
  timestamp INTEGER NOT NULL
);

-- Site settings (age gate, legal text, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Minimal seed
INSERT OR IGNORE INTO memberships (tier, price_cents, duration_months, perks_json, active)
VALUES
 ('free', 0, 0, '{}', 1),
 ('member', 9900, 1, '{"discount":0.10}', 1),
 ('vip', 19900, 1, '{"discount":0.20,"drops":true}', 1);
