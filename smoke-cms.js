// Non-destructive CMS round-trip test against the running server.
// Verifies: wrong-password rejection, login, save-to-disk (LOCAL_MODE),
// and image upload + serve round-trip. Restores all original content.
const fs = require('fs');
const nodePath = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const PW = (function () {
  const raw = fs.readFileSync(nodePath.join(__dirname, '.env.local'), 'utf-8');
  return (raw.match(/^CMS_PASSWORD=(.*)$/m) || [])[1].trim();
})();
const siteInfoPath = nodePath.join(__dirname, 'content', 'siteInfo.json');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => { (cond ? pass++ : fail++); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); };

async function main() {
  // 1. wrong password -> 401
  let r = await fetch(`${BASE}/api/cms/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'definitely-wrong' }) });
  ok('wrong password rejected (401)', r.status === 401, `got ${r.status}`);

  // 2. correct password -> 200 + cookie
  r = await fetch(`${BASE}/api/cms/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: PW }) });
  const setCookie = r.headers.get('set-cookie') || '';
  const cookie = (setCookie.match(/cms_session=[^;]+/) || [])[0] || '';
  ok('correct password accepted (200)', r.status === 200, `got ${r.status}`);
  ok('session cookie issued', !!cookie);

  const authHeaders = { 'Content-Type': 'application/json', Cookie: cookie };

  // 3. GET content with auth
  r = await fetch(`${BASE}/api/cms/content`, { headers: { Cookie: cookie } });
  ok('GET /api/cms/content authorized (200)', r.status === 200, `got ${r.status}`);
  const content = await r.json();
  ok('content has siteInfo section', !!content.siteInfo);

  // GET content WITHOUT auth -> 401
  r = await fetch(`${BASE}/api/cms/content`);
  ok('GET /api/cms/content unauthorized blocked (401)', r.status === 401, `got ${r.status}`);

  // 4. SAVE round-trip: add a temp marker, confirm it lands on disk, then restore.
  const original = JSON.parse(fs.readFileSync(siteInfoPath, 'utf-8'));
  const marker = 'smoke-' + content.siteInfo.companyName?.en?.length + '-x';
  const modified = { ...content.siteInfo, _smokeTest: marker };
  r = await fetch(`${BASE}/api/cms/content`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ siteInfo: modified }) });
  const saveResp = await r.json();
  ok('POST save returns ok', r.status === 200 && saveResp.ok === true, JSON.stringify(saveResp));
  const onDisk = JSON.parse(fs.readFileSync(siteInfoPath, 'utf-8'));
  ok('saved edit persisted to content/siteInfo.json on disk', onDisk._smokeTest === marker);

  // restore original exactly
  await fetch(`${BASE}/api/cms/content`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ siteInfo: original }) });
  const restored = JSON.parse(fs.readFileSync(siteInfoPath, 'utf-8'));
  ok('original siteInfo restored (no _smokeTest)', restored._smokeTest === undefined);

  // 5. UPLOAD round-trip: 1x1 transparent PNG -> serve back identical bytes.
  const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  r = await fetch(`${BASE}/api/cms/upload`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ name: 'smoke.png', dataUrl: `data:image/png;base64,${pngB64}` }) });
  const up = await r.json();
  ok('upload returns ok + url', r.status === 200 && up.ok && /^\/cms-assets\//.test(up.url), JSON.stringify(up));
  if (up.url) {
    const g = await fetch(`${BASE}${up.url}`);
    const got = Buffer.from(await g.arrayBuffer());
    ok('uploaded image served via /cms-assets/ (200, png)', g.status === 200 && g.headers.get('content-type') === 'image/png');
    ok('served bytes match uploaded bytes', got.equals(Buffer.from(pngB64, 'base64')));
    // cleanup the uploaded test file
    try { fs.unlinkSync(nodePath.join(__dirname, 'content', 'uploads', up.name)); } catch {}
  }

  console.log(`\n${fail === 0 ? 'ALL PASS' : 'SOME FAILED'}  (${pass} passed, ${fail} failed)`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error('ERROR', e); process.exit(2); });
