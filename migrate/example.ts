/**
 * A starting point for a client's migration script; copy it per content type
 * (e.g. migrate/posts.ts). See ./lib.ts for the rules it follows.
 *
 *   SANITY_STUDIO_DATASET=staging MIGRATE_DRY_RUN=1 pnpm exec sanity exec migrate/example.ts --with-user-token
 *
 * Reads the old site's content (here, a JSON export you saved next to it),
 * maps each item to a document with a stable id, and writes them all. Run it
 * twice: the second run should change nothing.
 */
import { readFileSync, existsSync } from 'node:fs';
import { altReport, docId, imageFrom, migrationClient, writeAll, type Doc } from './lib';

interface OldPost {
  url: string;
  title: string;
  date: string;
  summary?: string;
  image?: { src: string; alt?: string };
}

const SOURCE = 'migrate/old-posts.json';

async function main() {
  const client = migrationClient();
  if (!existsSync(SOURCE)) {
    console.error(`Save the old site's posts as ${SOURCE} first (an array of { url, title, date, summary, image }).`);
    process.exit(1);
  }
  const old: OldPost[] = JSON.parse(readFileSync(SOURCE, 'utf8'));

  const docs: Doc[] = [];
  for (const post of old) {
    const slug = new URL(post.url).pathname.split('/').filter(Boolean).pop() ?? post.title;
    docs.push({
      _id: docId('post', post.url),
      _type: 'post',
      title: post.title,
      slug: { _type: 'slug', current: slug },
      publishedAt: new Date(post.date).toISOString(),
      excerpt: post.summary ?? '',
      ...(post.image ? { mainImage: await imageFrom(client, post.image.src, post.image.alt ?? '', post.url) } : {}),
    });
  }

  await writeAll(client, docs);
  altReport();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
