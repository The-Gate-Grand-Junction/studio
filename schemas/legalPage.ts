import { defineType, defineField } from 'sanity';
import { HiScale } from 'react-icons/hi2';
import { adminOnlyEdit, richText } from './lib/editing';

/** Privacy policy, terms and the other legal pages. Their addresses are fixed. */
export default defineType({
  name: 'legalPage',
  title: 'Legal Page',
  type: 'document',
  icon: HiScale,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Page address',
      description: 'Set by the web team. The footer and search engines link to this address.',
      type: 'slug',
      readOnly: adminOnlyEdit,
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      description: 'Shown at the top of the page. Change it when the policy changes.',
      type: 'date',
    }),
    defineField({
      name: 'body',
      title: 'Text',
      type: 'array',
      of: richText(),
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'lastUpdated' },
  },
});
