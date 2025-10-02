export async function createYocoPaymentLink(env, { amount_cents, currency="ZAR", description, reference }) {
  // Placeholder: replace with real Yoco call (server-to-server) when live
  // Return a mock structure that your UI expects.
  const id = `yoco_${crypto.randomUUID()}`;
  const url = `${env.SITE_URL}/pay/${id}`;
  return { id, url };
}
