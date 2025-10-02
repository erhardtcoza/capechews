export async function hmacVerifySHA256(secret, payload, signature) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]
  );
  const sigBytes = hexToBytes(signature);
  const ok = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(payload));
  return ok;
}
function hexToBytes(hex){ const a=[]; for(let i=0;i<hex.length;i+=2)a.push(parseInt(hex.substr(i,2),16)); return new Uint8Array(a); }
