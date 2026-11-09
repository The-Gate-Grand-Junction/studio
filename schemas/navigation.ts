import { defineType, defineField, defineArrayMember } from 'sanity';
import { MdMenu } from 'react-icons/md';
import { adminOnlyEdit, LINK_HELP, linkRule } from './lib/editing';

/**
 * A menu: the main menu, the footer links or the legal links. Which one it is
 * (`navType`) is what the site keys on, so only the web team can change it.
 */
export default defineType({
  name: 'navigation',
  title: 'Menu',
  type: 'document',
  icon: MdMenu,
  fields: [
    defineField({
      name: 'navType',
      title: 'Where this menu appears',
      type: 'string',
      readOnly: adminOnlyEdit,
      options: {
        list: [
          { title: 'Main menu (top of every page)', value: 'main' },
          { title: 'Footer links', value: 'footer' },
          { title: 'Legal links (bottom bar)', value: 'legal' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Links',
      description: 'Drag to reorder. Each link needs its text and where it goes, such as /about.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'menuLink',
          fields: [
            defineField({ name: 'label', title: 'Text', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'url',
              title: 'Goes to',
              description: LINK_HELP,
              type: 'string',
              validation: (rule) => linkRule(rule.required()),
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'url' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { navType: 'navType', items: 'items' },
    prepare({ navType, items }: { navType?: string; items?: unknown[] }) {
      const title = { main: 'Main menu', footer: 'Footer links', legal: 'Legal links' }[navType ?? ''] ?? 'Menu';
      return { title, subtitle: `${items?.length ?? 0} link${items?.length === 1 ? '' : 's'}` };
    },
  },
});
