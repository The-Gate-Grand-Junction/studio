import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { iconPicker } from 'sanity-plugin-icon-picker';
import { schemaTypes } from './schemas';
import { structure, FIXED_TYPES } from './structure';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID!;
const SITE_URL = (process.env.SANITY_STUDIO_SITE_URL || 'https://thegategj.com').replace(/\/$/, '');

/** Document types with their own page on the site, by address prefix */
const DETAIL_PREFIX: Record<string, string> = {

};

const sharedConfig = {
  projectId,
  plugins: [structureTool({ structure }), iconPicker()],
  schema: { types: schemaTypes },
  document: {
    // "Open on site" in each page's menu. Changes show there once the site is next built.
    productionUrl: async (prev: string | undefined, { document }: { document: { _type: string; slug?: { current?: string } } }) => {
      const slug = document.slug?.current;
      if (!SITE_URL || !slug) return prev;
      if (document._type === 'page' || document._type === 'legalPage') return `${SITE_URL}${slug.startsWith('/') ? '' : '/'}${slug}`;
      if (DETAIL_PREFIX[document._type]) return `${SITE_URL}${DETAIL_PREFIX[document._type]}${slug}`;
      return prev;
    },
    actions: (prev: any[], context: { schemaType: string }) =>
      FIXED_TYPES.includes(context.schemaType)
        ? prev.filter((action: { action?: string }) => !['create', 'delete', 'duplicate'].includes(action.action ?? ''))
        : prev,
    newDocumentOptions: (prev: { templateId: string }[]) => prev.filter((opt) => !FIXED_TYPES.includes(opt.templateId)),
  },
};

export default defineConfig([
  {
    ...sharedConfig,
    name: 'production',
    title: 'The Gate : A Meeting Venue',
    dataset: 'production',
    basePath: '/production',
  },
  {
    ...sharedConfig,
    name: 'staging',
    title: 'The Gate : A Meeting Venue (Staging)',
    dataset: 'staging',
    basePath: '/staging',
  },
]);
