export async function sendWhatsApp(env, to, text) {
  // WhatsApp Cloud API placeholder; replace with real POST to /messages
  // Store to messages table for audit
  await env.DB.prepare(`INSERT INTO messages (from_number, body, direction, timestamp)
                        VALUES (?1, ?2, 'outgoing', ?3)`).bind(to, text, Date.now()).run();
  return { ok: true };
}
