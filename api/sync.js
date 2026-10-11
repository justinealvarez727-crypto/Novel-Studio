// Vercel serverless function: stores documents in Upstash Redis. One shared passphrase.
const crypto = require('crypto');
const U = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const T = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = async (cmds) => {
  const r = await fetch(U + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + T }, body: JSON.stringify(cmds) });
  return (await r.json()).map((x) => x.result);
};
const same = (a, b) => {
  const A = Buffer.from(String(a || '')), B = Buffer.from(String(b || ''));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};
module.exports = async (req, res) => {
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const fk = 'ns:fail:' + ip;
  const [fails] = await redis([['GET', fk]]);
  if (Number(fails) >= 10) return res.status(429).json({ error: 'too many attempts, try later' });
  const pw = process.env.APP_PASSWORD;
  if (!pw || !same(req.headers['x-key'], pw)) {
    await redis([['INCR', fk], ['EXPIRE', fk, 900]]);
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (req.method === 'GET') {
    const [ids] = await redis([['SMEMBERS', 'ns:ids']]);
    if (!ids.length) return res.json({});
    const [vals] = await redis([['MGET', ...ids.map((i) => 'ns:doc:' + i)]]);
    const out = {};
    ids.forEach((id, i) => { if (vals[i]) out[id] = JSON.parse(vals[i]); });
    return res.json(out);
  }
  if (req.method === 'PUT') {
    const { id, data } = req.body || {};
    if (typeof id !== 'string' || !/^[\w-]{1,120}$/.test(id)) return res.status(400).json({ error: 'bad id' });
    await redis([['SADD', 'ns:ids', id], ['SET', 'ns:doc:' + id, JSON.stringify(data)]]);
    return res.json({ ok: 1 });
  }
  if (req.method === 'DELETE') {
    const id = String(req.query.id || '');
    await redis([['SREM', 'ns:ids', id], ['DEL', 'ns:doc:' + id]]);
    return res.json({ ok: 1 });
  }
  res.status(405).end();
};
