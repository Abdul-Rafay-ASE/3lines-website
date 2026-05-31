// Service card overrides consumed by the cms-overrides.js client script.
const { readSection, corsJSON } = require('../cms/_lib');
const seeds = require('../cms/_seeds');
module.exports = async (req, res) => {
  corsJSON(res);
  res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=60');
  const data = (await readSection('services')) || seeds.services;
  res.json({ data });
};
