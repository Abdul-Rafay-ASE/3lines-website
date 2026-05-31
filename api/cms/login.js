const { sign, sessionCookie, PASSWORD } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!PASSWORD) return res.status(500).json({ ok: false, error: 'CMS_PASSWORD not configured' });
  const body = req.body || {};
  const provided = (body.password || '').toString();
  if (provided.length !== PASSWORD.length ||
      !require('crypto').timingSafeEqual(Buffer.from(provided.padEnd(PASSWORD.length, ' ')), Buffer.from(PASSWORD.padEnd(provided.length, ' ')))) {
    // small artificial delay to slow brute force
    await new Promise(r => setTimeout(r, 400));
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }
  const oneWeek = 7 * 24 * 60 * 60;
  const token = sign({ sub: 'admin', exp: Date.now() + oneWeek * 1000 });
  res.setHeader('Set-Cookie', sessionCookie(token, oneWeek));
  res.json({ ok: true });
};
