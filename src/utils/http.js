export const json = (obj, init={}) =>
  new Response(JSON.stringify(obj), { headers: { "content-type":"application/json" }, ...init });

export const text = (t, init={}) =>
  new Response(t, { headers: { "content-type":"text/plain" }, ...init });

export const bad = (msg="Bad Request", code=400) => json({ ok:false, error:msg }, { status: code });
export const ok = (data={}) => json({ ok:true, ...data });
