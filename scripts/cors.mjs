/**
 * Adds the CORS origins this client's Sanity project needs, skipping any it
 * already has. Run once at setup and again whenever a new address appears
 * (the Netlify site, a staging branch):
 *
 *   pnpm cors                                   domain from the package script
 *   pnpm cors https://client-site.netlify.app   plus extra site addresses
 *
 * The website reads Sanity from the browser on every page change, so each
 * address it is served from must be listed, read-only. Without them, every
 * navigation after the first fails (RMWS). The Studio's own addresses allow
 * credentials, because editors sign in there. Runs the Sanity CLI as you, so
 * `sanity login` first.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
const at = args.indexOf('--domain');
const domain = at >= 0 ? args.splice(at, 2)[1] : '';
const extra = args;

if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
  console.error('Usage: node scripts/cors.mjs --domain example.com [https://extra.origin …]');
  process.exit(1);
}
for (const origin of extra) {
  if (!/^https?:\/\/[^/\s]+$/.test(origin)) {
    console.error(`"${origin}" isn't an origin. Use the scheme and host only, e.g. https://client-site.netlify.app`);
    process.exit(1);
  }
}

const wanted = [
  // The website, read-only
  ...[`https://${domain}`, `https://www.${domain}`, 'http://localhost:5173', 'http://localhost:4173', ...extra].map((origin) => ({
    origin,
    credentials: false,
  })),
  // The Studio, where editors sign in
  { origin: `https://studio.${domain}`, credentials: true },
  { origin: 'http://localhost:3333', credentials: true },
];

// The project comes from .env, as for the Studio itself
if (existsSync('.env')) process.loadEnvFile('.env');
const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
if (!projectId) {
  console.error('Set SANITY_STUDIO_PROJECT_ID in .env first.');
  process.exit(1);
}

const bin = 'node_modules/.bin/sanity';
if (!existsSync(bin)) {
  console.error('Run pnpm install first.');
  process.exit(1);
}

const list = spawnSync(bin, ['cors', 'list', '--project-id', projectId], { encoding: 'utf8' });
if (list.status !== 0) {
  console.error((list.stderr || list.stdout).trim() || 'Could not list CORS origins. Are you logged in (pnpm exec sanity login)?');
  process.exit(1);
}
const existing = new Set(list.stdout.split('\n').map((l) => l.trim()).filter(Boolean));

let failed = 0;
for (const { origin, credentials } of wanted) {
  if (existing.has(origin)) {
    console.log(`  already there  ${origin}`);
    continue;
  }
  const add = spawnSync(bin, ['cors', 'add', origin, credentials ? '--credentials' : '--no-credentials', '--project-id', projectId], { stdio: 'inherit' });
  if (add.status === 0) console.log(`  added          ${origin}${credentials ? ' (sign-in allowed)' : ''}`);
  else failed++;
}
if (failed) process.exit(1);
console.log('\nCORS origins are set. Add the Netlify address(es) with `pnpm cors https://….netlify.app` once the site exists.');
