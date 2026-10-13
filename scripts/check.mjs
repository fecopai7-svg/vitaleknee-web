// Regression checks for the static site (no dependencies): run with `node scripts/check.mjs`.
// Each check guards a fix from the 2026-10-13 security/privacy audit; a failure exits with code 1.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (f) => readFileSync(join(root, f), 'utf8');
const html = readdirSync(root).filter((f) => f.endsWith('.html'));
const js = readdirSync(root).filter((f) => f.endsWith('.js'));
const css = readdirSync(root).filter((f) => f.endsWith('.css'));
const failures = [];
const fail = (msg) => failures.push(msg);

// 1. No third-party fonts or scripts before consent (IP addresses must not leave the site on page load)
for (const f of [...html, ...css]) {
  if (/fonts\.googleapis|fonts\.gstatic|fontshare\.com/.test(read(f))) fail(`${f}: loads remote fonts`);
}
for (const f of html) {
  const ext = [...read(f).matchAll(/<(?:script|link|img|iframe)[^>]+(?:src|href)="(https?:\/\/[^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => !u.startsWith('https://www.vitaleknee.com/'));
  if (ext.length) fail(`${f}: external resources in markup: ${ext.join(', ')}`);
}

// 2. The Meta pixel may only be injected from consent.js, inside loadPixel(), after an "ads" choice
for (const f of js) {
  const src = read(f);
  if (/connect\.facebook\.net/.test(src) && f !== 'consent.js') fail(`${f}: references the Meta pixel outside consent.js`);
}
const consent = read('consent.js');
if (!/if \(v && v\.ads\) loadPixel\(\)/.test(consent)) fail('consent.js: pixel is no longer gated on ads consent');
if (/data-ck="(analytics|ads)"[^>]*checked/.test(consent)) fail('consent.js: a consent checkbox is pre-ticked');
if (!/function revoke\(\)/.test(consent)) fail('consent.js: consent withdrawal (revoke) is missing');

// 3. Every page ships the CSP + referrer policy (GitHub Pages cannot send these headers)
for (const f of html) {
  const h = read(f);
  if (!/http-equiv="Content-Security-Policy"/.test(h)) fail(`${f}: missing Content-Security-Policy meta`);
  if (!/name="referrer"/.test(h)) fail(`${f}: missing referrer policy meta`);
  if (/ on[a-z]+="/.test(h)) fail(`${f}: inline event handler (blocked by CSP)`);
  for (const m of h.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)) {
    if (!/type="application\/ld\+json"/.test(m[1])) fail(`${f}: inline executable <script> (blocked by CSP)`);
  }
}

// 4. All local files referenced by pages, scripts and styles exist
const refs = new Set();
for (const f of [...html, ...js, ...css]) {
  for (const m of read(f).matchAll(/(?:media|fonts)\/[A-Za-z0-9._-]+\.(?:jpg|png|svg|webp|mp4|woff2)/g)) refs.add(m[0]);
}
for (const r of refs) if (!existsSync(join(root, r))) fail(`missing file: ${r}`);
for (const f of ['CNAME', '.nojekyll', 'fonts.css']) if (!existsSync(join(root, f))) fail(`missing ${f}`);
if (existsSync(join(root, 'CNAME')) && read('CNAME').trim() !== 'www.vitaleknee.com') fail('CNAME is not www.vitaleknee.com');

// 5. Cart quantities read from localStorage are clamped (tampered storage cannot build odd checkout links)
if (!/Math\.min\(10, Math\.floor\(Number\(q\)\)/.test(read('tienda.js'))) fail('tienda.js: cart quantity clamp removed');

// 6. No secrets in the published files (the Meta pixel ID is public by design and allowed)
const secretPatterns = [/shpat_[0-9a-f]{20,}/, /shpss_[0-9a-f]{20,}/, /EAA[A-Za-z0-9]{60,}/, /ghp_[A-Za-z0-9]{30,}/, /gho_[A-Za-z0-9]{30,}/, /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /sk_live_[0-9a-zA-Z]{20,}/];
for (const f of [...html, ...js, ...css, 'CNAME']) {
  const src = read(f);
  for (const p of secretPatterns) if (p.test(src)) fail(`${f}: looks like a secret (${p.source.slice(0, 12)}…)`);
}

// 7. Size budget for the first load (keeps the landing usable on mobile data)
const big = readdirSync(join(root, 'media')).filter((f) => /\.(jpg|png|webp)$/.test(f) && statSync(join(root, 'media', f)).size > 400 * 1024);
if (big.length) fail(`images over 400 KB: ${big.join(', ')}`);

if (failures.length) {
  console.error(`✗ ${failures.length} check(s) failed:\n- ` + failures.join('\n- '));
  process.exit(1);
}
console.log(`✓ all checks passed (${html.length} pages, ${js.length} scripts, ${refs.size} local assets)`);
