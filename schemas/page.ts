import { defineType, defineField } from 'sanity';
import { HiDocumentText } from 'react-icons/hi2';
import { preview as iconPreview } from 'sanity-plugin-icon-picker';
import { adminOnlyEdit } from './lib/editing';

// ─── Reusable field helpers ──────────────────────────────────────────────────

const iconPickerField = defineField({
      name: 'icon',
      title: 'Icon',
      type: 'iconPicker',
      options: { providers: ['hi', 'mdi', 'fi', 'fa'], outputFormat: 'react', storeSvg: true },
    });

// ─── Rich text: only what the site styles ───────────────────────────────────

const richText = [
  {
    type: 'block',
    styles: [
      { title: 'Paragraph', value: 'normal' },
      { title: 'Heading', value: 'h2' },
      { title: 'Subheading', value: 'h3' },
      { title: 'Small heading', value: 'h4' },
      { title: 'Quote', value: 'blockquote' },
    ],
    lists: [
      { title: 'Bullets', value: 'bullet' },
      { title: 'Numbered', value: 'number' },
    ],
    marks: {
      decorators: [
        { title: 'Bold', value: 'strong' },
        { title: 'Italic', value: 'em' },
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Link',
          fields: [
            defineField({
              name: 'href',
              title: 'Address',
              description: 'A page on this site (/contact) or a full web address (https://…)',
              type: 'url',
              validation: (Rule) => Rule.required().uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
            }),
          ],
        },
      ],
    },
  },
];

// ─── Image with its description on it ────────────────────────────────────────

const imageWithAlt = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'image',
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'alt',
        title: 'Description',
        description: "What the image shows, for people who can't see it",
        type: 'string',
        hidden: ({ parent }) => !!parent?.decorative,
        validation: (Rule) =>
          Rule.custom((alt, context) => {
            const image = context.parent as { asset?: unknown; decorative?: boolean } | undefined;
            return !image?.asset || image.decorative || alt ? true : 'Describe the image, or mark it decorative';
          }),
      }),
      defineField({ name: 'decorative', title: 'Decorative only (no description needed)', type: 'boolean', initialValue: false }),
    ],
  });


// ─── Section type definitions ────────────────────────────────────────────────

const heroSection = {
  type: 'object',
  name: 'heroSection',
  title: 'Hero Section',
  fields: [
    defineField({ name: 'title', title: 'Headline', type: 'string' }),
    defineField({ name: 'subtitle', title: 'Subtitle', type: 'text' }),
    defineField({ name: 'image', title: 'Background Image', description: 'Optional — gradient is used if empty', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'imageAlt', title: 'Background image alt text', description: 'Describe the background image for screen readers', type: 'string' }),
    defineField({
      name: 'cta',
      title: 'CTA Button',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Button Text', type: 'string' }),
        defineField({ name: 'url', title: 'Button Link', type: 'string' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'Hero Section', subtitle: 'Hero' };
    },
  },
};

const featureGrid = {
  type: 'object',
  name: 'featureGrid',
  title: 'Feature Grid',
  fields: [
    defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Feature Cards',
      type: 'array',
      of: [{
        type: 'object',
        name: 'featureItem',
        fields: [
          defineField({ name: 'title', title: 'Title', type: 'string' }),
          defineField({ name: 'description', title: 'Description', type: 'text' }),
          iconPickerField,
        ],
        preview: {
          select: { title: 'title', provider: 'icon.provider', name: 'icon.name' },
          prepare({ title, provider, name }: any) {
            return { title: title || 'Untitled', media: provider && name ? iconPreview({ provider, name }) : undefined };
          },
        },
      }],
    }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare({ heading }: { heading?: string }) {
      return { title: heading || 'Feature Grid', subtitle: 'Features' };
    },
  },
};

const testimonialsSection = {
  type: 'object',
  name: 'testimonialsSection',
  title: 'Testimonials',
  fields: [
    defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Client Testimonials',
      type: 'array',
      of: [{
        type: 'object',
        name: 'testimonialItem',
        fields: [
          defineField({ name: 'quote', title: 'Quote', type: 'text' }),
          defineField({ name: 'author', title: 'Author Name', type: 'string' }),
          defineField({ name: 'role', title: 'Role / Company', type: 'string' }),
          defineField({ name: 'rating', title: 'Star Rating', description: '1–5', type: 'number', validation: (Rule) => Rule.min(1).max(5) }),
          defineField({ name: 'photo', title: 'Photo', description: 'Optional headshot — falls back to author initial', type: 'image', options: { hotspot: true } }),
        ],
        preview: {
          select: { author: 'author', quote: 'quote', media: 'photo' },
          prepare({ author, quote, media }: any) {
            return { title: author || 'Anonymous', subtitle: quote ? `"${quote.slice(0, 60)}..."` : '', media };
          },
        },
      }],
    }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare({ heading }: { heading?: string }) {
      return { title: heading || 'Testimonials', subtitle: 'Testimonials' };
    },
  },
};

const contactSection = {
  type: 'object',
  name: 'contactSection',
  title: 'Contact',
  fields: [
    defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
    defineField({ name: 'preferenceNotes', title: 'Intro Text', type: 'text' }),
    defineField({ name: 'email', title: 'Email Address', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone Number', type: 'string' }),
    defineField({ name: 'showPhone', title: 'Show Phone Number', type: 'boolean' }),
    defineField({ name: 'responseTime', title: 'Response Time Note', type: 'string' }),
    defineField({ name: 'address', title: 'Physical Address', description: 'Shown under Phone. One line per line of the address.', type: 'text', rows: 3 }),
    defineField({ name: 'hours', title: 'Business Hours', description: 'One line per day or range, e.g. "Mon–Fri 8am–5pm"', type: 'text', rows: 3 }),
  ],
  preview: {
    prepare() {
      return { title: 'Contact', subtitle: 'Contact' };
    },
  },
};

const textContent = {
  type: 'object',
  name: 'textContent',
  title: 'Text Content',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'body', title: 'Body Content', type: 'array', of: richText }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare({ heading }: { heading?: string }) {
      return { title: heading || 'Text Content', subtitle: 'Text' };
    },
  },
};

const teamSection = {
  type: 'object',
  name: 'teamSection',
  title: 'Team',
  fields: [
    defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro Text', type: 'text', rows: 3 }),
    defineField({
      name: 'members',
      title: 'People',
      type: 'array',
      of: [{
        type: 'object',
        name: 'teamMember',
        fields: [
          defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
          defineField({ name: 'role', title: 'Role', type: 'string' }),
          defineField({ name: 'bio', title: 'Short Bio', type: 'text', rows: 3 }),
          imageWithAlt('photo', 'Photo', 'A square headshot works best. Initials are shown without one.'),
          defineField({ name: 'email', title: 'Email', description: 'Optional: shows an "Email <first name>" link', type: 'email' }),
        ],
        preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } },
      }],
    }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare({ heading }: { heading?: string }) {
      return { title: heading || 'Team', subtitle: 'Team' };
    },
  },
};

const mapSection = {
  type: 'object',
  name: 'mapSection',
  title: 'Map',
  fields: [
    defineField({ name: 'heading', title: 'Section Heading', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro Text', type: 'text', rows: 2 }),
    defineField({ name: 'address', title: 'Address', description: 'One line per line of the address. Also used for the "Open in Google Maps" link.', type: 'text', rows: 3 }),
    defineField({
      name: 'mapEmbedUrl',
      title: 'Google Maps embed address',
      description: 'Google Maps → your business → Share → Embed a map → copy only the address inside src="…"',
      type: 'url',
      validation: (Rule) =>
        Rule.custom((url) =>
          !url || /^https:\/\/www\.google\.com\/maps\/embed\?/.test(url) ? true : 'Use the embed address from Google Maps (it starts https://www.google.com/maps/embed?)',
        ),
    }),
    defineField({
      name: 'mapTitle',
      title: 'Map description',
      description: 'For screen readers, e.g. "Map of our office on Main Street"',
      type: 'string',
      hidden: ({ parent }) => !parent?.mapEmbedUrl,
      validation: (Rule) =>
        Rule.custom((title, context) => ((context.parent as any)?.mapEmbedUrl && !title ? 'Describe the map for screen readers' : true)),
    }),
  ],
  preview: {
    select: { heading: 'heading', address: 'address' },
    prepare({ heading, address }: { heading?: string; address?: string }) {
      return { title: heading || 'Map', subtitle: address?.split('\n')[0] || 'Map' };
    },
  },
};

const donationSection = {
  type: 'object',
  name: 'donationSection',
  title: 'Donation',
  fields: [
    defineField({ name: 'heading', title: 'Section Heading', description: 'Blank shows "Support our work"', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro Text', description: 'What a gift makes possible', type: 'text', rows: 3 }),
    defineField({
      name: 'amounts',
      title: 'Suggested amounts (dollars)',
      description: 'Up to 6 buttons, smallest first. Blank shows $25, $50, $100, $250. Donors can always enter their own.',
      type: 'array',
      of: [{ type: 'number' }],
      validation: (Rule) => Rule.max(6).custom((list?: number[]) =>
        !list || list.every((n) => Number.isInteger(n) && n >= 5 && n <= 10000) ? true : 'Whole dollars from 5 to 10,000'),
    }),
    defineField({ name: 'defaultAmount', title: 'Selected to start', description: 'One of the suggested amounts. Blank selects the second.', type: 'number' }),
    defineField({ name: 'allowMonthly', title: 'Offer monthly giving', type: 'boolean', initialValue: true }),
    defineField({ name: 'buttonLabel', title: 'Button label', description: 'Blank shows "Give $50" (or "Give $50 monthly")', type: 'string' }),
    defineField({ name: 'note', title: 'Small print', description: 'e.g. "Gifts are tax-deductible to the extent allowed by law."', type: 'string' }),
    defineField({ name: 'thankYouMessage', title: 'Thank-you message', description: 'Shown when the donor comes back from paying. Blank shows a thank-you and says a receipt is on its way.', type: 'text', rows: 2 }),
  ],
  preview: {
    select: { heading: 'heading' },
    prepare({ heading }: { heading?: string }) {
      return { title: heading || 'Donation', subtitle: 'Donation' };
    },
  },
};

// ─── Page document type ──────────────────────────────────────────────────────

export default defineType({
  name: 'page',
  title: 'Pages',
  type: 'document',
  icon: HiDocumentText,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'Search & Social' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Page address',
      description: 'Set by the web team (e.g. /about). Menus, links and search engines use this address.',
      type: 'slug',
      readOnly: adminOnlyEdit,
      options: { source: 'title', maxLength: 96 },
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sections',
      title: 'Page Sections',
      description: 'Add sections and drag to reorder. Each section carries its own content.',
      type: 'array',
      group: 'content',
      of: [
        heroSection,
        featureGrid,
        testimonialsSection,
        contactSection,
        textContent,
        teamSection,
        mapSection,
        donationSection,
      ],
    }),
    // Search & Social: the client's own search result for this page
    defineField({
      name: 'seoTitle',
      title: 'Search title',
      description: 'Shown as the link in Google. Blank = the page title. The site name is added when it fits.',
      type: 'string',
      group: 'seo',
      validation: (Rule) => Rule.max(60).warning('Google shows about 60 characters; the rest is cut off.'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Search description',
      description: 'The text under the link in Google, and in social previews.',
      type: 'text',
      rows: 3,
      group: 'seo',
      validation: (Rule) => [
        Rule.max(158).warning('Google shows about 158 characters; the rest is cut off.'),
        Rule.min(70).warning('Under about 70 characters, Google often writes its own.'),
      ],
    }),
    defineField({
      name: 'shareImage',
      title: 'Share image',
      description: 'Shown when the page is shared on social media or in messages. Cropped to 1200×630 around the hotspot.',
      type: 'image',
      options: { hotspot: true },
      group: 'seo',
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare({ title, slug }) {
      return {
        title: title || 'Untitled',
        subtitle: slug || '/',
      };
    },
  },
});
