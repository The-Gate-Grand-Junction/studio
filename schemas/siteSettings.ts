import { defineType, defineField, defineArrayMember } from 'sanity';
import { IoSettingsSharp } from 'react-icons/io5';
import { LINK_HELP, linkRule } from './lib/editing';

/**
 * Settings the whole site reads: name, logos, the header and footer buttons,
 * contact details (footer, contact section and search results) and social
 * links. Every field here renders somewhere (SiteLayout.vue); one that
 * doesn't would only mislead an editor.
 */
const PLATFORMS = [
  { title: 'Facebook', value: 'facebook' },
  { title: 'Instagram', value: 'instagram' },
  { title: 'LinkedIn', value: 'linkedin' },
  { title: 'YouTube', value: 'youtube' },
  { title: 'X (Twitter)', value: 'twitter' },
  { title: 'TikTok', value: 'tiktok' },
  { title: 'Pinterest', value: 'pinterest' },
  { title: 'Threads', value: 'threads' },
  { title: 'Bluesky', value: 'bluesky' },
  { title: 'Mastodon', value: 'mastodon' },
  { title: 'Nextdoor', value: 'nextdoor' },
  { title: 'GitHub', value: 'github' },
];

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: IoSettingsSharp,
  groups: [
    { name: 'brand', title: 'Name & logos', default: true },
    { name: 'buttons', title: 'Header & footer' },
    { name: 'contact', title: 'Contact details' },
    { name: 'social', title: 'Social links' },
  ],
  fields: [
    defineField({
      name: 'siteName',
      title: 'Business name',
      description: 'Exactly as written on the site. Used in the header, footer and search results.',
      type: 'string',
      group: 'brand',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      description: 'Shown in the header. A wide version reads best; PNG or SVG with a transparent background.',
      type: 'image',
      group: 'brand',
    }),
    defineField({
      name: 'darkLogo',
      title: 'Logo for dark mode',
      description: 'Optional. A light version of the logo, shown when a visitor switches the site to dark mode.',
      type: 'image',
      group: 'brand',
    }),

    defineField({ name: 'ctaLabel', title: 'Header button text', description: 'e.g. "Get a quote". Blank hides the button.', type: 'string', group: 'buttons' }),
    defineField({ name: 'ctaUrl', title: 'Header button goes to', description: LINK_HELP, type: 'string', group: 'buttons', validation: linkRule }),
    defineField({ name: 'ctaHeadline', title: 'Footer call to action: heading', description: 'The band above the footer, e.g. "Ready to get started?"', type: 'string', group: 'buttons' }),
    defineField({ name: 'ctaSubtext', title: 'Footer call to action: text', type: 'string', group: 'buttons' }),
    defineField({ name: 'ctaFooterLabel', title: 'Footer call to action: button text', description: 'Blank uses the header button.', type: 'string', group: 'buttons' }),
    defineField({ name: 'ctaFooterUrl', title: 'Footer call to action: button goes to', description: `Blank uses the header button. ${LINK_HELP}`, type: 'string', group: 'buttons', validation: linkRule }),
    defineField({ name: 'copyrightText', title: 'Copyright line', description: 'Blank shows "© <year> <business name>. All rights reserved."', type: 'string', group: 'buttons' }),

    defineField({ name: 'contactPhone', title: 'Phone', type: 'string', group: 'contact' }),
    defineField({ name: 'contactEmail', title: 'Email', type: 'string', group: 'contact', validation: (rule) => rule.email() }),
    defineField({ name: 'contactAddress', title: 'Address', type: 'text', rows: 3, group: 'contact' }),

    defineField({
      name: 'socialLinks',
      title: 'Social links',
      description: 'Shown as icons in the footer, in this order.',
      type: 'array',
      group: 'social',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({ name: 'platform', title: 'Platform', type: 'string', options: { list: PLATFORMS }, validation: (rule) => rule.required() }),
            defineField({ name: 'url', title: 'Profile address', type: 'url', validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' }),
  },
});
