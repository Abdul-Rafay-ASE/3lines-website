// Footer/site info overrides consumed by cms-overrides.js.
const { readSection, corsJSON } = require('../cms/_lib');
const seeds = require('../cms/_seeds');
module.exports = async (req, res) => {
  corsJSON(res);
  res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=60');
  const data = (await readSection('siteInfo')) || seeds.siteInfo;
  res.json({ data });
};
