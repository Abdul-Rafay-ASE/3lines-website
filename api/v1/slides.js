// Read-only public endpoint backed by seed data (not editable in MVP).
const seeds = require('../cms/_seeds');
const { corsJSON } = require('../cms/_lib');
module.exports = async (req, res) => {
  corsJSON(res);
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  res.json(seeds.slides);
};
