import { defineArrayMember, defineField, type StringRule } from 'sanity';

/**
 * Shared editing rules for the Studio. From the RMWS build.
 */

type CurrentUser = { roles?: { name: string }[] } | null | undefined;

/**
 * True for project administrators (the web team). Settings only the web team
 * should change (page addresses, which menu is which, internal names) are
 * read-only for everyone else, so a client editor can't break a page by
 * tidying a field that looks harmless.
 */
export const isAdmin = (user: CurrentUser) => Boolean(user?.roles?.some((r) => r.name === 'administrator'));

export const adminOnlyEdit = ({ currentUser }: { currentUser?: CurrentUser }) => !isAdmin(currentUser);

/**
 * An address that is locked once set: the editor picks it when creating the
 * item, then only the web team can change it, because people and search
 * engines already link to it. From the RMWS build.
 */
export const lockedOnceSet = ({ document, currentUser }: { document?: { _createdAt?: string; slug?: { current?: string } }; currentUser?: CurrentUser }) =>
  Boolean(document?._createdAt && document?.slug?.current) && !isAdmin(currentUser);

/** A link: a page on this site (/contact), a full https:// address, or mailto:/tel:. */
export const LINK_HELP = 'A page on this site such as /contact, a full https:// address, or mailto:/tel:';
export const linkRule = (Rule: StringRule) =>
  Rule.custom((value?: string) =>
    !value || /^(\/|https?:\/\/|mailto:|tel:)/.test(value) ? true : 'Start with / for a page on this site, or https://, mailto: or tel:'
  );

/**
 * The text editor, limited to what the site styles: paragraph, three heading
 * sizes, quote, lists, bold, italic and checked links. The page title is the
 * h1; the site keeps headings in order whichever size is picked.
 */
export function richText() {
  return [
    defineArrayMember({
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
                type: 'string',
                title: 'Link to',
                description: LINK_HELP,
                validation: (Rule) => linkRule(Rule.required()),
              }),
            ],
          },
        ],
      },
    }),
  ];
}
