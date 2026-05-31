const { sessionCookie } = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Set-Cookie', sessionCookie('', 0));
  res.json({ ok: true });
};
