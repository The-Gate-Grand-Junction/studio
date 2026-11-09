# pws-studio-template

This is a **scaffold template** — not a live Sanity Studio. It is cloned and configured by [pws-scaffolder](https://github.com/EricPhifer/pws-scaffolder) to generate client-specific Sanity Studio projects.

## Stack

Sanity v5, TypeScript

## Placeholder Pattern

Client-specific values use the `##PLACEHOLDER##` pattern, replaced by the scaffolder at generation time:

- `##CLIENT_NAME##` — studio title
- `##CLIENT_SLUG##` — studio name (kebab-case)
- `##COLOR_ACCENT##`, `##COLOR_PRIMARY##`, `##COLOR_TEXT_INVERSE##` — VSCode chrome colors

## Base Schemas

These ship with every build, and the website reads exactly their fields. The scaffolder always registers them and skips any Build Tools stub with the same name (header/footer variants export generic `siteSettings`/`navigation` stubs):

- **siteSettings** — one document: business name, logos (with what each needs), header button, footer call to action, copyright line, contact details, social links. Every field renders on the site (`SiteLayout.vue`).
- **navigation** — the menus: main, footer and legal (`nav-main`, `nav-footer`, `nav-legal`). Links are text + an address (`/about`, `https://…`, `mailto:`), checked as typed. Which menu is which is web-team only.
- **legalPage** — privacy, terms and the rest: title, last updated, text. The address is web-team only.
- **page** — replaced per site by the scaffolder with the sections the site uses (`pws-scaffolder/lib/sections.js`). Its address is web-team only.

`schemas/lib/editing.ts` holds the shared rules: `adminOnlyEdit` (read-only unless a project administrator), `lockedOnceSet` (an address set at creation, then web-team only: blog posts, case studies), `linkRule` and the limited `richText()` editor.

## Sidebar

The scaffolder writes `structure.ts` from the sitemap (RMWS 3.2): Website pages in menu order and Legal pages, listed by name; then the site's content types (services, posts, events…); Forms; Menus; Site settings. Pages, legal pages, menus and settings can be edited but not created or deleted (`FIXED_TYPES`). A page or document type added later still appears ("Other pages", and after the arranged types). Each page's menu has **Open on site** (`SANITY_STUDIO_SITE_URL`, default the client's domain).

The scaffolder adds project-specific schemas from the config's `sanity.schemaStubs` array on top of these and wires them into the schema index.

## CORS origins

The website reads Sanity from the browser on every page change, so each address it is served from must be a CORS origin, or every navigation after the first fails. `pnpm cors` (`scripts/cors.mjs`, run as you after `pnpm exec sanity login`) adds what's missing and skips the rest:

- read-only: `https://<domain>`, `https://www.<domain>`, `http://localhost:5173` (dev), `http://localhost:4173` (preview)
- sign-in allowed: `https://studio.<domain>`, `http://localhost:3333`

The scaffolder writes the domain into the script. Once Netlify exists, add its addresses too: `pnpm cors https://<site>.netlify.app` (and any staging URL).

## Migrating an existing site

`migrate/lib.ts` is the kit for moving a client's old website content in (rules from the RMWS migration); copy `migrate/example.ts` per content type.

- Writes to **staging only** (it exits on `production`); promote with a reviewed dataset export/import.
- Stable ids (`docId`) + `createOrReplace` (`writeAll`): run it twice and the second run changes nothing.
- `purge` deletes by id, never by type, and only with `MIGRATE_PURGE=1`.
- `fillEmpty` patches hardcoded old content (buttons, taglines, social and compliance links) without overwriting edits.
- `imageFrom` uploads each image once; `altReport` lists the ones that arrived without alt text.
- Flags are environment variables (`MIGRATE_DRY_RUN=1`, `MIGRATE_PURGE=1`): `sanity exec` doesn't forward arguments.

```sh
SANITY_STUDIO_DATASET=staging MIGRATE_DRY_RUN=1 pnpm exec sanity exec migrate/posts.ts --with-user-token
```

## Publish site (Growth only)

`plugins/publishSite` adds a **Publish site** tool. Growth sites are prerendered, so editors save as many documents as they like, then publish them to the live site with one build. The scaffolder removes the plugin on other tiers.

- Clicking it creates a `sitePublish` document. That's all the Studio does, so no deploy secret is ever in the Studio bundle.
- A Sanity webhook (API → Webhooks: on Create, filter `_type == "sitePublish"`, projection `{_id, target}`, secret = the website's `DEPLOY_WEBHOOK_SECRET`) calls the website's `trigger-deploy` function. That function checks the signature, hits the Netlify build hook, and writes the outcome back onto the document.
- The tool counts this month's production builds; set `SANITY_STUDIO_MONTHLY_BUILDS` to show them against the plan's allowance.

## Do Not

- Run this template directly — it requires a valid Sanity project ID
- Add client-specific schemas here — they go in `project-config.json` instead
- Remove base schemas — they are expected by the Foundation frontend