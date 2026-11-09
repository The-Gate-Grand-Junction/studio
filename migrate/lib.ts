/**
 * Migration kit: moving a client's old website content into this Studio.
 * The rules come from the RMWS migration:
 *
 * - **Staging only.** Every script refuses the production dataset. Content is
 *   promoted by a reviewed dataset export/import, never by re-running a script
 *   against production.
 * - **Reruns reproduce the first run.** Documents get deterministic ids
 *   (`docId`) and are written with createOrReplace (`writeAll`), so running a
 *   script twice changes nothing. Run it twice to check.
 * - **Purge by id, never by type.** New documents can share a type with legacy
 *   ones (RMWS's new menus reused the old `navigation` type), so a blanket
 *   delete removes what was just written. `purge` takes ids, and only deletes
 *   with MIGRATE_PURGE=1.
 * - **Flags are environment variables.** `sanity exec` doesn't forward
 *   arguments to the script.
 * - **Missing alt text is reported**, not silently marked decorative
 *   (`altReport`).
 * - **Hardcoded content** (hero buttons, taglines, card summaries, social and
 *   compliance links) gets small patch scripts that fill only what's empty
 *   (`fillEmpty`), so they're safe to rerun.
 *
 * Run a script against staging:
 *   SANITY_STUDIO_DATASET=staging pnpm exec sanity exec migrate/<script>.ts --with-user-token
 * Dry run (prints, writes nothing): add MIGRATE_DRY_RUN=1
 */
import { createHash } from 'node:crypto';
import { getCliClient } from 'sanity/cli';

export type Doc = { _id: string; _type: string; [key: string]: unknown };

/** MIGRATE_<NAME>=1 (or true/yes) */
export const flag = (name: string) => /^(1|true|yes)$/i.test(process.env[`MIGRATE_${name.toUpperCase()}`] ?? '');

export const dryRun = flag('dry_run');

/** The Sanity client for this run; exits on the production dataset. */
export function migrationClient() {
  const client = getCliClient({ apiVersion: '2024-01-01' });
  const dataset = client.config().dataset ?? '';
  if (!dataset || dataset === 'production') {
    console.error(`Refusing to migrate into "${dataset || '(no dataset)'}". Migrations write to staging only:`);
    console.error('  SANITY_STUDIO_DATASET=staging pnpm exec sanity exec migrate/<script>.ts --with-user-token');
    console.error('Promote to production with a dataset export/import after review.');
    process.exit(1);
  }
  console.log(`Migrating into "${dataset}"${dryRun ? ' (dry run: nothing is written)' : ''}.`);
  return client;
}

/**
 * A stable id from the type and something unique in the old site (its URL,
 * slug or database id), so a rerun replaces the same document. Readable when
 * the key is short, hashed when it isn't.
 */
export function docId(type: string, key: string): string {
  const readable = key.toLowerCase().replace(/^https?:\/\/[^/]+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const safe = readable && readable.length <= 60 ? readable : createHash('sha1').update(key).digest('hex').slice(0, 16);
  return `${type}-${safe}`;
}

type Client = ReturnType<typeof migrationClient>;

/** createOrReplace in batches; a rerun leaves the dataset exactly as the first run did. */
export async function writeAll(client: Client, docs: Doc[], batchSize = 100) {
  const ids = new Set<string>();
  for (const doc of docs) {
    if (ids.has(doc._id)) throw new Error(`Two documents share the id ${doc._id}; make docId keys unique`);
    ids.add(doc._id);
  }
  if (dryRun) {
    docs.forEach((d) => console.log(`  would write ${d._type} ${d._id}`));
    return;
  }
  for (let i = 0; i < docs.length; i += batchSize) {
    const tx = client.transaction();
    docs.slice(i, i + batchSize).forEach((d) => tx.createOrReplace(d));
    await tx.commit({ visibility: 'async' });
  }
  console.log(`Wrote ${docs.length} document(s).`);
}

/** Sets fields only where the document has none yet: safe to rerun, never overwrites an editor's change. */
export async function fillEmpty(client: Client, id: string, fields: Record<string, unknown>) {
  if (dryRun) {
    console.log(`  would fill empty fields on ${id}: ${Object.keys(fields).join(', ')}`);
    return;
  }
  await client.patch(id).setIfMissing(fields).commit();
}

/** Deletes exactly these ids (drafts too), and only with MIGRATE_PURGE=1. */
export async function purge(client: Client, ids: string[]) {
  const all = ids.flatMap((id) => [id, `drafts.${id}`]);
  if (!flag('purge') || dryRun) {
    console.log(`Would delete ${ids.length} document(s); set MIGRATE_PURGE=1 to delete them:`);
    ids.forEach((id) => console.log(`  ${id}`));
    return;
  }
  const tx = client.transaction();
  all.forEach((id) => tx.delete(id));
  await tx.commit();
  console.log(`Deleted ${ids.length} document(s).`);
}

const uploaded = new Map<string, string>();

/**
 * Uploads an image from the old site once per URL (Sanity also dedupes
 * identical files) and returns an image field. Alt text is the old page's;
 * pass '' when it had none, and `altReport` lists it.
 */
export async function imageFrom(client: Client, url: string, alt: string, where: string) {
  if (!alt.trim()) missingAlt.push({ where, url });
  let ref = uploaded.get(url);
  if (!ref && !dryRun) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Image ${url} returned ${res.status}`);
    const asset = await client.assets.upload('image', Buffer.from(await res.arrayBuffer()), {
      filename: decodeURIComponent(new URL(url).pathname.split('/').pop() || 'image'),
    });
    ref = asset._id;
    uploaded.set(url, ref);
  }
  return { _type: 'image', asset: { _type: 'reference', _ref: ref ?? 'image-dry-run' }, alt: alt.trim() };
}

const missingAlt: { where: string; url: string }[] = [];

/** Lists images that arrived without alt text, for someone to describe (or mark decorative on purpose). */
export function altReport() {
  if (!missingAlt.length) {
    console.log('Every image came with alt text.');
    return;
  }
  console.log(`\n${missingAlt.length} image(s) need alt text:`);
  missingAlt.forEach((m) => console.log(`  ${m.where}: ${m.url}`));
}
